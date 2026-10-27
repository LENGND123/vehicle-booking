"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { VEHICLES, type VehicleType } from "@/lib/fare";
import { api, rupees, usePoll } from "@/lib/client";

type Stats = Record<"riders" | "drivers" | "onlineDrivers" | "kycWaiting" | "activeRides" | "completed" | "revenue", number>;
type DriverRow = {
  _id: string;
  user: { name: string; email: string; phone: string } | null;
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
  licenseNumber: string;
  kycStatus: string;
  kycWaitingSince: string | null;
  isOnline: boolean;
};
type RideRow = {
  _id: string;
  status: string;
  vehicleType: VehicleType;
  fare: number;
  distanceKm: number;
  createdAt: string;
  user: { name: string } | null;
  driver: { vehicleNumber: string; user: { name: string } | null } | null;
  pickup: { address: string };
  drop: { address: string };
};

export default function AdminPage() {
  const [tab, setTab] = useState<"drivers" | "rides">("drivers");
  const [stats, setStats] = useState<Stats | null>(null);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [rides, setRides] = useState<RideRow[]>([]);

  usePoll(async () => {
    const [s, d, r] = await Promise.all([api("/api/admin/stats"), api("/api/admin/drivers"), api("/api/admin/bookings")]);
    setStats(s);
    setDrivers(d.drivers);
    setRides(r.bookings);
  }, 5000);

  const waiting = drivers.filter((d) => d.kycStatus === "pending" && d.kycWaitingSince);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Riders", stats.riders],
            ["Drivers", `${stats.drivers} (${stats.onlineDrivers} online)`],
            ["Active rides", stats.activeRides],
            ["Revenue", rupees(stats.revenue)],
          ].map(([label, value]) => (
            <div key={label} className="card">
              <p className="text-xs uppercase text-gray-500">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {waiting.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">🎥 Drivers waiting in the KYC call</p>
          {waiting.map((d) => (
            <div key={d._id} className="flex items-center justify-between rounded-xl bg-white p-3">
              <span>
                {d.user?.name} · {VEHICLES[d.vehicleType].label} · <span className="font-mono">{d.vehicleNumber}</span>
              </span>
              <Link href={`/admin/kyc/${d._id}`} className="btn-primary">
                Join call
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b">
        {(["drivers", "rides"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "drivers" ? (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3">Driver</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Licence</th>
                <th className="p-3">KYC</th>
                <th className="p-3">Online</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No drivers yet.
                  </td>
                </tr>
              )}
              {drivers.map((d) => (
                <tr key={d._id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{d.user?.name}</p>
                    <p className="text-xs text-gray-500">{d.user?.email}</p>
                  </td>
                  <td className="p-3">
                    {VEHICLES[d.vehicleType].icon} {d.vehicleModel}
                    <p className="font-mono text-xs">{d.vehicleNumber}</p>
                  </td>
                  <td className="p-3 font-mono text-xs">{d.licenseNumber}</td>
                  <td className="p-3">
                    <StatusBadge status={d.kycStatus} />
                  </td>
                  <td className="p-3">{d.isOnline ? "🟢" : "⚪"}</td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/kyc/${d._id}`} className="btn-secondary">
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Rider</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Trip</th>
                <th className="p-3">Fare</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rides.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No rides yet.
                  </td>
                </tr>
              )}
              {rides.map((r) => (
                <tr key={r._id} className="border-t align-top">
                  <td className="p-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">{r.user?.name}</td>
                  <td className="p-3">
                    {r.driver ? (
                      <>
                        {r.driver.user?.name}
                        <p className="font-mono text-xs">{r.driver.vehicleNumber}</p>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs p-3">
                    <p className="truncate">{r.pickup.address}</p>
                    <p className="truncate text-gray-500">→ {r.drop.address}</p>
                    <p className="text-xs text-gray-400">
                      {VEHICLES[r.vehicleType].label} · {r.distanceKm} km
                    </p>
                  </td>
                  <td className="p-3 font-semibold">{rupees(r.fare)}</td>
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
