"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type User = { name: string; role: "user" | "driver" | "admin" } | null;

const LINKS = {
  user: [
    { href: "/book", label: "Book a ride" },
    { href: "/rides", label: "My rides" },
  ],
  driver: [
    { href: "/driver", label: "Dashboard" },
    { href: "/driver/kyc", label: "Video KYC" },
  ],
  admin: [{ href: "/admin", label: "Admin" }],
};

export default function Navbar() {
  const [user, setUser] = useState<User>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    api<{ user: User }>("/api/auth/me").then((d) => setUser(d.user)).catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[1100] border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Go<span className="text-blue-600">Ride</span>
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-4 text-sm">
          {user &&
            LINKS[user.role].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? "font-semibold text-blue-600" : "text-gray-600 hover:text-gray-900"}
              >
                {l.label}
              </Link>
            ))}
        </div>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-600 sm:inline">
              {user.name} · <span className="capitalize">{user.role === "user" ? "rider" : user.role}</span>
            </span>
            <button onClick={logout} className="btn-secondary">
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Link href="/login" className="btn-secondary">
              Log in
            </Link>
            <Link href="/register" className="btn-primary">
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
