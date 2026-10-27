"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import KycCall from "@/components/KycCall";
import StatusBadge from "@/components/StatusBadge";
import { VEHICLES, type VehicleType } from "@/lib/fare";
import { api } from "@/lib/client";

type Driver = {
  _id: string;
  user: { name: string; email: string; phone: string };
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
  licenseNumber: string;
  kycStatus: string;
  kycNote: string;
};

const CHECKS = [
  "Face matches the driving licence photo",
  "Licence number matches the one entered",
  "Vehicle RC shows the same vehicle number",
  "Licence is valid (not expired)",
];

export default function AdminKycPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [d, setD] = useState<Driver | null>(null);
  const [inCall, setInCall] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => false));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/admin/drivers/${id}`).then((r) => setD(r.driver));
  }, [id]);

  async function decide(kycStatus: "approved" | "rejected") {
    if (kycStatus === "rejected" && !note.trim()) return alert("Write a reason so the driver knows what to fix.");
    setBusy(true);
    try {
      await api(`/api/admin/drivers/${id}`, { method: "PATCH", body: { kycStatus, note } });
      router.push("/admin");
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  }

  if (!d) return <p className="text-gray-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-blue-600">
        ← Back to admin
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          {inCall ? (
            <KycCall driverId={id} onLeave={() => setInCall(false)} />
          ) : (
            <div className="card flex h-[560px] flex-col items-center justify-center gap-3 text-center">
              <p className="text-5xl">🎥</p>
              <p className="text-gray-600">Join the video call with {d.user.name} to verify their documents.</p>
              <button className="btn-primary px-6 py-3" onClick={() => setInCall(true)}>
                Join KYC call
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">{d.user.name}</h1>
              <StatusBadge status={d.kycStatus} />
            </div>
            <p className="text-sm text-gray-600">
              {d.user.email}
              <br />
              {d.user.phone}
            </p>
            <dl className="grid grid-cols-2 gap-y-1 border-t pt-2 text-sm">
              <dt className="text-gray-500">Vehicle</dt>
              <dd>
                {VEHICLES[d.vehicleType].icon} {d.vehicleModel}
              </dd>
              <dt className="text-gray-500">Number</dt>
              <dd className="font-mono">{d.vehicleNumber}</dd>
              <dt className="text-gray-500">Licence</dt>
              <dd className="font-mono">{d.licenseNumber}</dd>
            </dl>
          </div>

          <div className="card space-y-3">
            <p className="font-semibold">Checklist</p>
            {CHECKS.map((c, i) => (
              <label key={c} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={checked[i]}
                  onChange={() => setChecked(checked.map((v, j) => (j === i ? !v : v)))}
                />
                {c}
              </label>
            ))}
            <textarea className="input" rows={2} placeholder="Note (required if rejecting)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-danger" disabled={busy} onClick={() => decide("rejected")}>
                Reject
              </button>
              <button className="btn-success" disabled={busy || !checked.every(Boolean)} onClick={() => decide("approved")}>
                Approve
              </button>
            </div>
            {!checked.every(Boolean) && <p className="text-xs text-gray-500">Tick every check to approve.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
