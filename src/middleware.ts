import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, homeFor, verifySession } from "@/lib/auth";

const PROTECTED: { prefix: string; role: string }[] = [
  { prefix: "/book", role: "user" },
  { prefix: "/rides", role: "user" },
  { prefix: "/driver", role: "driver" },
  { prefix: "/admin", role: "admin" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = PROTECTED.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();

  const session = await verifySession(req.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (session.role !== rule.role) return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/book/:path*", "/rides/:path*", "/driver/:path*", "/admin/:path*"] };
