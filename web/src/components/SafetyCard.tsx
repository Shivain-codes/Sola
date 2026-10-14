import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CloudSun,
  Droplets,
  Flame,
  HeartPulse,
  Siren,
  Sun,
  Thermometer,
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
import { BandStamp, HeatNumeral } from "./ui/Readout";
import { spring } from "./ui/motion";
import { Reveal as SiteReveal } from "./ui/Reveal";

type Props = {
  plan: Plan;
  source: "ai" | "fallback";
  hours: HourlyHeat[];
  airQuality?: AirQuality | null;
};

/** Scroll-into-view wrapper: fade+rise once, spring physics. */
function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SiteReveal as="section" className={className}>
      {children}
    </SiteReveal>
  );
}

export default function SafetyCard({ plan, source, hours, airQuality }: Props) {
  const peakHiC = hours.length ? Math.max(...hours.map((h) => h.hiC)) : 0;
  const peakTone = bandFor(peakHiC).tone;
  const peak = peakWindow(hours);
  const blocks = compressPlan(hours);

  return (
    <div className="flex flex-col">
      <RiskReadout lines={plan.riskSummary} tone={peakTone} peakHiC={peakHiC} />
      {peak && <PeakAlarm peak={peak} />}
      <HazeSection airQuality={airQuality} />

      {/* Mobile / tablet: curve then tabs. */}
      <div className="lg:hidden">
        <HeatStrip hours={hours} />
        <ResultTabs plan={plan} hours={hours} />
      </div>

      {/* Desktop: curve (wide) + plan (narrow), then 3-column panels. */}
      <div className="hidden lg:block">
        <SiteReveal className="grid grid-cols-[2fr_1fr] gap-10 border-t border-line pt-10">
          <div>
            <SectionLabel>Your shift, hour by hour</SectionLabel>
            <div className="mt-6">
              <HeatStrip hours={hours} bare />
            </div>
          </div>
          <div>
            <SectionLabel>Your plan</SectionLabel>
            <div className="mt-6">
              <PlanTab blocks={blocks} />
            </div>
          </div>
        </SiteReveal>

        <SiteReveal className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-10">
          <WarningSigns signs={plan.warningSigns} />
          <div>
            <Emergency steps={plan.ifSymptoms} />
          </div>
          <ThirdPanel peakTone={peakTone} />
        </SiteReveal>
      </div>

      {source === "fallback" && (
        <p className="pt-7 text-center text-sm text-ink-soft">
          Showing a basic safety plan — the live advisor is busy. The heat
          numbers are still accurate.
        </p>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
      {children}
    </p>
  );
}

/** Desktop third panel — a plain-language reminder, no invented data. */
function ThirdPanel({ peakTone }: { peakTone: HeatTone }) {
  const inkText = peakTone === "caution";
  return (
    <div className="flex flex-col rounded-2xl border border-line p-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
        The basics
      </p>
      <ul className="mt-5 flex flex-col gap-4 text-[15px] leading-snug text-ink">
        <li className="flex items-start gap-3">
          <span
            className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: "#EA580C" }}
          />
          Drink water before you feel thirsty.
        </li>
        <li className="flex items-start gap-3">
          <span
            className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: "#EA580C" }}
          />
          Take breaks in shade, not in the sun.
        </li>
        <li className="flex items-start gap-3">
          <span
            className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: "#EA580C" }}
          />
          Watch your coworkers for the danger signs.
        </li>
      </ul>
      <div className="mt-auto pt-6">
        <span
          className="inline-flex items-center font-display text-xs uppercase tracking-[0.18em]"
          style={{
            backgroundColor: toneHex[peakTone],
            color: inkText ? "#191512" : "#faf6f0",
            borderRadius: 4,
            padding: "6px 12px",
          }}
        >
          Mind the peak hours
        </span>
      </div>
    </div>
  );
}

/* ---------------- a. Verdict ---------------- */

