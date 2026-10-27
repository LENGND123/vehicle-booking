"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { VEHICLES, type VehicleType } from "@/lib/fare";
import { api, rupees } from "@/lib/client";

type Row = {
  _id: string;
  status: string;
  vehicleType: VehicleType;
  pickup: { address: string };
  drop: { address: string };
  fare: number;
  distanceKm: number;
  createdAt: string;
};

export default function RidesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    api("/api/bookings").then((d) => setRows(d.bookings));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My rides</h1>
      {!rows ? (
        <p className="text-gray-500">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-600">No rides yet.</p>
          <Link href="/book" className="btn-primary mt-3">
            Book your first ride
          </Link>
        </div>
      ) : (
        rows.map((r) => (
          <Link key={r._id} href={`/rides/${r._id}`} className="card flex items-center gap-4 hover:border-blue-300">
            <span className="text-3xl">{VEHICLES[r.vehicleType].icon}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.pickup.address}</p>
              <p className="truncate text-sm text-gray-500">→ {r.drop.address}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(r.createdAt).toLocaleString()} · {r.distanceKm} km
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{rupees(r.fare)}</p>
              <StatusBadge status={r.status} />
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
