import type { Transition, Variants } from "framer-motion";

/** Exact spec spring: type "spring", stiffness 260, damping 26. */
export const spring: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
};

/** Section container — children fade+rise in sequence. */
export const sectionStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
};

/** A card section fading and rising into place. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: spring },
};

/** Heat strip segment — scale-x from the left, staggered 0.05s L→R. */
export const segmentGrow: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: spring },
};

export const segmentContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
