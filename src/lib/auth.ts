import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/models/User";

export const COOKIE_NAME = "vb_token";

export type Session = { id: string; name: string; email: string; role: Role };

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(session: Session) {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

// Works in middleware (edge) and in route handlers.
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.id as string, name: payload.name as string, email: payload.email as string, role: payload.role as Role };
  } catch {
    return null;
  }
}

export function homeFor(role: string) {
  return role === "driver" ? "/driver" : role === "admin" ? "/admin" : "/book";
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
