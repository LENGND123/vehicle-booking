import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { ACTIVE_STATUSES, myDriver } from "@/lib/bookings";
import { VEHICLE_TYPES } from "@/lib/fare";
import { Booking } from "@/models/Booking";
import { Driver } from "@/models/Driver";

// Driver profile + the ride they are currently on (if any).
export const GET = handler(async () => {
  const session = await requireSession("driver");
  const driver = await myDriver(session);
  const active = driver
    ? await Booking.findOne({ driver: driver._id, status: { $in: ACTIVE_STATUSES } }).select("_id")
    : null;
  return ok({ driver, activeBookingId: active ? String(active._id) : null });
});

// Onboarding: save vehicle + licence details. Editing resets KYC.
export const POST = handler(async (req) => {
  const session = await requireSession("driver");
  const { vehicleType, vehicleModel, vehicleNumber, licenseNumber } = await req.json();
  if (!VEHICLE_TYPES.includes(vehicleType)) throw new HttpError(400, "Choose a vehicle type");
  if (!vehicleModel?.trim() || !vehicleNumber?.trim() || !licenseNumber?.trim()) {
    throw new HttpError(400, "Fill in all vehicle and licence details");
  }
  const driver = await Driver.findOneAndUpdate(
    { user: session.id },
    {
      vehicleType,
      vehicleModel,
      vehicleNumber,
      licenseNumber,
      kycStatus: "not_started",
      kycNote: "",
      isOnline: false,
    },
    { upsert: true, new: true, runValidators: true }
  );
  return ok({ driver });
});
