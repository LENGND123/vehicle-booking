import { handler, ok, requireSession } from "@/lib/api";
import { ACTIVE_STATUSES } from "@/lib/bookings";
import { Booking } from "@/models/Booking";
import { Driver } from "@/models/Driver";
import { User } from "@/models/User";

export const GET = handler(async () => {
  await requireSession("admin");
  const [riders, drivers, onlineDrivers, kycWaiting, activeRides, completed, revenue] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Driver.countDocuments(),
    Driver.countDocuments({ isOnline: true }),
    Driver.countDocuments({ kycStatus: "pending" }),
    Booking.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
    Booking.countDocuments({ status: "completed" }),
    Booking.aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$fare" } } }]),
  ]);
  return ok({ riders, drivers, onlineDrivers, kycWaiting, activeRides, completed, revenue: revenue[0]?.total ?? 0 });
});
