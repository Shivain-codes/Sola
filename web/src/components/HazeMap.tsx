"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { FireHotspot } from "../lib/haze";

/**
 * Haze fire map in the 21st.dev animated style: stylized map backdrop,
 * fire-hotspot markers that drop in with a stagger, city pin, and a
 * dashed drift arrow. Marker positions are projected from the REAL
 * hotspot/city coordinates (bbox-normalized), so relative geography
 * stays truthful — only the cartography is illustrative.
 */

const BACKDROP_URL =
  "https://cdn.21st.dev/assets/localized/f2a04222035a445668558f781cecc04117ed2be06b3cc84f223ed8d64e00e44e.png";
/** Cap animated markers for perf — the card text still reports the true total. */
const MARKER_CAP = 60;

function project(
  lat: number,
  lon: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
) {
  const x =
    ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * 100;
  const y =
    ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x, y };
}

function FireMarker({
  x,
  y,
  hot,
  delay,
}: {
  x: number;
  y: number;
  hot: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 16, delay }}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <div
          className={`rounded-full p-1 ${
            hot
              ? "bg-d-danger shadow-[0_0_10px_rgba(220,38,38,0.55)]"
              : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          }`}
        >
          <Flame className="size-3 text-white" fill="currentColor" />
        </div>
      </div>
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
  // High-confidence fires first, then cap the animated markers.
  const shown = [...hotspots]
    .sort((a, b) => (a.confidence === b.confidence ? 0 : a.confidence === "h" ? -1 : 1))
    .slice(0, MARKER_CAP);

  // Drift tip in lat/lon (same math as the old Leaflet arrow).
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
      <div
        className="absolute inset-0 mask-[linear-gradient(to_bottom,black_50%,transparent)] bg-no-repeat"
        style={{
          backgroundImage: `url(${BACKDROP_URL})`,
          backgroundSize: "530px 430px",
          backgroundPosition: "center -75px",
        }}
      />
      {/* Drift arrow */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          x1={cFrom.x}
          y1={cFrom.y}
          x2={cTo.x}
          y2={cTo.y}
          stroke="#7c2d12"
          strokeWidth={1.2}
          strokeDasharray="3 2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          opacity={0.8}
        />
        <circle cx={cTo.x} cy={cTo.y} r={1.6} fill="#7c2d12" opacity={0.9} />
      </svg>
      {/* Fire markers */}
      {shown.map((h, i) => {
        const p = project(h.lat, h.lon, bounds);
        return (
          <FireMarker
            key={`${h.lat}-${h.lon}-${i}`}
            x={p.x}
            y={p.y}
            hot={h.confidence === "h"}
            delay={Math.min(i * 0.025, 1.4)}
          />
        );
      })}
      {/* City pin */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 }}
        className="absolute z-10"
        style={{ left: `${cCity.x}%`, top: `${cCity.y}%` }}
      >
        <div className="relative -translate-x-1/2 -translate-y-1/2">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/40" />
          <div className="size-4 rounded-full bg-blue-600 ring-2 ring-white" />
        </div>
        {cityName && (
          <span className="absolute top-3 left-2 rounded-md bg-white/85 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-ink backdrop-blur-sm">
            {cityName}
          </span>
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[50%]" />
    </div>
  );
}

export default HazeMap;
