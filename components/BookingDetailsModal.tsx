"use client";

import { useState } from "react";
import { format } from "date-fns";
import { bs } from "date-fns/locale";
import { updateBookingStatus, deleteBooking } from "@/lib/api";
import { formatPrice, formatDuration, STATUS_LABELS } from "@/lib/format";
import type { Booking, BookingStatus, Service } from "@/lib/types";

const STATUS_CHIP: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function BookingDetailsModal({
  booking,
  service,
  onClose,
  onChanged,
}: {
  booking: Booking;
  service?: Service;
  onClose: () => void;
  onChanged: (updated: Booking | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleStatus(status: BookingStatus) {
    setBusy(true);
    try {
      const updated = await updateBookingStatus(booking.id, status);
      onChanged(updated);
    } catch {
      alert("Neuspješna promjena statusa rezervacije.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Da li ste sigurni da želite obrisati ovu rezervaciju?")) return;
    setBusy(true);
    try {
      await deleteBooking(booking.id);
      onChanged(null);
    } catch {
      alert("Greška pri brisanju rezervacije.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400">
              Rezervacija #{booking.id}
            </p>
            <h3 className="mt-0.5 text-lg font-semibold text-gray-900">{booking.client_name}</h3>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              STATUS_CHIP[booking.status] || "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {STATUS_LABELS[booking.status] || booking.status}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <DetailRow label="Email" value={booking.client_email} />
          <DetailRow label="Telefon" value={booking.client_phone} />
          <DetailRow
            label="Termin"
            value={`${format(new Date(booking.start_time), "EEEE, d. MMMM yyyy.", {
              locale: bs,
            })} u ${format(new Date(booking.start_time), "HH:mm")}–${format(
              new Date(booking.end_time),
              "HH:mm"
            )}`}
          />
          <DetailRow
            label="Usluga"
            value={
              service
                ? `${service.title} · ${formatDuration(service.duration_minutes)} · ${formatPrice(
                    service.price
                  )}`
                : `Usluga #${booking.service_id}`
            }
          />
          <DetailRow label="Uposlenik" value={booking.staff?.name || "Nije naznačeno"} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {booking.status !== "CONFIRMED" && (
            <button
              disabled={busy}
              onClick={() => handleStatus("CONFIRMED" as BookingStatus)}
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
            >
              Potvrdi
            </button>
          )}
          {booking.status !== "CANCELLED" && (
            <button
              disabled={busy}
              onClick={() => handleStatus("CANCELLED" as BookingStatus)}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Otkaži
            </button>
          )}
          {booking.status !== "COMPLETED" && (
            <button
              disabled={busy}
              onClick={() => handleStatus("COMPLETED" as BookingStatus)}
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              Završeno
            </button>
          )}
          <button
            disabled={busy}
            onClick={handleDelete}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            Obriši
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-2">
      <span className="font-mono text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-right text-gray-800">{value}</span>
    </div>
  );
}
