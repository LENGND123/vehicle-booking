import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { HttpError, handler, ok } from "@/lib/api";
import { COOKIE_NAME, cookieOptions, signSession } from "@/lib/auth";
import { User } from "@/models/User";

export const POST = handler(async (req) => {
  const { email, password } = await req.json();
  const user = await User.findOne({ email: String(email ?? "").toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(String(password ?? ""), user.passwordHash))) {
    throw new HttpError(401, "Wrong email or password");
  }
  const session = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  (await cookies()).set(COOKIE_NAME, await signSession(session), cookieOptions);
  return ok({ user: session });
});
