import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { VEHICLE_TYPES } from "@/lib/fare";

export const BOOKING_STATUSES = [
  "requested", // waiting for a driver
  "accepted", // driver is coming to pickup
  "arrived", // driver is at pickup
  "ongoing", // trip started (after OTP)
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const PlaceSchema = new Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const BookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driver: { type: Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    pickup: { type: PlaceSchema, required: true },
    drop: { type: PlaceSchema, required: true },
    distanceKm: { type: Number, required: true },
    durationMin: { type: Number, required: true },
    fare: { type: Number, required: true },
    // Road route from pickup to drop as [lat, lng] pairs.
    route: { type: [[Number]], default: [] },
    otp: { type: String, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "requested", index: true },
    cancelledBy: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export type BookingDoc = InferSchemaType<typeof BookingSchema>;

export const Booking: Model<BookingDoc> = models.Booking || model("Booking", BookingSchema);
