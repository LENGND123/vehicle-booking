import { handler, ok, requireSession } from "@/lib/api";
import { myDriver } from "@/lib/bookings";
import { haversineKm } from "@/lib/fare";
import { Booking } from "@/models/Booking";

const MAX_PICKUP_KM = 25;

// Open ride requests for this driver's vehicle type, nearest pickup first.
export const GET = handler(async () => {
  const session = await requireSession("driver");
  const driver = await myDriver(session);
  if (!driver || driver.kycStatus !== "approved" || !driver.isOnline) return ok({ requests: [] });

  const open = await Booking.find({ status: "requested", vehicleType: driver.vehicleType })
    .sort({ createdAt: -1 })
    .limit(30)
    .select("-route -otp")
    .lean();

  const here = driver.location?.lat != null ? { lat: driver.location.lat, lng: driver.location.lng! } : null;
  const requests = open
    .map((b) => ({ ...b, pickupKm: here ? +haversineKm(here, b.pickup).toFixed(1) : null }))
    .filter((b) => b.pickupKm == null || b.pickupKm <= MAX_PICKUP_KM)
    .sort((a, b) => (a.pickupKm ?? 0) - (b.pickupKm ?? 0));
  return ok({ requests });
});
