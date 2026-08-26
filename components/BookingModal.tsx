"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { bs } from "date-fns/locale";
import "react-day-picker/style.css";
import { createBooking, getAvailableSlots } from "@/lib/api";
import type { Service, Staff, SlotInfo, BookingCreatePayload } from "@/lib/types";

type ThemeStyle = { bg: string; cardBg: string; text: string; textMuted: string; border: string };

// Mapiranje naziva dana (working_hours ključevi) na JS Date.getDay() indekse
const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Izvlači indekse neradnih dana (0-6) iz radnog vremena salona.
// Ako salon nema definisano radno vrijeme, Nedjelja (0) je podrazumijevano neradna.
function getNonWorkingDayIndexes(workingHours: any): number[] {
  if (workingHours && typeof workingHours === "object") {
    const closedDays = Object.entries(workingHours)
      .filter(([, value]: [string, any]) => value && value.is_working === false)
      .map(([dayName]) => DAY_NAME_TO_INDEX[dayName])
      .filter((idx): idx is number => idx !== undefined);
    if (closedDays.length > 0) return closedDays;
  }
  return [0]; // Fallback: Nedjelja
}

const STEP_LABELS: Record<string, string> = {
  staff: "Odaberite Majstora",
  service: "Odaberite Uslugu",
  datetime: "Odaberite Termin",
  contact: "Vaši Podaci",
};

