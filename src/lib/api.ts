import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, type Session } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { Role } from "@/models/User";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(COOKIE_NAME)?.value);
}

export async function requireSession(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Please log in");
  if (roles.length && !roles.includes(session.role)) throw new HttpError(403, "Not allowed");
  return session;
}

// Wraps a route handler: connects the DB and turns thrown errors into JSON responses.
export function handler<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      await connectDB();
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
