// Sola — generatePlan Lambda (Function URL, no API Gateway). Node 20 runtime.
//
// Request (POST JSON):
//   { city, jobType, shiftStart, shiftEnd, age?, customOccupation?, aqi?,
//     hourly: [{ hour, tempC, humidity, heatIndexC, band }] }
//
// Response (200 JSON):
//   { plan: Plan, source: "ai" | "fallback" }
//
// Plan shape (strict — the web card renders exactly these fields):
//   {
//     riskSummary: string[4],                          // four descriptive, dynamic lines
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
  "You are a heat-safety advisor for outdoor workers. " +
  "Write in simple, short sentences. No jargon. No extra sections. " +
  "Tailor the advice to the specific worker, their job, and their age when given.";

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
  // "Other" with a custom value uses that value; "Other" left blank becomes a
  // generic "outdoor worker" so copy never reads "As a Other".
  const effectiveJob =
    jobType === "Other"
      ? customOccupation || "outdoor worker"
      : jobType;
  const shiftStart = str(input.shiftStart) || "";
  const shiftEnd = str(input.shiftEnd) || "";
  const hourly = Array.isArray(input.hourly) ? input.hourly : [];
  const aqiNum = Number(input.aqi);
  const aqi =
    Number.isFinite(aqiNum) && aqiNum >= 0 && aqiNum <= 500
      ? Math.round(aqiNum)
      : null;

  if (hourly.length === 0) {
    return resp(400, { error: "No hourly heat data provided." });
  }

  const peak = peakWindow(hourly);
  const peakHumidity = Math.max(
    ...hourly.map((h) => Number(h.humidity) || 0)
  );

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
      peakHumidity,
      aqi,
    });
    return resp(200, { plan, source: "ai" });
  } catch (err) {
    console.error("Bedrock/plan generation failed, using fallback:", err);
    const plan = fallbackPlan({ jobType: effectiveJob, hourly, peak, peakHumidity, age, aqi });
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
  peakHumidity,
  aqi,
}) {
  const table = hourly
    .map(
      (h) =>
        `${hourLabel(h.hour)}: ${Math.round(h.tempC)}C air, ${
          h.humidity
        }% humidity, feels ${Math.round(h.heatIndexC)}C (${h.band})`
    )
    .join("\n");

  const hazeLine =
    aqi == null
      ? `Haze: no air-quality data.`
      : `Haze: US AQI ${aqi} (${aqiLabel(aqi)}).`;

  const ageLine =
    age == null
      ? `Worker age: not given.`
      : age >= 60
        ? `Worker age: ${age}. Older adults overheat faster, feel thirst late, and are at higher heatstroke risk.`
        : age < 18
          ? `Worker age: ${age}. Young workers need extra water reminders and shade breaks.`
          : `Worker age: ${age}.`;

  const userPrompt = [
    `Worker: ${jobType} in ${city}.`,
    `Shift: ${shiftStart || "start"} to ${shiftEnd || "end"}.`,
    ageLine,
    hazeLine,
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
    `Write a heat-safety plan for THIS worker. Return ONLY valid JSON (no`,
    `markdown, no code fences) with exactly this shape:`,
    `{`,
    `  "riskSummary": ["line 1", "line 2", "line 3", "line 4"],`,
    `  "timeline": [{"label":"9am-11am","action":"Work","note":"short note"}],`,
    `  "warningSigns": ["sign 1","sign 2","sign 3","sign 4","sign 5"],`,
    `  "ifSymptoms": ["step 1","step 2","step 3"]`,
    `}`,
    `Rules:`,
    `- riskSummary: exactly 4 lines, plain words, no jargon. Every line must`,
    `  be specific to THIS worker, THIS city, and TODAY's numbers — dynamic,`,
    `  never generic filler.`,
    `- Line 1 MUST start with "As a ${jobType}," and include the city, the`,
    `  peak feels-like temperature, and the peak window hours.`,
    `- Line 2 MUST name the single most important action for THIS worker,`,
    `  tied to the peak window hours (e.g. when to rest, how often to drink).`,
    age != null
      ? `- Line 3 MUST be personal to the worker's age (${age}):`
      : `- Line 3 MUST give the second most important action for this worker's job. The worker's age was NOT given — do NOT mention age anywhere in this line:`,
    age != null && age >= 60
      ? `-   older adults overheat faster and feel thirst late — tell them plainly.`
      : age != null && age < 18
        ? `-   young workers need extra water reminders and shade breaks — say so.`
        : `-   give the second most important action for this worker's job.`,
    `- Line 4 MUST react to today's air:`,
    aqi != null && aqi > 100
      ? `-   haze is ${aqiLabel(aqi)} (AQI ${aqi}) — give mask/breathing guidance.`
      : `-   use today's peak humidity (${peakHumidity}%): if humid, warn that sweat won't cool them; if dry, remind them they dehydrate without feeling it.`,
    `- timeline: cover the FULL shift (${shiftStart || "start"} to ` +
      `${shiftEnd || "end"}), one block per 1-2 hours. action is Work, Rest, or Hydrate.`,
    `- EVERY timeline note must be specific to that block: cite the feels-like`,
    `  temperature for those hours and say exactly what to do. Never write`,
    `  generic filler like "drink water regularly".`,
    `- During the peak window, schedule Rest blocks in shade.`,
    age != null && age >= 60
      ? `- The worker is ${age}: schedule a Rest or Hydrate block at least ` +
        `every hour, and say the age reason plainly in 2-3 notes (e.g. "At ` +
        `${age}, rest even if you feel fine — heat hits faster"). Do NOT repeat ` +
        `the same sentence in every block.`
      : null,
    aqi != null && aqi > 150
      ? `- Haze is unhealthy (AQI ${aqi}): add mask/breathing advice in one ` +
        `timeline note.`
      : null,
    `- warningSigns: exactly 5 heatstroke warning signs, plain words.`,
    `- ifSymptoms: what to do if symptoms appear. Short steps.`,
    `- No text outside the JSON.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const payload = {
    system: [{ text: SYSTEM_PROMPT }],
    messages: [{ role: "user", content: [{ text: userPrompt }] }],
    inferenceConfig: { maxTokens: 1400, temperature: 0.4, topP: 0.9 },
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

  const riskSummary = asStringArray(obj.riskSummary).slice(0, 4);
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
    riskSummary.length < 2 ||
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

function fallbackPlan({ jobType, hourly, peak, peakHumidity, age, aqi }) {
  const maxHi = Math.max(...hourly.map((h) => h.heatIndexC));
  const worstBand = bandForC(maxHi);
  const senior = age != null && age >= 60;
  const peakHum = Number.isFinite(peakHumidity) ? Math.round(peakHumidity) : null;

  const peakRange = peak
    ? `Hottest from ${hourLabel(peak.startHour)} to ${hourLabel(peak.endHour)}.`
    : `No extreme peak today.`;

  const riskSummary = [
    `As a ${jobType.toLowerCase()}, ${peakRange} It feels up to ${Math.round(maxHi)}°C in the hottest hours.`,
    peak && maxHi >= 39
      ? `Rest in shade through the peak window — this is the most dangerous part of your shift.`
      : `Drink water every 15–20 minutes through the hot hours, not just when thirsty.`,
    senior
      ? `At ${age}, you overheat faster and feel thirst late — take shade breaks even before you feel tired.`
      : age != null
        ? `At ${age}, set a timer if you can — it's easy to lose track of water when you're busy.`
        : `If you stop sweating or feel dizzy, stop work and cool down right away.`,
    aqi != null && aqi > 100
      ? `Haze is ${aqiLabel(aqi).toLowerCase()} (AQI ${aqi}) — wear a mask outdoors and breathe through your nose.`
      : peakHum != null && peakHum >= 70
        ? `Humidity hits ${peakHum}% — sweat won't cool you well today, so shade breaks matter more.`
        : `Dry heat dehydrates silently — sip water steadily even if you don't feel sweaty.`,
  ];

  const timeline = hourly.map((h) => {
    const b = bandForC(h.heatIndexC);
    let action = "Work";
    let note = `Feels ${Math.round(h.heatIndexC)}°C. Drink water.`;
    if (h.heatIndexC >= 39) {
      action = "Rest";
      note = `Feels ${Math.round(
        h.heatIndexC
      )}°C — too hot. Rest in shade. Sip water often.`;
    } else if (h.heatIndexC >= 32) {
      action = "Hydrate";
      note = `Feels ${Math.round(
        h.heatIndexC
      )}°C. Slow down. Drink water every 15–20 min. Find shade.`;
    }
    if (senior && (action === "Work" || action === "Hydrate")) {
      note += ` At ${age}, rest even if you feel fine.`;
    }
    return {
      label: hourLabel(h.hour),
      action,
      note: `${b.label}. ${note}`,
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

/** Short US-AQI category for prompt context. */
function aqiLabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
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
