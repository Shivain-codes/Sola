// Sola — generatePlan Lambda (Function URL, no API Gateway). Node 20 runtime.
//
// Request (POST JSON):
//   { city, jobType, shiftStart, shiftEnd,
//     hourly: [{ hour, tempC, humidity, heatIndexC, band }] }
//
// Response (200 JSON):
//   { plan: Plan, source: "ai" | "fallback" }
//
// Plan shape (strict — the web card renders exactly these fields):
//   {
//     riskSummary: string[2],                         // two short lines
//     timeline: [{ label, action, note }],            // hour blocks: work/rest/hydrate
//     warningSigns: string[5],                         // heatstroke warning signs
//     ifSymptoms: string[]                             // emergency steps
//   }
//
// The AI never guesses the weather: the computed hourly heat-index table and the
// peak danger window are passed in and injected into the prompt. Nova only writes
// the advice. On any Bedrock error we return a deterministic fallback built from
// the bands so the user never sees a blank screen.

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_ID = "amazon.nova-lite-v1:0";
const REGION = process.env.AWS_REGION || "us-east-1";
const bedrock = new BedrockRuntimeClient({ region: REGION });

// CORS on EVERY response. The browser blocks responses without these even when
// the HTTP status is 200, which surfaces as "Load failed" in fetch().
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

const SYSTEM_PROMPT =
  "You are a heat-safety advisor for outdoor workers in India. " +
  "Write in simple, short sentences. No jargon. No extra sections.";

