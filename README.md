# Sola — a heatwave safety copilot for outdoor workers

> Enter your city, your shift hours, and your job → get today's heat-safety plan:
> which hours are dangerous, when to rest and drink water, the warning signs of
> heatstroke, and what to do if someone collapses. In plain words, on a phone.

**Track:** Heat and Water (heatwaves) · Environmental Hacks (Bharat Builds Tour)

- 🔗 **Live app:** `<AMPLIFY_URL>` *(no login — open on a phone)*
- 🎬 **Demo video (≤3 min):** `<YOUTUBE_URL>`
- 💻 **Repo:** `<GITHUB_URL>` *(public)*

---

## The problem

Heatwaves are the deadliest weather hazard, and outdoor workers — delivery
riders, construction labourers, street vendors — take the worst of it. They
can't move their work indoors, and they're paid to keep going.

The information they get is useless at the moment of decision. A weather app
says **"41°C."** So what? A rider on a bike doesn't know if that means *keep
going*, *drink more*, or *stop now*. A temperature number is not an instruction.
And the number alone is misleading: 36°C at 70% humidity is far more dangerous
than 36°C in dry air, because sweat can't evaporate — your body can't cool
itself. That's the **heat index** ("feels like"), and it's what actually hurts
people.

Sola turns the number into a **decision**. One screen in, a plan out:

- A color strip of the shift, hour by hour, with the current hour marked.
- "Work / Rest / Hydrate" guidance for each block.
- The five warning signs of heatstroke, in words a 15-year-old understands.
- Exactly what to do if symptoms appear.

It is a decision tool, not a dashboard.

## How it works

```
City + shift + job
     │
     ▼
Open-Meteo  ──►  geocode city → today's hourly temp + humidity
     │
     ▼
heat.ts     ──►  NWS Rothfusz heat index (°C), bucketed into danger bands
     │           ← this is deterministic math; the AI never touches it
     ▼
Lambda      ──►  the computed hourly heat table goes INTO the prompt
(Bedrock         Bedrock Nova Lite writes the plan from that data
 Nova Lite)      ← the model never guesses the weather, only the advice
     │
     ▼
Safety card ──►  rendered big-text, mobile-first, on Amplify Hosting
```

The split is deliberate and important: **the weather and danger levels are
computed, not generated.** The AI only writes the human-facing plan from numbers
it is handed. If Bedrock is unavailable, a deterministic fallback plan (built
straight from the danger bands) renders instead — the user never sees a blank
screen or a wrong temperature.

### The non-AI core: heat index

Computed in `web/src/lib/heat.ts` with the NWS Rothfusz regression (°F
round-trip, with the low/high-humidity edge adjustments), then bucketed:

| Heat index (°C) | Band            | Meaning                         |
| --------------- | --------------- | ------------------------------- |
| 27–32           | Caution         | Tiring; drink water             |
| 32–39           | Extreme caution | Slow down, shade, frequent rest |
| 39–51           | Danger          | Heatstroke likely with exertion |
| 51+             | Extreme danger  | Avoid heavy outdoor work        |

---

## Where AWS is used

Sola is built on AWS end to end. Three services, each doing one job:

| AWS service                | Role in Sola                                                                                             | Where                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **AWS Amplify Hosting**    | Hosts the React/Vite frontend; auto-deploys on every `git push` to `main`.                               | `amplify.yml`, `web/`              |
| **AWS Lambda**             | Compute for `generatePlan`, exposed via a **Function URL** (no API Gateway). Node 20, CORS open.          | `lambda/generatePlan/index.mjs`    |
| **Amazon Bedrock — Nova Lite** (`amazon.nova-lite-v1:0`) | Writes the safety plan from the computed hourly heat table. The model is called server-side from Lambda. | `lambda/generatePlan/index.mjs`    |

Flow: **Amplify** serves the app → the browser POSTs the computed heat data to
the **Lambda** Function URL → Lambda calls **Bedrock Nova Lite** and returns the
plan. No API Gateway, no database, no auth — the Function URL is the whole
backend surface.

---

## Stack

- `web/` — Vite + React + TypeScript + Tailwind, mobile-first (workers are on phones).
- `lambda/generatePlan/` — Node 20 Lambda (Function URL) → Bedrock Nova Lite.
- Weather data — [Open-Meteo](https://open-meteo.com/) geocoding + hourly forecast.
- Hosting — AWS Amplify.

## Setup

### Run locally

```bash
# 1. backend — the plan Lambda, hitting real Bedrock
cd lambda/generatePlan
npm install
node local-server.mjs            # http://localhost:8787
#   simulate Bedrock being down:  SOLA_FORCE_FALLBACK=1 node local-server.mjs

# 2. frontend
cd web
npm install
cp .env.example .env.local       # VITE_PLAN_URL defaults to the local server
npm run dev                       # http://localhost:5173
```

`local-server.mjs` runs the exact Lambda handler behind a tiny HTTP server, so
local dev exercises the real Bedrock path. It is **not** deployed.

### Deploy to AWS

Full runbook in **[DEPLOY.md](./DEPLOY.md)** — deploy the Lambda + Function URL
(IAM policy for `bedrock:InvokeModel` included), connect the repo to Amplify
Hosting, and set `VITE_PLAN_URL` to the Function URL. ~15 minutes.

Prerequisite: **Amazon Bedrock → Nova Lite (`amazon.nova-lite-v1:0`) access
enabled** in your account, in a region that offers it (e.g. `us-east-1`).

---

## `generatePlan` Lambda contract

The browser POSTs the computed hourly heat data; Nova writes the plan from it.

```jsonc
// request
{
  "city": "Delhi",
  "jobType": "Construction worker",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "hourly": [
    { "hour": 9, "tempC": 30, "humidity": 60, "heatIndexC": 33, "band": "Extreme caution" }
  ]
}
// response
{
  "source": "ai",            // or "fallback" if Bedrock was unavailable
  "plan": {
    "riskSummary": ["line 1", "line 2"],
    "timeline": [{ "label": "9am-11am", "action": "Work", "note": "…" }],
    "warningSigns": ["…", "…", "…", "…", "…"],
    "ifSymptoms": ["…", "…", "…"]
  }
}
```

---

## Scope

One feature, done well: **city + shift in → safety plan out.** No auth, no
database, no push notifications, no language toggle. Deliberately cut.

## Credits & data

- Weather & geocoding: **[Open-Meteo](https://open-meteo.com/)** — free, no API
  key required. Data licensed under **CC-BY 4.0**; used via the free
  non-commercial tier ([terms](https://open-meteo.com/en/terms)).
- Heat-index formula: **NWS Rothfusz regression** (US National Weather Service).
- AI: **Amazon Bedrock — Nova Lite** (`amazon.nova-lite-v1:0`).

## License

MIT — see [LICENSE](./LICENSE).
