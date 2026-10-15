import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  geocodeCity,
  fetchHourlyHeat,
  fetchAirQuality,
  hoursInShift,
  bandFor,
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
import { HeatTrace } from "./components/ui/HeatTrace";
import { BandStamp, HeatNumeral } from "./components/ui/Readout";
import { CloudShader } from "./components/ui/cloud-shader";
import { skyForAqi } from "./lib/sky";
import { SiteNav, CtaBand, SiteFooter } from "./components/site/Site";
import { HowItWorks, WhyItMatters } from "./components/site/Sections";

const JOB_TYPES = [
  "Delivery rider",
  "Construction worker",
  "Street vendor",
  "Other",
];

/** Live hero gauge — current-hour heat index + the full day's curve. */
type Gauge = {
  place: string;
  hiC: number;
  day: HourlyHeat[];
  updated: string;
} | null;

function fmtTime(d: Date): string {
  return d
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .toUpperCase();
}

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

  const [gauge, setGauge] = useState<Gauge>(null);
  const [gaugeLoading, setGaugeLoading] = useState(false);
  const [gaugeAqi, setGaugeAqi] = useState<number | null>(null);
  const gaugeReq = useRef(0);

  // Debounced live readout: current heat index + today's full curve.
  useEffect(() => {
    const q = city.trim();
    if (q.length < 3) {
      setGauge(null);
      setGaugeAqi(null);
      setGaugeLoading(false);
      return;
    }
    const reqId = ++gaugeReq.current;
    setGaugeLoading(true);
    const t = setTimeout(async () => {
      try {
        const geo = await geocodeCity(q);
        const hourly = await fetchHourlyHeat(geo.lat, geo.lon);
        const aq = await fetchAirQuality(geo.lat, geo.lon).catch(() => null);
        if (reqId !== gaugeReq.current) return;
        setGaugeAqi(aq?.aqi ?? null);
        const nowHour = new Date().getHours();
        const current =
          hourly.find((h) => h.hour === nowHour) ?? hourly[hourly.length - 1];
        if (reqId !== gaugeReq.current) return;
        setGauge({
          place: geo.name,
          hiC: current.hiC,
          day: hourly,
          updated: fmtTime(new Date()),
        });
      } catch {
        if (reqId !== gaugeReq.current) return;
        setGauge(null);
      } finally {
        if (reqId === gaugeReq.current) setGaugeLoading(false);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [city]);

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
  const gaugeTone = gauge ? bandFor(gauge.hiC).tone : null;

  // Sky behind the hero instrument panel follows the haze: the submitted
  // plan's AQI wins, otherwise the live-typed city's AQI, else clear sky.
  const sky = skyForAqi(airQuality?.aqi ?? gaugeAqi ?? null);

  return (
    <div id="top" className="grain min-h-full">
      <SiteNav />

      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto max-w-6xl px-6 pt-16 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left — message + form */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
              Heat safety for outdoor workers
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.98] text-ink">
              Know when the heat turns dangerous.
            </h1>
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={spring}
                    className="overflow-hidden"
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

          {/* Right — live instrument readout panel, sky reacts to haze */}
          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-line p-7 lg:p-9"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <CloudShader
                className="absolute inset-0"
                speed={0.6}
                count={sky.count}
                cloudColor={sky.cloudColor}
                skyTopColor={sky.skyTopColor}
                skyBottomColor={sky.skyBottomColor}
              />
            </div>
            <div className="relative z-10">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                  {gauge ? "Right now" : gaugeLoading ? "Reading…" : "Live heat index"}
                </p>
                {gauge ? (
                  <HeatNumeral
                    value={gauge.hiC}
                    fontSize="clamp(4rem, 12vw, 7rem)"
                    className="mt-1 block"
                  />
                ) : gaugeLoading ? (
                  <div className="skeleton mt-2 h-[clamp(4rem,12vw,7rem)] w-44 rounded-2xl" />
                ) : (
                  <p
                    className="mt-1 font-display tnum leading-[0.85] text-line"
                    style={{ fontSize: "clamp(4rem, 12vw, 7rem)" }}
                  >
                    --°
                  </p>
                )}
              </div>
              {gauge && gaugeTone && <BandStamp tone={gaugeTone} className="mb-3 shrink-0" />}
            </div>

            {/* City line + provenance micro-label */}
            <p className="mt-2 text-sm text-ink-soft">
              {gauge
                ? `Feels-like temperature in ${gauge.place}.`
                : "Type your city to read the current feels-like temperature."}
            </p>
            {gauge && (
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                Updated {gauge.updated} · Open-Meteo
              </p>
            )}

            {/* Heat trace — oscilloscope line of today's curve */}
            <div className="mt-7 border-t border-line pt-6">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                Today's trace
              </p>
              {gauge ? (
                <div className="mt-3">
                  <HeatTrace hours={gauge.day} />
                </div>
              ) : (
                <div className="skeleton mt-3 h-[120px] w-full rounded-xl" />
              )}
            </div>
            </div>
          </motion.aside>
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
            />
          </div>
        )}
      </section>

      {/* ---------------- Content sections ---------------- */}
      <HowItWorks />
      <WhyItMatters />

      <div className="mx-auto max-w-6xl px-6">
        <CtaBand />
      </div>

      <SiteFooter />
    </div>
  );
}
