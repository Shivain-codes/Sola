import { useEffect, useState } from "react";
import { WorksWheel, type WorksWheelItem } from "./ui/works-wheel";
import { Reveal } from "./ui/Reveal";

/* ------------------------------------------------------------------ */
/* Haze watch — a turning wheel of real haze skies. Images are fetched  */
/* live from Wikimedia Commons (freely licensed) and fall back to a    */
/* curated set if the API is unreachable.                              */
/* ------------------------------------------------------------------ */

const FALLBACK: WorksWheelItem[] = [
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
];

type CommonsPage = {
  title?: string;
  imageinfo?: { thumburl?: string; descriptionurl?: string }[];
};

async function searchCommons(
  query: string,
  limit: number,
): Promise<WorksWheelItem[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}` +
    `&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url&iiurlwidth=900`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("commons search failed");
  const data = await res.json();
  const pages: Record<string, CommonsPage> = data?.query?.pages ?? {};
  const items: WorksWheelItem[] = [];
  for (const p of Object.values(pages)) {
    const info = p.imageinfo?.[0];
    if (!info?.thumburl) continue;
    const title = (p.title ?? "Haze")
      .replace(/^File:/, "")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/_/g, " ")
      .slice(0, 42);
    items.push({
      title,
      image: info.thumburl,
      href: info.descriptionurl,
    });
  }
  return items;
}

function useHazeImages(): WorksWheelItem[] {
  const [items, setItems] = useState<WorksWheelItem[]>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sg, delhi] = await Promise.all([
          searchCommons("Singapore haze", 6),
          searchCommons("Delhi smog", 4),
        ]);
        if (cancelled) return;
        const seen = new Set<string>();
        const merged = [...sg, ...delhi].filter((it) => {
          if (seen.has(it.image)) return false;
          seen.add(it.image);
          return true;
        });
        if (merged.length >= 3) setItems(merged.slice(0, 10));
      } catch {
        // Keep the curated fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}

export default function HazeWheel() {
  const items = useHazeImages();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24" aria-label="Haze watch">
      <Reveal>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">
          Haze watch
        </p>
        <h2 className="mt-3 font-display text-[clamp(1.8rem,4.5vw,2.75rem)] leading-tight text-ink">
          This is what the haze looks like.
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          Real skies from real haze days — scroll to turn the wheel. Images via
          Wikimedia Commons.
        </p>
      </Reveal>
      <Reveal className="mt-8 overflow-hidden rounded-[22px] border border-line bg-paper/60 backdrop-blur-md">
        <div className="h-[68vh] min-h-[480px] w-full">
          <WorksWheel items={items} label="Haze watch" action="Source" />
        </div>
      </Reveal>
    </section>
  );
}
