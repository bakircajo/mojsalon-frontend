"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyShops,
  getServicesForShop,
  createService,
  createStaff,
  getStaffForShop,
  updateShop,
  ApiError,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";
import type { Shop, Service, Staff } from "@/lib/types";
import AdminBookingsCalendar from "@/components/AdminBookingsCalendar";
import ServicesGrid from "@/components/ServicesGrid";
import StaffGrid from "@/components/StaffGrid";

// Podrazumijevano radno vrijeme — mora odgovarati backend DEFAULT_WORKING_HOURS (app/models/shop.py)
const DEFAULT_WORKING_HOURS: Record<string, { start: string; end: string; is_working: boolean }> = {
  monday: { start: "08:00", end: "16:00", is_working: true },
  tuesday: { start: "08:00", end: "16:00", is_working: true },
  wednesday: { start: "08:00", end: "16:00", is_working: true },
  thursday: { start: "08:00", end: "16:00", is_working: true },
  friday: { start: "08:00", end: "16:00", is_working: true },
  saturday: { start: "08:00", end: "14:00", is_working: true },
  sunday: { start: "00:00", end: "00:00", is_working: false },
};

const DAY_LABELS: [string, string][] = [
  ["monday", "Ponedjeljak"],
  ["tuesday", "Utorak"],
  ["wednesday", "Srijeda"],
  ["thursday", "Četvrtak"],
  ["friday", "Petak"],
  ["saturday", "Subota"],
  ["sunday", "Nedjelja"],
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "settings">("bookings");
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Forma za dodavanje nove usluge (uređivanje postojeće ide kroz EditServiceModal)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");

  // Autocomplete za adresu
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Unosi za Galeriju i Uposlenike
  const [galleryInput, setGalleryInput] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffAvatarUrl, setStaffAvatarUrl] = useState("");
  const [staffBio, setStaffBio] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [staffSaving, setStaffSaving] = useState(false);

  // Forma za postavke salona
  const [shopSettings, setShopSettings] = useState({
    name: "",
    address: "",
    full_address: "",
    phone: "",
    instagram: "",
    latitude: "",
    longitude: "",
    theme: "noir",
    accent_color: "#F59E0B",
    gallery_images: [] as string[],
  });
  const [workingHours, setWorkingHours] = useState<
    Record<string, { start: string; end: string; is_working: boolean }>
  >(DEFAULT_WORKING_HOURS);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    async function loadShops() {
      try {
        const myShops = await getMyShops();
        setShops(myShops);
        if (myShops.length > 0) {
          setSelectedShop(myShops[0]);
        }
      } catch (err) {
        console.error("Greška pri dohvaćanju radnji:", err);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  useEffect(() => {
    if (!selectedShop) return;

    let parsedGallery: string[] = [];
    if (selectedShop.gallery_images) {
      if (Array.isArray(selectedShop.gallery_images)) {
        parsedGallery = selectedShop.gallery_images;
      } else if (typeof selectedShop.gallery_images === "string") {
        try {
          parsedGallery = JSON.parse(selectedShop.gallery_images);
        } catch {
          parsedGallery = [selectedShop.gallery_images];
        }
      }
    }

    setShopSettings({
      name: selectedShop.name || "",
      address: selectedShop.address || "",
      full_address: selectedShop.full_address || "",
      phone: selectedShop.phone || "",
      instagram: selectedShop.instagram || "",
      latitude: selectedShop.latitude ? String(selectedShop.latitude) : "",
      longitude: selectedShop.longitude ? String(selectedShop.longitude) : "",
      theme: selectedShop.theme || "noir",
      accent_color: selectedShop.accent_color || "#F59E0B",
      gallery_images: parsedGallery,
    });

    const shopWorkingHours = selectedShop.working_hours;
    if (shopWorkingHours && typeof shopWorkingHours === "object" && Object.keys(shopWorkingHours).length > 0) {
      setWorkingHours({ ...DEFAULT_WORKING_HOURS, ...shopWorkingHours });
    } else {
      setWorkingHours(DEFAULT_WORKING_HOURS);
    }

    async function loadShopData() {
      try {
        const [servicesData, staffData] = await Promise.all([
          getServicesForShop(selectedShop!.id),
          getStaffForShop(selectedShop!.id),
        ]);
        setServices(servicesData);
        setStaffList(staffData || []);
      } catch (err) {
        console.error("Greška pri učitavanju podataka salona:", err);
      }
    }

    loadShopData();
  }, [selectedShop?.id]);

  const handleAddressChange = async (query: string) => {
    setShopSettings((prev) => ({ ...prev, address: query }));

    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=ba&accept-language=bs,hr,sr,en`,
        {
          headers: {
            "User-Agent": "SalonBookingApp/1.0",
          },
        }
      );
      if (!res.ok) throw new Error("Neuspješna pretraga");
      const data = await res.json();
      setAddressSuggestions(data);
    } catch (err) {
      console.error("Greška pri pretrazi adrese:", err);
      setAddressSuggestions([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const selectSuggestion = (item: any) => {
    setShopSettings((prev) => ({
      ...prev,
      address: item.display_name,
      latitude: item.lat,
      longitude: item.lon,
    }));
    setAddressSuggestions([]);
  };

  const handleAddImage = () => {
    if (!galleryInput.trim()) return;
    setShopSettings((prev) => ({
      ...prev,
      gallery_images: [...prev.gallery_images, galleryInput.trim()],
    }));
    setGalleryInput("");
  };

  const handleRemoveImage = (index: number) => {
    setShopSettings((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const handleSaveStaff = async () => {
    if (!staffName.trim() || !selectedShop) return;

    setStaffSaving(true);
    try {
      const created = await createStaff({
        shop_id: selectedShop.id,
        name: staffName.trim(),
        role: staffRole.trim() || "Frizer / Barber",
        avatar_url: staffAvatarUrl.trim() || undefined,
        bio: staffBio.trim() || undefined,
        phone: staffPhone.trim() || undefined,
        email: staffEmail.trim() || undefined,
      });
      setStaffList((prev) => [...prev, created]);
      setStaffName("");
      setStaffRole("");
      setStaffAvatarUrl("");
      setStaffBio("");
      setStaffPhone("");
      setStaffEmail("");
    } catch (err) {
      alert("Greška pri dodavanju uposlenika.");
    } finally {
      setStaffSaving(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push("/admin/login");
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !title || !price) return;

    const payload = {
      title,
      description,
      price: parseFloat(price),
      duration_minutes: parseInt(durationMinutes),
      shop_id: selectedShop.id,
    };

    try {
      const created = await createService(payload);
      setServices((prev) => [...prev, created]);
      setTitle("");
      setDescription("");
      setPrice("");
      setDurationMinutes("30");
    } catch (err) {
      alert("Greška pri spašavanju usluge.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    setSavingSettings(true);
    try {
      const updatedShop = await updateShop(selectedShop.id, {
        name: shopSettings.name,
        address: shopSettings.address,
        full_address: shopSettings.full_address,
        phone: shopSettings.phone,
        instagram: shopSettings.instagram,
        latitude: shopSettings.latitude ? parseFloat(shopSettings.latitude) : null,
        longitude: shopSettings.longitude ? parseFloat(shopSettings.longitude) : null,
        theme: shopSettings.theme,
        accent_color: shopSettings.accent_color,
        working_hours: workingHours,
        gallery_images: shopSettings.gallery_images,
      });

      setSelectedShop(updatedShop);
      setShops((prev) => prev.map((s) => (s.id === updatedShop.id ? updatedShop : s)));
      alert("Postavke salona su uspješno sačuvane!");
    } catch (err: any) {
      console.error(err);
      if (err instanceof ApiError && err.status === 401) {
        alert("Sesija je istekla (401). Prijavite se ponovo.");
        router.push("/admin/login");
      } else {
        alert(err.message || "Greška pri spasavanju postavki salona.");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Učitavanje dashboarda...</div>;
  }

  if (!selectedShop) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Nemate kreiranih radnji</h2>
          <p className="text-sm text-gray-500">
            Da biste mogli upravljati terminima i uslugama, potrebno je da postavite svoj prvi salon.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full py-3 bg-black text-white font-medium rounded-xl text-sm hover:bg-gray-800 transition-colors"
            >
              + Kreirajte svoj prvi salon
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-200 transition-colors"
            >
              Odjava
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
       {/* Header / Navigacija */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">
              Upravljanje radnjom: <span className="font-semibold text-gray-800">{selectedShop.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {shops.length > 1 && (
              <select
                value={selectedShop.id}
                onChange={(e) => {
                  const targetId = Number(e.target.value);
                  const shop = shops.find((s) => s.id === targetId);
                  if (shop) {
                    setSelectedShop({ ...shop });
                  }
                }}
                className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-black cursor-pointer"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            <a
              href={`/${(selectedShop as any).slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Javna stranica ↗
            </a>

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Odjava
            </button>

            {/* TAB DUGMAD */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto justify-center">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${
                  activeTab === "bookings" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                }`}
              >
                Rezervacije
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${
                  activeTab === "services" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                }`}
              >
                Usluge
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-1.5 rounded-md font-medium text-sm transition-colors ${
                  activeTab === "settings" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                }`}
              >
                Postavke
              </button>
            </div>
          </div>
        </div>
        {/* TAB 1: REZERVACIJE */}
        {activeTab === "bookings" && selectedShop && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Zakazani Termini</h2>
            <AdminBookingsCalendar shopId={selectedShop.id} services={services} />
          </div>
        )}

        {/* TAB 2: USLUGE */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Dodaj Uslugu</h2>
              <form onSubmit={handleSaveService} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Naziv usluge</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="npr. Muško šišanje"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Opis (opcionalno)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Kratak opis usluge"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cijena (KM)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trajanje</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-black text-white font-medium rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    Dodaj Uslugu
                  </button>
                </div>
              </form>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Postojeće Usluge</h2>
              <ServicesGrid services={services} onChange={setServices} staffList={staffList} />
            </div>
          </div>
        )}

        {/* TAB 3: POSTAVKE SALONA */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">Postavke Salona: {selectedShop.name}</h2>

            <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
              {/* Sekcija 1: Osnovni podaci */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                  1. Osnovne Informacije & Kontakt
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Naziv Salona</label>
                    <input
                      type="text"
                      value={shopSettings.name}
                      onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Lokacija (za mapu)</label>
                    <input
                      type="text"
                      value={shopSettings.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="Unesite grad ili naselje..."
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Koristi se samo za postavljanje pina na mapi ispod. Za adresu koja se prikazuje klijentima, popunite polje &quot;Puna adresa&quot;.
                    </p>

                    {isSearchingAddress && (
                      <p className="text-xs text-gray-400 mt-1">Pretražujem lokacije...</p>
                    )}

                    {addressSuggestions.length > 0 && (
                      <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto text-xs divide-y">
                        {addressSuggestions.map((item, idx) => (
                          <li
                            key={idx}
                            onClick={() => selectSuggestion(item)}
                            className="p-2.5 hover:bg-gray-50 cursor-pointer text-gray-700"
                          >
                            {item.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Puna adresa (prikazuje se klijentima)</label>
                    <input
                      type="text"
                      value={shopSettings.full_address}
                      onChange={(e) => setShopSettings({ ...shopSettings, full_address: e.target.value })}
                      placeholder="npr. Ulica Alije Izetbegovića 25, 72240 Kakanj"
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Puna adresa sa ulicom i brojem — ovo tačno vide klijenti na javnoj stranici.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={shopSettings.phone}
                      onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                      placeholder="+387 61 000 000"
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Instagram Profil</label>
                    <input
                      type="text"
                      value={shopSettings.instagram}
                      onChange={(e) => setShopSettings({ ...shopSettings, instagram: e.target.value })}
                      placeholder="@mojsalon"
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Sekcija 2: Radno Vrijeme */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                  2. Radno Vrijeme
                </h3>
                <div className="space-y-2">
                  {DAY_LABELS.map(([key, label]) => {
                    const day = workingHours[key] || DEFAULT_WORKING_HOURS[key];
                    return (
                      <div
                        key={key}
                        className="grid grid-cols-3 items-center gap-3 p-2.5 rounded-lg border border-gray-100 bg-gray-50/50"
                      >
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={day.is_working}
                            onChange={(e) =>
                              setWorkingHours((prev) => ({
                                ...prev,
                                [key]: { ...day, is_working: e.target.checked },
                              }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                          />
                          {label}
                        </label>
                        <input
                          type="time"
                          value={day.start}
                          disabled={!day.is_working}
                          onChange={(e) =>
                            setWorkingHours((prev) => ({ ...prev, [key]: { ...day, start: e.target.value } }))
                          }
                          className="px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <input
                          type="time"
                          value={day.end}
                          disabled={!day.is_working}
                          onChange={(e) =>
                            setWorkingHours((prev) => ({ ...prev, [key]: { ...day, end: e.target.value } }))
                          }
                          className="px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sekcija 3: Galerija Slika */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                  3. Galerija Slika (URLs)
                </h3>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors"
                  >
                    Dodaj
                  </button>
                </div>

                {shopSettings.gallery_images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {shopSettings.gallery_images.map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border bg-gray-50 h-24">
                        <img src={url} alt={`Gallery item ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs opacity-80 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sekcija 4: Uposlenici */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                  4. Uposlenici / Barberi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Ime i prezime..."
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="text"
                    placeholder="Uloga (npr. Senior Barber)..."
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="url"
                    placeholder="URL slike (opcionalno)..."
                    value={staffAvatarUrl}
                    onChange={(e) => setStaffAvatarUrl(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon (opcionalno)..."
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="email"
                    placeholder="Email (opcionalno)..."
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    disabled={staffSaving}
                    onClick={handleSaveStaff}
                    className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {staffSaving ? "..." : "Dodaj"}
                  </button>
                </div>
                <textarea
                  placeholder="Kratka biografija (iskustvo, specijalnosti)... opcionalno"
                  value={staffBio}
                  onChange={(e) => setStaffBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black resize-none"
                />

                <StaffGrid staffList={staffList} onChange={setStaffList} />
              </div>

              {/* DUGME ZA SPASAVANJE */}
              <div className="pt-4 border-t flex justify-between items-center">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingSettings ? "Spašavanje..." : "Sačuvaj Sve Postavke"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}