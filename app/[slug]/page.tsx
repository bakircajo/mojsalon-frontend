"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getServicesForShop, createBooking, getAvailableSlots } from "@/lib/api";
import type { Shop, Service } from "@/lib/types";

// Dynamic import bez SSR-a (obavezno za Leaflet mapu)
const ShopMap = dynamic(() => import("@/components/ShopMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-zinc-950/50 animate-pulse rounded-2xl border border-zinc-800 flex items-center justify-center text-xs text-zinc-500">
      Učitavanje mape...
    </div>
  ),
});

const TEAM_MEMBERS = [
  { id: 1, name: "Emina K.", role: "Senior Stylist", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300" },
  { id: 2, name: "Dino M.", role: "Master Barber", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300" },
];

export default function ClientShopPage() {
  const params = useParams();
  const rawSlug = params?.slug;

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

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
    fetch(`http://127.0.0.1:8000/api/v1/shops/by-slug/${slugStr}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Salon nije pronađen`);
        return res.json();
      })
      .then(async (shopData: Shop) => {
        setShop(shopData);
        try {
          const serviceList = await getServicesForShop(shopData.id);
          setServices(serviceList);
        } catch (err) {
          console.error("Greška pri učitavanju usluga:", err);
        }
      })
      .catch((err) => {
        console.error("Greška pri dohvatanju salona:", err);
        setShop(null);
      })
      .finally(() => setLoading(false));
  }, [rawSlug]);

  const handleFetchSlots = async (serviceId: number, date: string) => {
    if (!shop || !date || date.length !== 10) {
      setAvailableSlots([]);
      return;
    }

    try {
      const slots = await getAvailableSlots(shop.id, serviceId, date);
      setAvailableSlots(slots);
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
      await createBooking({
        shop_id: shop.id,
        service_id: selectedService.id,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        start_time: `${bookingDate}T${selectedSlot}:00`,
      });

      setBookingSuccess(true);
      setClientInfo({ name: "", email: "", phone: "" });
    } catch (err: any) {
      alert(err.message || "Greška pri rezervaciji. Pokušajte ponovo.");
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
        <p className="text-zinc-400">Provjerite da li ste unijeli ispravan link ili da li je backend server (FastAPI/Django) pokrenut.</p>
      </div>
    );
  }

  const accentColor = shop.accent_color || "#F59E0B";
  const todayStr = new Date().toISOString().split("T")[0];

  // Provjera valjanosti koordinata
  const hasValidCoords = Boolean(
    shop.latitude &&
    shop.longitude &&
    !isNaN(Number(shop.latitude)) &&
    !isNaN(Number(shop.longitude))
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-black uppercase tracking-wider" style={{ color: accentColor }}>
            {shop.name}
          </h1>
          {shop.instagram && (
            <a
              href={`https://instagram.com/${shop.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-all"
            >
              Instagram: {shop.instagram}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Banner / Main Card */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 p-6 md:p-8 text-center space-y-4 shadow-2xl">
          <div>
            <span
              className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3"
              style={{ backgroundColor: accentColor, color: "#000" }}
            >
              {shop.shop_type ? shop.shop_type.replace("_", " ") : "SALON"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{shop.name}</h2>
            <p className="text-sm text-zinc-400 mt-2">📍 {shop.address || "Centar grada"} • ★ 4.9 (120+ ocjena)</p>
          </div>

          <div className="max-w-md mx-auto py-2 px-4 bg-zinc-800/80 rounded-2xl flex justify-between items-center text-xs text-zinc-300">
            <span>Radno vrijeme: <strong>09:00 - 20:00</strong></span>
            <span className="text-green-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Otvoreno
            </span>
          </div>
        </div>

        {/* Tim / Majstori */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">IZABERI MAJSTORA</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEAM_MEMBERS.map((staff) => (
              <div
                key={staff.id}
                onClick={() => setSelectedStaff(staff.name)}
                className={`p-3 bg-zinc-900 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                  selectedStaff === staff.name ? "border-amber-500 ring-1 ring-amber-500" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <img src={staff.image} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h4 className="text-xs font-bold">{staff.name}</h4>
                  <p className="text-[10px] text-zinc-400">{staff.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cjenovnik & Rezervacija */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Lista usluga */}
          <div className="md:col-span-7 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dostupne Usluge</h3>
            {services.length === 0 ? (
              <p className="text-sm text-zinc-500 p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
                Trenutno nema aktivnih usluga u cjenovniku.
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
                    className={`p-4 bg-zinc-900 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected ? "ring-2 scale-[1.01]" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                    style={{
                      borderColor: isSelected ? accentColor : undefined,
                      //@ts-ignore
                      "--tw-ring-color": accentColor,
                    }}
                  >
                    <div>
                      <h4 className="text-sm font-bold">{s.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{s.duration_minutes} min {s.description && `• ${s.description}`}</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: accentColor }}>
                      {s.price} KM
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Kalendar & Forma */}
          <div className="md:col-span-5">
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 sticky top-24">
              {!selectedService ? (
                <div className="text-center py-8 space-y-2">
                  <span className="text-3xl block">✂️</span>
                  <h4 className="font-bold text-sm">Odaberite uslugu</h4>
                  <p className="text-xs text-zinc-500">Kliknite na uslugu iz cjenovnika da otvorite kalendar.</p>
                </div>
              ) : bookingSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl mx-auto">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold">Uspješno zakazano!</h4>
                  <p className="text-xs text-zinc-300">
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
                  <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400">Odabrano</span>
                      <h4 className="font-bold text-xs" style={{ color: accentColor }}>{selectedService.title}</h4>
                    </div>
                    <span className="font-extrabold text-sm">{selectedService.price} KM</span>
                  </div>

                  {/* Datum */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-zinc-400">Datum</label>
                    <input
                      type="date"
                      min={todayStr}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-amber-500"
                      value={bookingDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setBookingDate(newDate);
                        setSelectedSlot("");
                        handleFetchSlots(selectedService.id, newDate);
                      }}
                    />
                  </div>

                  {/* Slobodni Termini */}
                  {bookingDate && (
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase text-zinc-400">Slobodni Termini</label>
                      {availableSlots.length === 0 ? (
                        <p className="text-xs text-zinc-500 py-1">Nema dostupnih termina.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                selectedSlot === slot ? "bg-white text-black border-white" : "border-zinc-800 hover:border-zinc-600 text-zinc-300"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Podaci Klijenta */}
                  {selectedSlot && (
                    <form onSubmit={handleBookingSubmit} className="space-y-2 pt-2 border-t border-zinc-800">
                      <input
                        type="text"
                        placeholder="Ime i prezime"
                        required
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none"
                        value={clientInfo.name}
                        onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        required
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none"
                        value={clientInfo.email}
                        onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      />
                      <input
                        type="tel"
                        placeholder="Broj telefona"
                        required
                        className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none"
                        value={clientInfo.phone}
                        onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      />

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all mt-2"
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

        {/* Interaktivna Mapa */}
        {hasValidCoords && (
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Lokacija Salona</h3>
            <p className="text-xs text-zinc-300">📍 {shop.address}</p>
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