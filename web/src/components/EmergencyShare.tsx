import { useEffect, useRef, useState } from "react";
import { Siren } from "lucide-react";
import { tr, fill, type LangCode } from "../lib/i18n";
import { LocationMap } from "./ui/expanded-map";
import { SolaButton } from "./ui/SolaButton";

type Props = {
  cityName: string;
  jobType: string;
  lang: LangCode;
};

type Phase =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "ready"; lat: number; lon: number; copied: boolean }
  | { kind: "failed"; reasonKey: "emgNoGeo" | "emgDenied" | "emgFixFail" };

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Felicia's location idea, implemented honestly: a website can't track a
 * worker in the background, but one tap can send their live GPS position
 * to an emergency contact. No accounts, no stored data — the location never
 * leaves the worker's phone except in the message they choose to send.
 */
export default function EmergencyShare({ cityName, jobType, lang }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const watchId = useRef<number | null>(null);

  function stopWatch() {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }

  // Stop live tracking when the card unmounts — no background tracking.
  useEffect(() => stopWatch, []);

  function locate() {
    if (!("geolocation" in navigator)) {
      setPhase({ kind: "failed", reasonKey: "emgNoGeo" });
      return;
    }
    setPhase({ kind: "locating" });
    stopWatch();
    watchId.current = navigator.geolocation.watchPosition(
      (pos) =>
        setPhase({
          kind: "ready",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          copied: false,
        }),
      (err) =>
        setPhase((prev) =>
          // Keep showing the last known fix if we already have one —
          // a momentary GPS dropout shouldn't wipe the map.
          prev.kind === "ready"
            ? prev
            : {
                kind: "failed",
                reasonKey:
                  err.code === err.PERMISSION_DENIED
                    ? "emgDenied"
                    : "emgFixFail",
              },
        ),
      // maximumAge: 0 — always a fresh fix, never a cached one.
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  const mapsLink =
    phase.kind === "ready"
      ? `https://maps.google.com/?q=${phase.lat.toFixed(5)},${phase.lon.toFixed(5)}`
      : null;
  const msg = fill(tr(lang, "emgMsg"), {
    job: jobType.toLowerCase(),
    city: cityName,
    loc:
      mapsLink ?? fill(tr(lang, "emgNoLoc"), { city: cityName }),
  });
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  // iOS needs sms:?&body=, Android uses sms:?body=
  const smsHref = `sms:?${isIOS() ? "&" : ""}body=${encodeURIComponent(msg)}`;

  async function copyLink() {
    if (phase.kind !== "ready" || !mapsLink) return;
    try {
      await navigator.clipboard.writeText(mapsLink);
    } catch {
      await navigator.clipboard.writeText(msg).catch(() => {});
    }
    setPhase({ ...phase, copied: true });
  }

  return (
    <section
      aria-label="Emergency location sharing"
      className="mt-6 rounded-2xl border border-line bg-white/80 p-5 sm:p-6"
    >
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
        <Siren size={18} strokeWidth={2.25} className="text-d-danger" />
        {tr(lang, "emgTitle")}
      </h3>
      <p className="mt-1 text-[13px] leading-snug text-ink-soft">
        {tr(lang, "emgDesc")}
      </p>

      {phase.kind === "idle" && (
        <SolaButton onClick={locate} className="mt-4">
          {tr(lang, "emgShare")}
        </SolaButton>
      )}

      {phase.kind === "locating" && (
        <p className="mt-4 text-[13px] text-ink-soft" role="status">
          {tr(lang, "emgLocating")}
        </p>
      )}

      {phase.kind === "ready" && (
        <div className="mt-4">
          <div className="relative flex justify-center">
            <span className="absolute top-2 left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-d-danger px-2.5 py-1 font-display text-[10px] font-semibold tracking-widest text-white uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              Live
            </span>
            <LocationMap
              location={tr(lang, "emgYourLocation")}
              latitude={phase.lat}
              longitude={phase.lon}
              zoom={15}
              defaultExpanded
            />
          </div>
          <p className="rounded-lg bg-white/70 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-line text-ink-soft mt-3">
            {msg}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#25D366] px-4 py-3 text-center font-display text-sm font-semibold text-white"
            >
              {tr(lang, "emgWa")}
            </a>
            <a
              href={smsHref}
              className="rounded-xl bg-ink px-4 py-3 text-center font-display text-sm font-semibold text-white"
            >
              {tr(lang, "emgSms")}
            </a>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="mt-2 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft"
          >
            {phase.copied ? tr(lang, "emgCopied") : tr(lang, "emgCopy")}
          </button>
        </div>
      )}

      {phase.kind === "failed" && (
        <div className="mt-4">
          <p className="text-[13px] text-ink-soft">{tr(lang, phase.reasonKey)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#25D366] px-4 py-3 text-center font-display text-sm font-semibold text-white"
            >
              {tr(lang, "emgNoGps")}
            </a>
            <button
              type="button"
              onClick={locate}
              className="rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink"
            >
              {tr(lang, "emgRetry")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
