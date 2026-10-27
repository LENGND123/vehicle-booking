import { handler, ok, requireSession } from "@/lib/api";
import { Driver } from "@/models/Driver";

export const GET = handler(async () => {
  await requireSession("admin");
  const drivers = await Driver.find()
    .populate("user", "name email phone")
    .sort({ kycWaitingSince: -1, createdAt: -1 })
    .lean();
  return ok({ drivers });
});
