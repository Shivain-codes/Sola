import { motion } from "framer-motion";
import type { HourlyHeat } from "../../lib/heat";

/** Catmull-Rom → cubic Bézier smooth path. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
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

/**
 * Oscilloscope-style heat trace: a single 1.5px heat-orange line of today's
 * feels-like curve, no fill, tick marks every 6 hours (06/12/18). Draws in
 * via pathLength on mount.
 */
export function HeatTrace({ hours }: { hours: HourlyHeat[] }) {
  if (hours.length < 2) return null;

  const W = 520;
  const H = 150;
  const padX = 6;
  const padTop = 14;
  const padBot = 22;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBot;

  const temps = hours.map((h) => h.hiC);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);
  const yMin = min - span * 0.15;
  const yMax = max + span * 0.15;
  const ySpan = yMax - yMin;

  const xFor = (hour: number) => padX + (hour / 23) * plotW;
  const yFor = (hiC: number) =>
    padTop + plotH - ((hiC - yMin) / ySpan) * plotH;

  const pts = hours.map((h) => ({ x: xFor(h.hour), y: yFor(h.hiC) }));
  const line = smoothPath(pts);

  const ticks = [6, 12, 18];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* baseline */}
      <line
        x1={padX}
        x2={W - padX}
        y1={padTop + plotH}
        y2={padTop + plotH}
        stroke="#E8DFD3"
        strokeWidth="1"
      />
      {/* 6-hour tick marks */}
      {ticks.map((t) => {
        const x = xFor(t);
        return (
          <g key={t}>
            <line
              x1={x}
              x2={x}
              y1={padTop + plotH}
              y2={padTop + plotH + 5}
              stroke="#E8DFD3"
              strokeWidth="1"
            />
            <text
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#8a7d6c"
              fontFamily='"Space Grotesk", sans-serif'
            >
              {String(t).padStart(2, "0")}
            </text>
          </g>
        );
      })}
      {/* the trace */}
      <motion.path
        d={line}
        fill="none"
        stroke="#EA580C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      />
    </svg>
  );
}
