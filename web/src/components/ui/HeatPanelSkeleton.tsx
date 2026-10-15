import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Sola-weather adaptation of the greeting preloader: rapid-cycling     */
/* status words in the numeral slot while the live readout loads.      */
/* Loops until the data lands (no fixed timer), then hands off.        */
/* ------------------------------------------------------------------ */

const WORDS = [
  "Reading the sky",
  "Feeling the heat",
  "Tracing the day",
  "Checking the haze",
];

export function WeatherCycler({ intervalMs = 380 }: { intervalMs?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <div
      className="relative mt-2 flex h-[clamp(4rem,12vw,7rem)] items-center overflow-hidden"
      aria-label="Reading the weather"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={index}
          className="absolute flex items-center gap-3 font-display text-ink"
          style={{ fontSize: "clamp(2rem, 6.5vw, 3.75rem)" }}
          aria-hidden={false}
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -34, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink"
            aria-hidden="true"
          />
          {WORDS[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Trace placeholder with a faint pulse line hinting at the curve to come. */
export function TraceSkeleton() {
  return (
    <div className="skeleton relative mt-3 h-[120px] w-full overflow-hidden rounded-xl">
      <svg
        viewBox="0 0 300 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full opacity-50"
        aria-hidden="true"
      >
        <path
          d="M 8 84 C 70 66, 120 96, 180 76 S 270 92, 292 80"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
