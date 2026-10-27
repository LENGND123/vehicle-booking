"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import MapView from "@/components/MapView";
import StatusBadge from "@/components/StatusBadge";
import { VEHICLES, VEHICLE_TYPES, type VehicleType } from "@/lib/fare";
import { api, rupees, usePoll } from "@/lib/client";

type LatLng = { lat: number; lng: number };
type Driver = {
  _id: string;
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
  licenseNumber: string;
  kycStatus: "not_started" | "pending" | "approved" | "rejected";
  kycNote: string;
  isOnline: boolean;
  location: { lat: number | null; lng: number | null };
};

export default function DriverPage() {
  const [driver, setDriver] = useState<Driver | null | undefined>(undefined);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const d = await api("/api/driver/me");
    setDriver(d.driver);
    setActiveId(d.activeBookingId);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (driver === undefined) return <p className="text-gray-500">Loading…</p>;
  if (!driver || editing) return <Onboarding initial={driver} onSaved={() => (setEditing(false), load())} />;

  if (driver.kycStatus !== "approved") {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <VehicleCard driver={driver} onEdit={() => setEditing(true)} />
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Video KYC</h2>
            <StatusBadge status={driver.kycStatus} />
          </div>
          {driver.kycStatus === "rejected" && driver.kycNote && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Reason: {driver.kycNote}</p>
          )}
          <p className="text-sm text-gray-600">
            Before you can take rides, a GoRide officer verifies you on a short video call. Keep your driving licence and
            vehicle RC ready, and sit in a well-lit place.
          </p>
          <Link href="/driver/kyc" className="btn-primary w-full py-3">
            {driver.kycStatus === "pending" ? "Rejoin KYC call" : "Start Video KYC"}
          </Link>
          <button className="btn-secondary w-full" onClick={load}>
            Refresh status
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard driver={driver} activeId={activeId} reload={load} onEdit={() => setEditing(true)} />;
}

function VehicleCard({ driver, onEdit }: { driver: Driver; onEdit?: () => void }) {
  return (
    <div className="card flex items-center gap-4">
      <span className="text-4xl">{VEHICLES[driver.vehicleType].icon}</span>
      <div className="flex-1">
        <p className="font-semibold">{driver.vehicleModel}</p>
        <p className="font-mono text-sm text-gray-600">{driver.vehicleNumber}</p>
      </div>
      {onEdit && (
        <button className="text-sm font-medium text-blue-600" onClick={onEdit}>
          Edit
        </button>
      )}
    </div>
  );
}

