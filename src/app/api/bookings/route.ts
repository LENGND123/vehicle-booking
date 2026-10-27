import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { ACTIVE_STATUSES, bookingView, myDriver } from "@/lib/bookings";
import { VEHICLE_TYPES, calcFare, type VehicleType } from "@/lib/fare";
import { getRoute } from "@/lib/maps";
import { Booking } from "@/models/Booking";

// List my bookings (rider: rides I booked, driver: rides I drove, admin: everything).
export const GET = handler(async () => {
  const session = await requireSession();
  let filter = {};
  if (session.role === "user") filter = { user: session.id };
  if (session.role === "driver") {
    const driver = await myDriver(session);
    filter = { driver: driver?._id ?? null };
  }
  const list = await Booking.find(filter).sort({ createdAt: -1 }).limit(50).select("-route");
  return ok({ bookings: list.map((b) => ({ ...b.toObject(), otp: undefined })) });
});

// Rider books a ride. Price is worked out here, never trusted from the browser.
export const POST = handler(async (req) => {
  const session = await requireSession("user");
  const { pickup, drop, vehicleType } = await req.json();
  if (!VEHICLE_TYPES.includes(vehicleType)) throw new HttpError(400, "Choose a vehicle type");
  for (const p of [pickup, drop]) {
    if (!p?.address || !Number.isFinite(p?.lat) || !Number.isFinite(p?.lng)) throw new HttpError(400, "Pickup and drop are required");
  }

  const active = await Booking.findOne({ user: session.id, status: { $in: ACTIVE_STATUSES } });
  if (active) throw new HttpError(409, `You already have an active ride (${active._id})`);

  const r = await getRoute(pickup, drop);
  const booking = await Booking.create({
    user: session.id,
    vehicleType,
    pickup,
    drop,
    distanceKm: r.distanceKm,
    durationMin: r.durationMin,
    route: r.route,
    fare: calcFare(vehicleType as VehicleType, r.distanceKm, r.durationMin),
    otp: String(Math.floor(1000 + Math.random() * 9000)),
  });
  return ok({ booking: await bookingView(booking, session) }, 201);
});
