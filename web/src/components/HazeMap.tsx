"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { FireHotspot } from "../lib/haze";

/**
 * Haze fire map in the exact 21st.dev Map component format:
 * dotted halftone map backdrop, white teardrop pins with flame badges,
 * bottom gradient fade. Pin positions are projected from the REAL
 * hotspot/city coordinates (bbox-normalized), so the layout reflects
 * the actual geography around the entered city.
 */

const BACKDROP_URL =
  "https://cdn.21st.dev/assets/localized/f2a04222035a445668558f781cecc04117ed2be06b3cc84f223ed8d64e00e44e.png";
/** Cap animated pins for perf — the card text still reports the true total. */
const PIN_CAP = 40;

function project(
  lat: number,
  lon: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x, y };
}

function FirePin({
  x,
  y,
  hot,
  delay,
  flickerDelay,
}: {
  x: number;
  y: number;
  hot: boolean;
  delay: number;
  flickerDelay: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 0 }}
      animate={{ y: [-20, 0, 4, 0], scale: [0.75, 1], opacity: [0, 1] }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className="absolute z-10"
      style={{ left: `calc(${x}% - 19px)`, top: `calc(${y}% - 34px)` }}
    >
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [1, 0.85, 1] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          delay: flickerDelay,
          ease: "easeInOut",
        }}
        className="relative size-[38px] drop-shadow-[0_3px_1px_rgba(0,0,0,.15)]"
      >
        <svg fill="none" viewBox="0 0 38 38" className="absolute size-full">
          <path
            d="M29.607 5.193c5.858 5.857 5.858 15.355 0 21.213l-9.9 9.9-.707.706-.708-.708-9.899-9.898c-5.857-5.858-5.857-15.356 0-21.213 5.858-5.858 15.356-5.858 21.214 0Z"
            className="fill-black/5"
          />
          <path
            d="m28.9 25.698-9.9 9.9-9.9-9.9C3.634 20.232 3.634 11.367 9.1 5.9 14.569.432 23.433.432 28.9 5.9c5.467 5.468 5.467 14.332 0 19.8Z"
            className="fill-white"
          />
        </svg>
        <span
          className={`absolute top-[4px] left-[7px] flex size-6 items-center justify-center rounded-full ${
            hot ? "bg-d-danger" : "bg-amber-500"
          }`}
        >
          <Flame className="size-3.5 text-white" fill="currentColor" />
        </span>
      </motion.div>
    </motion.div>
  );
}

export function HazeMap({
  hotspots,
  cityLat,
  cityLon,
  cityName,
  centroid,
  driftDeg,
}: {
  hotspots: FireHotspot[];
  cityLat: number;
  cityLon: number;
  cityName: string;
  centroid: { lat: number; lon: number };
  driftDeg: number;
}) {
  // High-confidence fires first, then cap the animated pins.
  const shown = [...hotspots]
    .sort((a, b) =>
      a.confidence === b.confidence ? 0 : a.confidence === "h" ? -1 : 1,
    )
    .slice(0, PIN_CAP);

  // Drift tip in lat/lon, then everything projected to % of the data bbox.
  const rad = (driftDeg * Math.PI) / 180;
  const tip = {
    lat: centroid.lat + 1.2 * Math.cos(rad),
    lon: centroid.lon + 1.2 * Math.sin(rad),
  };

  const lats = [...shown.map((h) => h.lat), cityLat, tip.lat];
  const lons = [...shown.map((h) => h.lon), cityLon, tip.lon];
  const spanLat = Math.max(...lats) - Math.min(...lats);
  const spanLon = Math.max(...lons) - Math.min(...lons);
  const padLat = spanLat * 0.18 + 0.05;
  const padLon = spanLon * 0.18 + 0.05;
  const bounds = {
    minLat: Math.min(...lats) - padLat,
    maxLat: Math.max(...lats) + padLat,
    minLon: Math.min(...lons) - padLon,
    maxLon: Math.max(...lons) + padLon,
  };

  const cFrom = project(centroid.lat, centroid.lon, bounds);
  const cTo = project(tip.lat, tip.lon, bounds);
  const cCity = project(cityLat, cityLon, bounds);

  return (
    <div aria-hidden="true" className="relative size-full overflow-hidden">
      {/* Dotted halftone map backdrop (21st.dev) */}
      <div
        className="absolute inset-0 mask-[linear-gradient(to_bottom,black_50%,transparent)] bg-no-repeat"
        style={{
          backgroundImage: `url(${BACKDROP_URL})`,
          backgroundSize: "530px 430px",
          backgroundPosition: "center -75px",
        }}
      />
      {/* Drift arrow — dashes flow toward the tip */}
      <svg
        className="absolute inset-0 z-[5] h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={cFrom.x}
          y1={cFrom.y}
          x2={cTo.x}
          y2={cTo.y}
          stroke="#7c2d12"
          strokeWidth={1.4}
          strokeDasharray="3 2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          opacity={0.85}
          className="animate-drift-flow"
        />
        <circle cx={cTo.x} cy={cTo.y} r={1.6} fill="#7c2d12" opacity={0.9} />
      </svg>
      {/* Fire pins */}
      {shown.map((h, i) => {
        const p = project(h.lat, h.lon, bounds);
        return (
          <FirePin
            key={`${h.lat}-${h.lon}-${i}`}
            x={p.x}
            y={p.y}
            hot={h.confidence === "h"}
            delay={Math.min(i * 0.04, 1.4)}
            flickerDelay={(i * 0.37) % 1.8}
          />
        );
      })}
      {/* City pin */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 }}
        className="absolute z-10"
        style={{ left: `calc(${cCity.x}% - 8px)`, top: `calc(${cCity.y}% - 8px)` }}
      >
        <div className="relative size-4">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/40" />
          <div className="absolute inset-0 rounded-full bg-blue-600 ring-2 ring-white" />
        </div>
        {cityName && (
          <span className="absolute top-5 left-1/2 -translate-x-1/2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-ink backdrop-blur-sm">
            {cityName}
          </span>
        )}
      </motion.div>
      {/* Bottom fade (21st.dev) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[50%]" />
    </div>
  );
}

export default HazeMap;
