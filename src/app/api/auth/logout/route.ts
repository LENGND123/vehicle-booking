import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  (await cookies()).delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
