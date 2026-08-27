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

const DAY_KEYS_BY_JS_INDEX = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Provjerava da li je salon trenutno otvoren na osnovu working_hours za tekući dan/vrijeme.
export function isShopOpenNow(workingHours: any): boolean {
  if (!workingHours || typeof workingHours !== "object") return false;

  const now = new Date();
  const dayKey = DAY_KEYS_BY_JS_INDEX[now.getDay()];
  const todayHours = workingHours[dayKey];
  if (!todayHours || !todayHours.is_working) return false;

  const [startH, startM] = String(todayHours.start || "08:00").split(":").map(Number);
  const [endH, endM] = String(todayHours.end || "16:00").split(":").map(Number);
  if ([startH, startM, endH, endM].some((n) => Number.isNaN(n))) return false;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return minutesNow >= startMinutes && minutesNow < endMinutes;
}

// Vraća radno vrijeme salona za tekući dan kao "HH:MM–HH:MM", ili "Zatvoreno" ako ne radi danas.
export function getTodayHoursLabel(workingHours: any): string {
  if (!workingHours || typeof workingHours !== "object") return "Zatvoreno";

  const dayKey = DAY_KEYS_BY_JS_INDEX[new Date().getDay()];
  const todayHours = workingHours[dayKey];
  if (!todayHours || !todayHours.is_working) return "Zatvoreno";

  return `${todayHours.start || "08:00"}–${todayHours.end || "16:00"}`;
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Na čekanju",
  CONFIRMED: "Potvrđeno",
  CANCELLED: "Otkazano",
  COMPLETED: "Završeno",
};
