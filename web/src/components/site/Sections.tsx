import { Droplets, HeartPulse, ShieldCheck } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "../ui/Reveal";

/* ---------------- How it works ---------------- */

export function HowItWorks() {
  const steps = [
    { n: "01", title: "Tell us your shift", copy: "City, job, and the hours you'll be outside." },
    { n: "02", title: "We read the sky", copy: "Live feels-like temperature for every hour, humidity included." },
    { n: "03", title: "Get your plan", copy: "When to work, rest, and drink — and the signs that mean stop." },
  ];

  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
      <Reveal>
        <p className="font-display text-xs uppercase tracking-[0.2em] text-ink-soft">
          How it works
        </p>
      </Reveal>

      <RevealGroup as="ul" stagger={0.08} className="mt-8">
        {steps.map((s, i) => (
          <RevealItem
            key={s.n}
            as="li"
            className={
              "flex flex-col gap-2 py-7 sm:flex-row sm:items-baseline sm:gap-8" +
              (i !== steps.length - 1 ? " border-b border-line" : "")
            }
          >
            <span className="font-display tnum text-[clamp(2.5rem,6vw,3.5rem)] leading-none text-ink">
              {s.n}
            </span>
            <div className="sm:flex sm:flex-1 sm:items-baseline sm:justify-between sm:gap-8">
              <h3 className="font-display text-2xl leading-tight text-ink">
                {s.title}
              </h3>
              <p className="mt-1 max-w-sm text-base leading-relaxed text-ink-soft sm:mt-0 sm:text-right">
                {s.copy}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* ---------------- Why it matters ---------------- */

export function WhyItMatters() {
  const cards = [
    {
      icon: Droplets,
      title: "Humidity is the hidden danger",
      copy: "When the air is humid, sweat can't evaporate — so your body can't cool itself. The same temperature feels far hotter and is far more dangerous.",
    },
    {
      icon: HeartPulse,
      title: "Heatstroke moves fast",
      copy: "Heatstroke is a medical emergency. Once the warning signs appear, a person's condition can worsen within minutes without cooling and help.",
    },
    {
      icon: ShieldCheck,
      title: "Prevention is simple",
      copy: "Most heat illness is preventable. Water, shade, and rest during the hottest hours are the proven basics that keep outdoor workers safe.",
    },
  ];

  return (
    <section id="why" className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
      <Reveal>
        <p className="font-display text-xs uppercase tracking-[0.2em] text-ink-soft">
          Why it matters
        </p>
      </Reveal>

      <RevealGroup stagger={0.08} className="mt-8 grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <RevealItem
            key={c.title}
            className="flex flex-col rounded-2xl border border-line bg-paper p-7"
          >
            <c.icon size={24} strokeWidth={1.75} color="#EA580C" />
            <h3 className="mt-5 font-display text-xl leading-tight text-ink">
              {c.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {c.copy}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
