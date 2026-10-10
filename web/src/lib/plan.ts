// Sola — plan API client. POSTs the computed hourly heat data to the
// generatePlan Lambda Function URL; Nova writes the plan from that data.

import { bandFor, type HourlyHeat } from "./heat";

export type TimelineBlock = {
  label: string;
  action: string; // Work | Rest | Hydrate
  note: string;
};

export type Plan = {
  riskSummary: string[];
  timeline: TimelineBlock[];
  warningSigns: string[];
  ifSymptoms: string[];
};

export type PlanResult = {
  plan: Plan;
  source: "ai" | "fallback";
};

// Set VITE_PLAN_URL to the Lambda Function URL at build/deploy time.
const PLAN_URL = import.meta.env.VITE_PLAN_URL as string | undefined;

export async function generatePlan(args: {
  city: string;
  jobType: string;
  shiftStart: string;
  shiftEnd: string;
  hours: HourlyHeat[];
}): Promise<PlanResult> {
  if (!PLAN_URL) {
    throw new Error(
      "Plan service is not configured yet (VITE_PLAN_URL missing)."
    );
  }

  const payload = {
    city: args.city,
    jobType: args.jobType,
    shiftStart: args.shiftStart,
    shiftEnd: args.shiftEnd,
    hourly: args.hours.map((h) => ({
      hour: h.hour,
      tempC: Math.round(h.tempC * 10) / 10,
      humidity: h.humidity,
      heatIndexC: Math.round(h.hiC * 10) / 10,
      band: bandFor(h.hiC).label,
    })),
  };

  // 15s guard so the UI never hangs forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(PLAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Plan service error (${res.status})`);
    const data = (await res.json()) as PlanResult;
    if (!data?.plan) throw new Error("Plan service returned no plan.");
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
