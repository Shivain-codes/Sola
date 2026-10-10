import type { HeatTone } from "./heat";

/**
 * Exact-spec danger hexes. The 4-colour scale maps:
 *   safe #15803D → caution #CA8A04 → hot #EA580C → danger #DC2626.
 * "extreme" reuses danger (the spec defines four colours only).
 * Danger colours are for graphics only — never body text.
 */
export const toneHex: Record<HeatTone, string> = {
  safe: "#15803D",
  caution: "#CA8A04",
  hot: "#EA580C",
  danger: "#DC2626",
  extreme: "#DC2626",
};

/** Plain, worker-readable label for a tone. */
export const toneWord: Record<HeatTone, string> = {
  safe: "OK",
  caution: "Careful",
  hot: "Hot",
  danger: "Danger",
  extreme: "Danger",
};
