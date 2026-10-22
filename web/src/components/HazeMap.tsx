"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FireHotspot } from "../lib/haze";

/**
 * Haze fire map: REAL geography (Leaflet + Esri tiles) so the map shows
 * the actual country's structure — Singapore looks like Singapore, Delhi
 * like Delhi — automatically, wherever the city is. Markers are animated
 * via CSS (drop-in stagger + infinite flame flicker, flowing drift arrow).
 */

/** Cap animated markers for perf — the card text still reports the true total. */
const MARKER_CAP = 60;

const FLAME_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="14" height="14"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';

function fireIcon(hot: boolean, delay: number, flickerDelay: number) {
  return L.divIcon({
    className: "haze-marker",
    html:
      `<div class="haze-drop" style="animation-delay:${delay.toFixed(2)}s">` +
      `<div class="haze-flicker" style="animation-delay:${flickerDelay.toFixed(2)}s">` +
      `<div class="haze-flame ${hot ? "hot" : "nom"}">${FLAME_SVG}</div>` +
      `</div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function cityIcon(cityName: string) {
  return L.divIcon({
    className: "haze-marker",
    html:
      `<div class="haze-drop" style="animation-delay:0.1s">` +
      `<div class="haze-city"><span class="haze-city-ping"></span><span class="haze-city-dot"></span></div>` +
      (cityName
        ? `<div class="haze-city-label">${cityName.replace(/</g, "&lt;")}</div>`
        : "") +
      `</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export function HazeMap({
  hotspots,
  cityLat,
  cityLon,
  cityName,
  centroid,
  driftDeg,
}: {
  hotspots: FireHotspot[];
  cityLat: number;
  cityLon: number;
  cityName: string;
  centroid: { lat: number; lon: number };
  driftDeg: number;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<L.Map | null>(null);
  // Keep latest props for the effect without re-creating the map on every render.
  const propsRef = useRef({ hotspots, cityLat, cityLon, cityName, centroid, driftDeg });
  propsRef.current = { hotspots, cityLat, cityLon, cityName, centroid, driftDeg };

  useEffect(() => {
    if (!mapRef.current) return;
    if (leafletRef.current) {
      leafletRef.current.remove();
      leafletRef.current = null;
    }
    const p = propsRef.current;
    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
      zoomControl: false, // keep the clean 21st.dev-style chrome-less look
    });
    leafletRef.current = map;

    // Esri World Street Map — real country/city geography, keyless.
    // Slightly faded so the dot-screen print texture reads as the aesthetic.
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 12,
        opacity: 0.6,
        attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
      },
    ).addTo(map);

    const pts: L.LatLngExpression[] = [];
    const shown = [...p.hotspots]
      .sort((a, b) =>
        a.confidence === b.confidence ? 0 : a.confidence === "h" ? -1 : 1,
      )
      .slice(0, MARKER_CAP);
    shown.forEach((h, i) => {
      const pt: L.LatLngExpression = [h.lat, h.lon];
      pts.push(pt);
      L.marker(pt, {
        icon: fireIcon(
          h.confidence === "h",
          Math.min(i * 0.025, 1.4),
          (i * 0.37) % 1.6,
        ),
        interactive: false,
      }).addTo(map);
    });

    // City pin.
    const cityPt: L.LatLngExpression = [p.cityLat, p.cityLon];
    pts.push(cityPt);
    L.marker(cityPt, { icon: cityIcon(p.cityName), interactive: false }).addTo(
      map,
    );

    // Drift arrow: dashed line from the fire centroid along the drift heading,
    // with CSS-animated marching dashes showing flow direction.
    const rad = (p.driftDeg * Math.PI) / 180;
    const tip: L.LatLngExpression = [
      p.centroid.lat + 1.2 * Math.cos(rad),
      p.centroid.lon + 1.2 * Math.sin(rad),
    ];
    pts.push(tip);
    L.polyline(
      [
        [p.centroid.lat, p.centroid.lon],
        tip,
      ],
      {
        color: "#7c2d12",
        weight: 3,
        className: "haze-drift",
      },
    ).addTo(map);

    map.fitBounds(L.latLngBounds(pts).pad(0.25));
    return () => {
      map.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative size-full">
      <div ref={mapRef} className="size-full" />
      {/* Dot-screen print texture over the real geography — sits above tiles
          and the drift line, below the markers. */}
      <div className="haze-dots pointer-events-none absolute inset-0 z-[500]" />
    </div>
  );
}

export default HazeMap;
