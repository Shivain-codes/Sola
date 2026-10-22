import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Phone } from "lucide-react";
import { spring } from "../ui/motion";
import { TextRevealInView } from "../ui/text-reveal";
import NavigationBar from "../ui/navigation-bar";
import { Footer7 } from "../ui/footer-7";
import {
  tr,
  LANGS,
  EMERGENCY_NUMBERS,
  serviceLabel,
  type LangCode,
} from "../../lib/i18n";

const SCROLL = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ---------------- Header (scrolls away with the page) ---------------- */

export function SiteNav() {
  return <NavigationBar />;
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

/** Emergency numbers directory + language picker, above the main footer. */
function EmergencyStrip({
  lang,
  setLang,
}: {
  lang: LangCode;
  setLang: (l: LangCode) => void;
}) {
  const [cc, setCc] = useState("SG");
  const entry =
    EMERGENCY_NUMBERS.find((e) => e.code === cc) ?? EMERGENCY_NUMBERS[0];

  return (
    <div className="border-y border-line bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-[1fr_auto]">
        <div>
          <h3 className="font-display text-lg font-semibold">
            🚨 {tr(lang, "emgDirTitle")}
          </h3>
          <p className="mt-1 text-[13px] text-paper/70">
            {tr(lang, "emgDirDesc")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              aria-label="Country"
              className="rounded-lg border border-paper/25 bg-transparent px-3 py-2.5 text-sm text-paper"
            >
              {EMERGENCY_NUMBERS.map((e) => (
                <option key={e.code} value={e.code} className="text-ink">
                  {e.country}
                </option>
              ))}
            </select>
            {entry.numbers.map((n) => (
              <a
                key={n.service}
                href={`tel:${n.number}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-d-danger px-4 py-2.5 font-display text-sm font-semibold text-white"
              >
                <Phone size={15} strokeWidth={2.5} />
                {serviceLabel(lang, n.service)} {n.number}
              </a>
            ))}
          </div>
        </div>
        <div className="sm:text-right">
          <label
            htmlFor="sola-lang"
            className="font-display text-sm font-medium text-paper/80"
          >
            {tr(lang, "langLabel")}
          </label>
          <select
            id="sola-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="mt-2 block w-full rounded-lg border border-paper/25 bg-transparent px-3 py-2.5 text-sm text-paper sm:ml-auto sm:w-auto"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code} className="text-ink">
                {l.native}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-paper/50">
            {tr(lang, "langAuto")}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SiteFooter({
  lang,
  setLang,
}: {
  lang: LangCode;
  setLang: (l: LangCode) => void;
}) {
  const [modal, setModal] = useState<null | "privacy" | "terms">(null);

  return (
    <footer>
      <EmergencyStrip lang={lang} setLang={setLang} />
      <Footer7
        title="Sola"
        titleHref="#top"
        onTitleClick={SCROLL("top")}
        description="Reads today's heat for your city and shift, then tells you what to do about it — in plain words."
        sections={[
          {
            title: "Product",
            links: [
              { name: "Get my plan", href: "#app", onClick: SCROLL("app") },
              { name: "How it works", href: "#how", onClick: SCROLL("how") },
              { name: "Why it matters", href: "#why", onClick: SCROLL("why") },
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
