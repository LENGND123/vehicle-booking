"use client";

import { useEffect, useState } from "react";
import { api, type Place } from "@/lib/client";

type Props = {
  label: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
  allowMyLocation?: boolean;
};

// Address box with OpenStreetMap suggestions and an optional "use my location" button.
export default function PlaceSearch({ label, value, onChange, allowMyLocation }: Props) {
  const [text, setText] = useState(value?.address ?? "");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setText(value?.address ?? ""), [value?.address]);

  useEffect(() => {
    if (!open || text.trim().length < 3 || text === value?.address) return;
    const t = setTimeout(async () => {
      try {
        const { places } = await api<{ places: Place[] }>(`/api/geocode?q=${encodeURIComponent(text)}`);
        setResults(places);
      } catch {
        setResults([]);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [text, open, value?.address]);

  function useMyLocation() {
    if (!navigator.geolocation) return alert("Your browser can't share location");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { address } = await api(`/api/geocode?lat=${coords.latitude}&lng=${coords.longitude}`).catch(() => ({
          address: "My location",
        }));
        onChange({ address, lat: coords.latitude, lng: coords.longitude });
        setBusy(false);
      },
      () => {
        setBusy(false);
        alert("Couldn't get your location. Type an address or click on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Search a place…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {allowMyLocation && (
          <button type="button" onClick={useMyLocation} className="btn-secondary shrink-0" title="Use my location">
            {busy ? "…" : "◎"}
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-white shadow-lg">
          {results.map((p) => (
            <li key={`${p.lat},${p.lng}`}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                onMouseDown={() => {
                  onChange(p);
                  setResults([]);
                  setOpen(false);
                }}
              >
                {p.address}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
