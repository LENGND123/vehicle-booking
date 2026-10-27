import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { HttpError, handler, ok } from "@/lib/api";
import { COOKIE_NAME, cookieOptions, signSession } from "@/lib/auth";
import { User } from "@/models/User";

export const POST = handler(async (req) => {
  const { name, email, phone, password, role } = await req.json();
  if (!name?.trim() || !email?.trim() || !password) throw new HttpError(400, "Name, email and password are required");
  if (String(password).length < 6) throw new HttpError(400, "Password must be at least 6 characters");

  const normalized = String(email).toLowerCase().trim();
  if (await User.exists({ email: normalized })) throw new HttpError(409, "An account with this email already exists");

  const isAdmin = !!process.env.ADMIN_EMAIL && normalized === process.env.ADMIN_EMAIL.toLowerCase();
  const user = await User.create({
    name,
    email: normalized,
    phone: phone ?? "",
    passwordHash: await bcrypt.hash(password, 10),
    role: isAdmin ? "admin" : role === "driver" ? "driver" : "user",
  });

  const session = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  (await cookies()).set(COOKIE_NAME, await signSession(session), cookieOptions);
  return ok({ user: session }, 201);
});
