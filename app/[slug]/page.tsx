"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getShopBySlug,
  getServicesForShop,
  getStaffForShop,
  createBooking,
  getAvailableSlots
} from "@/lib/api";
import type { Shop, Service } from "@/lib/types";

interface Staff {
  id: number;
  name: string;
  role?: string;
  avatar_url?: string;
}

const ShopMap = dynamic(() => import("@/components/ShopMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-zinc-950/50 animate-pulse rounded-2xl border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
      Učitavanje mape...
    </div>
  ),
});

const THEME_STYLES: Record<string, { bg: string; cardBg: string; text: string; textMuted: string; border: string }> = {
  noir: { bg: "bg-[#09090B]", cardBg: "bg-zinc-900", text: "text-white", textMuted: "text-zinc-400", border: "border-zinc-800" },
  steel: { bg: "bg-[#0F172A]", cardBg: "bg-[#1E293B]", text: "text-slate-50", textMuted: "text-slate-400", border: "border-slate-700" },
  royal: { bg: "bg-[#0284C7]", cardBg: "bg-[#0369A1]", text: "text-white", textMuted: "text-sky-200", border: "border-sky-500" },
  forest: { bg: "bg-[#064E3B]", cardBg: "bg-[#047857]", text: "text-emerald-50", textMuted: "text-emerald-200", border: "border-emerald-600" },
  espresso: { bg: "bg-[#1C1917]", cardBg: "bg-[#292524]", text: "text-stone-100", textMuted: "text-stone-400", border: "border-stone-700" },
  velvet: { bg: "bg-[#2E1065]", cardBg: "bg-[#3B0764]", text: "text-purple-50", textMuted: "text-purple-300", border: "border-purple-800" },
  nordic: { bg: "bg-gray-50", cardBg: "bg-white", text: "text-gray-900", textMuted: "text-gray-500", border: "border-gray-200" },
  gold: { bg: "bg-black", cardBg: "bg-[#121212]", text: "text-amber-100", textMuted: "text-amber-300/60", border: "border-amber-900/50" },
};

