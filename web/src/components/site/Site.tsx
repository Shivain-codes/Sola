import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { spring } from "../ui/motion";
import { TextRevealInView } from "../ui/text-reveal";
import NavigationBar from "../ui/navigation-bar";
import { Footer7 } from "../ui/footer-7";
import { useLenis, useScrollTo } from "../ui/SmoothScroll";

/* ---------------- Header (scrolls away with the page) ---------------- */

export function SiteNav() {
  return <NavigationBar />;
}

/* ---------------- CTA band (transparent, text + button only) ---------------- */

export function CtaBand() {
  const scrollTo = useScrollTo();
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
          onClick={scrollTo("app")}
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
  const scrollTo = useScrollTo();
  const lenis = useLenis();

  // Freeze the buttery scroll while a legal modal is open.
  useEffect(() => {
    if (!lenis) return;
    if (modal) lenis.stop();
    else lenis.start();
  }, [modal, lenis]);

  return (
    <footer>
      <Footer7
        title="Sola"
        titleHref="#top"
        onTitleClick={scrollTo("top")}
        description="Reads today's heat for your city and shift, then tells you what to do about it — in plain words."
        sections={[
          {
            title: "Product",
            links: [
              { name: "Get my plan", href: "#app", onClick: scrollTo("app") },
              { name: "How it works", href: "#how", onClick: scrollTo("how") },
              { name: "Why it matters", href: "#why", onClick: scrollTo("why") },
            ],
          },
          {
            title: "Data & safety",
            links: [
              {
                name: "Weather by Open-Meteo",
                href: "https://open-meteo.com",
                external: true,
              },
              { name: "Emergency? Call your local emergency number.", href: "" },
            ],
          },
        ]}
        copyright="© 2026 Sola"
        legalLinks={[
          { name: "Privacy", onClick: () => setModal("privacy") },
          { name: "Terms", onClick: () => setModal("terms") },
        ]}
      />

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
