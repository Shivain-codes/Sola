# Sola — submission kit

Everything needed to submit. Fill the three links, record the video, submit
**Sunday morning** (not Sunday night — give yourself buffer before the Oct 11 close).

## Submission fields

| Field          | Value                                          |
| -------------- | ---------------------------------------------- |
| Project        | Sola — heatwave safety copilot                 |
| Track          | **Heat and Water** (heatwaves)                 |
| Repo (public)  | `<GITHUB_URL>`                                 |
| Live URL       | `<AMPLIFY_URL>`  (no login)                    |
| Demo video     | `<YOUTUBE_URL>`  (public, ≤3 min)              |
| Built on AWS   | Amplify Hosting + Lambda + Bedrock Nova Lite   |

---

## Demo video script (target 2:15, hard cap 3:00)

No copyrighted music. Talk over it, or use silence / a royalty-free bed
(YouTube Audio Library). Record the walkthrough on a **phone-width** window so it
reads as a mobile product. Keep the Network tab open for beat 3.

### Beat 1 — the problem + who it's for (0:00–0:15)

> "Heatwaves kill more outdoor workers than any other weather. A delivery rider
> opens a weather app, sees '41 degrees' — and that number tells them nothing
> about what to *do*. Sola turns the heat into a plan."

Show: a plain weather app or just the number "41°C", then cut to Sola's hero.

### Beat 2 — live walkthrough (0:15–1:45)

Do it for real, no cuts if you can:

1. Type a city (e.g. **Delhi**), pick **Construction worker**, set the shift.
2. Tap **Get my safety plan**. Let it load (~3s).
3. Narrate the card as you scroll:
   - "It computes the real *heat index* — what it feels like with humidity —
     not just the thermometer."
   - Point at the **color strip**: "Here's the whole shift, hour by hour. Green
     is fine, orange and red are dangerous. This block is marked 'now'."
   - "Then plain guidance: work, rest, or drink water, for each part of the day."
   - "The five warning signs of heatstroke, in simple words."
   - "And exactly what to do if someone collapses."

Key line to say out loud: **"The app never guesses the weather — the heat
numbers are computed, the AI only writes the advice."**

### Beat 3 — where AWS fits (1:45–2:15)

> "It's built on AWS. **Amplify** hosts the app and redeploys on every push.
> The browser sends the computed heat data to a **Lambda** Function URL. Lambda
> calls **Amazon Bedrock, Nova Lite**, which writes the plan from those numbers
> and sends it back."

Show: the Network tab with the POST going to the `*.lambda-url.*.on.aws` URL and
the JSON plan coming back. Optionally flash the Amplify console and the Bedrock
model id `amazon.nova-lite-v1:0`.

Close: "Sola — a safety plan for the people who can't come inside."

---

## Pre-submit verification checklist

Run through this before pasting the links into the submission form:

- [ ] **Repo is public** — open the GitHub URL in a private/incognito window.
- [ ] **README explains AWS usage** — the "Where AWS is used" table names
      Amplify (hosting), Lambda (compute), Bedrock Nova Lite (the plan).
- [ ] **Live URL works with no login** — open `<AMPLIFY_URL>` in incognito on a
      phone-width window; full flow city → plan completes.
- [ ] **It hits the real backend, not localhost** — DevTools → Network shows the
      POST going to `*.lambda-url.*.on.aws` and returning `{ "source": "ai", ... }`.
- [ ] **Fallback is safe** — even if Bedrock throttles, a plan still renders
      (`source: "fallback"`). No blank screen.
- [ ] **Video is public** — open the YouTube link in incognito; it plays.
- [ ] **Video is under 3:00** and has **no copyrighted music**.
- [ ] **Three links filled** in the submission + **track = Heat and Water**.
- [ ] Submitted **Sunday morning**.