export default function ClientShopPage() {
  const params = useParams();
  const rawSlug = params?.slug;

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<Staff[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [bookingDate, setBookingDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
useEffect(() => {
  if (!rawSlug) return;
  const slugStr = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  setLoading(true);

  getShopBySlug(slugStr)
    .then(async (shopData: any) => {
      setShop(shopData);

      if (shopData?.id) {
        // Parallelno dohvatanje usluga i radnika preko tvojih API funkcija
        const [serviceList, staffList] = await Promise.all([
          getServicesForShop(shopData.id).catch(() => []),
          getStaffForShop(shopData.id).catch(() => []),
        ]);

        setServices(serviceList || []);
        setTeamMembers(staffList || []);
      }
    })
    .catch((err) => {
      console.error("Shop error:", err);
      setShop(null);
    })
    .finally(() => setLoading(false));
}, [rawSlug]);
  const handleFetchSlots = async (serviceId: number, date: string, staffId?: number) => {
    if (!shop || !date || date.length !== 10) {
      setAvailableSlots([]);
      return;
    }

    try {
      const slots = await getAvailableSlots(shop.id, serviceId, date, staffId);
      setAvailableSlots(slots || []);
    } catch (err) {
      console.error("Greška pri učitavanju slobodnih termina:", err);
      setAvailableSlots([]);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !selectedService || !selectedSlot || submitting) return;

    setSubmitting(true);

    try {
      const payload: any = {
        shop_id: shop.id,
        service_id: selectedService.id,
        staff_id: selectedStaff ? selectedStaff.id : undefined,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        start_time: `${bookingDate}T${selectedSlot}:00`,
      };

      await createBooking(payload);

      setBookingSuccess(true);
      setClientInfo({ name: "", email: "", phone: "" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Greška pri rezervaciji. Pokušajte ponovo.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-white">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping" />
          <p className="font-medium text-lg text-zinc-300">Učitavanje salona...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090B] text-white p-4">
        <h1 className="text-3xl font-extrabold mb-2">Salon nije pronađen</h1>
        <p className="text-zinc-400">Provjerite da li ste unijeli ispravan link ili da li je backend server pokrenut.</p>
      </div>
    );
  }

  const currentThemeKey = (shop.theme || "noir").toLowerCase();
  const theme = THEME_STYLES[currentThemeKey] || THEME_STYLES.noir;
  const accentColor = shop.accent_color || "#F59E0B";
  const todayStr = new Date().toISOString().split("T")[0];

  const hasValidCoords = Boolean(
    shop.latitude &&
    shop.longitude &&
    !isNaN(Number(shop.latitude)) &&
    !isNaN(Number(shop.longitude))
  );

  const galleryImages: string[] = (shop as any).gallery_images || [];

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans transition-colors duration-300`}>
      {/* Header */}
      <header className={`border-b ${theme.border} ${theme.cardBg} backdrop-blur-md sticky top-0 z-50`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-black uppercase tracking-wider" style={{ color: accentColor }}>
            {shop.name}
          </h1>
          {shop.instagram && (
            <a
              href={`https://instagram.com/${shop.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${theme.border} hover:opacity-80 transition-all`}
            >
              Instagram: {shop.instagram}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Banner / Main Card */}
        <div className={`relative rounded-3xl overflow-hidden ${theme.cardBg} border ${theme.border} p-6 md:p-8 text-center space-y-4 shadow-2xl`}>
          <div>
            <span
              className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3"
              style={{ backgroundColor: accentColor, color: "#000" }}
            >
              {shop.shop_type ? shop.shop_type.replace("_", " ") : "SALON"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{shop.name}</h2>
            <p className={`text-sm ${theme.textMuted} mt-2`}>
              📍 {shop.address || "Centar grada"}
            </p>
          </div>

          <div className={`max-w-md mx-auto py-2 px-4 rounded-2xl border ${theme.border} flex justify-between items-center text-xs ${theme.textMuted}`}>
            <span>
              Radno vrijeme: <strong>08:00 - 20:00</strong>
            </span>
            <span className="text-green-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Otvoreno
            </span>
          </div>
        </div>

        {/* Tim / Majstori */}
        <div className="space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
            IZABERI MAJSTORA {teamMembers.length > 0 ? "(OPCIONO)" : ""}
          </h3>

          {teamMembers.length === 0 ? (
            <p className={`text-xs ${theme.textMuted} p-4 ${theme.cardBg} rounded-2xl border ${theme.border}`}>
              Trenutno nema unesenih majstora u salonu.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {teamMembers.map((staff) => {
                const isSelected = selectedStaff?.id === staff.id;
                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      const newStaff = isSelected ? null : staff;
                      setSelectedStaff(newStaff);
                      if (selectedService && bookingDate) {
                        void handleFetchSlots(selectedService.id, bookingDate, newStaff?.id);
                      }
                    }}
                    className={`p-3 ${theme.cardBg} rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected ? "ring-2 scale-[1.02]" : `hover:${theme.border}`
                    }`}
                    style={{ borderColor: isSelected ? accentColor : undefined }}
                  >
                    <img
                      src={staff.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={staff.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700"
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
        </div>

        {/* Cjenovnik & Rezervacija */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Dostupne Usluge</h3>
            {services.length === 0 ? (
              <p className={`text-sm ${theme.textMuted} p-6 ${theme.cardBg} rounded-2xl border ${theme.border}`}>
                Trenutno nema aktivnih usluga u cjenovniku. Dodajte usluge u admin panelu.
              </p>
            ) : (
              services.map((s) => {
                const isSelected = selectedService?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedService(s);
                      setSelectedSlot("");
                      if (bookingDate) {
                        void handleFetchSlots(s.id, bookingDate, selectedStaff?.id);
                      }
                    }}
                    className={`p-4 ${theme.cardBg} rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected ? "ring-2 scale-[1.01]" : `hover:${theme.border}`
                    }`}
                    style={{ borderColor: isSelected ? accentColor : undefined }}
                  >
                    <div>
                      <h4 className="text-sm font-bold">{s.title}</h4>
                      <p className={`text-xs ${theme.textMuted} mt-0.5`}>
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

          <div className="md:col-span-5">
            <div className={`p-6 ${theme.cardBg} border ${theme.border} rounded-3xl space-y-5 sticky top-24`}>
              {!selectedService ? (
                <div className="text-center py-8 space-y-2">
                  <span className="text-3xl block">✂️</span>
                  <h4 className="font-bold text-sm">Odaberite uslugu</h4>
                  <p className={`text-xs ${theme.textMuted}`}>Kliknite na uslugu iz cjenovnika da otvorite kalendar.</p>
                </div>
              ) : bookingSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl mx-auto">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold">Uspješno zakazano!</h4>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Vidimo se <strong>{bookingDate}</strong> u <strong>{selectedSlot}h</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setSelectedService(null);
                      setSelectedSlot("");
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black mt-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    Novi termin
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`border-b ${theme.border} pb-3 flex justify-between items-center`}>
                    <div>
                      <span className={`text-[10px] uppercase ${theme.textMuted}`}>Odabrano</span>
                      <h4 className="font-bold text-xs" style={{ color: accentColor }}>{selectedService.title}</h4>
                      {selectedStaff && (
                        <p className="text-[10px] text-zinc-400">Majstor: {selectedStaff.name}</p>
                      )}
                    </div>
                    <span className="font-extrabold text-sm">{selectedService.price} KM</span>
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-xs font-bold uppercase ${theme.textMuted}`}>Datum</label>
                    <input
                      type="date"
                      min={todayStr}
                      className={`w-full p-2.5 rounded-xl ${theme.bg} border ${theme.border} ${theme.text} text-xs outline-none`}
                      value={bookingDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setBookingDate(newDate);
                        setSelectedSlot("");
                        void handleFetchSlots(selectedService.id, newDate, selectedStaff?.id);
                      }}
                    />
                  </div>

                  {bookingDate && (
                    <div className="space-y-1">
                      <label className={`block text-xs font-bold uppercase ${theme.textMuted}`}>Slobodni Termini</label>
                      {availableSlots.length === 0 ? (
                        <p className={`text-xs ${theme.textMuted} py-1`}>Nema dostupnih termina za odabrani datum.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                selectedSlot === slot
                                  ? "bg-white text-black border-white"
                                  : `${theme.border} ${theme.textMuted}`
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedSlot && (
                    <form onSubmit={handleBookingSubmit} className={`space-y-2 pt-2 border-t ${theme.border}`}>
                      <input
                        type="text"
                        placeholder="Ime i prezime"
                        required
                        className={`w-full p-2.5 rounded-xl ${theme.bg} border ${theme.border} ${theme.text} text-xs outline-none`}
                        value={clientInfo.name}
                        onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        required
                        className={`w-full p-2.5 rounded-xl ${theme.bg} border ${theme.border} ${theme.text} text-xs outline-none`}
                        value={clientInfo.email}
                        onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      />
                      <input
                        type="tel"
                        placeholder="Broj telefona"
                        required
                        className={`w-full p-2.5 rounded-xl ${theme.bg} border ${theme.border} ${theme.text} text-xs outline-none`}
                        value={clientInfo.phone}
                        onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      />

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all mt-2 hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        {submitting ? "Slanje..." : "Potvrdi Rezervaciju"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {galleryImages.length > 0 && (
          <div className={`p-6 ${theme.cardBg} border ${theme.border} rounded-3xl space-y-3`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Galerija Radova</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {galleryImages.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Galerija slika ${idx + 1}`}
                  className="w-full h-36 object-cover rounded-2xl border border-zinc-800 hover:scale-[1.02] transition-all duration-200"
                />
              ))}
            </div>
          </div>
        )}

        {hasValidCoords && (
          <div className={`p-6 ${theme.cardBg} border ${theme.border} rounded-3xl space-y-3`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Lokacija Salona</h3>
            <p className="text-xs">📍 {shop.address}</p>
            <ShopMap
              latitude={Number(shop.latitude)}
              longitude={Number(shop.longitude)}
              shopName={shop.name}
              address={shop.address || ""}
            />
          </div>
        )}
      </main>
    </div>
  );
}