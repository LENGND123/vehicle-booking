import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { myDriver } from "@/lib/bookings";

// Driver's phone/browser posts its position every few seconds; riders poll the booking to see it.
export const POST = handler(async (req) => {
  const session = await requireSession("driver");
  const { lat, lng } = await req.json();
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpError(400, "lat and lng are required");
  const driver = await myDriver(session);
  if (!driver) throw new HttpError(400, "Add your vehicle first");
  driver.location = { lat, lng, updatedAt: new Date() };
  await driver.save();
  return ok({ ok: true });
});
