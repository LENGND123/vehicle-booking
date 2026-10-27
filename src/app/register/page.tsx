"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/client";

const HOME: Record<string, string> = { user: "/book", driver: "/driver", admin: "/admin" };

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: params.get("role") === "driver" ? "driver" : "user",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { user } = await api("/api/auth/register", { body: form });
      router.push(HOME[user.role]);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-8 max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
        {[
          { v: "user", label: "🧍 I want rides" },
          { v: "driver", label: "🚗 I want to drive" },
        ].map((o) => (
          <button
            type="button"
            key={o.v}
            onClick={() => setForm({ ...form, role: o.v })}
            className={`rounded-lg py-2 text-sm font-semibold ${form.role === o.v ? "bg-white shadow" : "text-gray-600"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input className="input" placeholder="Full name" value={form.name} onChange={set("name")} required />
      <input className="input" type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
      <input className="input" type="tel" placeholder="Phone number" value={form.phone} onChange={set("phone")} required />
      <input
        className="input"
        type="password"
        placeholder="Password (min 6 characters)"
        value={form.password}
        onChange={set("password")}
        minLength={6}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Creating…" : "Sign up"}
      </button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-600">
          Log in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
