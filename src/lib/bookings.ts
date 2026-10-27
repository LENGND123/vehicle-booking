import type { Session } from "@/lib/auth";
import { Booking, type BookingStatus } from "@/models/Booking";
import { Driver } from "@/models/Driver";
import { User } from "@/models/User";

export const ACTIVE_STATUSES: BookingStatus[] = ["requested", "accepted", "arrived", "ongoing"];

type AnyBooking = InstanceType<typeof Booking>;

// Shape a booking for the client: add rider/driver details, hide the OTP from everyone but the rider.
export async function bookingView(b: AnyBooking, session: Session) {
  const [rider, driver] = await Promise.all([
    User.findById(b.user).select("name phone").lean(),
    b.driver ? Driver.findById(b.driver).populate<{ user: { name: string; phone: string } }>("user", "name phone").lean() : null,
  ]);
  const obj = b.toObject();
  return {
    ...obj,
    _id: String(b._id),
    otp: session.role === "user" ? obj.otp : undefined,
    rider: rider ? { name: rider.name, phone: rider.phone } : null,
    driverInfo: driver
      ? {
          id: String(driver._id),
          name: driver.user?.name,
          phone: driver.user?.phone,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel,
          vehicleNumber: driver.vehicleNumber,
          location: driver.location,
        }
      : null,
  };
}

export async function myDriver(session: Session) {
  return Driver.findOne({ user: session.id });
}
