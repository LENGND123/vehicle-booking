"use client";

import Link from "next/link";
import { use, useState } from "react";
import MapView from "@/components/MapView";
import StatusBadge from "@/components/StatusBadge";
import { VEHICLES, haversineKm, type VehicleType } from "@/lib/fare";
import { api, rupees, usePoll } from "@/lib/client";

type Booking = {
  _id: string;
  status: string;
  vehicleType: VehicleType;
  pickup: { address: string; lat: number; lng: number };
  drop: { address: string; lat: number; lng: number };
  route: number[][];
  fare: number;
  distanceKm: number;
  durationMin: number;
  otp?: string;
  rating: number | null;
  driverInfo: {
    name: string;
    phone: string;
    vehicleModel: string;
    vehicleNumber: string;
    location: { lat: number | null; lng: number | null; updatedAt: string | null };
  } | null;
};

const LIVE = ["requested", "accepted", "arrived", "ongoing"];

export default function TrackRidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [b, setB] = useState<Booking | null>(null);
  const [error, setError] = useState("");

  // Poll every 3s while the ride is live — this is what moves the driver on the map.
  usePoll(
    async () => {
      if (b && !LIVE.includes(b.status)) return;
      try {
        const d = await api(`/api/bookings/${id}`);
        setB(d.booking);
      } catch (e) {
        setError((e as Error).message);
      }
    },
    3000,
    [id, b?.status]
  );

  async function act(body: object) {
    try {
      const d = await api(`/api/bookings/${id}`, { method: "PATCH", body });
      setB(d.booking);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (error && !b) return <p className="text-red-600">{error}</p>;
  if (!b) return <p className="text-gray-500">Loading ride…</p>;

  const loc = b.driverInfo?.location;
  const driverPos = loc?.lat != null && loc?.lng != null ? { lat: loc.lat, lng: loc.lng } : null;
  const showDriver = driverPos && ["accepted", "arrived", "ongoing"].includes(b.status);
  const target = b.status === "ongoing" ? b.drop : b.pickup;
  const etaMin = showDriver ? Math.max(1, Math.round((haversineKm(driverPos!, target) * 1.3 * 60) / 25)) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">
              {VEHICLES[b.vehicleType].icon} {VEHICLES[b.vehicleType].label} ride
            </h1>
            <StatusBadge status={b.status} />
          </div>

          {b.status === "requested" && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <span className="h-3 w-3 animate-ping rounded-full bg-amber-500" />
              Looking for a nearby {VEHICLES[b.vehicleType].label.toLowerCase()} driver…
            </div>
          )}

          {etaMin != null && (
            <p className="text-sm font-medium text-blue-700">
              {b.status === "ongoing" ? `About ${etaMin} min to your drop` : b.status === "arrived" ? "Your driver is at the pickup" : `Driver arriving in ~${etaMin} min`}
            </p>
          )}

          {b.otp && ["requested", "accepted", "arrived"].includes(b.status) && (
            <div className="rounded-xl bg-gray-900 p-3 text-center text-white">
              <p className="text-xs uppercase tracking-wide text-gray-400">Share this OTP to start the ride</p>
              <p className="font-mono text-3xl font-bold tracking-[0.4em]">{b.otp}</p>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-green-600">●</span> {b.pickup.address}
            </p>
            <p>
              <span className="text-red-600">●</span> {b.drop.address}
            </p>
          </div>
          <div className="flex justify-between border-t pt-3 text-sm">
            <span className="text-gray-600">
              {b.distanceKm} km · {b.durationMin} min
            </span>
            <span className="text-lg font-bold">{rupees(b.fare)}</span>
          </div>
        </div>

        {b.driverInfo && (
          <div className="card">
            <p className="text-xs font-semibold uppercase text-gray-500">Your driver</p>
            <p className="mt-1 text-lg font-semibold">{b.driverInfo.name}</p>
            <p className="text-sm text-gray-600">
              {b.driverInfo.vehicleModel} · <span className="font-mono font-semibold">{b.driverInfo.vehicleNumber}</span>
            </p>
            <p className="mt-1 text-xs text-green-700">✔ Video KYC verified</p>
            {b.driverInfo.phone && LIVE.includes(b.status) && (
              <a href={`tel:${b.driverInfo.phone}`} className="btn-secondary mt-3 w-full">
                📞 Call {b.driverInfo.phone}
              </a>
            )}
          </div>
        )}

        {["requested", "accepted", "arrived"].includes(b.status) && (
          <button className="btn-danger w-full" onClick={() => confirm("Cancel this ride?") && act({ action: "cancel" })}>
            Cancel ride
          </button>
        )}

        {b.status === "completed" && (
          <div className="card text-center">
            <p className="font-semibold">You have arrived 🎉</p>
            <p className="mt-1 text-sm text-gray-600">Pay {rupees(b.fare)} to your driver.</p>
            <p className="mt-3 text-sm">{b.rating ? "Thanks for rating!" : "Rate your driver"}</p>
            <div className="mt-1 text-3xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} disabled={!!b.rating} onClick={() => act({ action: "rate", rating: n })}>
                  {n <= (b.rating ?? 0) ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>
        )}

        {!LIVE.includes(b.status) && (
          <Link href="/book" className="btn-primary w-full">
            Book another ride
          </Link>
        )}
      </div>

      <MapView
        pickup={b.pickup}
        drop={b.drop}
        route={b.route}
        driver={showDriver ? driverPos : null}
        driverIcon={VEHICLES[b.vehicleType].icon}
        className="h-[75vh] w-full rounded-2xl shadow-sm"
      />
    </div>
  );
}
