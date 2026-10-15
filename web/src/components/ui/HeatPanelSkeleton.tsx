import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* Heat-safety tips that loop while the live readout loads. */
const TIPS = [
  "Drink water before you're thirsty",
  "Shade is your best friend out there",
  "Rest through the hottest hour",
  "Dizziness or nausea means stop",
  "Light clothes, covered skin",
];

/** Cycling tip line — replaces the helper text slot while loading, loops forever. */
export function CyclingTip() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mt-2 h-6 overflow-hidden" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.p
          key={index}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0 flex items-center gap-2 text-sm text-ink-soft"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-soft"
            aria-hidden="true"
          />
          {TIPS[index]}
        </motion.p>
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
