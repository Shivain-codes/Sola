"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

/**
 * Animated stylized map (21st.dev style) for the emergency card.
 * One marker = the worker's live position. The marker drops in on mount;
 * the pulsing ring signals live tracking.
 */
function WorkerMarker({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 0 }}
      animate={{ y: [-20, 0, 4, 0], scale: [0.75, 1], opacity: [0, 1] }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="absolute top-[34%] left-[calc(50%-24px)] size-[48px] drop-shadow-[0_3px_1px_rgba(0,0,0,.15)]"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-d-danger/25" />
      <svg fill="none" viewBox="0 0 38 38" className="absolute size-full">
        <path
          d="M29.607 5.193c5.858 5.857 5.858 15.355 0 21.213l-9.9 9.9-.707.706-.708-.708-9.899-9.898c-5.857-5.858-5.857-15.356 0-21.213 5.858-5.858 15.356-5.858 21.214 0Z"
          className="fill-black/5"
        />
        <path
          d="m28.9 25.698-9.9 9.9-9.9-9.9C3.634 20.232 3.634 11.367 9.1 5.9 14.569.432 23.433.432 28.9 5.9c5.467 5.468 5.467 14.332 0 19.8Z"
          className="fill-white"
        />
      </svg>
      <MapPin
        className="absolute top-[7px] left-1/2 size-6 -translate-x-1/2 text-d-danger"
        fill="currentColor"
        strokeWidth={1.5}
      />
    </motion.div>
  );
}

export function Map() {
  return (
    <div aria-hidden="true" className="relative size-full overflow-hidden">
      <div className="absolute inset-0 bg-[url(https://cdn.21st.dev/assets/localized/f2a04222035a445668558f781cecc04117ed2be06b3cc84f223ed8d64e00e44e.png)] mask-[linear-gradient(to_bottom,black_50%,transparent)] bg-size-[530px_430px] bg-position-[center_-75px] bg-no-repeat" />
      <WorkerMarker delay={0.15} />
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[50%]" />
    </div>
  );
}

export default Map;
