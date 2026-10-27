import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

export const ROLES = ["user", "driver", "admin"] as const;
export type Role = (typeof ROLES)[number];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "user" },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDoc> = models.User || model("User", UserSchema);