function RiskReadout({
  lines,
  tone,
  peakHiC,
}: {
  lines: string[];
  tone: HeatTone;
  peakHiC: number;
}) {
  return (
    <Reveal className="pb-9">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
        Today's peak heat
      </p>
      {/* Horizontal on desktop: giant numeral left, verdict copy right. */}
      <div className="mt-2 lg:flex lg:items-center lg:gap-10">
        <div className="flex items-end justify-between gap-4 lg:shrink-0">
          <HeatNumeral value={peakHiC} fontSize="clamp(4rem, 15vw, 7rem)" />
          <BandStamp tone={tone} className="mb-3 shrink-0 lg:hidden" />
        </div>
        <div className="mt-5 flex-1 space-y-1.5 lg:mt-0">
          <div className="hidden lg:mb-3 lg:block">
            <BandStamp tone={tone} />
          </div>
          {lines.map((line, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "font-display text-2xl leading-tight text-ink lg:text-3xl"
                  : "text-base leading-relaxed text-ink-soft"
              }
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- b. Peak alarm ---------------- */

function PeakAlarm({ peak }: { peak: { start: number; end: number } }) {
  return (
    <Reveal
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen"
    >
      <div style={{ backgroundColor: "#EA580C" }}>
        <div className="mx-auto max-w-[480px] px-6 py-7">
          <p className="font-display text-xs uppercase tracking-[0.22em] text-ink/70">
            Peak danger
          </p>
          <p className="mt-1 font-display text-[clamp(2rem,8vw,3rem)] leading-[0.98] text-ink">
            {hourLabel(peak.start)}&nbsp;—&nbsp;{hourLabel(peak.end)}
          </p>
          <p className="mt-1 font-display text-sm uppercase tracking-[0.14em] text-ink/80">
            Rest, shade, water. Avoid heavy work.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------- b2. Haze score ---------------- */

/** Live air-quality readout. Silently hides when no AQI data is present. */
function HazeSection({ airQuality }: { airQuality?: AirQuality | null }) {
  if (!airQuality) return null;
  const band = aqiBandFor(airQuality.aqi);
  const inkText = band.tone === "caution";

  return (
    <Reveal className="border-t border-line py-9">
      <SectionLabel>Haze score</SectionLabel>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p
          className="font-display tnum leading-[0.85] text-ink"
          style={{ fontSize: "clamp(3rem, 11vw, 5rem)" }}
        >
          {Math.round(airQuality.aqi)}
        </p>
        <span
          className="mb-3 inline-flex shrink-0 items-center font-display text-sm uppercase tracking-[0.18em]"
          style={{
            backgroundColor: toneHex[band.tone],
            color: inkText ? "#191512" : "#faf6f0",
            borderRadius: 4,
            padding: "6px 12px",
          }}
        >
          {band.label}
        </span>
      </div>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">
        {band.meaning}
      </p>
    </Reveal>
  );
}

/* ---------------- c. Hour-by-hour heat curve ---------------- */

/** Lucide band icon per tone (never emoji). */
function bandIcon(tone: HeatTone) {
  if (tone === "danger" || tone === "extreme") return Flame;
  if (tone === "hot") return Sun;
  if (tone === "caution") return CloudSun;
  return Thermometer; // safe
}

/** Smooth path (Catmull-Rom → cubic Bézier) through points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function HeatStrip({ hours, bare }: { hours: HourlyHeat[]; bare?: boolean }) {
  if (hours.length === 0) return null;

  // Geometry (viewBox units). Right gutter for temp scale, top for icons.
  const W = 480;
  const H = 190;
  const padL = 8;
  const padR = 44; // temp scale on the right
  const padTop = 34; // band icons row above the plot
  const padBot = 26; // hour labels below
  const plotW = W - padL - padR;
  const plotH = H - padTop - padBot;

  const temps = hours.map((h) => h.hiC);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);
  // pad the y-range a touch so the curve doesn't kiss the edges
  const yMin = min - span * 0.18;
  const yMax = max + span * 0.18;
  const ySpan = yMax - yMin;

  const xFor = (i: number) =>
    padL + (hours.length === 1 ? plotW / 2 : (i / (hours.length - 1)) * plotW);
  const yFor = (hiC: number) =>
    padTop + plotH - ((hiC - yMin) / ySpan) * plotH;

  const pts = hours.map((h, i) => ({ x: xFor(i), y: yFor(h.hiC) }));
  const line = smoothPath(pts);
  const area =
    line +
    ` L ${pts[pts.length - 1].x} ${padTop + plotH}` +
    ` L ${pts[0].x} ${padTop + plotH} Z`;

  // H / L marker indices
  let hiIdx = 0;
  let loIdx = 0;
  hours.forEach((h, i) => {
    if (h.hiC > hours[hiIdx].hiC) hiIdx = i;
    if (h.hiC < hours[loIdx].hiC) loIdx = i;
  });

  // Horizontal gridlines at 3 temp levels
  const gridTemps = [yMax, (yMax + yMin) / 2, yMin].map((t) =>
    Math.round(t)
  );

  // Hour label indices: every 3 hours, always include first + last
  const labelIdx = new Set<number>([0, hours.length - 1]);
  for (let i = 0; i < hours.length; i += 3) labelIdx.add(i);

  const nowHour = new Date().getHours();
  const nowIdx = hours.findIndex((h) => h.hour === nowHour);

  const Wrapper = bare ? BareWrap : Reveal;

  return (
    <Wrapper className={bare ? "" : "border-t border-line py-9"}>
      {!bare && (
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
          Your shift, hour by hour
        </p>
      )}

      {/* Band icons — one per hour, above the curve */}
      <div
        className={bare ? "relative" : "relative mt-6"}
        role="img"
        aria-label={stripLabel(hours)}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 flex"
          style={{
            left: `${(padL / W) * 100}%`,
            width: `${(plotW / W) * 100}%`,
          }}
        >
          {hours.map((h, i) => {
            const band = bandFor(h.hiC);
            const Icon = bandIcon(band.tone);
            return (
              <div
                key={h.time}
                className="flex flex-1 justify-center"
                style={{
                  // nudge first/last inward so edge icons stay on-canvas
                  transform:
                    i === 0
                      ? "translateX(6px)"
                      : i === hours.length - 1
                      ? "translateX(-6px)"
                      : undefined,
                }}
              >
                <Icon size={16} strokeWidth={2} color={toneHex[band.tone]} />
              </div>
            );
          })}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="heat-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Hairline gridlines + right-side temp scale */}
          {gridTemps.map((t, i) => {
            const y = yFor(t);
            return (
              <g key={i}>
                <line
                  x1={padL}
                  x2={padL + plotW}
                  y1={y}
                  y2={y}
                  stroke="#E8DFD3"
                  strokeWidth="1"
                />
                <text
                  x={W - padR + 8}
                  y={y + 4}
                  fontSize="11"
                  fill="#6B5F52"
                  fontFamily="Inter, sans-serif"
                >
                  {t}°
                </text>
              </g>
            );
          })}

          {/* Gradient fill under the curve */}
          <motion.path
            d={area}
            fill="url(#heat-fill)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.35 }}
          />

          {/* The curve */}
          <motion.path
            d={line}
            fill="none"
            stroke="#EA580C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />

          {/* now vertical hairline */}
          {nowIdx >= 0 && (
            <line
              x1={xFor(nowIdx)}
              x2={xFor(nowIdx)}
              y1={padTop}
              y2={padTop + plotH}
              stroke="#191512"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          )}

          {/* H / L markers — pop after the curve draws */}
          <Marker
            x={pts[hiIdx].x}
            y={pts[hiIdx].y}
            label="H"
            value={Math.round(hours[hiIdx].hiC)}
            color="#DC2626"
            above
          />
          <Marker
            x={pts[loIdx].x}
            y={pts[loIdx].y}
            label="L"
            value={Math.round(hours[loIdx].hiC)}
            color="#15803D"
            above={false}
          />
        </svg>

        {/* Hour labels — every 3 hours */}
        <div
          className="flex"
          style={{
            marginLeft: `${(padL / W) * 100}%`,
            width: `${(plotW / W) * 100}%`,
          }}
        >
          {hours.map((h, i) => (
            <div key={h.time} className="flex flex-1 justify-center">
              {labelIdx.has(i) && (
                <span
                  className={
                    i === nowIdx
                      ? "font-display text-[11px] text-ink tnum"
                      : "text-[11px] text-ink-soft tnum"
                  }
                >
                  {hourLabel(h.hour)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <Legend />
    </Wrapper>
  );
}

/** Plain wrapper for the desktop grid (no border/reveal — grid handles both). */
function BareWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/** SVG instrument callout: ring + label, placed above or below the point. */
function Marker({
  x,
  y,
  label,
  value,
  color,
  above,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  color: string;
  above: boolean;
}) {
  const ty = above ? y - 16 : y + 24;
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.4 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.55 }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <circle cx={x} cy={y} r="6" fill="#FAF6F0" stroke={color} strokeWidth="3" />
      <text
        x={x}
        y={ty}
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fontFamily='"Space Grotesk", sans-serif'
        fill={color}
      >
        {label} {value}°
      </text>
    </motion.g>
  );
}

function stripLabel(hours: HourlyHeat[]): string {
  return (
    "Heat index through the shift: " +
    hours.map((h) => `${hourLabel(h.hour)} ${Math.round(h.hiC)} degrees`).join(", ")
  );
}

function Legend() {
  const items: { label: string; tone: HeatTone }[] = [
    { label: "OK", tone: "safe" },
    { label: "Careful", tone: "caution" },
    { label: "Hot", tone: "hot" },
    { label: "Danger", tone: "danger" },
  ];
  return (
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-soft">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: toneHex[it.tone] }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ---------------- d. Tabbed results ---------------- */

type TabKey = "plan" | "signs" | "emergency";

function ResultTabs({ plan, hours }: { plan: Plan; hours: HourlyHeat[] }) {
  const [tab, setTab] = useState<TabKey>("plan");
  const blocks = compressPlan(hours);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "plan", label: "Your plan" },
    { key: "signs", label: "Danger signs" },
    { key: "emergency", label: "Emergency" },
  ];

  return (
    <section className="border-t border-line pt-6">
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 -mx-6 bg-paper/90 px-6 py-3 backdrop-blur-sm">
        <div
          role="tablist"
          aria-label="Safety plan sections"
          className="flex gap-1 rounded-full border border-line p-1"
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className="relative flex-1 rounded-full px-3 py-2 font-display text-sm text-ink"
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-full bg-ink"
                  />
                )}
                <span
                  className={
                    "relative z-10 " + (active ? "text-paper" : "text-ink-soft")
                  }
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[320px] py-7">
        <AnimatePresence mode="wait">
          {tab === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
            >
              <PlanTab blocks={blocks} />
            </motion.div>
          )}
          {tab === "signs" && (
            <motion.div
              key="signs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
            >
              <WarningSigns signs={plan.warningSigns} />
            </motion.div>
          )}
          {tab === "emergency" && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={spring}
            >
              <Emergency steps={plan.ifSymptoms} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ---------------- e. Compressed plan ---------------- */

type PlanBlock = {
  startHour: number;
  endHour: number;
  tone: HeatTone;
  title: string;
  guidance: string;
  icon: typeof Droplets;
};

function PlanTab({ blocks }: { blocks: PlanBlock[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {blocks.map((b, i) => (
        <li
          key={i}
          className="flex items-start gap-4 rounded-3xl border border-line p-5"
        >
          <span
            className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: toneHex[b.tone] }}
          >
            <b.icon
              size={20}
              strokeWidth={2}
              color={b.tone === "caution" ? "#191512" : "#faf6f0"}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm tnum text-ink-soft">
              {hourLabel(b.startHour)} — {hourLabel(b.endHour)}
            </p>
            <p className="font-display text-xl leading-tight text-ink">
              {b.title}
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-soft">
              {b.guidance}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- f. Danger signs ---------------- */

function WarningSigns({ signs }: { signs: string[] }) {
  return (
    <div className="rounded-3xl bg-ink p-7 text-paper">
      <p className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-paper/70">
        <Siren size={15} strokeWidth={2.25} color="#DC2626" />
        Danger signs to watch for
      </p>
      <ul className="mt-6 grid gap-4">
        {signs.map((sign, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <span
              className="mt-[9px] h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: "#DC2626" }}
            />
            <span className="text-[18px] leading-snug text-paper">{sign}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- g. Emergency ---------------- */

function Emergency({ steps }: { steps: string[] }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
        <HeartPulse size={14} strokeWidth={2.25} color="#DC2626" />
        If someone feels sick
      </p>
      <ol className="mt-6 grid gap-x-8 sm:grid-cols-2">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex items-baseline gap-5 border-b border-line py-4"
          >
            <span
              className="shrink-0 font-display tnum leading-none text-ink"
              style={{ fontSize: "2.25rem" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[18px] leading-snug text-ink">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- helpers ---------------- */

/** Longest contiguous run at caution-or-worse (hiC ≥ 32); the alarm window. */
function peakWindow(hours: HourlyHeat[]): { start: number; end: number } | null {
  if (hours.length === 0) return null;
  let best: { start: number; end: number } | null = null;
  let runStart = -1;
  for (let i = 0; i < hours.length; i++) {
    const hot = hours[i].hiC >= 32;
    if (hot && runStart === -1) runStart = i;
    const runEnds = !hot || i === hours.length - 1;
    if (runStart !== -1 && runEnds) {
      const end = hot ? i : i - 1;
      const len = end - runStart;
      if (!best || len > best.end - best.start) {
        best = { start: hours[runStart].hour, end: hours[end].hour };
      }
      runStart = -1;
    }
  }
  return best;
}

/** Severity tier for grouping — 3 bands → 3 kinds of guidance. */
type Tier = "work" | "caution" | "danger";
function tierOf(hiC: number): Tier {
  if (hiC >= 39) return "danger";
  if (hiC >= 32) return "caution";
  return "work";
}

const TIER_META: Record<
  Tier,
  { tone: HeatTone; title: string; guidance: string; icon: typeof Droplets }
> = {
  work: {
    tone: "safe",
    title: "Work — stay ahead of it",
    guidance: "Drink water every 20 minutes. Take short breaks in shade.",
    icon: Droplets,
  },
  caution: {
    tone: "hot",
    title: "Slow down",
    guidance:
      "Ease the pace. Water every 15 minutes, rest in shade between tasks.",
    icon: Sun,
  },
  danger: {
    tone: "danger",
    title: "Peak danger — rest",
    guidance: "No heavy work. Stay in shade, keep sipping water, watch others.",
    icon: Flame,
  },
};

/** Compress per-hour data into 2–3 contiguous blocks by severity tier. */
function compressPlan(hours: HourlyHeat[]): PlanBlock[] {
  if (hours.length === 0) return [];
  const blocks: PlanBlock[] = [];
  let startIdx = 0;
  let tier = tierOf(hours[0].hiC);

  const push = (fromIdx: number, toIdx: number, t: Tier) => {
    const meta = TIER_META[t];
    blocks.push({
      startHour: hours[fromIdx].hour,
      // end label is the start of the hour AFTER the block (exclusive-ish)
      endHour: (hours[toIdx].hour + 1) % 24,
      tone: meta.tone,
      title: meta.title,
      guidance: meta.guidance,
      icon: meta.icon,
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
