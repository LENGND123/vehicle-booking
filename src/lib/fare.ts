export const VEHICLE_TYPES = ["bike", "auto", "car", "suv"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLES: Record<
  VehicleType,
  { label: string; icon: string; seats: number; base: number; perKm: number; perMin: number }
> = {
  bike: { label: "Bike", icon: "🏍️", seats: 1, base: 20, perKm: 7, perMin: 0.5 },
  auto: { label: "Auto", icon: "🛺", seats: 3, base: 30, perKm: 11, perMin: 1 },
  car: { label: "Car", icon: "🚗", seats: 4, base: 50, perKm: 15, perMin: 1.5 },
  suv: { label: "SUV", icon: "🚙", seats: 6, base: 80, perKm: 20, perMin: 2 },
};

export function calcFare(type: VehicleType, distanceKm: number, durationMin: number) {
  const v = VEHICLES[type];
  return Math.round(v.base + v.perKm * distanceKm + v.perMin * durationMin);
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
