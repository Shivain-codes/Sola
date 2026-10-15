import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Sola's greeting preloader — full-page intro. Rapid-cycling weather   */
/* words (the greeting component's rhythm, Sola's words), then the      */
/* curtain lifts to reveal the page. No gsap: framer-motion only.      */
/* ------------------------------------------------------------------ */

const WORDS = [
  "Reading the sky",
  "Feeling the heat",
  "Tracing the day",
  "Checking the haze",
  "Measuring humidity",
  "Plotting safety",
];

export function SolaPreloader({ intervalMs = 350 }: { intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [cycling, setCycling] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!cycling) return;
    const id = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= WORDS.length) {
          clearInterval(id);
          setCycling(false);
          return i;
        }
        return i + 1;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [cycling, intervalMs]);

  // Lift the curtain shortly after the last word lands.
  useEffect(() => {
    if (cycling) return;
    const t = setTimeout(() => setDone(true), 450);
    return () => clearTimeout(t);
  }, [cycling]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-paper"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          aria-label="Loading Sola"
        >
          <div className="relative flex h-28 w-full items-center justify-center overflow-hidden px-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {cycling && (
                <motion.div
                  key={index}
                  className="absolute flex items-center gap-3 font-display text-ink"
                  style={{ fontSize: "clamp(1.75rem, 6vw, 3rem)" }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink"
                    aria-hidden="true"
                  />
                  {WORDS[index]}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="absolute bottom-10 text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
            Sola · Heat safety
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
