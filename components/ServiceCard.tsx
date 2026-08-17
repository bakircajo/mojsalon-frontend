import Link from "next/link";
import type { Service } from "@/lib/types";
import { formatDuration, formatPrice } from "@/lib/format";

export default function ServiceCard({
  service,
  shopId,
}: {
  service: Service;
  shopId: number;
}) {
  return (
    <Link
      href={`/shop/${shopId}/book/${service.id}`}
      className="focus-ring group relative flex items-center justify-between gap-4 overflow-hidden rounded-sm border border-line bg-white px-6 py-5 transition-colors hover:border-ink"
    >
      <div>
        <h3 className="font-display text-lg text-ink">{service.title}</h3>
        {service.description && (
          <p className="mt-1 max-w-md text-sm text-muted">{service.description}</p>
        )}
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted">
          {formatDuration(service.duration_minutes)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-mono text-lg text-stub-dark">
          {formatPrice(service.price)}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink opacity-0 transition-opacity group-hover:opacity-100">
          Zakaži →
        </span>
      </div>
    </Link>
  );
}
