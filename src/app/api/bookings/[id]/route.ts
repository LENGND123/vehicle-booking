import { isValidObjectId } from "mongoose";
import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { ACTIVE_STATUSES, bookingView, myDriver } from "@/lib/bookings";
import { Booking } from "@/models/Booking";

type Ctx = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!isValidObjectId(id)) throw new HttpError(404, "Ride not found");
  const b = await Booking.findById(id);
  if (!b) throw new HttpError(404, "Ride not found");
  return b;
}

export const GET = handler(async (_req, { params }: Ctx) => {
  const session = await requireSession();
  const b = await load((await params).id);

  if (session.role === "user" && String(b.user) !== session.id) throw new HttpError(403, "Not your ride");
  if (session.role === "driver") {
    const d = await myDriver(session);
    // Drivers can see open requests (to decide) and rides assigned to them.
    if (b.status !== "requested" && String(b.driver) !== String(d?._id)) throw new HttpError(403, "Not your ride");
  }
  return ok({ booking: await bookingView(b, session) });
});

export const PATCH = handler(async (req, { params }: Ctx) => {
  const session = await requireSession("user", "driver");
  const { id } = await params;
  const { action, otp, rating } = await req.json();
  let b = await load(id);

  if (session.role === "user") {
    if (String(b.user) !== session.id) throw new HttpError(403, "Not your ride");
    if (action === "cancel") {
      if (!["requested", "accepted", "arrived"].includes(b.status)) throw new HttpError(400, "This ride can't be cancelled now");
      b.status = "cancelled";
      b.cancelledBy = "user";
    } else if (action === "rate") {
      if (b.status !== "completed") throw new HttpError(400, "You can rate after the ride");
      const n = Number(rating);
      if (!(n >= 1 && n <= 5)) throw new HttpError(400, "Rating must be 1 to 5");
      b.rating = n;
    } else throw new HttpError(400, "Unknown action");
    await b.save();
    return ok({ booking: await bookingView(b, session) });
  }

  // Driver actions
  const driver = await myDriver(session);
  if (!driver || driver.kycStatus !== "approved") throw new HttpError(403, "Your KYC must be approved first");

  if (action === "accept") {
    if (!driver.isOnline) throw new HttpError(400, "Go online to accept rides");
    if (b.vehicleType !== driver.vehicleType) throw new HttpError(400, "This ride needs a different vehicle");
    const busy = await Booking.exists({ driver: driver._id, status: { $in: ACTIVE_STATUSES } });
    if (busy) throw new HttpError(409, "Finish your current ride first");
    // Atomic so two drivers can't take the same ride.
    const taken = await Booking.findOneAndUpdate(
      { _id: b._id, status: "requested" },
      { status: "accepted", driver: driver._id, acceptedAt: new Date() },
      { new: true }
    );
    if (!taken) throw new HttpError(409, "Another driver already took this ride");
    b = taken;
    return ok({ booking: await bookingView(b, session) });
  }

  if (String(b.driver) !== String(driver._id)) throw new HttpError(403, "Not your ride");

  if (action === "arrive" && b.status === "accepted") {
    b.status = "arrived";
  } else if (action === "start" && b.status === "arrived") {
    if (String(otp ?? "").trim() !== b.otp) throw new HttpError(400, "Wrong OTP. Ask the rider for the 4-digit code.");
    b.status = "ongoing";
    b.startedAt = new Date();
  } else if (action === "complete" && b.status === "ongoing") {
    b.status = "completed";
    b.completedAt = new Date();
  } else if (action === "cancel" && ["accepted", "arrived"].includes(b.status)) {
    // Driver drops the ride: put it back so another driver can take it.
    b.status = "requested";
    b.set("driver", null);
  } else {
    throw new HttpError(400, `Can't ${action} a ride that is ${b.status}`);
  }
  await b.save();
  return ok({ booking: await bookingView(b, session) });
});
