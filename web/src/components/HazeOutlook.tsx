import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Flame } from "lucide-react";
import type { HazeOutlook as Outlook } from "../lib/haze";

/**
 * Haze early-warning card: live NASA FIRMS fire hotspots on a map,
 * smoke drift direction, and a rough arrival estimate for the city.
 * Renders nothing when there is no outlook (no key / no fires / error).
 */
export default function HazeOutlook({
  outlook,
  cityName,
  cityLat,
  cityLon,
}: {
  outlook: Outlook | null;
  cityName: string;
  cityLat: number;
  cityLon: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!outlook || !mapRef.current) return;
    if (leafletRef.current) {
      leafletRef.current.remove();
      leafletRef.current = null;
    }
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    });
    leafletRef.current = map;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 10,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const pts: L.LatLngExpression[] = [];
    for (const h of outlook.hotspots) {
      const p: L.LatLngExpression = [h.lat, h.lon];
      pts.push(p);
      L.circleMarker(p, {
        radius: h.confidence === "h" ? 5 : 3.5,
        color: h.confidence === "h" ? "#dc2626" : "#f59e0b",
        weight: 1,
        fillOpacity: 0.75,
      }).addTo(map);
    }

    // City marker (plain circle — no default-icon asset issues).
    const cityPt: L.LatLngExpression = [cityLat, cityLon];
    pts.push(cityPt);
    L.circleMarker(cityPt, {
      radius: 7,
      color: "#1d4ed8",
      weight: 2,
      fillColor: "#3b82f6",
      fillOpacity: 0.9,
    })
      .addTo(map)
      .bindTooltip(cityName || "You", { permanent: false });

    // Drift arrow: short line from the fire centroid along the drift heading.
    const rad = (outlook.driftDeg * Math.PI) / 180;
    const len = 1.2; // degrees, visual only
    const tip: L.LatLngExpression = [
      outlook.centroid.lat + len * Math.cos(rad),
      outlook.centroid.lon + len * Math.sin(rad),
    ];
    pts.push(tip);
    L.polyline(
      [
        [outlook.centroid.lat, outlook.centroid.lon],
        tip,
      ],
      { color: "#7c2d12", weight: 3, dashArray: "6 4" }
    ).addTo(map);
    L.circleMarker(tip, {
      radius: 4,
      color: "#7c2d12",
      weight: 2,
      fillOpacity: 0.9,
    }).addTo(map);

    map.fitBounds(L.latLngBounds(pts).pad(0.25));
    return () => {
      map.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlook, cityLat, cityLon]);

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
      <div ref={mapRef} className="mx-4 mt-3 h-60 rounded-xl" />
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