function Onboarding({ initial, onSaved }: { initial: Driver | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    vehicleType: initial?.vehicleType ?? ("car" as VehicleType),
    vehicleModel: initial?.vehicleModel ?? "",
    vehicleNumber: initial?.vehicleNumber ?? "",
    licenseNumber: initial?.licenseNumber ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (initial?.kycStatus === "approved" && !confirm("Changing vehicle details needs a new video KYC. Continue?")) return;
    setBusy(true);
    try {
      await api("/api/driver/me", { body: form });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Your vehicle</h1>
      <div className="grid grid-cols-4 gap-2">
        {VEHICLE_TYPES.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setForm({ ...form, vehicleType: t })}
            className={`rounded-xl border p-3 text-center ${form.vehicleType === t ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="text-3xl">{VEHICLES[t].icon}</div>
            <div className="text-xs font-semibold">{VEHICLES[t].label}</div>
          </button>
        ))}
      </div>
      <input className="input" placeholder="Vehicle model (e.g. Maruti Swift)" value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} required />
      <input className="input uppercase" placeholder="Vehicle number (e.g. DL01AB1234)" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} required />
      <input className="input uppercase" placeholder="Driving licence number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Save and continue to KYC"}
      </button>
    </form>
  );
}

type Request = {
  _id: string;
  pickup: { address: string };
  drop: { address: string };
  fare: number;
  distanceKm: number;
  pickupKm: number | null;
};

function Dashboard({ driver, activeId, reload, onEdit }: { driver: Driver; activeId: string | null; reload: () => void; onEdit: () => void }) {
  const [online, setOnline] = useState(driver.isOnline);
  const [requests, setRequests] = useState<Request[]>([]);
  const [pos, setPos] = useState<LatLng | null>(
    driver.location?.lat != null ? { lat: driver.location.lat, lng: driver.location.lng! } : null
  );
  const [gpsError, setGpsError] = useState("");
  const lastSent = useRef(0);

  const sendLocation = useCallback((p: LatLng, force = false) => {
    setPos(p);
    if (!force && Date.now() - lastSent.current < 3000) return;
    lastSent.current = Date.now();
    api("/api/driver/location", { body: p }).catch(() => {});
  }, []);

  // Share real GPS while online and not on a ride (the ride screen handles its own tracking).
  useEffect(() => {
    if (!online || activeId || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setGpsError("");
        sendLocation({ lat: coords.latitude, lng: coords.longitude });
      },
      () => setGpsError("Location is off. Click on the map to set where you are."),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [online, activeId, sendLocation]);

  usePoll(
    async () => {
      if (!online || activeId) return setRequests([]);
      const d = await api("/api/driver/requests");
      setRequests(d.requests);
    },
    4000,
    [online, activeId]
  );

  async function toggle() {
    try {
      await api("/api/driver/status", { method: "PATCH", body: { isOnline: !online } });
      setOnline(!online);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function accept(id: string) {
    try {
      await api(`/api/bookings/${id}`, { method: "PATCH", body: { action: "accept" } });
      reload();
    } catch (e) {
      alert((e as Error).message);
      setRequests((r) => r.filter((x) => x._id !== id));
    }
  }

  if (activeId) return <ActiveRide id={activeId} driver={driver} startPos={pos} onDone={reload} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <VehicleCard driver={driver} onEdit={onEdit} />
        <button
          onClick={toggle}
          className={`w-full rounded-2xl p-5 text-left text-white shadow ${online ? "bg-green-600" : "bg-gray-800"}`}
        >
          <p className="text-xl font-bold">{online ? "You're online" : "You're offline"}</p>
          <p className="text-sm opacity-80">{online ? "Tap to go offline" : "Tap to go online and get ride requests"}</p>
        </button>
        {online && gpsError && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{gpsError}</p>}

        {online && (
          <div className="space-y-3">
            <h2 className="font-semibold">Ride requests</h2>
            {requests.length === 0 && <p className="text-sm text-gray-500">Waiting for riders nearby…</p>}
            {requests.map((r) => (
              <div key={r._id} className="card space-y-2">
                <div className="flex justify-between">
                  <span className="text-xl font-bold">{rupees(r.fare)}</span>
                  <span className="text-sm text-gray-500">
                    {r.distanceKm} km trip{r.pickupKm != null && ` · ${r.pickupKm} km away`}
                  </span>
                </div>
                <p className="truncate text-sm">
                  <span className="text-green-600">●</span> {r.pickup.address}
                </p>
                <p className="truncate text-sm">
                  <span className="text-red-600">●</span> {r.drop.address}
                </p>
                <button className="btn-success w-full" onClick={() => accept(r._id)}>
                  Accept ride
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <MapView
        driver={pos}
        driverIcon={VEHICLES[driver.vehicleType].icon}
        onMapClick={online ? (p) => sendLocation(p, true) : undefined}
        className="h-[70vh] w-full rounded-2xl shadow-sm"
      />
    </div>
  );
}

type ActiveBooking = {
  _id: string;
  status: string;
  pickup: LatLng & { address: string };
  drop: LatLng & { address: string };
  route: number[][];
  fare: number;
  distanceKm: number;
  rider: { name: string; phone: string } | null;
};

function ActiveRide({ id, driver, startPos, onDone }: { id: string; driver: Driver; startPos: LatLng | null; onDone: () => void }) {
  const [b, setB] = useState<ActiveBooking | null>(null);
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<"gps" | "simulate">("simulate");
  const [pos, setPos] = useState<LatLng | null>(startPos);
  const posRef = useRef(pos);
  posRef.current = pos;
  const routeIdx = useRef(0);

  usePoll(async () => {
    const d = await api(`/api/bookings/${id}`);
    setB(d.booking);
    if (["completed", "cancelled", "requested"].includes(d.booking.status)) onDone();
  }, 4000, [id]);

  const push = useCallback((p: LatLng) => {
    setPos(p);
    api("/api/driver/location", { body: p }).catch(() => {});
  }, []);

  // Real GPS mode
  useEffect(() => {
    if (mode !== "gps" || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(({ coords }) => push({ lat: coords.latitude, lng: coords.longitude }), undefined, {
      enableHighAccuracy: true,
    });
    return () => navigator.geolocation.clearWatch(watch);
  }, [mode, push]);

  // Demo mode: drive to the pickup, then follow the road route to the drop.
  useEffect(() => {
    if (mode !== "simulate" || !b) return;
    const t = setInterval(() => {
      const cur = posRef.current ?? { lat: b.pickup.lat + 0.012, lng: b.pickup.lng + 0.012 };
      if (b.status === "accepted") {
        const dLat = b.pickup.lat - cur.lat;
        const dLng = b.pickup.lng - cur.lng;
        const close = Math.abs(dLat) < 0.0003 && Math.abs(dLng) < 0.0003;
        push(close ? { lat: b.pickup.lat, lng: b.pickup.lng } : { lat: cur.lat + dLat * 0.2, lng: cur.lng + dLng * 0.2 });
      } else if (b.status === "ongoing" && b.route.length) {
        const step = Math.max(1, Math.ceil(b.route.length / 40));
        routeIdx.current = Math.min(b.route.length - 1, routeIdx.current + step);
        const [lat, lng] = b.route[routeIdx.current];
        push({ lat, lng });
      } else if (!posRef.current) {
        push(cur);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [mode, b, push]);

  async function act(action: string) {
    try {
      const d = await api(`/api/bookings/${id}`, { method: "PATCH", body: { action, otp } });
      setB(d.booking);
      if (action === "start") routeIdx.current = 0;
      if (["complete", "cancel"].includes(action)) onDone();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (!b) return <p className="text-gray-500">Loading ride…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Current ride</h1>
            <StatusBadge status={b.status} />
          </div>
          {b.rider && (
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div>
                <p className="font-semibold">{b.rider.name}</p>
                <p className="text-xs text-gray-500">Rider</p>
              </div>
              {b.rider.phone && (
                <a className="btn-secondary" href={`tel:${b.rider.phone}`}>
                  📞 Call
                </a>
              )}
            </div>
          )}
          <p className="text-sm">
            <span className="text-green-600">●</span> {b.pickup.address}
          </p>
          <p className="text-sm">
            <span className="text-red-600">●</span> {b.drop.address}
          </p>
          <div className="flex justify-between border-t pt-3">
            <span className="text-sm text-gray-600">{b.distanceKm} km</span>
            <span className="text-lg font-bold">Collect {rupees(b.fare)}</span>
          </div>

          {b.status === "accepted" && (
            <button className="btn-primary w-full py-3" onClick={() => act("arrive")}>
              I&apos;ve arrived at pickup
            </button>
          )}
          {b.status === "arrived" && (
            <div className="space-y-2">
              <input
                className="input text-center font-mono text-2xl tracking-[0.4em]"
                maxLength={4}
                inputMode="numeric"
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              <button className="btn-success w-full py-3" disabled={otp.length !== 4} onClick={() => act("start")}>
                Start ride
              </button>
            </div>
          )}
          {b.status === "ongoing" && (
            <button className="btn-success w-full py-3" onClick={() => act("complete")}>
              Complete ride
            </button>
          )}
          {["accepted", "arrived"].includes(b.status) && (
            <button className="w-full text-sm text-red-600" onClick={() => confirm("Drop this ride?") && act("cancel")}>
              Can&apos;t make it — release ride
            </button>
          )}
        </div>

        <div className="card space-y-2">
          <p className="text-sm font-semibold">Location sharing</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 text-sm">
            {(["gps", "simulate"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-lg py-1.5 font-medium ${mode === m ? "bg-white shadow" : "text-gray-600"}`}>
                {m === "gps" ? "📡 Real GPS" : "🧪 Simulate drive"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Simulate moves the vehicle along the route so you can demo live tracking from a laptop. Use Real GPS on a
            phone.
          </p>
        </div>
      </div>
      <MapView
        pickup={b.pickup}
        drop={b.drop}
        route={b.route}
        driver={pos}
        driverIcon={VEHICLES[driver.vehicleType].icon}
        className="h-[75vh] w-full rounded-2xl shadow-sm"
      />
    </div>
  );
}
