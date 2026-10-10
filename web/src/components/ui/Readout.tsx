import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import type { HeatTone } from "../../lib/heat";
import { toneHex, toneWord } from "../../lib/tone";
import { cn } from "../../lib/cn";

/**
 * Band label as an industrial stamp — squared corners (4px), uppercase,
 * letterspaced, solid band color, paper text. No pills.
 */
export function BandStamp({
  tone,
  className,
}: {
  tone: HeatTone;
  className?: string;
}) {
  const inkText = tone === "caution"; // amber needs ink for contrast
  return (
    <span
      className={cn(
        "inline-flex items-center font-display text-sm uppercase tracking-[0.18em]",
        className
      )}
      style={{
        backgroundColor: toneHex[tone],
        color: inkText ? "#191512" : "#faf6f0",
        borderRadius: 4,
        padding: "6px 12px",
      }}
    >
      {toneWord[tone]}
    </span>
  );
}

/**
 * Solid heat-orange tabular numeral that counts up on mount (spring 260/26).
 * A one-shot shimmer sweep plays on load, then settles to solid #EA580C —
 * so the only animated-gradient moment is this, per spec.
 */
export function HeatNumeral({
  value,
  fontSize,
  className,
}: {
  value: number;
  fontSize: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      type: "spring",
      stiffness: 260,
      damping: 26,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span
      className={cn("numeral-shimmer-once font-display tnum leading-[0.85]", className)}
      style={{ fontSize }}
    >
      {Math.round(display)}°
    </span>
  );
}
