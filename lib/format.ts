export function formatPrice(price: number): string {
  return new Intl.NumberFormat("bs-BA", {
    style: "currency",
    currency: "BAM",
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("bs-BA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function todayISODate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Na čekanju",
  CONFIRMED: "Potvrđeno",
  CANCELLED: "Otkazano",
  COMPLETED: "Završeno",
};
