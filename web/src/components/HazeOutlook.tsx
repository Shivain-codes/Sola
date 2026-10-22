import { Flame, CircleCheck } from "lucide-react";
import type { HazeOutlookResult } from "../lib/haze";
import { HazeMap } from "./HazeMap";

/**
 * Haze early-warning card: live NASA FIRMS fire hotspots on a map,
 * smoke drift direction, and a rough arrival estimate for the city.
 * When the check succeeds and finds no fires, shows a compact all-clear
 * card instead. Renders nothing when the check could not run at all
 * (no key / fetch failed) — never claims anything unverified.
 */
export default function HazeOutlook({
  result,
  cityName,
  cityLat,
  cityLon,
}: {
  result: HazeOutlookResult;
  cityName: string;
  cityLat: number;
  cityLon: number;
}) {
  const outlook = result.status === "fires" ? result.outlook : null;

  if (result.status === "unavailable") return null;

  // All-clear: the check ran fine and found no fires. Compact card —
  // no map, nothing to map.
  if (result.status === "clear") {
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 px-4 pt-4">
          <Flame className="h-4 w-4 text-d-hot" />
          <h3 className="font-display text-[15px] font-semibold text-ink">
            Haze outlook
          </h3>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-4">
          <p className="flex items-center gap-1.5 text-[14px] font-medium leading-snug text-ink">
            <CircleCheck className="h-4 w-4 text-d-safe" />
            No active fire hotspots nearby in the last 24h
          </p>
          <p className="text-[13px] leading-snug text-ink-soft">
            No incoming haze expected from fires{cityName ? ` around ${cityName}` : ""}.
          </p>
          <p className="mt-1 text-[11px] leading-snug text-ink-soft/75">
            Checked just now · Fire data: NASA FIRMS (VIIRS Suomi-NPP).
          </p>
        </div>
      </section>
    );
  }

  if (!outlook) return null;

  const headline = outlook.headingTowardCity
    ? `Smoke drifting ${outlook.driftCompass} — toward ${cityName || "you"}`
    : `Smoke drifting ${outlook.driftCompass} — away for now`;
  const eta =
    outlook.etaHours == null
      ? "Arrival unclear — winds too light to estimate"
      : `Rough arrival: ~${outlook.etaHours}h`;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Flame className="h-4 w-4 text-d-hot" />
        <h3 className="font-display text-[15px] font-semibold text-ink">
          Haze outlook
        </h3>
      </div>
      <div className="mx-4 mt-3 h-60 overflow-hidden rounded-xl border border-line">
        <HazeMap
          hotspots={outlook.hotspots}
          cityLat={cityLat}
          cityLon={cityLon}
          cityName={cityName}
          centroid={outlook.centroid}
          driftDeg={outlook.driftDeg}
        />
      </div>
      <div className="flex flex-col gap-1.5 px-4 py-4">
        <p className="text-[14px] font-medium leading-snug text-ink">
          🔥 {outlook.fireCount} active fire{outlook.fireCount === 1 ? "" : "s"}{" "}
          in the last 24h
        </p>
        <p className="text-[13px] leading-snug text-ink-soft">{headline}</p>
        <p className="text-[13px] leading-snug text-ink-soft">
          {eta} · winds {outlook.windKmh} km/h at the fires
        </p>
        <p className="mt-1 text-[11px] leading-snug text-ink-soft/75">
          Fire hotspots: NASA FIRMS (VIIRS Suomi-NPP, last 24h). Drift is a
          wind-based estimate, not a forecast.
        </p>
      </div>
    </section>
  );
}
