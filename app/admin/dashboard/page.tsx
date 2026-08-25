"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getMyShops,
  getShopBookings,
  getServicesForShop,
  updateBookingStatus,
  createService,
  updateService,
  deleteService,
  deleteBooking,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffForShop,
  updateShop,
  deleteShop,
  ApiError,
} from "@/lib/api";
import { clearToken } from "@/lib/auth";
import type { Shop, Booking, Service, BookingStatus } from "@/lib/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "settings">("bookings");
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // State za paginaciju rezervacija
  const [page, setPage] = useState<number>(1);
  const LIMIT = 10;

  // Pretraga i selekcija rezervacija
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Forma za usluge (Dodavanje / Uređivanje)
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");

  // Autocomplete za adresu
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Unosi za Galeriju i Uposlenike
  const [galleryInput, setGalleryInput] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [staffAvatarUrl, setStaffAvatarUrl] = useState("");
  const [staffList, setStaffList] = useState<{ id: number; name: string; role?: string; avatar_url?: string }[]>([]);
  const [staffSaving, setStaffSaving] = useState(false);

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
    gallery_images: [] as string[],
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
      phone: (selectedShop as any).phone || "",
      instagram: selectedShop.instagram || "",
      latitude: selectedShop.latitude ? String(selectedShop.latitude) : "",
      longitude: selectedShop.longitude ? String(selectedShop.longitude) : "",
      theme: selectedShop.theme || "noir",
      accent_color: selectedShop.accent_color || "#F59E0B",
      work_start: (selectedShop as any).work_start || "09:00",
      work_end: (selectedShop as any).work_end || "17:00",
      work_days: (selectedShop as any).work_days || "Pon-Sub",
      gallery_images: parsedGallery,
    });

    async function loadShopData() {
      try {
        const [bookingsData, servicesData, staffData] = await Promise.all([
          getShopBookings(selectedShop!.id),
          getServicesForShop(selectedShop!.id),
          getStaffForShop(selectedShop!.id),
        ]);
        setBookings(bookingsData);
        setServices(servicesData);
        setStaffList(staffData || []);
        setSelectedIds([]);
      } catch (err) {
        console.error("Greška pri učitavanju podataka salona:", err);
      }
    }

    loadShopData();
  }, [selectedShop?.id, page]);

  const handleDeleteShopClick = async () => {
    if (!selectedShop) return;

    const confirmDelete = confirm(
      `Jeste li sigurni da želite obrisati salon "${selectedShop.name}"?\n\nOva akcija je TRAJNA i obrisat će sve povezane rezervacije, usluge i radnike.`
    );

    if (!confirmDelete) return;

    try {
      await deleteShop(selectedShop.id);

      const updatedShops = shops.filter((s) => s.id !== selectedShop.id);
      setShops(updatedShops);

      if (updatedShops.length > 0) {
        setSelectedShop(updatedShops[0]);
      } else {
        setSelectedShop(null);
      }

      alert("Salon je uspješno obrisan!");
    } catch (err: any) {
      alert(err?.message || "Greška pri brisanju salona.");
    }
  };

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
      if (editingStaffId) {
        const updated = await updateStaff(editingStaffId, {
          name: staffName.trim(),
          role: staffRole.trim() || "Frizer / Barber",
          avatar_url: staffAvatarUrl.trim() || undefined,
        });
        setStaffList((prev) => prev.map((s) => (s.id === editingStaffId ? updated : s)));
        setEditingStaffId(null);
      } else {
        const created = await createStaff({
          shop_id: selectedShop.id,
          name: staffName.trim(),
          role: staffRole.trim() || "Frizer / Barber",
          avatar_url: staffAvatarUrl.trim() || undefined,
        });
        setStaffList((prev) => [...prev, created]);
      }
      setStaffName("");
      setStaffRole("");
      setStaffAvatarUrl("");
    } catch (err) {
      alert(editingStaffId ? "Greška pri izmjeni uposlenika." : "Greška pri dodavanju uposlenika.");
    } finally {
      setStaffSaving(false);
    }
  };

  const handleEditStaffClick = (person: { id: number; name: string; role?: string; avatar_url?: string }) => {
    setEditingStaffId(person.id);
    setStaffName(person.name);
    setStaffRole(person.role || "");
    setStaffAvatarUrl(person.avatar_url || "");
  };

  const handleCancelStaffEdit = () => {
    setEditingStaffId(null);
    setStaffName("");
    setStaffRole("");
    setStaffAvatarUrl("");
  };

  const handleRemoveStaff = async (staffId: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovog uposlenika?")) return;
    try {
      await deleteStaff(staffId);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      if (editingStaffId === staffId) handleCancelStaffEdit();
    } catch (err) {
      alert("Greška pri brisanju uposlenika.");
    }
  };

  const handleLogout = () => {
    clearToken();
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
      if (editingServiceId) {
        const updated = await updateService(editingServiceId, payload);
        setServices((prev) => prev.map((s) => (s.id === editingServiceId ? updated : s)));
        setEditingServiceId(null);
      } else {
        const created = await createService(payload);
        setServices((prev) => [...prev, created]);
      }
      setTitle("");
      setDescription("");
      setPrice("");
      setDurationMinutes("30");
    } catch (err) {
      alert("Greška pri spašavanju usluge.");
    }
  };

  const handleEditServiceClick = (s: Service) => {
    setEditingServiceId(s.id);
    setTitle(s.title);
    setDescription(s.description || "");
    setPrice(String(s.price));
    setDurationMinutes(String(s.duration_minutes));
  };

  const handleCancelServiceEdit = () => {
    setEditingServiceId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setDurationMinutes("30");
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
      const updatedShop = await updateShop(selectedShop.id, {
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
        gallery_images: shopSettings.gallery_images,
      } as any);

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

  const filteredBookings = bookings.filter(
    (b) =>
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
                  const targetId = Number(e.target.value);
                  const shop = shops.find((s) => s.id === targetId);
                  if (shop) {
                    setSelectedShop({ ...shop });
                    setPage(1);
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

            <button
              onClick={() => router.push("/onboarding")}
              className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              + Novi salon
            </button>

            <a
              href={`/${(selectedShop as any).slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Javna stranica ↗
            </a>

            {/* DUGME ZA BRISANJE SALONA */}
            <button
              onClick={handleDeleteShopClick}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              title="Trajno obriši salon"
            >
              🗑️ Obriši salon
            </button>

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
              <p className="text-gray-500 text-sm py-8 text-center">Nema pronađene rezervacije.</p>
            ) : (
              <div className="overflow-x-auto space-y-4">
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
                      <th className="px-4 py-3">Uposlenik</th>
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
                          {b.staff?.name ? (
                            <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                              {b.staff.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Nije naznačeno</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>{b.client_phone}</div>
                          <div className="text-xs text-gray-400">{b.client_email}</div>
                        </td>
                        <td className="px-4 py-3">{new Date(b.start_time).toLocaleString("bs-BA")}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              b.status === "CONFIRMED"
                                ? "bg-green-100 text-green-700"
                                : b.status === "CANCELLED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleStatusChange(b.id, "CONFIRMED" as BookingStatus)}
                            className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-medium"
                          >
                            Potvrdi
                          </button>
                          <button
                            onClick={() => handleStatusChange(b.id, "CANCELLED" as BookingStatus)}
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

                {/* Navigacija za Paginaciju */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    ← Prethodna
                  </button>

                  <span className="text-xs font-medium text-gray-500">Stranica {page}</span>

                  <button
                    disabled={bookings.length < LIMIT}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    Sljedeća →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USLUGE */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                {editingServiceId ? "Uredi Uslugu" : "Dodaj Uslugu"}
              </h2>
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
                    {editingServiceId ? "Sačuvaj Izmjene" : "Dodaj Uslugu"}
                  </button>
                  {editingServiceId && (
                    <button
                      type="button"
                      onClick={handleCancelServiceEdit}
                      className="px-3 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      Odustani
                    </button>
                  )}
                </div>
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
                        <p className="text-xs text-gray-500 mt-1">
                          {s.duration_minutes} min • {s.price} KM
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditServiceClick(s)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          Uredi
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Obriši
                        </button>
                      </div>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Adresa Salona</label>
                    <input
                      type="text"
                      value={shopSettings.address}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="Unesite ulicu i broj..."
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Početak Rada</label>
                    <input
                      type="time"
                      value={shopSettings.work_start}
                      onChange={(e) => setShopSettings({ ...shopSettings, work_start: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kraj Rada</label>
                    <input
                      type="time"
                      value={shopSettings.work_end}
                      onChange={(e) => setShopSettings({ ...shopSettings, work_end: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Radni Dani</label>
                    <input
                      type="text"
                      value={shopSettings.work_days}
                      onChange={(e) => setShopSettings({ ...shopSettings, work_days: e.target.value })}
                      placeholder="npr. Pon - Pet"
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
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
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="URL slike (opcionalno)..."
                      value={staffAvatarUrl}
                      onChange={(e) => setStaffAvatarUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="button"
                      disabled={staffSaving}
                      onClick={handleSaveStaff}
                      className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      {staffSaving ? "..." : editingStaffId ? "Sačuvaj" : "Dodaj"}
                    </button>
                    {editingStaffId && (
                      <button
                        type="button"
                        onClick={handleCancelStaffEdit}
                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {staffList.length > 0 && (
                  <div className="divide-y border rounded-lg p-2 bg-gray-50/50">
                    {staffList.map((person) => (
                      <div key={person.id} className="py-2 px-2 flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                              {person.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{person.name}</p>
                            <p className="text-xs text-gray-500">{person.role || "Uposlenik"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditStaffClick(person)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Uredi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStaff(person.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Obriši
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

                <button
                  type="button"
                  onClick={handleDeleteShopClick}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs rounded-lg transition-colors"
                >
                  🗑️ Trajno Obriši Ovaj Salon
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}