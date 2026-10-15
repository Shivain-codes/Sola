import {
  CloudSun,
  Droplets,
  Flame,
  HeartPulse,
  Siren,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import {
  aqiBandFor,
  bandFor,
  hourLabel,
  type AirQuality,
  type HeatTone,
  type HourlyHeat,
} from "../lib/heat";
import type { Plan } from "../lib/plan";
import { toneHex } from "../lib/tone";
import { Reveal as SiteReveal } from "./ui/Reveal";

type Props = {
  plan: Plan;
  source: "ai" | "fallback";
  hours: HourlyHeat[];
  airQuality?: AirQuality | null;
  cityName: string;
  /** Worker's age (optional) — sharpens hydration/rest guidance for 60+. */
  age?: number;
};

/* ------------------------------------------------------------------ */
/* Apple Weather structure, Sola content:                              */
/* hero numeral → hourly strip → range-bar rows → 2-col module grid.   */
/* ------------------------------------------------------------------ */

const HEAT_GRADIENT =
  "linear-gradient(90deg,#15803D 0%,#CA8A04 38%,#EA580C 62%,#DC2626 100%)";
const UV_GRADIENT =
  "linear-gradient(90deg,#15803D 0%,#CA8A04 27%,#EA580C 45%,#DC2626 64%,#7C3AED 100%)";

export default function SafetyCard({
  plan,
  source,
  hours,
  airQuality,
  cityName,
  age,
}: Props) {
  if (hours.length === 0) return null;

  const nowHour = new Date().getHours();
  const nowIdx = hours.findIndex((h) => h.hour === nowHour);
  const nowHi = nowIdx >= 0 ? hours[nowIdx].hiC : hours[0].hiC;
  const his = hours.map((h) => h.hiC);
  const hi = Math.max(...his);
  const lo = Math.min(...his);
  const band = bandFor(nowHi);
  const blocks = buildBlocks(hours);
  const guide = guidanceFor(hi, age);

  return (
    <div className="flex flex-col gap-3">
      <Hero cityName={cityName} nowHi={nowHi} hi={hi} lo={lo} band={band} />
      <HourlyCard hours={hours} nowIdx={nowIdx} />
      <BreakdownCard blocks={blocks} dayMin={lo} dayMax={hi} />

      <SiteReveal as="section" className="grid grid-cols-2 gap-3">
        <Module label="Hydration" icon={Droplets} value="250 ml" caption={guide.waterEvery}>
          <NeedScale level={guide.level} />
        </Module>
        <Module label="Rest" icon={CloudSun} value={guide.restLen} caption={guide.restEvery}>
          <NeedScale level={guide.level} />
        </Module>
        <Module
          label="Warning signs"
          icon={Siren}
          value={String(plan.warningSigns.length)}
          caption="signs to watch for"
        >
          <ul className="flex flex-col gap-1">
            {plan.warningSigns.map((s, i) => (
              <li key={i} className="truncate text-[12px] leading-snug text-ink-soft">
                {s}
              </li>
            ))}
          </ul>
        </Module>
        {airQuality && (
          <Module
            label="Haze score"
            icon={Wind}
            value={String(Math.round(airQuality.aqi))}
            caption={aqiBandFor(airQuality.aqi).label}
          >
            <AqiScale aqi={airQuality.aqi} />
          </Module>
        )}
      </SiteReveal>
      <Card>
        <CardLabel>Your plan</CardLabel>
        <div className="mt-3 flex flex-col gap-2">
          {plan.riskSummary.map((line, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "font-display text-xl leading-snug text-ink"
                  : "text-[15px] leading-relaxed text-ink-soft"
              }
            >
              {line}
            </p>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel icon={HeartPulse}>If someone feels sick</CardLabel>
        <ol className="mt-3 flex flex-col">
          {plan.ifSymptoms.map((step, i) => (
            <li
              key={i}
              className={
                "flex items-baseline gap-4 py-2.5 " +
                (i > 0 ? "border-t border-line/70" : "")
              }
            >
              <span className="shrink-0 font-display text-lg text-ink-soft tnum">
                {i + 1}
              </span>
              <span className="text-[15px] leading-snug text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      {source === "fallback" && (
        <p className="pt-2 text-center text-sm text-ink-soft">
          Showing a basic safety plan — the live advisor is busy. The heat
          numbers are still accurate.
        </p>
      )}
    </div>
  );
}

/* ---------------- 1. Hero — location / huge numeral / condition / H:L ---------------- */

function Hero({
  cityName,
  nowHi,
  hi,
  lo,
  band,
}: {
  cityName: string;
  nowHi: number;
  hi: number;
  lo: number;
  band: { short: string };
}) {
  return (
    <SiteReveal as="section" className="px-2 pb-5 pt-2 text-center">
      <h2 className="font-display text-[clamp(1.6rem,4.5vw,2.4rem)] leading-tight text-ink">
        {cityName}
      </h2>
      <p
        className="font-display font-extralight leading-[1.05] text-ink tnum"
        style={{ fontSize: "clamp(5.5rem,17vw,8.5rem)" }}
      >
        {Math.round(nowHi)}°
      </p>
      <p className="mt-1 font-display text-xl text-ink">{band.short}</p>
      <p className="mt-1 text-[17px] text-ink tnum">
        H:{Math.round(hi)}°&nbsp;&nbsp;L:{Math.round(lo)}°
      </p>
    </SiteReveal>
  );
}

/* ---------------- 2. Hourly strip ---------------- */

function HourlyCard({ hours, nowIdx }: { hours: HourlyHeat[]; nowIdx: number }) {
  return (
    <SiteReveal as="section">
      <Card>
        <CardLabel>Hourly heat</CardLabel>
        <div className="-mx-1 mt-2 flex gap-1 overflow-x-auto px-1 pb-1">
          {hours.map((h, i) => {
            const b = bandFor(h.hiC);
            const Icon = bandIcon(b.tone);
            const isNow = i === nowIdx;
            return (
              <div
                key={h.time}
                className="flex w-[52px] shrink-0 flex-col items-center gap-1.5 py-1"
              >
                <span
                  className={
                    "text-[11px] tnum " +
                    (isNow ? "font-semibold text-ink" : "text-ink-soft")
                  }
                >
                  {isNow ? "Now" : hourLabel(h.hour).toUpperCase()}
                </span>
                <Icon size={19} strokeWidth={2} color={toneHex[b.tone]} />
                <span
                  className={
                    "text-[15px] tnum " +
                    (isNow ? "font-semibold text-ink" : "text-ink")
                  }
                >
                  {Math.round(h.hiC)}°
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </SiteReveal>
  );
}

/* ---------------- 3. Shift breakdown — Apple's 10-day rows ---------------- */

type Block = {
  startHour: number;
  endHour: number;
  tone: HeatTone;
  title: string;
  lo: number;
  hi: number;
};

function BreakdownCard({
  blocks,
  dayMin,
  dayMax,
}: {
  blocks: Block[];
  dayMin: number;
  dayMax: number;
}) {
  const span = Math.max(dayMax - dayMin, 1);
  return (
    <SiteReveal as="section">
      <Card>
        <CardLabel>Shift breakdown</CardLabel>
        <div className="mt-1 flex flex-col">
          {blocks.map((b, i) => {
            const Icon = bandIcon(b.tone);
            // Position this block's [lo,hi] on the day's [dayMin,dayMax] scale.
            const l = Math.max(0, ((b.lo - dayMin) / span) * 100);
            const r = Math.min(100, ((b.hi - dayMin) / span) * 100);
            const w = Math.max(r - l, 7);
            return (
              <div
                key={i}
                className={
                  "flex items-center gap-3 py-3 " +
                  (i > 0 ? "border-t border-line/70" : "")
                }
              >
                <span className="w-[104px] shrink-0 text-[13px] text-ink tnum">
                  {hourLabel(b.startHour).toUpperCase()}–
                  {hourLabel(b.endHour).toUpperCase()}
                </span>
                <Icon size={17} strokeWidth={2} color={toneHex[b.tone]} />
                <span className="w-9 shrink-0 text-right text-[15px] text-ink-soft/80 tnum">
                  {Math.round(b.lo)}°
                </span>
                <div className="relative h-[6px] flex-1">
                  <div
                    className="absolute inset-0 rounded-full opacity-25"
                    style={{ background: HEAT_GRADIENT }}
                  />
                  <div
                    className="absolute inset-y-0 overflow-hidden rounded-full"
                    style={{ left: `${l}%`, width: `${w}%` }}
                  >
                    <div
                      className="absolute inset-y-0"
                      style={{
                        left: `${-(l / w) * 100}%`,
                        width: `${(100 / w) * 100}%`,
                        background: HEAT_GRADIENT,
                      }}
                    />
                  </div>
                </div>
                <span className="w-9 shrink-0 text-[15px] font-medium text-ink tnum">
                  {Math.round(b.hi)}°
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </SiteReveal>
  );
}

/* ---------------- 4. Module grid ---------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-line bg-paper/75 p-5 backdrop-blur-md">
      {children}
    </div>
  );
}

function CardLabel({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
      {Icon && <Icon size={13} strokeWidth={2.25} color="#EA580C" />}
      {children}
    </p>
  );
}

function Module({
  label,
  icon: Icon,
  value,
  caption,
  children,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  caption: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-[22px] border border-line bg-paper/75 p-4 backdrop-blur-md">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
        <Icon size={13} strokeWidth={2.25} color="#EA580C" />
        {label}
      </p>
      <p className="mt-2 font-display text-[32px] font-light leading-none text-ink tnum">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">{caption}</p>
      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  );
}

/** Continuous need scale (hydration / rest urgency), marker at level 0..1. */
function NeedScale({ level }: { level: number }) {
  return (
    <div className="relative h-[6px] rounded-full" style={{ background: HEAT_GRADIENT }}>
      <div
        className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow"
        style={{ left: `${Math.min(96, Math.max(4, level * 100))}%` }}
      />
    </div>
  );
}

function AqiScale({ aqi }: { aqi: number }) {
  const pct = Math.min(100, Math.max(0, (aqi / 300) * 100));
  return (
    <div className="relative h-[6px] rounded-full" style={{ background: UV_GRADIENT }}>
      <div
        className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function bandIcon(tone: HeatTone): LucideIcon {
  if (tone === "danger" || tone === "extreme") return Flame;
  if (tone === "hot") return Sun;
  if (tone === "caution") return CloudSun;
  return Thermometer; // safe
}

type Tier = "work" | "caution" | "danger";
function tierOf(hiC: number): Tier {
  if (hiC >= 39) return "danger";
  if (hiC >= 32) return "caution";
  return "work";
}

const TIER_META: Record<Tier, { tone: HeatTone; title: string }> = {
  work: { tone: "safe", title: "Work — stay ahead of it" },
  caution: { tone: "hot", title: "Slow down" },
  danger: { tone: "danger", title: "Peak danger — rest" },
};

/** Compress per-hour data into contiguous severity blocks, with each block's lo/hi. */
function buildBlocks(hours: HourlyHeat[]): Block[] {
  if (hours.length === 0) return [];
  const blocks: Block[] = [];
  let startIdx = 0;
  let tier = tierOf(hours[0].hiC);

  const push = (fromIdx: number, toIdx: number, t: Tier) => {
    const slice = hours.slice(fromIdx, toIdx + 1);
    const meta = TIER_META[t];
    blocks.push({
      startHour: hours[fromIdx].hour,
      endHour: (hours[toIdx].hour + 1) % 24,
      tone: meta.tone,
      title: meta.title,
      lo: Math.min(...slice.map((h) => h.hiC)),
      hi: Math.max(...slice.map((h) => h.hiC)),
    });
  };

  for (let i = 1; i < hours.length; i++) {
    const t = tierOf(hours[i].hiC);
    if (t !== tier) {
      push(startIdx, i - 1, tier);
      startIdx = i;
      tier = t;
    }
  }
  push(startIdx, hours.length - 1, tier);
  return blocks;
}

/**
 * Rules-based hydration/rest guidance from the shift's peak heat index.
 * Workers 60+ get one urgency tier bump — older adults dehydrate faster
 * and feel heat stress sooner, so water/rest come more often.
 */
function guidanceFor(
  peakHiC: number,
  age?: number
): {
  waterEvery: string;
  restLen: string;
  restEvery: string;
  level: number;
} {
  const senior = age != null && age >= 60;
  const hi = senior ? peakHiC + 4 : peakHiC;
  if (hi >= 39)
    return {
      waterEvery: "Every 15 min",
      restLen: "15 min",
      restEvery: senior ? "Shade break every 20 min" : "Shade break every 30 min",
      level: 0.92,
    };
  if (hi >= 32)
    return {
      waterEvery: senior ? "Every 15 min" : "Every 20 min",
      restLen: "10 min",
      restEvery: senior ? "Shade break every 30 min" : "Shade break every hour",
      level: 0.6,
    };
  return {
    waterEvery: "Every 30 min",
    restLen: "Short breaks",
    restEvery: "Rest in shade as needed",
    level: 0.3,
  };
}
