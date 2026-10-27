import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { reverseGeocode, searchPlaces } from "@/lib/maps";

// GET ?q=text  -> matching places
// GET ?lat=..&lng=.. -> address for a point
export const GET = handler(async (req) => {
  await requireSession();
  const params = new URL(req.url).searchParams;
  const q = params.get("q");
  if (q) return ok({ places: await searchPlaces(q) });

  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new HttpError(400, "Give q or lat/lng");
  return ok({ address: await reverseGeocode(lat, lng) });
});
