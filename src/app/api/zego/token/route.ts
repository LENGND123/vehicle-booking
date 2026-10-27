import { isValidObjectId } from "mongoose";
import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { myDriver } from "@/lib/bookings";
import { generateToken04, kycRoomId, zegoConfig } from "@/lib/zego";
import { Driver } from "@/models/Driver";

// GET ?driverId=...  -> token for that driver's KYC room.
// Drivers may only join their own room; admins may join any.
export const GET = handler(async (req) => {
  const session = await requireSession("driver", "admin");
  const cfg = zegoConfig();
  if (!cfg) throw new HttpError(503, "Video KYC is not set up. Add ZEGO_APP_ID and ZEGO_SERVER_SECRET to .env.local");

  let driverId = new URL(req.url).searchParams.get("driverId") ?? "";
  if (session.role === "driver") {
    const d = await myDriver(session);
    if (!d) throw new HttpError(400, "Add your vehicle first");
    driverId = String(d._id);
  } else if (!isValidObjectId(driverId) || !(await Driver.exists({ _id: driverId }))) {
    throw new HttpError(404, "Driver not found");
  }

  const userID = `${session.role}_${session.id}`;
  return ok({
    appID: cfg.appId,
    token: generateToken04(cfg.appId, userID, cfg.secret, 60 * 60),
    roomID: kycRoomId(driverId),
    userID,
    userName: session.role === "admin" ? `${session.name} (KYC officer)` : session.name,
  });
});
