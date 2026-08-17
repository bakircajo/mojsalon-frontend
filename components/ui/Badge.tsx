import clsx from "clsx";
import { STATUS_LABELS } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-pine-light text-pine",
  CANCELLED: "bg-stub-light text-stub-dark",
  COMPLETED: "bg-slate-200 text-slate-700",
};

export default function Badge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
        STYLES[status] || "bg-slate-100 text-slate-700"
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
