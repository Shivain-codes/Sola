// Sola haze early-warning — live fire hotspots (NASA FIRMS) + smoke drift.
//
// Data source: NASA FIRMS area API (VIIRS Suomi-NPP near real-time, CSV).
// Free MAP_KEY required: https://firms.modaps.eosdis.nasa.gov/api/ → set as
// VITE_FIRMS_KEY at build time. Everything here is failure-proof: any error
// (no key, network, parse) returns null and the UI hides the section —
// we never invent fire data.

export type FireHotspot = {
  lat: number;
  lon: number;
  /** VIIRS confidence: 'n' nominal, 'h' high. 'l' (low) is filtered out. */
  confidence: "n" | "h";
  /** Fire radiative power (MW), null when missing. */
  frp: number | null;
};

export type HazeOutlook = {
  /** Total high/nominal-confidence hotspots in the search box (last 24h). */
  fireCount: number;
  /** Hotspots actually passed to the map (capped for rendering). */
  hotspots: FireHotspot[];
  centroid: { lat: number; lon: number };
  /** Wind at the fire centroid, km/h (Open-Meteo, 10m). */
  windKmh: number;
  /** Meteorological wind direction: where the wind blows FROM, degrees. */
  windFromDeg: number;
  /** Where the smoke drifts TO, degrees. */
  driftDeg: number;
  driftCompass: string;
  /** Centroid → city distance, km. */
  distanceKm: number;
  bearingToCityDeg: number;
  /** True when the drift direction points at the city (±45°). */
  headingTowardCity: boolean;
  /** Rough arrival estimate in hours; null when winds are too light to say. */
  etaHours: number | null;
  /** ISO timestamp of when the FIRMS data was fetched. */
  fetchedAt: string;
};

const FIRMS_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const WIND_URL = "https://api.open-meteo.com/v1/forecast";
/** Search box half-width in degrees around the city (10° x 10° total). */
const BOX_HALF_DEG = 5;
/** Max hotspots drawn on the map (count still reports the true total). */
const MAP_CAP = 800;

/** Great-circle distance in km. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Initial bearing from point 1 to point 2, degrees 0-360. */
export function bearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(p2);
  const x =
    Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS16 = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

