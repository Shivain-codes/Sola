import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { spring } from "../ui/motion";
import { RevealGroup, RevealItem } from "../ui/Reveal";
import { TextRevealInView } from "../ui/text-reveal";

const SCROLL = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ---------------- Sticky header ---------------- */

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#top"
          onClick={SCROLL("top")}
          className="font-display text-xl text-ink"
        >
          Sola
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#how"
            onClick={SCROLL("how")}
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            How it works
          </a>
          <a
            href="#why"
            onClick={SCROLL("why")}
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Why it matters
          </a>
          <a
            href="#app"
            onClick={SCROLL("app")}
            className="rounded-full bg-ink px-5 py-2 font-display text-sm text-paper transition-colors hover:bg-[#2a241e]"
          >
            Get my plan
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- CTA band (transparent, text + button only) ---------------- */

export function CtaBand() {
  return (
    <section className="relative">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
        <TextRevealInView
          as="p"
          per="word"
          preset="fade-in-blur"
          speedReveal={1.3}
          className="font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.02] text-ink"
        >
          Don&apos;t guess the heat. Read it.
        </TextRevealInView>
        <a
          href="#app"
          onClick={SCROLL("app")}
          className="shrink-0 rounded-full bg-ink px-7 py-4 font-display text-base text-paper transition-colors hover:bg-[#2a241e]"
        >
          Get my plan
        </a>
      </div>
    </section>
  );
}

/* ---------------- Footer + legal modals ---------------- */

export function SiteFooter() {
  const [modal, setModal] = useState<null | "privacy" | "terms">(null);

  return (
    <footer className="border-t border-line">
      <RevealGroup
        stagger={0.08}
        className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* a. brand */}
        <RevealItem>
          <p className="font-display text-xl text-ink">Sola</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
            Reads today's heat for your city and shift, then tells you what to
            do about it — in plain words.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink-soft">
            Built for WeMakeDevs Environmental Hacks
          </p>
        </RevealItem>

        {/* b. product anchors */}
        <RevealItem className="flex flex-col gap-3 text-sm">
          <p className="font-display text-xs uppercase tracking-[0.16em] text-ink-soft">
            Product
          </p>
          <a href="#app" onClick={SCROLL("app")} className="text-ink-soft hover:text-ink">
            Get my plan
          </a>
          <a href="#how" onClick={SCROLL("how")} className="text-ink-soft hover:text-ink">
            How it works
          </a>
          <a href="#why" onClick={SCROLL("why")} className="text-ink-soft hover:text-ink">
            Why it matters
          </a>
        </RevealItem>

        {/* c. data + safety */}
        <RevealItem className="flex flex-col gap-3 text-sm">
          <p className="font-display text-xs uppercase tracking-[0.16em] text-ink-soft">
            Data &amp; safety
          </p>
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          >
            Weather by Open-Meteo
          </a>
          <p className="text-ink-soft">
            Emergency? Call your local emergency number.
          </p>
        </RevealItem>

        {/* d. legal */}
        <RevealItem className="flex flex-col gap-3 text-sm">
          <p className="font-display text-xs uppercase tracking-[0.16em] text-ink-soft">
            Legal
          </p>
          <button
            onClick={() => setModal("privacy")}
            className="text-left text-ink-soft hover:text-ink"
          >
            Privacy
          </button>
          <button
            onClick={() => setModal("terms")}
            className="text-left text-ink-soft hover:text-ink"
          >
            Terms
          </button>
        </RevealItem>
      </RevealGroup>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-xs text-ink-soft">© 2026 Sola</p>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <Modal
            title={modal === "privacy" ? "Privacy" : "Terms"}
            onClose={() => setModal(null)}
          >
            {modal === "privacy"
              ? "Sola runs entirely in your browser. There are no accounts and no sign-up. We don't store your city, shift, or any personal data — your inputs are sent once to fetch the weather and generate your plan, and nothing is kept afterwards."
              : "Sola is a free safety aid, not medical advice or a guarantee. It reads public weather data and offers general heat-safety guidance. Always use your own judgement, follow your employer's rules, and in an emergency call your local emergency number. The app runs in your browser with no account and stores no data."}
          </Modal>
        )}
      </AnimatePresence>
    </footer>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-line bg-paper p-7"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-soft transition-colors hover:text-ink"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          {children}
        </p>
      </motion.div>
    </motion.div>
  );
}
