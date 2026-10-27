import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { VEHICLE_TYPES } from "@/lib/fare";

export const KYC_STATUSES = ["not_started", "pending", "approved", "rejected"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

const DriverSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    vehicleModel: { type: String, required: true },
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
    licenseNumber: { type: String, required: true, uppercase: true, trim: true },
    kycStatus: { type: String, enum: KYC_STATUSES, default: "not_started" },
    kycNote: { type: String, default: "" },
    // Set when the driver is waiting in the KYC video room.
    kycWaitingSince: { type: Date, default: null },
    isOnline: { type: Boolean, default: false },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

export type DriverDoc = InferSchemaType<typeof DriverSchema>;

export const Driver: Model<DriverDoc> = models.Driver || model("Driver", DriverSchema);
