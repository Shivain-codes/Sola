// Sola heat core — no AI, pure math + Open-Meteo (no API key required).

export type GeoResult = { lat: number; lon: number; name: string };

export type HourlyHeat = {
  /** Hour of day 0-23 (local to the city, from Open-Meteo timezone=auto). */
  hour: number;
  /** ISO local time string, e.g. "2026-10-09T14:00". */
  time: string;
  tempC: number;
  humidity: number;
  /** Computed heat index in °C. */
  hiC: number;
};

/** Semantic danger tone — the only accent system in the UI. */
export type HeatTone = "safe" | "caution" | "hot" | "danger" | "extreme";

export type Band = {
  label: string;
  /** Short, plain word for a worker ("OK", "Careful", "Hot"…). */
  short: string;
  /** Semantic tone key; components map this to the heat.* palette. */
  tone: HeatTone;
};

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Geocode a city name to coordinates. Throws if not found. */
export async function geocodeCity(city: string): Promise<GeoResult> {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  const first = data?.results?.[0];
  if (!first) throw new Error(`Could not find a city named "${city}"`);
  const name = [first.name, first.admin1, first.country]
    .filter(Boolean)
    .join(", ");
  return { lat: first.latitude, lon: first.longitude, name };
}

/** Fetch today's hourly temperature (°C) and relative humidity (%). */
export async function fetchHourlyHeat(
  lat: number,
  lon: number
): Promise<HourlyHeat[]> {
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed (${res.status})`);
  const data = await res.json();
  const times: string[] = data?.hourly?.time ?? [];
  const temps: number[] = data?.hourly?.temperature_2m ?? [];
  const rhs: number[] = data?.hourly?.relative_humidity_2m ?? [];

  return times.map((time, i) => {
    const tempC = temps[i];
    const humidity = rhs[i];
    const hour = Number(time.slice(11, 13));
    return {
      hour,
      time,
      tempC,
      humidity,
      hiC: heatIndex(tempC, humidity),
    };
  });
}

/**
 * Heat index via the NWS Rothfusz regression.
 * Input/output in °C; the regression itself runs in °F (round-trip).
 */
export function heatIndex(tempC: number, rh: number): number {
  const T = tempC * (9 / 5) + 32; // °F

  // The regression is only meaningful at warm temperatures. Below ~80°F
  // the NWS uses a simpler average formula; for cooler air the heat index
  // is effectively the air temperature.
  const simple = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + rh * 0.094);
  if ((simple + T) / 2 < 80) {
    return (simple - 32) * (5 / 9);
  }

  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * rh -
    0.22475541 * T * rh -
    0.00683783 * T * T -
    0.05481717 * rh * rh +
    0.00122874 * T * T * rh +
    0.00085282 * T * rh * rh -
    0.00000199 * T * T * rh * rh;

  // NWS adjustments at the edges.
  if (rh < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (rh > 85 && T >= 80 && T <= 87) {
    HI += ((rh - 85) / 10) * ((87 - T) / 5);
  }

  return (HI - 32) * (5 / 9); // back to °C
}

/** Danger band for a heat index in °C. */
export function bandFor(hiC: number): Band {
  if (hiC >= 51)
    return { label: "Extreme danger", short: "Extreme", tone: "extreme" };
  if (hiC >= 39) return { label: "Danger", short: "Danger", tone: "danger" };
  if (hiC >= 32)
    return { label: "Extreme caution", short: "Hot", tone: "hot" };
  if (hiC >= 27) return { label: "Caution", short: "Careful", tone: "caution" };
  return { label: "Safe", short: "OK", tone: "safe" };
}

/** Map a heat tone to its solid / soft / text Tailwind classes. */
export const toneClasses: Record<
  HeatTone,
  { solid: string; onSolid: string; soft: string; onSoft: string; dot: string }
> = {
  safe: {
    solid: "bg-heat-safe",
    onSolid: "text-white",
    soft: "bg-heat-safe/12",
    onSoft: "text-heat-safe",
    dot: "bg-heat-safe",
  },
  caution: {
    solid: "bg-heat-caution",
    onSolid: "text-ink",
    soft: "bg-heat-caution/15",
    onSoft: "text-[#8a6d08]",
    dot: "bg-heat-caution",
  },
  hot: {
    solid: "bg-heat-hot",
    onSolid: "text-white",
    soft: "bg-heat-hot/12",
    onSoft: "text-heat-hot",
    dot: "bg-heat-hot",
  },
  danger: {
    solid: "bg-heat-danger",
    onSolid: "text-white",
    soft: "bg-heat-danger/12",
    onSoft: "text-heat-danger",
    dot: "bg-heat-danger",
  },
  extreme: {
    solid: "bg-heat-extreme",
    onSolid: "text-white",
    soft: "bg-heat-extreme/12",
    onSoft: "text-heat-extreme",
    dot: "bg-heat-extreme",
  },
};

/** Format an hour 0-23 as a short label like "6am", "2pm". */
export function hourLabel(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${h12}${ampm}`;
}

/**
 * Slice the hourly data to the shift window.
 * Handles overnight shifts (end <= start) by wrapping across midnight.
 */
export function hoursInShift(
  hourly: HourlyHeat[],
  startHour: number,
  endHour: number
): HourlyHeat[] {
  if (endHour > startHour) {
    return hourly.filter((h) => h.hour >= startHour && h.hour < endHour);
  }
  // Overnight: start..23 then 0..end
  return hourly.filter((h) => h.hour >= startHour || h.hour < endHour);
}
