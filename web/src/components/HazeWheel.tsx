import { useEffect, useState } from "react";
import { WorksWheel, type WorksWheelItem } from "./ui/works-wheel";
import { Reveal } from "./ui/Reveal";

/* ------------------------------------------------------------------ */
/* Haze watch — a turning wheel of real haze skies for one location.   */
/* Images are fetched live from Wikimedia Commons (freely licensed),   */
/* filtered to the location; a curated set covers the API being down.  */
/* ------------------------------------------------------------------ */

const FALLBACKS: Record<string, WorksWheelItem[]> = {
  singapore: [
    {
      title: "Singapore haze — Oct 2026",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/2026_haze_in_Singapore_20261005_183229.jpg/1280px-2026_haze_in_Singapore_20261005_183229.jpg",
      href: "https://commons.wikimedia.org/wiki/File:2026_haze_in_Singapore_20261005_183229.jpg",
    },
    {
      title: "Haze over Singapore",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Haze_Singapore_%2822319169378%29.jpg/1280px-Haze_Singapore_%2822319169378%29.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Haze_Singapore_(22319169378).jpg",
    },
    {
      title: "Sun through haze — Bukit Timah",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Sun_seen_through_haze%2C_Bukit_Timah%2C_Singapore.jpg/1280px-Sun_seen_through_haze%2C_Bukit_Timah%2C_Singapore.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Sun_seen_through_haze,_Bukit_Timah,_Singapore.jpg",
    },
  ],
  delhi: [
    {
      title: "Smog in the skies of Delhi",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Smog_in_the_skies_of_Delhi%2C_India.jpg/960px-Smog_in_the_skies_of_Delhi%2C_India.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Smog_in_the_skies_of_Delhi,_India.jpg",
    },
    {
      title: "Smog near Delhi — Nov 2016",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Smog_as_visible_in_the_Gurgaon_area_near_Delhi_on_Nov_2016.jpg/960px-Smog_as_visible_in_the_Gurgaon_area_near_Delhi_on_Nov_2016.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Smog_as_visible_in_the_Gurgaon_area_near_Delhi_on_Nov_2016.jpg",
    },
    {
      title: "Smog over IIT Delhi",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Smog_and_IITD.jpg/960px-Smog_and_IITD.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Smog_and_IITD.jpg",
    },
  ],
};

type CommonsPage = {
  title?: string;
  imageinfo?: { thumburl?: string; descriptionurl?: string; timestamp?: string }[];
};

type HazeImage = WorksWheelItem & { uploadedAt: number };

async function searchCommons(
  query: string,
  limit: number,
): Promise<HazeImage[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    `&generator=search&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}` +
    `&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|timestamp&iiurlwidth=900`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("commons search failed");
  const data = await res.json();
  const pages: Record<string, CommonsPage> = data?.query?.pages ?? {};
  const items: HazeImage[] = [];
  for (const p of Object.values(pages)) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const title = (p.title ?? "Haze")
      .replace(/^File:/, "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/_/g, " ")
      .replace(/\s*\([\d\s]+\)/g, "")
      .replace(/\s*\b\d{8}\b\s*\b\d{6}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 42);
    items.push({
      title,
      image: info.thumburl,
      href: info.descriptionurl,
      uploadedAt: info.timestamp ? +new Date(info.timestamp) : 0,
    });
  }
  return items;
}

/** Images for exactly one location — nothing else. Fetched live on every
    visit (realtime), newest uploads first so the wheel never goes stale, and
    deterministically rotated each day so a single day always brings a fresh
    wheel. Everything comes from Wikimedia Commons — real, freely-licensed
    photos, each card linking its file page. */
function useHazeImages(location: string): WorksWheelItem[] {
  const key = location.trim().toLowerCase() || "singapore";
  const [items, setItems] = useState<WorksWheelItem[]>(
    () => FALLBACKS[key] ?? FALLBACKS.singapore,
  );

  useEffect(() => {
    let cancelled = false;
    setItems(FALLBACKS[key] ?? FALLBACKS.singapore);
    (async () => {
      try {
        const [haze, smog] = await Promise.all([
          searchCommons(`${location} haze`, 15),
          searchCommons(`${location} smog`, 15),
        ]);
        if (cancelled) return;
        const seen = new Set<string>();
        const matched = [...haze, ...smog].filter((it) => {
          if (seen.has(it.image)) return false;
          seen.add(it.image);
          const t = it.title.toLowerCase();
          // Only this location — nothing else — and genuinely haze/smog.
          return (
            t.includes(key) && (t.includes("haze") || t.includes("smog"))
          );
        });
        // Newest uploads first — fresh photos, not decade-old ones.
        matched.sort((a, b) => b.uploadedAt - a.uploadedAt);
        if (matched.length >= 3) {
          // A deterministic daily rotation: every day the wheel opens on a
          // different slice of the pool, so each single day brings new images.
          const day = Math.floor(Date.now() / 86400000);
          const offset = day % matched.length;
          const rotated = [
            ...matched.slice(offset),
            ...matched.slice(0, offset),
          ];
          setItems(rotated.slice(0, 15));
        }
      } catch {
        // Keep the curated fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location, key]);

  return items;
}

export default function HazeWheel({ city }: { city: string }) {
  const location = city.trim() || "Singapore";
  const items = useHazeImages(location);

  return (
    <section
      className="mx-auto max-w-6xl px-6 py-16 lg:py-24"
      aria-label="Haze watch"
    >
      <Reveal>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
          Haze watch
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.8rem,4.5vw,2.75rem)] leading-tight text-ink">
          This is what the haze looks like over {location}.
        </h2>
      </Reveal>
      <Reveal className="mt-8">
        <div className="h-[68vh] min-h-[480px] w-full">
          <WorksWheel
            items={items}
            label="Haze watch"
            action="Source"
            showIndex={false}
            className="bg-transparent"
          />
        </div>
      </Reveal>
      <Reveal className="mt-6">
        <p className="text-center text-xs text-ink-soft">
          Haze images via{" "}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-ink"
          >
            Wikimedia Commons
          </a>{" "}
          · Live haze coverage:{" "}
          <a
            href="https://www.straitstimes.com/singapore/haze-in-singapore-persists-24-hour-psi-remains-unhealthy-for-all-regions"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-ink"
          >
            The Straits Times
          </a>
        </p>
      </Reveal>
    </section>
  );
}
