"use client";

import { useEffect, useRef } from "react";

/**
 * Dotted halftone map generated FROM the real geography of the given bounds:
 * loads Esri Light-Gray tiles covering the bounds, draws them to canvas,
 * and re-renders as ink dots (the 21st.dev dotted aesthetic) — so the
 * dotted map IS the entered city's region, not a fixed US illustration.
 */

const TILE = 256;
const SERVICE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile";

export type LatLonBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

const lonToX = (lon: number, z: number) => ((lon + 180) / 360) * 2 ** z;
const latToY = (lat: number, z: number) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z;
};

function fitZoom(b: LatLonBounds, w: number, h: number) {
  for (let z = 10; z >= 2; z--) {
    const bw = (lonToX(b.maxLon, z) - lonToX(b.minLon, z)) * TILE;
    const bh = (latToY(b.minLat, z) - latToY(b.maxLat, z)) * TILE;
    if (bw <= w && bh <= h) return z;
  }
  return 2;
}

function loadTile(z: number, x: number, y: number): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `${SERVICE}/${z}/${y}/${x}`;
  });
}

/** Re-render the source canvas as ink dots on white. Fixed tonal mapping
 *  tuned for the Esri Light-Gray palette: near-white water stays clean,
 *  mid-gray land becomes an airy dot field, dark labels/roads dot denser. */
function halftone(src: HTMLCanvasElement, cell = 5): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  const data = sctx.getImageData(0, 0, w, h).data;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  octx.fillStyle = "#ffffff";
  octx.fillRect(0, 0, w, h);
  octx.fillStyle = "#44403c";
  const half = cell / 2;
  for (let cy = 0; cy < h; cy += cell) {
    for (let cx = 0; cx < w; cx += cell) {
      const px = Math.min(cx + (cell >> 1), w - 1);
      const py = Math.min(cy + (cell >> 1), h - 1);
      const i = (py * w + px) * 4;
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const ink = Math.min(Math.max((0.9 - lum) / 0.22, 0), 1);
      const r = half * 0.85 * Math.pow(ink, 1.15);
      if (r < 0.4) continue;
      octx.beginPath();
      octx.arc(cx + half, cy + half, Math.min(r, half), 0, Math.PI * 2);
      octx.fill();
    }
  }
  return out;
}

export function DottedMapBackdrop({ bounds }: { bounds: LatLonBounds }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const W = wrap.clientWidth || 700;
    const H = wrap.clientHeight || 240;
    const b = bounds;

    (async () => {
      const z = fitZoom(b, W, H);
      const x0 = Math.floor(lonToX(b.minLon, z));
      const x1 = Math.floor(lonToX(b.maxLon, z));
      const y0 = Math.floor(latToY(b.maxLat, z));
      const y1 = Math.floor(latToY(b.minLat, z));

      // Compose tiles.
      const gw = x1 - x0 + 1;
      const gh = y1 - y0 + 1;
      const comp = document.createElement("canvas");
      comp.width = gw * TILE;
      comp.height = gh * TILE;
      const cctx = comp.getContext("2d")!;
      const jobs: Promise<void>[] = [];
      for (let tx = x0; tx <= x1; tx++) {
        for (let ty = y0; ty <= y1; ty++) {
          jobs.push(
            loadTile(z, tx, ty).then((img) => {
              if (img && !cancelled)
                cctx.drawImage(img, (tx - x0) * TILE, (ty - y0) * TILE);
            }),
          );
        }
      }
      await Promise.all(jobs);
      if (cancelled) return;

      // Crop exactly to the data bounds, scale to the container.
      const px0 = (lonToX(b.minLon, z) - x0) * TILE;
      const py0 = (latToY(b.maxLat, z) - y0) * TILE;
      const pw = (lonToX(b.maxLon, z) - lonToX(b.minLon, z)) * TILE;
      const ph = (latToY(b.minLat, z) - latToY(b.maxLat, z)) * TILE;
      const sized = document.createElement("canvas");
      sized.width = Math.max(1, Math.round(W));
      sized.height = Math.max(1, Math.round(H));
      sized
        .getContext("2d")!
        .drawImage(comp, px0, py0, pw, ph, 0, 0, sized.width, sized.height);
      if (cancelled) return;

      const dotted = halftone(sized, 5);
      canvas.width = dotted.width;
      canvas.height = dotted.height;
      canvas.getContext("2d")!.drawImage(dotted, 0, 0);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full mask-[linear-gradient(to_bottom,black_50%,transparent)]"
      />
    </div>
  );
}

export default DottedMapBackdrop;
