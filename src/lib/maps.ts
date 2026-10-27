import { haversineKm } from "@/lib/fare";

export type LatLng = { lat: number; lng: number };

// Free OpenStreetMap services. Both ask for a descriptive User-Agent and light use.
const UA = "VehicleBookingDemo/1.0 (learning project)";

export async function getRoute(a: LatLng, b: LatLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const r = data.routes?.[0];
    if (!r) throw new Error("no route");
    return {
      distanceKm: +(r.distance / 1000).toFixed(2),
      durationMin: Math.max(1, Math.round(r.duration / 60)),
      route: (r.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng]),
    };
  } catch {
    // Routing service unavailable: fall back to a straight line estimate.
    const km = haversineKm(a, b) * 1.3;
    return {
      distanceKm: +km.toFixed(2),
      durationMin: Math.max(1, Math.round((km / 25) * 60)),
      route: [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
    };
  }
}

export async function searchPlaces(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((p) => ({ address: p.display_name, lat: +p.lat, lng: +p.lon }));
}

export async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return (data.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
