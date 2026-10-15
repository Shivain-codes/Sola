/**
 * Maps a US AQI value to a CloudShader sky palette.
 *
 * True to life: haze washes the sky out toward a pale gray-white, it doesn't
 * darken it — so every palette here stays light enough for the panel's dark
 * ink text. `null` (no AQI yet / fetch failed) renders a clear default sky.
 */
export type SkyPalette = {
  skyTopColor: string;
  skyBottomColor: string;
  cloudColor: string;
  /** fewer, thinner clouds as the murk thickens */
  count: number;
};

const CLEAR: SkyPalette = {
  skyTopColor: "#2f6db3",
  skyBottomColor: "#8fc3ec",
  cloudColor: "#fbf8f2",
  count: 5,
};

export function skyForAqi(aqi: number | null | undefined): SkyPalette {
  if (aqi == null || !Number.isFinite(aqi)) return CLEAR;
  if (aqi <= 50)
    return CLEAR; // Good — vivid blue
  if (aqi <= 100)
    return {
      skyTopColor: "#5e8fc0",
      skyBottomColor: "#b4cfe6",
      cloudColor: "#f7f4ee",
      count: 5,
    }; // Moderate — softer blue
  if (aqi <= 150)
    return {
      skyTopColor: "#8fa3b8",
      skyBottomColor: "#cfd6d6",
      cloudColor: "#f1ede6",
      count: 4,
    }; // USG — pale blue-gray
  if (aqi <= 200)
    return {
      skyTopColor: "#a09a8e",
      skyBottomColor: "#d8d2c4",
      cloudColor: "#e9e2d4",
      count: 4,
    }; // Unhealthy — warm gray wash
  if (aqi <= 300)
    return {
      skyTopColor: "#8d867a",
      skyBottomColor: "#c9c2b2",
      cloudColor: "#ddd5c3",
      count: 3,
    }; // Very Unhealthy — gray-beige murk
  return {
    skyTopColor: "#7a7268",
    skyBottomColor: "#b5aa98",
    cloudColor: "#d3c9b5",
    count: 3,
  }; // Hazardous — heavy gray-tan
}
