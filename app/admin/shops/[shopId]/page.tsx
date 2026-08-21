"use client";

import { useEffect, useState, use } from "react";
import RequireAuth from "@/components/RequireAuth";
import AdminNav from "@/components/AdminNav";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import {
  getShop,
  updateShop,
  getServicesForShop,
  createService,
  updateService,
  deleteService,
  getStaffForShop,
  createStaff,
  updateStaff,
  deleteStaff,
  updateShopGallery,
} from "@/lib/api";
import type { Shop, Service } from "@/lib/types";

// Lokalni interfejs za Staff
interface Staff {
  id: number;
  name: string;
  role?: string;
  avatar_url?: string;
}

export default function ManageShopPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <RequireAuth>
      <ManageShopContent shopId={Number(resolvedParams.id)} />
    </RequireAuth>
  );
}

function ManageShopContent({ shopId }: { shopId: number }) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"settings" | "services" | "staff" | "gallery">("settings");

  // State za osnovne postavke salona
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    instagram: "",
    accent_color: "#F59E0B",
    latitude: "",
    longitude: "",
  });

  // State za pretragu adrese
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // State za unos/izmjenu usluge
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    price: "",
    duration_minutes: "30",
  });

  // State za radnike i galeriju
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffForm, setStaffForm] = useState({ name: "", role: "", avatar_url: "" });
  const [staffSaving, setStaffSaving] = useState(false);
  const [gallery, setGallery] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [gallerySaving, setGallerySaving] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    Promise.all([
      getShop(shopId),
      getServicesForShop(shopId),
      getStaffForShop(shopId)
    ])
      .then(([shopData, servicesData, staffData]) => {
        setShop(shopData);
        setServices(servicesData);
        setStaffList(staffData || []);
        setGallery((shopData as any).gallery_images || []);
        setFormData({
          name: shopData.name || "",
          address: shopData.address || "",
          instagram: shopData.instagram || "",
          accent_color: shopData.accent_color || "#F59E0B",
          latitude: shopData.latitude ? String(shopData.latitude) : "",
          longitude: shopData.longitude ? String(shopData.longitude) : "",
        });
      })
      .catch((err) => console.error("Greška pri učitavanju:", err))
      .finally(() => setLoading(false));
  }, [shopId]);

  // Pretraga adrese preko OpenStreetMap
  const handleSearchAddress = async (query: string) => {
    setFormData((prev) => ({ ...prev, address: query, latitude: "", longitude: "" }));

    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "bs, hr, sr, en" } }
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Greška pri pretrazi adrese:", err);
    }
  };

  const handleSelectAddress = (item: any) => {
    setFormData((prev) => ({
      ...prev,
      address: item.display_name || "",
      latitude: item.lat || "",
      longitude: item.lon || "",
    }));
    setSuggestions([]);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        accent_color: formData.accent_color,
      };

      if (formData.address.trim()) payload.address = formData.address.trim();
      if (formData.instagram.trim()) payload.instagram = formData.instagram.trim();
      if (formData.latitude) payload.latitude = parseFloat(formData.latitude);
      if (formData.longitude) payload.longitude = parseFloat(formData.longitude);

      const updated = await updateShop(shop.id, payload);
      setShop(updated);
      alert("Postavke salona su uspješno sačuvane!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Provjerite unesene podatke.";
      alert(`Greška: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Dodavanje ili Uređivanje usluge
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !serviceForm.title.trim()) return;

    try {
      const payload = {
        shop_id: shop.id,
        title: serviceForm.title.trim(),
        description: serviceForm.description.trim(),
        price: parseFloat(serviceForm.price) || 0,
        duration_minutes: parseInt(serviceForm.duration_minutes) || 30,
      };

      if (editingServiceId) {
        const updated = await updateService(editingServiceId, payload);
        setServices((prev) => prev.map((s) => (s.id === editingServiceId ? updated : s)));
        setEditingServiceId(null);
      } else {
        const created = await createService(payload);
        setServices((prev) => [...prev, created]);
      }

      setServiceForm({ title: "", description: "", price: "", duration_minutes: "30" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dogodila se greška.";
      alert("Greška pri spašavanju usluge: " + msg);
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      title: service.title,
      description: service.description || "",
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
    });
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
    setServiceForm({ title: "", description: "", price: "", duration_minutes: "30" });
  };

  const handleDeleteService = async (serviceId: number) => {
    if (typeof window !== "undefined" && !window.confirm("Da li ste sigurni da želite obrisati ovu uslugu?")) return;
    try {
      await deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dogodila se greška.";
      alert("Greška pri brisanju: " + msg);
    }
  };

  // Dodavanje ili Uređivanje radnika
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !staffForm.name.trim()) return;

    setStaffSaving(true);
    try {
      if (editingStaffId) {
        const payload = {
          name: staffForm.name.trim(),
          role: staffForm.role.trim() || "Stilista",
          avatar_url: staffForm.avatar_url.trim() || undefined,
        };
        const updated = await updateStaff(editingStaffId, payload);
        setStaffList((prev) => prev.map((st) => (st.id === editingStaffId ? updated : st)));
        setEditingStaffId(null);
      } else {
        const payload = {
          shop_id: shop.id,
          name: staffForm.name.trim(),
          role: staffForm.role.trim() || "Stilista",
          avatar_url: staffForm.avatar_url.trim() || undefined,
        };
        const created = await createStaff(payload);
        setStaffList((prev) => [...prev, created]);
      }

      setStaffForm({ name: "", role: "", avatar_url: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dogodila se greška.";
      alert("Greška pri spašavanju radnika: " + msg);
    } finally {
      setStaffSaving(false);
    }
  };

  const handleEditStaffClick = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      role: staff.role || "",
      avatar_url: staff.avatar_url || "",
    });
  };

  const handleCancelStaffEdit = () => {
    setEditingStaffId(null);
    setStaffForm({ name: "", role: "", avatar_url: "" });
  };

  // Brisanje radnika
  const handleDeleteStaff = async (staffId: number) => {
    if (typeof window !== "undefined" && !window.confirm("Da li ste sigurni da želite obrisati ovog radnika?")) return;
    try {
      await deleteStaff(staffId);
      setStaffList((prev) => prev.filter((st) => st.id !== staffId));
      if (editingStaffId === staffId) handleCancelStaffEdit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dogodila se greška.";
      alert("Greška pri brisanju radnika: " + msg);
    }
  };

  // Dodavanje i brisanje fotogalerije na backendu
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !newImageUrl.trim()) return;

    const updatedGallery = [...gallery, newImageUrl.trim()];
    setGallerySaving(true);
    try {
      await updateShopGallery(shop.id, updatedGallery);
      setGallery(updatedGallery);
      setNewImageUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dogodila se greška.";
      alert("Greška pri spašavanju slike: " + msg);
    } finally {
      setGallerySaving(false);
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!shop) return;
    if (typeof window !== "undefined" && !window.confirm("Obriši sliku iz galerije?")) return;

    const updatedGallery = gallery.filter((_, i) => i !== index);
    setGallerySaving(true);
    try {
      await updateShopGallery(shop.id, updatedGallery);
      setGallery(updatedGallery);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dogodila se greška.";
      alert("Greška pri brisanju slike: " + msg);
    } finally {
      setGallerySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <AdminNav />
        <div className="p-10 text-center text-sm text-muted">Učitavanje podataka salona...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen">
        <AdminNav />
        <div className="p-10 text-center text-sm text-red-500">Salon nije pronađen.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AdminNav />
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Upravljanje Salonom</p>
          <h1 className="text-3xl font-bold text-ink">{shop.name}</h1>
        </div>

        {/* TAB NAVIGACIJA */}
        <div className="flex border-b border-line gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "settings" ? "border-black text-black" : "border-transparent text-muted"
            }`}
          >
            ⚙️ Postavke Profila
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "services" ? "border-black text-black" : "border-transparent text-muted"
            }`}
          >
            ✂️ Cjenovnik ({services.length})
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "staff" ? "border-black text-black" : "border-transparent text-muted"
            }`}
          >
            💈 Uposlenici ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "gallery" ? "border-black text-black" : "border-transparent text-muted"
            }`}
          >
            🖼️ Fotogalerija ({gallery.length})
          </button>
        </div>

        {/* TAB 1: POSTAVKE */}
        {activeTab === "settings" && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-ink mb-4">Postavke i Profil</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <Input
                id="name"
                label="Naziv Salona"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="relative">
                <Input
                  id="address"
                  label="Adresa"
                  value={formData.address}
                  onChange={(e) => void handleSearchAddress(e.target.value)}
                  placeholder="Unesite adresu..."
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-line mt-1 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => handleSelectAddress(item)}
                        className="p-2 text-xs hover:bg-gray-50 cursor-pointer border-b border-line last:border-none"
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Input
                id="instagram"
                label="Instagram Korisničko Ime"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="latitude"
                  label="Geografska širina (Lat)"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
                <Input
                  id="longitude"
                  label="Geografska dužina (Lng)"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Boja Akcenta</label>
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="h-10 w-20 cursor-pointer rounded border border-line p-1"
                />
              </div>

              <Button type="submit" loading={saving} className="mt-2">
                Sačuvaj Postavke
              </Button>
            </form>
          </Card>
        )}

        {/* TAB 2: CJENOVNIK */}
        {activeTab === "services" && (
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-ink">
              {editingServiceId ? "Uredi Uslugu" : "Dodaj Novu Uslugu"}
            </h2>

            <form onSubmit={handleSaveService} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-line">
              <Input
                id="serviceTitle"
                label="Naziv usluge"
                value={serviceForm.title}
                onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                required
              />
              <Input
                id="servicePrice"
                label="Cijena (KM)"
                type="number"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                required
              />
              <Input
                id="serviceDuration"
                label="Trajanje (minuta)"
                type="number"
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                required
              />
              <Input
                id="serviceDesc"
                label="Opis"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingServiceId ? "Sačuvaj Izmjene" : "+ Dodaj Uslugu"}
                </Button>
                {editingServiceId && (
                  <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                    Odustani
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-2">
              {services.length === 0 ? (
                <p className="text-xs text-muted italic">Nema dodanih usluga.</p>
              ) : (
                services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-white border border-line rounded">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{s.title}</h4>
                      <p className="text-xs text-muted">{s.duration_minutes} min — {s.price} KM</p>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleEditClick(s)}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        Uredi
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteService(s.id)}
                        className="text-red-600 font-medium hover:underline"
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* TAB 3: UPOSLENICI */}
        {activeTab === "staff" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-ink">
              {editingStaffId ? "Uredi Radnika" : "Dodaj Radnika"}
            </h2>
            <form onSubmit={handleSaveStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-line">
              <Input
                label="Ime i prezime"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                required
              />
              <Input
                label="Uloga / Pozicija"
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                placeholder="npr. Barber / Frizer"
              />
              <div className="sm:col-span-2">
                <Input
                  label="URL Avatara / Slike"
                  value={staffForm.avatar_url}
                  onChange={(e) => setStaffForm({ ...staffForm, avatar_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit" loading={staffSaving} className="flex-1">
                  {editingStaffId ? "Sačuvaj Izmjene" : "+ Sačuvaj Radnika"}
                </Button>
                {editingStaffId && (
                  <Button type="button" variant="secondary" onClick={handleCancelStaffEdit}>
                    Odustani
                  </Button>
                )}
              </div>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {staffList.length === 0 ? (
                <p className="col-span-full text-xs text-muted italic">Nema dodanih radnika.</p>
              ) : (
                staffList.map((st) => (
                  <div
                    key={st.id}
                    className={`p-3 bg-white border rounded text-center relative group ${
                      editingStaffId === st.id ? "border-black ring-1 ring-black" : "border-line"
                    }`}
                  >
                    <img
                      src={st.avatar_url || "https://via.placeholder.com/80"}
                      alt={st.name}
                      className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                    />
                    <h5 className="font-bold text-sm text-ink">{st.name}</h5>
                    <p className="text-xs text-muted">{st.role || "Stilista"}</p>
                    <div className="mt-2 flex justify-center gap-3 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleEditStaffClick(st)}
                        className="text-blue-600 hover:underline"
                      >
                        Uredi
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteStaff(st.id)}
                        className="text-red-600 hover:underline"
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* TAB 4: FOTOGALERIJA */}
        {activeTab === "gallery" && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-ink">Fotogalerija Radova</h2>
            <form onSubmit={handleAddImage} className="flex gap-2">
              <Input
                placeholder="Unesite URL slike..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <Button type="submit" loading={gallerySaving}>+ Dodaj</Button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {gallery.length === 0 ? (
                <p className="col-span-full text-xs text-muted italic">Nema dodanih slika u galeriji.</p>
              ) : (
                gallery.map((url, i) => (
                  <div key={i} className="relative group h-32 bg-gray-100 rounded border border-line overflow-hidden">
                    <img src={url} alt={`Slika ${i}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void handleDeleteImage(i)}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Obriši
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}