export const handler = async (event) => {
  const method =
    event?.requestContext?.http?.method ?? event?.httpMethod ?? "POST";

  // Preflight — answer immediately with the CORS headers.
  if (method === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  let input = {};
  try {
    input = event?.body ? JSON.parse(event.body) : {};
  } catch {
    return resp(400, { error: "Invalid JSON body" });
  }

  const city = str(input.city) || "your city";
  const jobType = str(input.jobType) || "outdoor worker";
  const customOccupation = str(input.customOccupation);
  const ageNum = Number(input.age);
  const age =
    Number.isFinite(ageNum) && ageNum >= 1 && ageNum <= 120
      ? Math.round(ageNum)
      : null;
  const effectiveJob =
    jobType === "Other" && customOccupation ? customOccupation : jobType;
  const shiftStart = str(input.shiftStart) || "";
  const shiftEnd = str(input.shiftEnd) || "";
  const hourly = Array.isArray(input.hourly) ? input.hourly : [];

  if (hourly.length === 0) {
    return resp(400, { error: "No hourly heat data provided." });
  }

  const peak = peakWindow(hourly);

  // Try Bedrock. Any failure (access, timeout, bad parse) -> fallback.
  try {
    const plan = await generateWithNova({
      city,
      jobType: effectiveJob,
      age,
      shiftStart,
      shiftEnd,
      hourly,
      peak,
    });
    return resp(200, { plan, source: "ai" });
  } catch (err) {
    console.error("Bedrock/plan generation failed, using fallback:", err);
    const plan = fallbackPlan({ jobType: effectiveJob, hourly, peak });
    return resp(200, { plan, source: "fallback" });
  }
};

// ---------------------------------------------------------------------------
// Nova Lite
// ---------------------------------------------------------------------------

async function generateWithNova({
  city,
  jobType,
  age,
  shiftStart,
  shiftEnd,
  hourly,
  peak,
}) {
  const table = hourly
    .map(
      (h) =>
        `${hourLabel(h.hour)}: ${Math.round(h.tempC)}C air, ${
          h.humidity
        }% humidity, feels ${Math.round(h.heatIndexC)}C (${h.band})`
    )
    .join("\n");

  const userPrompt = [
    `Worker: ${jobType} in ${city}.`,
    `Shift: ${shiftStart || "start"} to ${shiftEnd || "end"}.`,
    ...(age != null
      ? [
          `Worker age: ${age}. Adjust rest and hydration for age-related heat risk — older adults (60+) and young children need more frequent rest and water breaks.`,
        ]
      : []),
    ``,
    `Today's hourly heat index for the shift hours only:`,
    table,
    ``,
    peak
      ? `Peak danger window: ${hourLabel(peak.startHour)} to ${hourLabel(
          peak.endHour
        )} (feels up to ${Math.round(peak.maxHiC)}C).`
      : `No extreme peak today, but stay careful.`,
    ``,
    `Write a heat-safety plan. Return ONLY valid JSON (no markdown, no code`,
    `fences) with exactly this shape:`,
    `{`,
    `  "riskSummary": ["line 1", "line 2"],`,
    `  "timeline": [{"label":"9am-11am","action":"Work","note":"short note"}],`,
    `  "warningSigns": ["sign 1","sign 2","sign 3","sign 4","sign 5"],`,
    `  "ifSymptoms": ["step 1","step 2","step 3"]`,
    `}`,
    `Rules:`,
    `- riskSummary: exactly 2 short lines.`,
    `- timeline: one block per 1-2 shift hours. action is Work, Rest, or Hydrate.`,
    `  Tell them to rest and hydrate during the hottest blocks.`,
    `- warningSigns: exactly 5 heatstroke warning signs, plain words.`,
    `- ifSymptoms: what to do if symptoms appear. Short steps.`,
    `- No text outside the JSON.`,
  ].join("\n");

  const payload = {
    system: [{ text: SYSTEM_PROMPT }],
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    inferenceConfig: { maxTokens: 900, temperature: 0.3, topP: 0.9 },
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const out = await bedrock.send(command);
  const decoded = JSON.parse(new TextDecoder().decode(out.body));
  const text = decoded?.output?.message?.content?.[0]?.text ?? "";

  const plan = parsePlan(text);
  if (!plan) throw new Error("Could not parse a valid plan from Nova output");
  return plan;
}

/** Pull JSON out of the model text and validate it into a Plan. */
function parsePlan(text) {
  if (!text) return null;
  // Strip code fences if present, then grab the outermost {...}.
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  let obj;
  try {
    obj = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }

  const riskSummary = asStringArray(obj.riskSummary).slice(0, 2);
  const warningSigns = asStringArray(obj.warningSigns).slice(0, 5);
  const ifSymptoms = asStringArray(obj.ifSymptoms);
  const timeline = Array.isArray(obj.timeline)
    ? obj.timeline
        .map((t) => ({
          label: str(t?.label),
          action: str(t?.action),
          note: str(t?.note),
        }))
        .filter((t) => t.label || t.action || t.note)
    : [];

  // Minimum viable plan — otherwise treat as a parse failure and fall back.
  if (
    riskSummary.length < 1 ||
    timeline.length < 1 ||
    warningSigns.length < 3 ||
    ifSymptoms.length < 1
  ) {
    return null;
  }

  return { riskSummary, timeline, warningSigns, ifSymptoms };
}

// ---------------------------------------------------------------------------
// Fallback — deterministic plan built from the bands. Never a blank screen.
// ---------------------------------------------------------------------------

function fallbackPlan({ jobType, hourly, peak }) {
  const maxHi = Math.max(...hourly.map((h) => h.heatIndexC));
  const worstBand = bandForC(maxHi);

  const riskSummary = [
    `Today feels up to ${Math.round(maxHi)}°C for a ${jobType.toLowerCase()}.`,
    peak
      ? `Hottest from ${hourLabel(peak.startHour)} to ${hourLabel(
          peak.endHour
        )}. Plan rest then.`
      : `Stay hydrated and take breaks in the shade.`,
  ];

  const timeline = hourly.map((h) => {
    const b = bandForC(h.heatIndexC);
    let action = "Work";
    let note = "Drink water regularly.";
    if (h.heatIndexC >= 39) {
      action = "Rest";
      note = "Too hot. Rest in shade. Sip water often.";
    } else if (h.heatIndexC >= 32) {
      action = "Hydrate";
      note = "Slow down. Drink water every 15–20 min. Find shade.";
    }
    return {
      label: hourLabel(h.hour),
      action,
      note: `Feels ${Math.round(h.heatIndexC)}°C (${b.label}). ${note}`,
    };
  });

  const warningSigns = [
    "Headache or dizziness",
    "Fast heartbeat",
    "Nausea or vomiting",
    "Hot, dry skin or heavy sweating that stops",
    "Confusion or fainting",
  ];

  const ifSymptoms = [
    "Stop work and move to shade or a cool place.",
    "Loosen clothes. Pour or wipe cool water on skin.",
    "Sip water slowly if awake and alert.",
    "If confused, fainting, or not improving, call emergency help now.",
  ];

  // Nudge the first line if the worst band is already dangerous.
  if (worstBand.label === "Extreme danger") {
    riskSummary[0] = `Dangerous heat today — feels up to ${Math.round(
      maxHi
    )}°C. Avoid heavy work.`;
  }

  return { riskSummary, timeline, warningSigns, ifSymptoms };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function peakWindow(hourly) {
  if (hourly.length === 0) return null;
  let maxHiC = -Infinity;
  for (const h of hourly) if (h.heatIndexC > maxHiC) maxHiC = h.heatIndexC;
  // Only call it a "danger window" if it actually crosses into caution+.
  if (maxHiC < 32) {
    const hot = hourly.filter((h) => h.heatIndexC >= 27);
    if (hot.length === 0) return null;
    return {
      startHour: hot[0].hour,
      endHour: hot[hot.length - 1].hour,
      maxHiC,
    };
  }
  const danger = hourly.filter((h) => h.heatIndexC >= 32);
  return {
    startHour: danger[0].hour,
    endHour: danger[danger.length - 1].hour,
    maxHiC,
  };
}

function bandForC(hiC) {
  if (hiC >= 51) return { label: "Extreme danger" };
  if (hiC >= 39) return { label: "Danger" };
  if (hiC >= 32) return { label: "Extreme caution" };
  if (hiC >= 27) return { label: "Caution" };
  return { label: "Safe" };
}

function hourLabel(hour) {
  const h = Number(hour);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "am" : "pm";
  return `${h12}${ampm}`;
}

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter(Boolean);
}

function str(v) {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function resp(statusCode, bodyObj) {
  return { statusCode, headers: CORS, body: JSON.stringify(bodyObj) };
}
