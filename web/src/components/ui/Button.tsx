import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { spring } from "./motion";

/** Solid ink, paper text, rounded-full, no shadow. 2px orange focus (global). */
export function Button({
  children,
  type = "button",
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={cn(
        "w-full rounded-full bg-ink px-6 py-4 text-center font-display text-base text-paper",
        "transition-colors hover:bg-[#2a241e] disabled:opacity-50",
        className
      )}
    >
      {children}
    </motion.button>
  );
}
