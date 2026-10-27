"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MapView from "@/components/MapView";
import PlaceSearch from "@/components/PlaceSearch";
import { VEHICLES, VEHICLE_TYPES, type VehicleType } from "@/lib/fare";
import { api, rupees, type Place } from "@/lib/client";

type Quote = { distanceKm: number; durationMin: number; route: number[][]; fares: Record<VehicleType, number> };

export default function BookPage() {
  const router = useRouter();
  const [pickup, setPickup] = useState<Place | null>(null);
  const [drop, setDrop] = useState<Place | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [vehicle, setVehicle] = useState<VehicleType>("car");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/bookings").then(({ bookings }) => {
      const active = bookings.find((b: { status: string }) => ["requested", "accepted", "arrived", "ongoing"].includes(b.status));
      setActiveId(active?._id ?? null);
    });
  }, []);

  useEffect(() => {
    setQuote(null);
    if (!pickup || !drop) return;
    api<Quote>("/api/quote", { body: { pickup, drop } })
      .then(setQuote)
      .catch((e) => setError(e.message));
  }, [pickup, drop]);

  // Clicking the map fills pickup first, then drop.
  async function onMapClick(p: { lat: number; lng: number }) {
    const { address } = await api(`/api/geocode?lat=${p.lat}&lng=${p.lng}`).catch(() => ({ address: `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` }));
    const place = { address, ...p };
    if (!pickup) setPickup(place);
    else setDrop(place);
  }

  async function book() {
    setBusy(true);
    setError("");
    try {
      const { booking } = await api("/api/bookings", { body: { pickup, drop, vehicleType: vehicle } });
      router.push(`/rides/${booking._id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        {activeId && (
          <Link href={`/rides/${activeId}`} className="block rounded-xl bg-blue-600 p-4 text-white shadow">
            <p className="font-semibold">You have a ride in progress</p>
            <p className="text-sm text-blue-100">Tap to track it on the map →</p>
          </Link>
        )}

        <div className="card space-y-4">
          <h1 className="text-xl font-bold">Where to?</h1>
          <PlaceSearch label="Pickup" value={pickup} onChange={setPickup} allowMyLocation />
          <PlaceSearch label="Drop" value={drop} onChange={setDrop} />
          <p className="text-xs text-gray-500">Tip: you can also click on the map to set pickup, then drop.</p>
          {(pickup || drop) && (
            <button
              className="text-xs font-medium text-blue-600"
              onClick={() => {
                setPickup(null);
                setDrop(null);
              }}
            >
              Clear both
            </button>
          )}
        </div>

        {pickup && drop && (
          <div className="card space-y-3">
            {!quote ? (
              <p className="text-sm text-gray-500">Finding the best route…</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  {quote.distanceKm} km · about {quote.durationMin} min
                </p>
                <div className="space-y-2">
                  {VEHICLE_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setVehicle(t)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                        vehicle === t ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-3xl">{VEHICLES[t].icon}</span>
                      <span className="flex-1">
                        <span className="block font-semibold">{VEHICLES[t].label}</span>
                        <span className="text-xs text-gray-500">{VEHICLES[t].seats} seats</span>
                      </span>
                      <span className="font-bold">{rupees(quote.fares[t])}</span>
                    </button>
                  ))}
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button className="btn-primary w-full py-3" disabled={busy || !!activeId} onClick={book}>
                  {busy ? "Booking…" : `Book ${VEHICLES[vehicle].label} · ${rupees(quote.fares[vehicle])}`}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <MapView pickup={pickup} drop={drop} route={quote?.route} onMapClick={onMapClick} className="h-[70vh] w-full rounded-2xl shadow-sm" />
    </div>
  );
}
