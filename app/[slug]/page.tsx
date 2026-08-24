"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getShopBySlug,
  getServicesForShop,
  getStaffForShop,
  createBooking,
  getAvailableSlots
} from "@/lib/api";
import type { Shop, Service, Staff, BookingCreatePayload } from "@/lib/types";

// Proširenje Shop interfejsa za opcionalno polje galerije slika
type ShopWithGallery = Shop & {
  gallery_images?: string[] | string | null;
  slug?: string;
};

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

  const [shop, setShop] = useState<ShopWithGallery | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<Staff[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [bookingDate, setBookingDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [confirmedSlot, setConfirmedSlot] = useState("");

  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Stanja za Karusel / Lightbox
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const staffRequired = teamMembers.length > 0;
  const staffMissing = staffRequired && !selectedStaff;

  useEffect(() => {
    if (!rawSlug) return;
    const slugStr = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

    setLoading(true);

    getShopBySlug(slugStr)
      .then(async (shopData: ShopWithGallery) => {
        setShop(shopData);

        if (shopData?.id) {
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

  useEffect(() => {
    if (!shop || !selectedService || !bookingDate) {
      setAvailableSlots([]);
      return;
    }

    if (staffRequired && !selectedStaff) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);

    getAvailableSlots(shop.id, selectedService.id, bookingDate, selectedStaff?.id)
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
  }, [shop, selectedService?.id, bookingDate, selectedStaff?.id, staffRequired]);

  // Priprema slika za galeriju
  let galleryImages: string[] = [];
  if (shop && shop.gallery_images) {
    const rawGallery = shop.gallery_images;
    if (Array.isArray(rawGallery)) {
      galleryImages = rawGallery;
    } else if (typeof rawGallery === "string") {
      try {
        galleryImages = JSON.parse(rawGallery);
      } catch {
        galleryImages = [];
      }
    }
  }

  const nextSlide = useCallback(() => {
    if (galleryImages.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevSlide = useCallback(() => {
    if (galleryImages.length === 0) return;
    setCurrentSlideIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  // Tastaturna navigacija za Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextSlide, prevSlide]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !selectedService || !selectedSlot || submitting) return;

    if (staffRequired && !selectedStaff) {
      alert("Molimo odaberite radnika prije izbora termina.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: BookingCreatePayload = {
        shop_id: shop.id,
        service_id: selectedService.id,
        staff_id: selectedStaff ? selectedStaff.id : undefined,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        start_time: `${bookingDate}T${selectedSlot}:00`,
      };

      await createBooking(payload);

      setConfirmedSlot(selectedSlot);
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

        {/* Slideshow Galerija */}
        {galleryImages.length > 0 && (
          <div className={`p-6 ${theme.cardBg} border ${theme.border} rounded-3xl space-y-4`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
                Galerija Radova ({galleryImages.length})
              </h3>
              <span className={`text-[10px] ${theme.textMuted}`}>Kliknite za uvećanje</span>
            </div>

            <div className="relative group overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 aspect-[16/9] sm:aspect-[21/9]">
              <img
                src={galleryImages[currentSlideIndex]}
                alt={`Slika radova ${currentSlideIndex + 1}`}
                onClick={() => setLightboxOpen(true)}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-all duration-300"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md opacity-80 hover:opacity-100 hover:scale-110 transition-all border border-white/10"
                    aria-label="Prethodna slika"
                  >
                    ❮
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md opacity-80 hover:opacity-100 hover:scale-110 transition-all border border-white/10"
                    aria-label="Sledeća slika"
                  >
                    ❯
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
                    {galleryImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          currentSlideIndex === idx ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && galleryImages.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 text-white/70 hover:text-white text-3xl font-light z-10"
            >
              ✕
            </button>

            <img
              src={galleryImages[currentSlideIndex]}
              alt={`Fullscreen slika ${currentSlideIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  ❮
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all"
                >
                  ❯
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-zinc-400">
                  {currentSlideIndex + 1} / {galleryImages.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tim / Radnici */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
              IZABERI MAJSTORA {staffRequired && <span className="text-red-500">*</span>}
            </h3>
            {staffMissing && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Obavezno</span>
            )}
          </div>

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
                      setSelectedSlot("");
                    }}
                    className={`p-3 ${theme.cardBg} rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected ? "ring-2 scale-[1.02]" : `hover:${theme.border}`
                    } ${staffMissing ? "ring-1 ring-red-500/40" : ""}`}
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

          {staffMissing && (
            <p className="text-xs font-medium text-red-500">
              Molimo odaberite radnika prije izbora termina.
            </p>
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
                    Vidimo se <strong>{bookingDate.split("-").reverse().join(".")}</strong> u <strong>{confirmedSlot}h</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setSelectedService(null);
                      setSelectedSlot("");
                      setConfirmedSlot("");
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black mt-2 hover:opacity-90 transition-all"
                    style={{ backgroundColor: accentColor }}
                  >
                    Novi termin
                  </button>
                </div>
              ) : staffMissing ? (
                <div className="text-center py-8 space-y-2">
                  <span className="text-3xl block">👤</span>
                  <h4 className="font-bold text-sm">Odaberite radnika</h4>
                  <p className="text-xs text-red-500 font-medium">
                    Molimo odaberite radnika prije izbora termina.
                  </p>
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
                      disabled={staffMissing}
                      className={`w-full p-2.5 rounded-xl ${theme.bg} border ${theme.border} ${theme.text} text-xs outline-none disabled:opacity-40 disabled:cursor-not-allowed`}
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setSelectedSlot("");
                      }}
                    />
                  </div>

                  {bookingDate && (
                    <div className="space-y-1">
                      <label className={`block text-xs font-bold uppercase ${theme.textMuted}`}>Slobodni Termini</label>
                      {slotsLoading ? (
                        <p className={`text-xs ${theme.textMuted} py-1`}>Provjeravam dostupnost...</p>
                      ) : availableSlots.length === 0 ? (
                        <p className={`text-xs ${theme.textMuted} py-1`}>Nema dostupnih termina za odabrani datum.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              disabled={staffMissing}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
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
                        disabled={submitting || staffMissing}
                        className="w-full py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all mt-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
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

        {/* Mapa */}
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