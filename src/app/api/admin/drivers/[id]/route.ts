import { isValidObjectId } from "mongoose";
import { HttpError, handler, ok, requireSession } from "@/lib/api";
import { Driver } from "@/models/Driver";

type Ctx = { params: Promise<{ id: string }> };

async function load(id: string) {
  if (!isValidObjectId(id)) throw new HttpError(404, "Driver not found");
  const d = await Driver.findById(id).populate("user", "name email phone");
  if (!d) throw new HttpError(404, "Driver not found");
  return d;
}

export const GET = handler(async (_req, { params }: Ctx) => {
  await requireSession("admin");
  return ok({ driver: await load((await params).id) });
});

// Approve or reject a driver's KYC after the video call.
export const PATCH = handler(async (req, { params }: Ctx) => {
  await requireSession("admin");
  const { kycStatus, note } = await req.json();
  if (!["approved", "rejected"].includes(kycStatus)) throw new HttpError(400, "kycStatus must be approved or rejected");
  const d = await load((await params).id);
  d.kycStatus = kycStatus;
  d.kycNote = note ?? "";
  d.set("kycWaitingSince", null);
  if (kycStatus === "rejected") d.isOnline = false;
  await d.save();
  return ok({ driver: d });
});