/** Degrees → 16-wind compass label. */
export function compass16(deg: number): string {
  return COMPASS16[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

/** Smallest angular difference between two headings, 0-180. */
export function angularDiff(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/**
 * Parse a FIRMS VIIRS CSV payload into hotspots, keeping only
 * nominal/high confidence detections. Never throws — returns [] on garbage.
 */
export function parseFirmsCsv(csv: string): FireHotspot[] {
  try {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const latI = header.indexOf("latitude");
    const lonI = header.indexOf("longitude");
    const confI = header.indexOf("confidence");
    const frpI = header.indexOf("frp");
    if (latI < 0 || lonI < 0 || confI < 0) return [];
    const out: FireHotspot[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const conf = (cols[confI] || "").trim().toLowerCase();
      if (conf !== "n" && conf !== "h") continue;
      const lat = Number(cols[latI]);
      const lon = Number(cols[lonI]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const frp = frpI >= 0 ? Number(cols[frpI]) : NaN;
      out.push({
        lat,
        lon,
        confidence: conf as "n" | "h",
        frp: Number.isFinite(frp) ? frp : null,
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Result of the haze check:
 * - "fires": live hotspots found (full outlook).
 * - "clear": check succeeded, zero hotspots — UI shows the all-clear card.
 * - "unavailable": no FIRMS key or fetch failed — UI hides the section
 *   entirely rather than claim anything.
 */
export type HazeOutlookResult =
  | { status: "fires"; outlook: HazeOutlook }
  | { status: "clear" }
  | { status: "unavailable" };

/**
 * Build the haze outlook for a city. Never throws and never invents data:
 * "clear" means we checked and found nothing; "unavailable" means we could
 * not check at all.
 */
export async function buildHazeOutlook(
  cityLat: number,
  cityLon: number
): Promise<HazeOutlookResult> {
  try {
    const key = import.meta.env.VITE_FIRMS_KEY as string | undefined;
    if (!key) return { status: "unavailable" };

    const w = cityLon - BOX_HALF_DEG;
    const s = cityLat - BOX_HALF_DEG;
    const e = cityLon + BOX_HALF_DEG;
    const n = cityLat + BOX_HALF_DEG;
    const url =
      `${FIRMS_URL}/${encodeURIComponent(key)}/VIIRS_SNPP_NRT/` +
      `${w},${s},${e},${n}/1`;
    const res = await fetch(url);
    if (!res.ok) return { status: "unavailable" };
    const hotspots = parseFirmsCsv(await res.text());
    if (hotspots.length === 0) return { status: "clear" };

    // Centroid of all detections.
    const centroid = {
      lat: hotspots.reduce((a, h) => a + h.lat, 0) / hotspots.length,
      lon: hotspots.reduce((a, h) => a + h.lon, 0) / hotspots.length,
    };

    // Wind at the fire centroid (Open-Meteo, no key needed).
    const wres = await fetch(
      `${WIND_URL}?latitude=${centroid.lat}&longitude=${centroid.lon}` +
        `&current=wind_speed_10m,wind_direction_10m&timezone=auto`
    );
    if (!wres.ok) return { status: "unavailable" };
    const wdata = await wres.json();
    const windKmh = Number(wdata?.current?.wind_speed_10m);
    const windFromDeg = Number(wdata?.current?.wind_direction_10m);
    if (!Number.isFinite(windKmh) || !Number.isFinite(windFromDeg))
      return { status: "unavailable" };

    // Smoke travels downwind: opposite of where the wind comes FROM.
    const driftDeg = (windFromDeg + 180) % 360;
    const distanceKm = haversineKm(
      centroid.lat,
      centroid.lon,
      cityLat,
      cityLon
    );
    const bearingToCityDeg = bearingDeg(
      centroid.lat,
      centroid.lon,
      cityLat,
      cityLon
    );
    const headingTowardCity = angularDiff(driftDeg, bearingToCityDeg) <= 45;
    // Rough estimate only — smoke is not a parcel on rails.
    const etaHours =
      windKmh >= 3 ? distanceKm / windKmh : null;

    return {
      status: "fires",
      outlook: {
        fireCount: hotspots.length,
        hotspots: hotspots.slice(0, MAP_CAP),
        centroid,
        windKmh: Math.round(windKmh * 10) / 10,
        windFromDeg: Math.round(windFromDeg),
        driftDeg: Math.round(driftDeg),
        driftCompass: compass16(driftDeg),
        distanceKm: Math.round(distanceKm),
        bearingToCityDeg: Math.round(bearingToCityDeg),
        headingTowardCity,
        etaHours: etaHours == null ? null : Math.round(etaHours),
        fetchedAt: new Date().toISOString(),
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}

/** One-line summary for the AI plan prompt (Lambda) — fires case. */
export function summarizeHazeOutlook(o: HazeOutlook): string {
  const dir = o.headingTowardCity
    ? `drifting ${o.driftCompass} toward the city`
    : `drifting ${o.driftCompass}, away from the city for now`;
  const eta =
    o.etaHours == null
      ? `arrival time unclear (light winds)`
      : `rough arrival estimate ~${o.etaHours}h`;
  return (
    `Haze outlook (NASA FIRMS, VIIRS, last 24h): ${o.fireCount} active fire ` +
    `hotspot(s) centered ~${o.distanceKm} km ${compass16(o.bearingToCityDeg)} ` +
    `of the city; smoke ${dir} on ${o.windKmh} km/h winds; ${eta}. ` +
    `Treat the ETA as a rough estimate, not a forecast.`
  );
}

/** One-line summary for the AI plan prompt (Lambda) — clear case. */
export function summarizeClearOutlook(): string {
  return (
    `Haze outlook (NASA FIRMS, VIIRS, last 24h): no active fire hotspots ` +
    `detected in the surrounding region. No incoming haze expected from fires.`
  );
}
