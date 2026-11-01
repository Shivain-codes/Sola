import { useEffect, useState } from "react";
import { WorksWheel, type WorksWheelItem } from "./ui/works-wheel";
import { Reveal } from "./ui/Reveal";

/* ------------------------------------------------------------------ */
/* Haze watch — a turning wheel of real haze skies for one location.   */
/* Images are fetched live from Wikimedia Commons (freely licensed).   */
/* Where a human-curated Commons category exists for the location,    */
/* that category is the dynamic source — keyword search is only a      */
/* fallback, because keyword search matches filenames, not photos      */
/* (a yacht named "Haze" in New York, or a satellite photo titled      */
/* "... New York ... Very Heavy Haze", both pass a keyword filter).   */
/* A curated set paints instantly and covers the API being down.      */
/* ------------------------------------------------------------------ */

/** Human-curated Commons categories — membership is relevance, not a
    filename match. New uploads to the category appear automatically. */
const CATEGORY_MAP: Record<string, string> = {
  "new york": "Smoke from 2023 Quebec wildfires in New York City",
  singapore: "Haze in Singapore",
};

const FALLBACKS: Record<string, WorksWheelItem[]> = {
  singapore: [
    {
      title: "Singapore haze — Oct 2026",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/2026_haze_in_Singapore_20261005_183229.jpg/1280px-2026_haze_in_Singapore_20261005_183229.jpg",
      href: "https://commons.wikimedia.org/wiki/File:2026_haze_in_Singapore_20261005_183229.jpg",
    },
    {
      title: "Haze over Singapore — Oct 2026",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/2026_haze_in_Singapore_20261005_183224.jpg/1280px-2026_haze_in_Singapore_20261005_183224.jpg",
      href: "https://commons.wikimedia.org/wiki/File:2026_haze_in_Singapore_20261005_183224.jpg",
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
  "new york": [
    {
      title: "Orange haze hides Manhattan — Jun 2023",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Orange_Haze_Hides_Manhattan.jpg/1280px-Orange_Haze_Hides_Manhattan.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Orange_Haze_Hides_Manhattan.jpg",
    },
    {
      title: "Empire State haze — Jun 2023",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Empire_State_Haze_%2852958371285%29.jpg/1280px-Empire_State_Haze_%2852958371285%29.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Empire_State_Haze_(52958371285).jpg",
    },
    {
      title: "Empire State Building — Jun 7, 2023",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Empire_State_Building_on_June_7%2C_2023.jpg/1280px-Empire_State_Building_on_June_7%2C_2023.jpg",
      href: "https://commons.wikimedia.org/wiki/File:Empire_State_Building_on_June_7,_2023.jpg",
    },
  ],
};

type CommonsPage = {
  title?: string;
  imageinfo?: { thumburl?: string; descriptionurl?: string; timestamp?: string }[];
};

type HazeImage = WorksWheelItem & { uploadedAt: number; matchText: string };

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
    // Clean the full title first — filtering runs on the whole thing, so a
    // long title never loses its city/keyword to the display slice.
    const cleaned = (p.title ?? "Haze")
      .replace(/^File:/, "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/_/g, " ")
      .replace(/\s*\([\d\s]+\)/g, "")
      .replace(/\s*\b\d{8}\b\s*\b\d{6}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    items.push({
      title: cleaned.slice(0, 42),
      image: info.thumburl,
      href: info.descriptionurl,
      uploadedAt: info.timestamp ? +new Date(info.timestamp) : 0,
      matchText: cleaned.toLowerCase(),
    });
  }
  return items;
}

/** Category members, parsed the same way. Unlike keyword search, every
    member was placed in the category by a human, so no title filter is
    needed here — and no title filter can let a yacht or a satellite
    photo through. Non-bitmap files (tif/tiff) are skipped by the
    thumburl check in practice; keep only files with a usable thumb. */
async function searchCategory(
  category: string,
  limit: number,
): Promise<HazeImage[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    `&generator=categorymembers&gcmtitle=${encodeURIComponent("Category:" + category)}` +
    `&gcmtype=file&gcmlimit=${limit}&prop=imageinfo&iiprop=url|timestamp&iiurlwidth=900`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("commons category failed");
  const data = await res.json();
  const pages: Record<string, CommonsPage> = data?.query?.pages ?? {};
  const items: HazeImage[] = [];
  for (const p of Object.values(pages)) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl) continue;
    if (/\.tiff?$/i.test(p.title ?? "")) continue;
    const cleaned = (p.title ?? "Haze")
      .replace(/^File:/, "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/_/g, " ")
      .replace(/\s*\([\d\s]+\)/g, "")
      .replace(/\s*\b\d{8}\b\s*\b\d{6}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    items.push({
      title: cleaned.slice(0, 42),
      image: info.thumburl,
      href: info.descriptionurl,
      uploadedAt: info.timestamp ? +new Date(info.timestamp) : 0,
      matchText: cleaned.toLowerCase(),
    });
  }
  return items;
}

/** Filename traps that pass a keyword filter but are not haze weather:
    a vessel/person named Haze, a satellite programme, a space photo. */
const KEYWORD_EXCLUSIONS = [
  "yacht",
  "clipper",
  "ship",
  "apollo",
  "ast-",
  "jenna haze",
  "scott haze",
];

/** The wheel reads best with a tight set, and only fresh uploads belong in it. */
const MAX_ITEMS = 6;
/** "New" = uploaded within the last 120 days — this haze season, not 2013. */
const FRESH_DAYS = 120;

/** Images for exactly one location — nothing else. Fetched live on every
    visit (realtime), newest uploads first so the wheel never goes stale, and
    deterministically rotated each day so a single day always brings a fresh
    wheel. Everything comes from Wikimedia Commons — real, freely-licensed
    photos, each card linking its file page.
    Returns null while loading. Never substitutes another city's photos:
    if Commons has none of this location, the caller shows an empty state. */
function useHazeImages(location: string): WorksWheelItem[] | null {
  const key = location.trim().toLowerCase() || "singapore";
  // Curated correct-city fallbacks paint instantly; anything else starts
  // loading so we never flash another city's photos.
  const [items, setItems] = useState<WorksWheelItem[] | null>(
    () => FALLBACKS[key] ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    setItems(FALLBACKS[key] ?? null);
    // Debounce: wait for typing to settle before hitting the Commons API.
    const timer = setTimeout(() => {
      (async () => {
      try {
        // Dynamic, category-first: if this city has a curated Commons
        // category, its members are the pool — newest first, daily
        // rotation below. New uploads to the category appear on their
        // own, so this stays dynamic without re-curating by hand.
        // (No fresh-days filter here: a 2023 event category is the
        // correct record for that city, not "this season".)
        const category = CATEGORY_MAP[key];
        let matched: HazeImage[] = [];
        if (category) {
          const fromCategory = await searchCategory(category, 50);
          if (cancelled) return;
          const seenCat = new Set<string>();
          matched = fromCategory.filter((it) => {
            if (seenCat.has(it.image)) return false;
            seenCat.add(it.image);
            return true;
          });
          // A thin category is worse than keyword search — drop it so
          // the keyword path below runs instead.
          if (matched.length < 3) matched = [];
        }
        if (matched.length === 0) {
          const [haze, smog] = await Promise.all([
            searchCommons(`${location} haze`, 25),
            searchCommons(`${location} smog`, 25),
          ]);
          if (cancelled) return;
          const seen = new Set<string>();
          matched = [...haze, ...smog].filter((it) => {
            if (seen.has(it.image)) return false;
            seen.add(it.image);
            const t = it.matchText;
            // Only this location — nothing else — and genuinely haze/smog,
            // and not a known filename trap (yacht/person/space photo).
            return (
              t.includes(key) &&
              (t.includes("haze") || t.includes("smog")) &&
              !KEYWORD_EXCLUSIONS.some((w) => t.includes(w))
            );
          });
        }
        // Newest uploads first — fresh photos, not decade-old ones.
        matched.sort((a, b) => b.uploadedAt - a.uploadedAt);
        // Only new uploads make the wheel. If fewer than 3 are fresh, fall
        // back to the newest available so the wheel never sits empty.
        const cutoff = Date.now() - FRESH_DAYS * 86400000;
        const fresh = matched.filter((it) => it.uploadedAt >= cutoff);
        const pool = (fresh.length >= 3 ? fresh : matched).slice(0, MAX_ITEMS);
        // A deterministic daily rotation: every day the wheel opens on a
        // different slice of the pool, so each single day brings new images.
        const day = Math.floor(Date.now() / 86400000);
        const offset = pool.length > 0 ? day % pool.length : 0;
        setItems([...pool.slice(offset), ...pool.slice(0, offset)]);
      } catch {
        // Fetch failed: keep the curated fallback if this city has one,
        // otherwise stay empty — never another city's photos.
        if (cancelled) return;
        setItems(FALLBACKS[key] ?? []);
      }
      })();
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [location, key]);

  return items;
}

export default function HazeWheel({ city }: { city: string }) {
  const location = city.trim() || "Singapore";
  const items = useHazeImages(location);
  const isSingapore = location.trim().toLowerCase() === "singapore";

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
        {items === null ? (
          <div className="flex h-[68vh] min-h-[480px] w-full items-center justify-center">
            <p className="text-sm text-ink-soft">
              Finding haze photos of {location}…
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-[68vh] min-h-[480px] w-full items-center justify-center">
            <p className="max-w-md text-center text-sm leading-relaxed text-ink-soft">
              No haze photos of {location} on Wikimedia Commons yet — the
              wheel appears here as soon as photographers upload them.
            </p>
          </div>
        ) : (
          <div className="h-[68vh] min-h-[480px] w-full">
            <WorksWheel
              items={items}
              label="Haze watch"
              action="Source"
              showIndex={false}
              className="bg-transparent"
            />
          </div>
        )}
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
          </a>
          {isSingapore && (
            <>
              {" "}· Live haze coverage:{" "}
              <a
                href="https://www.straitstimes.com/singapore/haze-in-singapore-persists-24-hour-psi-remains-unhealthy-for-all-regions"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 transition-colors hover:text-ink"
              >
                The Straits Times
              </a>
            </>
          )}
        </p>
      </Reveal>
    </section>
  );
}
