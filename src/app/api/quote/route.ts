import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { VEHICLE_TYPES, calcFare } from "@/lib/fare";
import { getRoute } from "@/lib/maps";

// Route + price for every vehicle type, shown before booking.
export const POST = handler(async (req) => {
  await requireSession("user");
  const { pickup, drop } = await req.json();
  if (!pickup?.lat || !drop?.lat) throw new HttpError(400, "Pickup and drop are required");
  const r = await getRoute(pickup, drop);
  const fares = Object.fromEntries(VEHICLE_TYPES.map((t) => [t, calcFare(t, r.distanceKm, r.durationMin)]));
  return ok({ ...r, fares });
});
