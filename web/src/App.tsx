import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  geocodeCity,
  fetchHourlyHeat,
  fetchAirQuality,
  hoursInShift,
  type HourlyHeat,
  type AirQuality,
} from "./lib/heat";
import { generatePlan, type PlanResult } from "./lib/plan";
import SafetyCard from "./components/SafetyCard";
import { Button } from "./components/ui/Button";
import {
  FieldRow,
  NumberField,
  SelectField,
  TextField,
  TimeField,
} from "./components/ui/Field";
import { spring } from "./components/ui/motion";
import { SolaPreloader } from "./components/ui/SolaPreloader";
import { CloudShader } from "./components/ui/cloud-shader";
import { TextReveal } from "./components/ui/text-reveal";
import { skyForAqi } from "./lib/sky";
import { SiteNav, CtaBand, SiteFooter } from "./components/site/Site";
import { HowItWorks, WhyItMatters } from "./components/site/Sections";

const JOB_TYPES = [
  "Delivery rider",
  "Construction worker",
  "Street vendor",
  "Other",
];

export default function App() {
  const [city, setCity] = useState("");
  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [age, setAge] = useState("");
  const [customOccupation, setCustomOccupation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [shiftHours, setShiftHours] = useState<HourlyHeat[]>([]);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShiftHours([]);
    setPlaceName(null);
    setPlanResult(null);
    setAirQuality(null);

    if (!city.trim()) {
      setError("Enter a city name.");
      return;
    }

    setLoading(true);
    try {
      const geo = await geocodeCity(city.trim());
      const aq = await fetchAirQuality(geo.lat, geo.lon);
      setAirQuality(aq);
      const hourly = await fetchHourlyHeat(geo.lat, geo.lon);
      const startHour = Number(startTime.slice(0, 2));
      const endHour = Number(endTime.slice(0, 2));
      const slice = hoursInShift(hourly, startHour, endHour);
      if (slice.length === 0) {
        setError("No forecast hours fall inside that shift window.");
        setLoading(false);
        return;
      }
      setPlaceName(geo.name);
      setShiftHours(slice);

      const parsedAge = Number.parseInt(age, 10);
      const ageOk =
        Number.isFinite(parsedAge) && parsedAge >= 1 && parsedAge <= 120;

      const result = await generatePlan({
        city: geo.name,
        jobType,
        shiftStart: startTime,
        shiftEnd: endTime,
        hours: slice,
        age: ageOk ? parsedAge : undefined,
        customOccupation:
          jobType === "Other" ? customOccupation.trim() : undefined,
        aqi: airQuality?.aqi ?? undefined,
      });
      setPlanResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const hasPlan = planResult && shiftHours.length > 0;

  // Sky follows the haze of the submitted plan's AQI, else clear sky.
  const sky = skyForAqi(airQuality?.aqi ?? null);

  return (
    <div id="top" className="grain relative min-h-full overflow-x-clip">
      <SolaPreloader />
      {/* Full-page haze-reactive sky background. Absolute (in-flow): it scrolls
          with the page, so it never fights scroll or glitches captures the way
          viewport-locked layers do. Rendered at half resolution — soft clouds
          upscale cleanly and it's far cheaper on the GPU. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to bottom, ${sky.skyTopColor}, ${sky.skyBottomColor})`,
        }}
      >
        <CloudShader
          className="absolute inset-0"
          speed={0.6}
          count={6}
          resolutionScale={0.5}
          cloudColor={sky.cloudColor}
          skyTopColor={sky.skyTopColor}
          skyBottomColor={sky.skyBottomColor}
        />
      </div>
      <div className="relative z-10">
      <SiteNav />

      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto max-w-6xl px-6 pt-16 lg:pt-24">
        <div className="max-w-2xl">
          {/* Left — message + form */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
              Heat safety for outdoor workers
            </p>
            <TextReveal
              as="h1"
              per="word"
              preset="fade-in-blur"
              speedReveal={1.4}
              className="mt-4 font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.98] text-ink"
            >
              Know when the heat turns dangerous.
            </TextReveal>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              Sola reads today's feels-like temperature for your city and shift,
              then tells you when to work, rest, and drink — in plain words.
            </p>

            {/* Hero form (mirrors #app; scrolls there on submit intent) */}
            <form
              onSubmit={onSubmit}
              className="mt-8 flex flex-col gap-5"
              id="app"
            >
              <TextField
                label="City"
                value={city}
                onChange={setCity}
                placeholder="e.g. Delhi"
              />
              <SelectField
                label="Job type"
                value={jobType}
                onChange={setJobType}
                options={JOB_TYPES}
              />
              <AnimatePresence initial={false}>
                {jobType === "Other" && (
                  <motion.div
                    key="custom-occupation"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <TextField
                      label="Tell us your occupation"
                      value={customOccupation}
                      onChange={setCustomOccupation}
                      placeholder="e.g. street vendor"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <NumberField
                label="Age (optional)"
                value={age}
                onChange={setAge}
                placeholder="e.g. 65"
              />
              <FieldRow>
                <TimeField
                  label="Shift start"
                  value={startTime}
                  onChange={setStartTime}
                />
                <TimeField
                  label="Shift end"
                  value={endTime}
                  onChange={setEndTime}
                />
              </FieldRow>
              <div className="pt-1">
                <Button type="submit" disabled={loading}>
                  {loading ? "Reading the heat…" : "Get my safety plan"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={spring}
              className="mx-auto mt-8 flex max-w-md items-center gap-3 border-t border-line pt-6 text-ink lg:mx-0"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: "#DC2626" }}
              />
              <span className="text-[15px]">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12"
              aria-busy="true"
              aria-label="Building your safety plan"
            >
              <div className="skeleton h-5 w-40 rounded-full" />
              <div className="skeleton mt-5 h-20 w-32 rounded-2xl" />
              <div className="skeleton mt-6 h-14 w-full rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context line */}
        {hasPlan && placeName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-14 font-display text-sm text-ink-soft"
          >
            {placeName}
            <span className="px-2 text-line">/</span>
            {jobType.toLowerCase()}
          </motion.p>
        )}

        {/* Plan */}
        {hasPlan && (
          <div className="mt-6">
            <SafetyCard
              plan={planResult.plan}
              source={planResult.source}
              hours={shiftHours}
              airQuality={airQuality}
              cityName={placeName ?? city}
              age={(() => {
                const n = Number.parseInt(age, 10);
                return Number.isFinite(n) && n >= 1 && n <= 120 ? n : undefined;
              })()}
            />
          </div>
        )}
      </section>

      {/* ---------------- Content sections ---------------- */}
      <HowItWorks />
      <WhyItMatters />

      <CtaBand />
      <SiteFooter />
      </div>
    </div>
  );
}
