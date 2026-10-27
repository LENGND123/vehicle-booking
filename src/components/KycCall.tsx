"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";

type Props = {
  driverId?: string; // admin passes the driver; drivers join their own room
  onJoin?: () => void;
  onLeave?: () => void;
};

// One-to-one video call in the driver's KYC room, using ZEGOCLOUD's prebuilt UI.
export default function KycCall({ driverId, onJoin, onLeave }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const handlers = useRef({ onJoin, onLeave });
  handlers.current = { onJoin, onLeave };

  useEffect(() => {
    let zp: { destroy: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const cfg = await api(`/api/zego/token${driverId ? `?driverId=${driverId}` : ""}`);
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        if (cancelled || !box.current) return;
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(cfg.appID, cfg.token, cfg.roomID, cfg.userID, cfg.userName);
        const instance = ZegoUIKitPrebuilt.create(kitToken);
        zp = instance;
        instance.joinRoom({
          container: box.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          showPreJoinView: true,
          showScreenSharingButton: false,
          showRoomTimer: true,
          maxUsers: 2,
          onJoinRoom: () => handlers.current.onJoin?.(),
          onLeaveRoom: () => handlers.current.onLeave?.(),
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      zp?.destroy();
    };
  }, [driverId]);

  if (error) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">Video call unavailable</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-xl bg-gray-900">
      {loading && <p className="absolute inset-0 flex items-center justify-center text-white">Connecting…</p>}
      <div ref={box} className="h-full w-full" />
    </div>
  );
}
