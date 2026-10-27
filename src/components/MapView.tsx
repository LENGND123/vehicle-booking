"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

type Pt = { lat: number; lng: number } | null | undefined;

type Props = {
  pickup?: Pt;
  drop?: Pt;
  driver?: Pt;
  driverIcon?: string;
  route?: number[][];
  onMapClick?: (p: { lat: number; lng: number }) => void;
  className?: string;
};

const DEFAULT_CENTER: [number, number] = [28.6139, 77.209]; // New Delhi

function emojiIcon(L: typeof Leaflet, emoji: string, bg: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// Leaflet map with pickup/drop/driver markers and the road route.
// Leaflet touches `window`, so it is loaded only in the browser.
export default function MapView({ pickup, drop, driver, driverIcon = "🚗", route, onMapClick, className }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const layers = useRef<{ pickup?: Leaflet.Marker; drop?: Leaflet.Marker; driver?: Leaflet.Marker; route?: Leaflet.Polyline }>({});
  const clickRef = useRef(onMapClick);
  clickRef.current = onMapClick;
  const fittedFor = useRef("");

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      L.current = mod;
      map.current = mod.map(el.current, { zoomControl: true }).setView(DEFAULT_CENTER, 12);
      mod
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map.current);
      map.current.on("click", (e) => clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      sync();
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(sync);

  function sync() {
    const m = map.current;
    const lib = L.current;
    if (!m || !lib) return;

    const place = (key: "pickup" | "drop" | "driver", p: Pt, emoji: string, bg: string) => {
      const existing = layers.current[key];
      if (!p) {
        existing?.remove();
        delete layers.current[key];
      } else if (existing) {
        existing.setLatLng([p.lat, p.lng]);
      } else {
        layers.current[key] = lib.marker([p.lat, p.lng], { icon: emojiIcon(lib, emoji, bg) }).addTo(m);
      }
    };
    place("pickup", pickup, "📍", "#16a34a");
    place("drop", drop, "🏁", "#dc2626");
    place("driver", driver, driverIcon, "#111827");

    layers.current.route?.remove();
    delete layers.current.route;
    if (route && route.length > 1) {
      layers.current.route = lib.polyline(route as [number, number][], { color: "#2563eb", weight: 5, opacity: 0.8 }).addTo(m);
    }

    // Re-fit the view only when the set of fixed points changes, not on every driver move.
    const pts = [pickup, drop].filter(Boolean) as { lat: number; lng: number }[];
    const key = pts.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|") + (driver && !fittedFor.current ? "d" : "");
    if (key && key !== fittedFor.current) {
      fittedFor.current = key;
      const all = driver ? [...pts, driver] : pts;
      if (all.length === 1) m.setView([all[0].lat, all[0].lng], 15);
      else m.fitBounds(lib.latLngBounds(all.map((p) => [p.lat, p.lng] as [number, number])), { padding: [50, 50] });
    } else if (!key && driver && !fittedFor.current) {
      fittedFor.current = "driver";
      m.setView([driver.lat, driver.lng], 15);
    }
  }

  return <div ref={el} className={className ?? "h-[420px] w-full rounded-xl"} />;
}
