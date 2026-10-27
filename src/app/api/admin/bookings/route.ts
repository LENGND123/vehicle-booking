import { handler, ok, requireSession } from "@/lib/api";
import { Booking } from "@/models/Booking";

export const GET = handler(async () => {
  await requireSession("admin");
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .select("-route -otp")
    .populate("user", "name")
    .populate({ path: "driver", select: "vehicleNumber user", populate: { path: "user", select: "name" } })
    .lean();
  return ok({ bookings });
});
