"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { bs } from "date-fns/locale";
import { getShopBookings } from "@/lib/api";
import type { Booking, Service, Staff } from "@/lib/types";
import BookingDetailsModal from "./BookingDetailsModal";

type ViewMode = "month" | "week" | "3months";

const STATUS_DOT: Record<string, string> = {
  CONFIRMED: "bg-emerald-500",
  PENDING: "bg-amber-500",
  CANCELLED: "bg-red-500",
  COMPLETED: "bg-blue-500",
};

const STATUS_CHIP: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 line-through opacity-70",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
};

const WEEKDAY_LABELS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

export default function AdminBookingsCalendar({
  shopId,
  services,
  staffList = [],
}: {
  shopId: number;
  services: Service[];
  staffList?: Staff[];
}) {
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  const range = useMemo(() => {
    if (view === "week") {
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    }
    if (view === "3months") {
      return { start: startOfMonth(anchor), end: endOfMonth(addMonths(anchor, 2)) };
    }
    return {
      start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
    };
  }, [view, anchor]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getShopBookings(shopId, {
      startDate: format(range.start, "yyyy-MM-dd"),
      endDate: format(range.end, "yyyy-MM-dd"),
      staffId: selectedStaffId ?? undefined,
    })
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch((err) => {
        console.error("Greška pri učitavanju rezervacija:", err);
        if (!cancelled) setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, range.start.getTime(), range.end.getTime(), selectedStaffId]);

  function shiftAnchor(dir: 1 | -1) {
    if (view === "week") setAnchor((d) => addWeeks(d, dir));
    else if (view === "3months") setAnchor((d) => addMonths(d, dir * 3));
    else setAnchor((d) => addMonths(d, dir));
  }

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = format(new Date(b.start_time), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    for (const list of map.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [bookings]);

  const serviceById = useMemo(() => {
    const map = new Map<number, Service>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const label = useMemo(() => {
    if (view === "week") {
      return `${format(range.start, "d. MMM", { locale: bs })} – ${format(range.end, "d. MMM yyyy.", {
        locale: bs,
      })}`;
    }
    if (view === "3months") {
      return `${format(anchor, "MMMM", { locale: bs })} – ${format(
        addMonths(anchor, 2),
        "MMMM yyyy.",
        { locale: bs }
      )}`;
    }
    return format(anchor, "LLLL yyyy.", { locale: bs });
  }, [view, anchor, range]);

  function handleModalChanged(updated: Booking | null) {
    setBookings((prev) => {
      if (!selectedBooking) return prev;
      if (updated) return prev.map((b) => (b.id === updated.id ? updated : b));
      return prev.filter((b) => b.id !== selectedBooking.id);
    });
    setSelectedBooking(null);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftAnchor(-1)}
            className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Prethodni period"
          >
            ‹
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Danas
          </button>
          <button
            onClick={() => shiftAnchor(1)}
            className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Sljedeći period"
          >
            ›
          </button>
          <span className="ml-2 text-sm font-semibold capitalize text-gray-900">{label}</span>
        </div>

        {staffList.length > 0 && (
          <select
            value={selectedStaffId ?? ""}
            onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">Svi Radnici</option>
            {staffList.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
          {(["month", "week", "3months"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                view === v ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              {v === "month" ? "Mjesec" : v === "week" ? "Sedmica" : "3 Mjeseca"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">Učitavanje rezervacija...</p>
      ) : view === "week" ? (
        <WeekGrid range={range} bookingsByDay={bookingsByDay} onSelect={setSelectedBooking} />
      ) : view === "3months" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <MonthGrid
              key={i}
              monthAnchor={addMonths(startOfMonth(anchor), i)}
              bookingsByDay={bookingsByDay}
              onSelect={setSelectedBooking}
              compact
            />
          ))}
        </div>
      ) : (
        <MonthGrid monthAnchor={anchor} bookingsByDay={bookingsByDay} onSelect={setSelectedBooking} />
      )}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          service={serviceById.get(selectedBooking.service_id)}
          onClose={() => setSelectedBooking(null)}
          onChanged={handleModalChanged}
        />
      )}
    </div>
  );
}

function BookingChip({ booking, onSelect }: { booking: Booking; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-medium ${
        STATUS_CHIP[booking.status] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
      title={`${booking.client_name} — ${format(new Date(booking.start_time), "HH:mm")}`}
    >
      <span
        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
          STATUS_DOT[booking.status] || "bg-gray-400"
        }`}
      />
      {format(new Date(booking.start_time), "HH:mm")} {booking.client_name}
    </button>
  );
}

function MonthGrid({
  monthAnchor,
  bookingsByDay,
  onSelect,
  compact,
}: {
  monthAnchor: Date;
  bookingsByDay: Map<string, Booking[]>;
  onSelect: (b: Booking) => void;
  compact?: boolean;
}) {
  const gridStart = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const maxVisible = compact ? 2 : 3;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {compact && (
        <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold capitalize text-gray-700">
          {format(monthAnchor, "LLLL yyyy.", { locale: bs })}
        </div>
      )}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayBookings = bookingsByDay.get(key) || [];
          const outside = !isSameMonth(day, monthAnchor);
          return (
            <div
              key={key}
              className={`min-h-[86px] border-b border-r border-gray-100 p-1.5 last:border-r-0 ${
                outside ? "bg-gray-50/50" : "bg-white"
              }`}
            >
              <span
                className={`text-[11px] font-medium ${
                  isToday(day)
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-black text-white"
                    : outside
                      ? "text-gray-300"
                      : "text-gray-600"
                }`}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayBookings.slice(0, maxVisible).map((b) => (
                  <BookingChip key={b.id} booking={b} onSelect={() => onSelect(b)} />
                ))}
                {dayBookings.length > maxVisible && (
                  <span className="block px-1 text-[10px] text-gray-400">
                    +{dayBookings.length - maxVisible} više
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  range,
  bookingsByDay,
  onSelect,
}: {
  range: { start: Date; end: Date };
  bookingsByDay: Map<string, Booking[]>;
  onSelect: (b: Booking) => void;
}) {
  const days = eachDayOfInterval(range);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayBookings = bookingsByDay.get(key) || [];
        return (
          <div key={key} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold capitalize text-gray-700">
                {format(day, "EEEE", { locale: bs })}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday(day) ? "bg-black text-white" : "text-gray-500"
                }`}
              >
                {format(day, "d")}
              </span>
            </div>
            {dayBookings.length === 0 ? (
              <p className="text-[11px] text-gray-300">Nema termina</p>
            ) : (
              <div className="space-y-1">
                {dayBookings.map((b) => (
                  <BookingChip key={b.id} booking={b} onSelect={() => onSelect(b)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
