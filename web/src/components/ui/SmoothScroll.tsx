"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

/** Access the shared Lenis instance (null when reduced-motion or not ready). */
export const useLenis = () => useContext(LenisContext);

/**
 * Buttery smooth scrolling for the whole page. Skipped entirely when the
 * user prefers reduced motion — then everything falls back to native.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true });
    setLenis(instance);

    let raf = 0;
    const loop = (time: number) => {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

/** Scroll to a section id — through Lenis when active, native smooth otherwise. */
export function useScrollTo() {
  const lenis = useLenis();
  return useCallback(
    (id: string) => (e: MouseEvent) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -72, duration: 1.4 });
      else el.scrollIntoView({ behavior: "smooth" });
    },
    [lenis],
  );
}
