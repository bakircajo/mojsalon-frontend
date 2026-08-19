"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import AdminNav from "@/components/AdminNav";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { getShop, updateShop, getServicesForShop, createService, deleteService } from "@/lib/api";
import type { Shop, Service } from "@/lib/types";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    instagram: "",
    accent_color: "#F59E0B",
    latitude: "",
    longitude: "",
  });

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: "",
    duration_minutes: "30",
  });

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    Promise.all([getShop(shopId), getServicesForShop(shopId)])
      .then(([shopData, servicesData]) => {
        setShop(shopData);
        setServices(servicesData);
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
    } catch (err: any) {
      console.error("Detalji greške sa backenda:", err);
      alert(`Greška: ${err.message || "Provjerite unesene podatke ili login status."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !newService.title.trim()) return;

    try {
      const created = await createService({
        shop_id: shop.id,
        title: newService.title.trim(),
        description: newService.description.trim(),
        price: parseFloat(newService.price) || 0,
        duration_minutes: parseInt(newService.duration_minutes) || 30,
      });

      setServices((prev) => [...prev, created]);
      setNewService({ title: "", description: "", price: "", duration_minutes: "30" });
    } catch (err: any) {
      alert("Greška pri dodavanju usluge: " + err.message);
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovu uslugu?")) return;
    try {
      await deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err: any) {
      alert("Greška pri brisanju: " + err.message);
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
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Upravljanje Salonom</p>
          <h1 className="text-3xl font-bold text-ink">{shop.name}</h1>
        </div>

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
            <Input
              id="address"
              label="Adresa"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              id="instagram"
              label="Instagram Korisničko Ime (npr. @mojsalon)"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />

            {/* Polja za koordinate mape */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="latitude"
                label="Geografska širina (Latitude - npr. 43.8563)"
                type="number"
                step="any"
                placeholder="43.8563"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
              <Input
                id="longitude"
                label="Geografska dužina (Longitude - npr. 18.3866)"
                type="number"
                step="any"
                placeholder="18.3866"
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

        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-bold text-ink">Cjenovnik i Usluge</h2>

          <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-100 p-4 rounded-lg">
            <Input
              id="serviceTitle"
              label="Naziv usluge"
              placeholder="npr. Šišanje i brada"
              value={newService.title}
              onChange={(e) => setNewService({ ...newService, title: e.target.value })}
              required
            />
            <Input
              id="servicePrice"
              label="Cijena (KM)"
              type="number"
              placeholder="20"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              required
            />
            <Input
              id="serviceDuration"
              label="Trajanje (minuta)"
              type="number"
              value={newService.duration_minutes}
              onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
              required
            />
            <Input
              id="serviceDesc"
              label="Opis (opciono)"
              placeholder="Kratak opis..."
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Button type="submit" variant="secondary" className="w-full">
                + Dodaj Uslugu u Cjenovnik
              </Button>
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
                  <button
                    type="button"
                    onClick={() => handleDeleteService(s.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Obriši
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}