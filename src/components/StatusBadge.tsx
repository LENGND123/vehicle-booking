import { STATUS_TEXT } from "@/lib/client";

const COLORS: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  arrived: "bg-indigo-100 text-indigo-800",
  ongoing: "bg-violet-100 text-violet-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-200 text-gray-700",
  not_started: "bg-gray-200 text-gray-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] ?? "bg-gray-100"}`}>
      {STATUS_TEXT[status] ?? status}
    </span>
  );
}
