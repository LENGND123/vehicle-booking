"use client";

import { useEffect, useRef } from "react";

export type Place = { address: string; lat: number; lng: number };

// fetch JSON and throw the server's error message on failure.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

// Run fn now and then every `ms` while the page is open.
export function usePoll(fn: () => void | Promise<void>, ms: number, deps: unknown[] = []) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!alive) return;
      try {
        await saved.current();
      } catch {
        /* keep polling */
      }
    };
    tick();
    const id = setInterval(tick, ms);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const STATUS_TEXT: Record<string, string> = {
  requested: "Finding a driver",
  accepted: "Driver on the way",
  arrived: "Driver has arrived",
  ongoing: "Trip in progress",
  completed: "Completed",
  cancelled: "Cancelled",
  not_started: "Not started",
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Rejected",
};
