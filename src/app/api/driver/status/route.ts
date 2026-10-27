import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { myDriver } from "@/lib/bookings";

export const PATCH = handler(async (req) => {
  const session = await requireSession("driver");
  const { isOnline } = await req.json();
  const driver = await myDriver(session);
  if (!driver) throw new HttpError(400, "Add your vehicle first");
  if (isOnline && driver.kycStatus !== "approved") throw new HttpError(403, "Your KYC must be approved before going online");
  driver.isOnline = !!isOnline;
  await driver.save();
  return ok({ driver });
});