export default function BookingModal({
  shopId,
  workingHours,
  services,
  teamMembers,
  theme,
  accentColor,
  onClose,
}: {
  shopId: number;
  workingHours: any;
  services: Service[];
  teamMembers: Staff[];
  theme: ThemeStyle;
  accentColor: string;
  onClose: () => void;
}) {
  const staffRequired = teamMembers.length > 0;
  const STEP_KEYS = staffRequired
    ? (["staff", "service", "datetime", "contact"] as const)
    : (["service", "datetime", "contact"] as const);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = STEP_KEYS[stepIndex];

  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState("");

  const formattedBookingDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const nonWorkingDayIndexes = getNonWorkingDayIndexes(workingHours);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Zaključaj skrolovanje pozadine dok je modal otvoren
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Escape zatvara modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Učitavanje slobodnih termina — zahtijeva uslugu (radi trajanja) i, ako je potreban, radnika
  useEffect(() => {
    if (!selectedService || !formattedBookingDate) {
      setAvailableSlots([]);
      return;
    }
    if (staffRequired && !selectedStaff) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);

    getAvailableSlots(shopId, selectedService.id, formattedBookingDate, selectedStaff?.id)
      .then((slots) => {
        if (!cancelled) setAvailableSlots(slots || []);
      })
      .catch((err) => {
        console.error("Greška pri učitavanju slobodnih termina:", err);
        if (!cancelled) setAvailableSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shopId, selectedService?.id, formattedBookingDate, selectedStaff?.id, staffRequired]);

  const canGoNext =
    currentStep === "staff"
      ? !!selectedStaff
      : currentStep === "service"
        ? !!selectedService
        : currentStep === "datetime"
          ? !!selectedDate && !!selectedSlot
          : true;

  function goNext() {
    if (!canGoNext) return;
    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedService || !selectedSlot || submitting) return;
    if (staffRequired && !selectedStaff) return;

    setSubmitting(true);
    try {
      const payload: BookingCreatePayload = {
        shop_id: shopId,
        service_id: selectedService.id,
        staff_id: selectedStaff ? selectedStaff.id : undefined,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        start_time: `${formattedBookingDate}T${selectedSlot}:00`,
      };

      await createBooking(payload);
      setConfirmedSlot(selectedSlot);
      setBookingSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Greška pri rezervaciji. Pokušajte ponovo.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border ${theme.border} ${theme.cardBg} ${theme.text} p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {bookingSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-2xl text-green-400">
              ✓
            </div>
            <h3 className="text-lg font-bold">Uspješno zakazano!</h3>
            <p className={`text-xs ${theme.textMuted}`}>
              Vidimo se{" "}
              <strong>{selectedDate ? format(selectedDate, "dd.MM.yyyy") : ""}</strong> u{" "}
              <strong>{confirmedSlot}h</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-black transition-all hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Zatvori
            </button>
          </div>
        ) : (
          <>
            {/* Header: naslov koraka + zatvori */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className={`text-[10px] uppercase tracking-wider ${theme.textMuted}`}>
                  Korak {stepIndex + 1} od {STEP_KEYS.length}
                </p>
                <h3 className="text-lg font-bold">{STEP_LABELS[currentStep]}</h3>
              </div>
              <button
                onClick={onClose}
                className={`text-xl leading-none ${theme.textMuted} hover:opacity-80`}
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>

            {/* Progress bar */}
            <div className="mb-6 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((stepIndex + 1) / STEP_KEYS.length) * 100}%`,
                  backgroundColor: accentColor,
                }}
              />
            </div>

            {/* STEP: Majstor */}
            {currentStep === "staff" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {teamMembers.map((staff) => {
                  const isSelected = selectedStaff?.id === staff.id;
                  return (
                    <div
                      key={staff.id}
                      onClick={() => setSelectedStaff(isSelected ? null : staff)}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all ${
                        isSelected ? "ring-2" : `hover:${theme.border}`
                      }`}
                      style={{ borderColor: isSelected ? accentColor : undefined }}
                    >
                      <img
                        src={staff.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt={staff.name}
                        className="h-12 w-12 rounded-full border border-zinc-700 object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold">{staff.name}</h4>
                        <p className={`text-[10px] ${theme.textMuted}`}>{staff.role || "Frizer/Stilista"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* STEP: Usluga */}
            {currentStep === "service" && (
              <div className="max-h-96 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {services.length === 0 ? (
                  <p className={`p-6 text-center text-sm ${theme.textMuted}`}>Trenutno nema aktivnih usluga.</p>
                ) : (
                  services.map((s) => {
                    const isSelected = selectedService?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedService(s);
                          setSelectedSlot("");
                        }}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                          isSelected ? "ring-2" : `hover:${theme.border}`
                        }`}
                        style={{ borderColor: isSelected ? accentColor : undefined }}
                      >
                        <div>
                          <h4 className="text-sm font-bold">{s.title}</h4>
                          <p className={`mt-0.5 text-xs ${theme.textMuted}`}>
                            {s.duration_minutes} min {s.description && `• ${s.description}`}
                          </p>
                        </div>
                        <span className="text-sm font-black" style={{ color: accentColor }}>
                          {s.price} KM
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* STEP: Datum i vrijeme */}
            {currentStep === "datetime" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div
                    className={`booking-calendar flex justify-center rounded-2xl border ${theme.border} bg-black/30 p-3`}
                    style={{ "--cal-accent": accentColor } as React.CSSProperties}
                  >
                    <DayPicker
                      mode="single"
                      locale={bs}
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setSelectedSlot("");
                      }}
                      disabled={[{ before: todayStart }, { dayOfWeek: nonWorkingDayIndexes }]}
                      showOutsideDays
                      classNames={{
                        root: theme.text,
                        months: "flex flex-col",
                        month: "flex flex-col gap-2",
                        month_caption: "relative flex h-9 items-center justify-center",
                        caption_label: "text-xs font-bold uppercase tracking-widest opacity-90",
                        nav: "absolute inset-x-0 top-0 flex h-9 items-center justify-between",
                        button_previous:
                          "flex h-7 w-7 items-center justify-center rounded-full opacity-50 transition-colors hover:bg-white/10 hover:opacity-100 disabled:pointer-events-none disabled:opacity-20",
                        button_next:
                          "flex h-7 w-7 items-center justify-center rounded-full opacity-50 transition-colors hover:bg-white/10 hover:opacity-100 disabled:pointer-events-none disabled:opacity-20",
                        chevron: "h-3.5 w-3.5 fill-current",
                        month_grid: "mt-1 border-collapse",
                        weekdays: "flex",
                        weekday: "w-9 pb-1 text-center text-[10px] font-semibold uppercase tracking-wider opacity-35",
                        weeks: "flex flex-col gap-1",
                        week: "flex",
                        day: "cal-day p-0 text-center",
                        day_button:
                          "cal-day-btn flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold opacity-80 transition-all duration-150 hover:bg-white/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-20 disabled:hover:bg-transparent",
                        today: "cal-today",
                        selected: "cal-selected",
                        disabled: "cal-disabled",
                        outside: "cal-outside",
                      }}
                    />
                  </div>
                  <style jsx global>{`
                    .booking-calendar .cal-selected .cal-day-btn {
                      background-color: var(--cal-accent);
                      color: #000;
                      box-shadow: none;
                      opacity: 1;
                    }
                    .booking-calendar .cal-today:not(.cal-selected) .cal-day-btn {
                      box-shadow: inset 0 0 0 1.5px var(--cal-accent);
                      color: var(--cal-accent);
                      opacity: 1;
                    }
                    .booking-calendar .cal-outside .cal-day-btn {
                      opacity: 0.15;
                    }
                    .booking-calendar .cal-disabled .cal-day-btn {
                      text-decoration: line-through;
                      text-decoration-color: rgba(255, 255, 255, 0.15);
                    }
                  `}</style>
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <label className={`block text-xs font-bold uppercase ${theme.textMuted}`}>
                      Slobodni Termini ({format(selectedDate, "dd.MM.yyyy")})
                    </label>
                    {slotsLoading ? (
                      <p className={`py-1 text-xs ${theme.textMuted}`}>Provjeravam dostupnost...</p>
                    ) : availableSlots.length === 0 ? (
                      <p className={`py-1 text-xs ${theme.textMuted}`}>Nema dostupnih termina za odabrani datum.</p>
                    ) : (
                      <>
                        <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 custom-scrollbar">
                          {availableSlots.map((slot) => {
                            const isSelected = selectedSlot === slot.time;
                            const isDisabled = !slot.available;
                            return (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => slot.available && setSelectedSlot(slot.time)}
                                title={!slot.available ? "Termin je već zauzet" : undefined}
                                className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                                  !slot.available
                                    ? "cursor-not-allowed border-red-500/40 bg-red-500/10 text-red-400/70 line-through"
                                    : isSelected
                                      ? "scale-105 border-white bg-white text-black"
                                      : `border-emerald-500/30 bg-emerald-500/5 ${theme.textMuted} hover:border-emerald-500 hover:text-emerald-400`
                                }`}
                              >
                                {slot.time}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 pt-1 text-[10px]">
                          <span className={`flex items-center gap-1.5 ${theme.textMuted}`}>
                            <span className="h-2.5 w-2.5 rounded-full border border-emerald-500/50 bg-emerald-500/20" />
                            Slobodno
                          </span>
                          <span className={`flex items-center gap-1.5 ${theme.textMuted}`}>
                            <span className="h-2.5 w-2.5 rounded-full border border-red-500/50 bg-red-500/20" />
                            Zauzeto
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP: Kontakt podaci (ima sopstveni submit, ne dijeli Dalje dugme) */}
            {currentStep === "contact" && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ime i prezime"
                  required
                  className={`w-full rounded-xl p-3 text-sm outline-none ${theme.bg} border ${theme.border} ${theme.text}`}
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className={`w-full rounded-xl p-3 text-sm outline-none ${theme.bg} border ${theme.border} ${theme.text}`}
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="Broj telefona"
                  required
                  className={`w-full rounded-xl p-3 text-sm outline-none ${theme.bg} border ${theme.border} ${theme.text}`}
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                />

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider ${theme.border} ${theme.textMuted} hover:opacity-80`}
                  >
                    Nazad
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-black shadow-lg transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: accentColor }}
                  >
                    {submitting ? "Slanje..." : "Potvrdi Rezervaciju"}
                  </button>
                </div>
              </form>
            )}

            {/* Nazad/Dalje navigacija (svi koraci osim kontakta, koji ima svoj submit iznad) */}
            {currentStep !== "contact" && (
              <div className="mt-6 flex gap-2">
                {stepIndex > 0 && (
                  <button
                    onClick={goBack}
                    className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wider ${theme.border} ${theme.textMuted} hover:opacity-80`}
                  >
                    Nazad
                  </button>
                )}
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="flex-1 rounded-xl py-3 text-xs font-extrabold uppercase tracking-wider text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ backgroundColor: accentColor }}
                >
                  Dalje
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
