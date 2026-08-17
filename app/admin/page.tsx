"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyShops,
  getShopBookings,
  getServicesForShop,
  updateBookingStatus,
  createService,
  deleteService,
  deleteBooking,
} from "@/lib/api";
import { removeToken } from "@/lib/auth";
import type { Shop, Booking, Service, BookingStatus } from "@/lib/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "settings">("bookings");
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Pretraga i selekcija rezervacija
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Forma za usluge
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");

  // Forma za postavke salona
  const [shopSettings, setShopSettings] = useState({
    name: "",
    address: "",
    phone: "",
    instagram: "",
    latitude: "",
    longitude: "",
    theme: "noir",
    accent_color: "#F59E0B",
    work_start: "09:00",
    work_end: "17:00",
    work_days: "Pon-Sub",
  });
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

    // Popuni postavke podacima izabranog salona
    setShopSettings({
      name: selectedShop.name || "",
      address: selectedShop.address || "",
      phone: (selectedShop as any).phone || "",
      instagram: selectedShop.instagram || "",
      latitude: selectedShop.latitude ? String(selectedShop.latitude) : "",
      longitude: selectedShop.longitude ? String(selectedShop.longitude) : "",
      theme: selectedShop.theme || "noir",
      accent_color: selectedShop.accent_color || "#F59E0B",
      work_start: (selectedShop as any).work_start || "09:00",
      work_end: (selectedShop as any).work_end || "17:00",
      work_days: (selectedShop as any).work_days || "Pon-Sub",
    });

    async function loadShopData() {
      try {
        const [bookingsData, servicesData] = await Promise.all([
          getShopBookings(selectedShop.id),
          getServicesForShop(selectedShop.id),
        ]);
        setBookings(bookingsData);
        setServices(servicesData);
        setSelectedIds([]);
      } catch (err) {
        console.error("Greška pri učitavanju podataka salona:", err);
      }
    }

    loadShopData();
  }, [selectedShop]);

  const handleLogout = () => {
    removeToken();
    router.push("/admin/login");
  };

  const handleStatusChange = async (bookingId: number, status: BookingStatus) => {
    try {
      const updated = await updateBookingStatus(bookingId, status);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b))
      );
    } catch (err) {
      alert("Neuspješna promjena statusa rezervacije.");
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovu rezervaciju?")) return;
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setSelectedIds((prev) => prev.filter((id) => id !== bookingId));
    } catch (err) {
      alert("Greška pri brisanju rezervacije.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Da li ste sigurni da želite obrisati ${selectedIds.length} selektovanih rezervacija?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteBooking(id)));
      setBookings((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    } catch (err) {
      alert("Greška pri brisanju selektovanih rezervacija.");
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map((b) => b.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !title || !price) return;

    try {
      const created = await createService({
        title,
        description,
        price: parseFloat(price),
        duration_minutes: parseInt(durationMinutes),
        shop_id: selectedShop.id,
      });
      setServices((prev) => [...prev, created]);
      setTitle("");
      setDescription("");
      setPrice("");
    } catch (err) {
      alert("Greška pri kreiranju usluge.");
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu uslugu?")) return;
    try {
      await deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      alert("Greška pri brisanju usluge.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;

    setSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/api/v1/shops/${selectedShop.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: shopSettings.name,
          address: shopSettings.address,
          phone: shopSettings.phone,
          instagram: shopSettings.instagram,
          latitude: shopSettings.latitude ? parseFloat(shopSettings.latitude) : null,
          longitude: shopSettings.longitude ? parseFloat(shopSettings.longitude) : null,
          theme: shopSettings.theme,
          accent_color: shopSettings.accent_color,
          work_start: shopSettings.work_start,
          work_end: shopSettings.work_end,
          work_days: shopSettings.work_days,
        }),
      });

      if (!res.ok) throw new Error("Greška pri spasavanju postavki");

      const updatedShop = await res.json();
      setSelectedShop(updatedShop);
      setShops((prev) => prev.map((s) => (s.id === updatedShop.id ? updatedShop : s)));
      alert("Postavke salona su uspješno sačuvane!");
    } catch (err: any) {
      alert(err.message || "Greška pri spasavanju postavki salona.");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredBookings = bookings.filter((b) =>
    b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.client_phone.includes(searchQuery) ||
    b.client_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  const shop = shops.find((s) => s.id === Number(e.target.value));
                  if (shop) setSelectedShop(shop);
                }}
                className="px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-black"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => router.push("/onboarding")}
              className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              + Novi salon
            </button>

            <a
              href={`/${selectedShop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Javna stranica ↗
            </a>

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
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
        {activeTab === "bookings" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Zakazani Termini</h2>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="🔍 Pretraži klijenta ili telefon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm w-full sm:w-64 outline-none focus:ring-1 focus:ring-black"
                />

                {selectedIds.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1 shrink-0"
                  >
                    🗑️ Obriši ({selectedIds.length})
                  </button>
                )}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">Nema pronadjene rezervacije.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredBookings.length > 0 && selectedIds.length === filteredBookings.length}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3">Klijent</th>
                      <th className="px-4 py-3">Kontakt</th>
                      <th className="px-4 py-3">Datum i Vrijeme</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={() => handleSelectOne(b.id)}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{b.client_name}</td>
                        <td className="px-4 py-3">
                          <div>{b.client_phone}</div>
                          <div className="text-xs text-gray-400">{b.client_email}</div>
                        </td>
                        <td className="px-4 py-3">{new Date(b.start_time).toLocaleString("bs-BA")}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              b.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : b.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleStatusChange(b.id, "confirmed" as BookingStatus)}
                            className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-medium"
                          >
                            Potvrdi
                          </button>
                          <button
                            onClick={() => handleStatusChange(b.id, "cancelled" as BookingStatus)}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium"
                          >
                            Otkaži
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Obriši rezervaciju"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USLUGE */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Dodaj Uslugu</h2>
              <form onSubmit={handleAddService} className="space-y-4">
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
                <button
                  type="submit"
                  className="w-full py-2.5 bg-black text-white font-medium rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  Dodaj Uslugu
                </button>
              </form>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Postojeće Usluge</h2>
              {services.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">Nema unesenih usluga.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {services.map((s) => (
                    <div key={s.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                        {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                        <p className="text-xs text-gray-500 mt-1">{s.duration_minutes} min • {s.price} KM</p>
                      </div>
                      <button
                        onClick={() => handleDeleteService(s.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                      >
                        Obriši
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">1. Osnovne Informacije & Kontakt</h3>
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Adresa Salona</label>
                    <input
                      type="text"
                      value={shopSettings.address}
                      onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={shopSettings.phone}
                      onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      placeholder="+387 61 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Instagram (@korisnicko_ime)</label>
                    <input
                      type="text"
                      value={shopSettings.instagram}
                      onChange={(e) => setShopSettings({ ...shopSettings, instagram: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      placeholder="@mojsalon"
                    />
                  </div>
                </div>
              </div>

              {/* Sekcija 2: Radno Vrijeme & Radni Dani */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">2. Radno Vrijeme & Radni Dani</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Radni Dani</label>
                    <input
                      type="text"
                      value={shopSettings.work_days}
                      onChange={(e) => setShopSettings({ ...shopSettings, work_days: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      placeholder="npr. Pon-Sub"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Početak Radnog Vremena</label>
                    <input
                      type="time"
                      value={shopSettings.work_start}
                      onChange={(e) => setShopSettings({ ...shopSettings, work_start: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kraj Radnog Vremena</label>
                    <input
                      type="time"
                      value={shopSettings.work_end}
                      onChange={(e) => setShopSettings({ ...shopSettings, work_end: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Sekcija 3: Lokacija (Koordinate za Mapu) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">3. Geografska Lokacija (Karta)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Latitude (Širina)</label>
                    <input
                      type="number"
                      step="any"
                      value={shopSettings.latitude}
                      onChange={(e) => setShopSettings({ ...shopSettings, latitude: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      placeholder="npr. 43.8563"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Longitude (Dužina)</label>
                    <input
                      type="number"
                      step="any"
                      value={shopSettings.longitude}
                      onChange={(e) => setShopSettings({ ...shopSettings, longitude: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                      placeholder="npr. 18.4131"
                    />
                  </div>
                </div>
              </div>

              {/* Sekcija 4: Dizajn i Tema */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">4. Tema i Izgled Javne Stranice</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tema</label>
                    <select
                      value={shopSettings.theme}
                      onChange={(e) => setShopSettings({ ...shopSettings, theme: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                    >
                      <option value="noir">Noir (Tamna/Crna)</option>
                      <option value="steel">Steel (Tamno Plava)</option>
                      <option value="royal">Royal (Svijetlo Plava)</option>
                      <option value="forest">Forest (Zelena)</option>
                      <option value="espresso">Espresso (Smeđa)</option>
                      <option value="velvet">Velvet (Ljubičasta/Siva)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Akcentna Boja</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={shopSettings.accent_color}
                        onChange={(e) => setShopSettings({ ...shopSettings, accent_color: e.target.value })}
                        className="h-9 w-12 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={shopSettings.accent_color}
                        onChange={(e) => setShopSettings({ ...shopSettings, accent_color: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sačuvaj dugme */}
              <div className="pt-4 border-t">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-black text-white font-medium rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {savingSettings ? "Spasavanje..." : "Sačuvaj Postavke Salona"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}