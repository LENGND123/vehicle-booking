import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { myDriver } from "@/lib/bookings";

// Driver enters/leaves the KYC video room. Admins see who is waiting.
export const POST = handler(async (req) => {
  const session = await requireSession("driver");
  const { action } = await req.json();
  const driver = await myDriver(session);
  if (!driver) throw new HttpError(400, "Add your vehicle first");
  if (driver.kycStatus === "approved") throw new HttpError(400, "Your KYC is already approved");

  if (action === "join") {
    driver.kycStatus = "pending";
    driver.kycWaitingSince = new Date();
  } else if (action === "leave") {
    driver.set("kycWaitingSince", null);
  } else throw new HttpError(400, "Unknown action");
  await driver.save();
  return ok({ driver });
});
