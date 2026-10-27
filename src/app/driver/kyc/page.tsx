"use client";

import Link from "next/link";
import { useState } from "react";
import KycCall from "@/components/KycCall";
import StatusBadge from "@/components/StatusBadge";
import { api, usePoll } from "@/lib/client";

export default function DriverKycPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [hasVehicle, setHasVehicle] = useState(true);
  const [started, setStarted] = useState(false);

  // Watch for the officer's decision while the call is going on.
  usePoll(async () => {
    const d = await api("/api/driver/me");
    setHasVehicle(!!d.driver);
    setStatus(d.driver?.kycStatus ?? null);
  }, 4000);

  if (!hasVehicle) {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <p>Add your vehicle details first.</p>
        <Link href="/driver" className="btn-primary mt-3">
          Add vehicle
        </Link>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="card mx-auto max-w-xl space-y-3 text-center">
        <p className="text-5xl">✅</p>
        <h1 className="text-2xl font-bold">You&apos;re verified!</h1>
        <p className="text-gray-600">Your video KYC is approved. Go online to start getting rides.</p>
        <Link href="/driver" className="btn-primary">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Video KYC</h1>
        {status && <StatusBadge status={status} />}
      </div>

      {!started ? (
        <div className="card max-w-xl space-y-3">
          <p className="font-semibold">Before you join:</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
            <li>Keep your driving licence and vehicle RC in hand.</li>
            <li>Sit in a bright, quiet place and allow camera + microphone.</li>
            <li>A GoRide officer will join, check your documents and approve you.</li>
          </ul>
          <button
            className="btn-primary w-full py-3"
            onClick={async () => {
              await api("/api/driver/kyc", { body: { action: "join" } }).catch((e) => alert(e.message));
              setStarted(true);
            }}
          >
            Join the KYC call
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Waiting for an officer… keep this page open. Your status updates here automatically.
          </p>
          <KycCall onLeave={() => api("/api/driver/kyc", { body: { action: "leave" } }).finally(() => setStarted(false))} />
        </>
      )}
    </div>
  );
}
