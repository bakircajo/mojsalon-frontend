"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import AdminNav from "@/components/AdminNav";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import { ApiError, createShop, getMyShops } from "@/lib/api";
import type { Shop } from "@/lib/types";

// Podrazumijevano radno vrijeme usklađeno sa backend modelom
const DEFAULT_WORKING_HOURS = {
  monday: { start: "08:00", end: "16:00", is_working: true },
  tuesday: { start: "08:00", end: "16:00", is_working: true },
  wednesday: { start: "08:00", end: "16:00", is_working: true },
  thursday: { start: "08:00", end: "16:00", is_working: true },
  friday: { start: "08:00", end: "16:00", is_working: true },
  saturday: { start: "08:00", end: "14:00", is_working: true },
  sunday: { start: "00:00", end: "00:00", is_working: false },
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // --- State za adresu i koordinate ---
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // --- State za radno vrijeme ---
  const [workingHours, setWorkingHours] = useState(DEFAULT_WORKING_HOURS);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function loadShops() {
    setLoading(true);
    getMyShops()
      .then((data) => {
        if (Array.isArray(data)) {
          setShops(data);
        } else {
          setShops([]);
        }
      })
      .catch((err) => {
        console.error("Greška pri učitavanju salona:", err);
        setShops([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadShops();
  }, []);

  // Funkcija za pretragu adrese sa interneta (Nominatim API)
  const handleSearchAddress = async (query: string) => {
    setAddress(query);
    setLatitude(null);
    setLongitude(null);

    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            "Accept-Language": "bs, hr, sr, en",
          },
        }
      );
      if (!res.ok) throw new Error("Mrežna greška pri pretrazi");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error("Greška pri pretrazi adrese:", err);
      setSuggestions([]);
    }
  };

  const handleSelectAddress = (item: any) => {
    setAddress(item.display_name || "");
    setLatitude(item.lat ? parseFloat(item.lat) : null);
    setLongitude(item.lon ? parseFloat(item.lon) : null);
    setSuggestions([]);
  };

  // Helper za izmjenu radnog vremena pojedinog dana
  const handleWorkingHourChange = (day: string, field: string, value: any) => {
    setWorkingHours((prev: any) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Naziv radnje je obavezan.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await createShop({
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        latitude,
        longitude,
        working_hours: workingHours,
      });

      setName("");
      setDescription("");
      setAddress("");
      setLatitude(null);
      setLongitude(null);
      setWorkingHours(DEFAULT_WORKING_HOURS);
      setShowForm(false);
      loadShops();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Kreiranje radnje nije uspjelo."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-stub">
              Pregled
            </p>
            <h1 className="mt-1 font-display text-3xl italic text-ink">
              Moji saloni
            </h1>
          </div>
          <Button
            onClick={() => setShowForm((s) => !s)}
            variant={showForm ? "secondary" : "primary"}
          >
            {showForm ? "Otkaži" : "+ Nova radnja"}
          </Button>
        </div>

        {showForm && (
          <Card className="mt-6 p-6">
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input
                id="shopName"
                label="Naziv radnje"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="npr. Studio Bella"
              />

              <div className="relative">
                <Input
                  id="shopAddress"
                  label="Adresa (lokacija biznisa)"
                  value={address}
                  onChange={(e) => handleSearchAddress(e.target.value)}
                  placeholder="Unesite adresu (npr. Kralja Tomislava, Mostar)"
                />

                {suggestions.length > 0 && (
                  <ul className="absolute z-20 w-full bg-white border border-line mt-1 rounded-sm shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((item, index) => (
                      <li
                        key={index}
                        onClick={() => handleSelectAddress(item)}
                        className="p-2.5 text-sm hover:bg-gray-50 cursor-pointer border-b border-line last:border-none"
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
                {latitude && longitude && (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Lokacija uspješno prepoznata na mapi
                  </p>
                )}
              </div>

              <Textarea
                id="shopDescription"
                label="Opis (opciono)"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kratak opis radnje i ponude…"
              />

              <div className="border-t border-line pt-4 mt-2">
                <h3 className="text-sm font-semibold text-ink mb-3">
                  Radno vrijeme
                </h3>
                <div className="grid gap-3">
                  {Object.entries(workingHours).map(
                    ([day, hours]: [string, any]) => (
                      <div
                        key={day}
                        className="flex items-center justify-between gap-2 text-sm bg-gray-50 p-2.5 rounded-sm border border-line"
                      >
                        <div className="flex items-center gap-2 w-32">
                          <input
                            type="checkbox"
                            checked={hours.is_working}
                            onChange={(e) =>
                              handleWorkingHourChange(
                                day,
                                "is_working",
                                e.target.checked
                              )
                            }
                            className="rounded border-line text-ink focus:ring-ink"
                          />
                          <span className="capitalize font-medium text-ink">
                            {day === "monday"
                              ? "Ponedjeljak"
                              : day === "tuesday"
                              ? "Utorak"
                              : day === "wednesday"
                              ? "Srijeda"
                              : day === "thursday"
                              ? "Četvrtak"
                              : day === "friday"
                              ? "Petak"
                              : day === "saturday"
                              ? "Subota"
                              : "Nedjelja"}
                          </span>
                        </div>

                        {hours.is_working ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={hours.start}
                              onChange={(e) =>
                                handleWorkingHourChange(
                                  day,
                                  "start",
                                  e.target.value
                                )
                              }
                              className="border border-line rounded px-2 py-1 text-xs bg-white"
                            />
                            <span>do</span>
                            <input
                              type="time"
                              value={hours.end}
                              onChange={(e) =>
                                handleWorkingHourChange(
                                  day,
                                  "end",
                                  e.target.value
                                )
                              }
                              className="border border-line rounded px-2 py-1 text-xs bg-white"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">
                            Neradni dan
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-stub-dark">{error}</p>}
              <Button
                type="submit"
                loading={creating}
                className="self-start mt-2"
              >
                Sačuvaj radnju
              </Button>
            </form>
          </Card>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-sm text-muted">Učitavanje…</p>
          ) : !shops || shops.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted">
                Još uvijek nemate nijednu radnju. Kreirajte prvu da počnete
                primati rezervacije.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="rounded-sm border border-line bg-white p-6 flex flex-col justify-between"
                >
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
                      Kod salona #{shop.id}
                    </p>
                    <h2 className="mt-1 font-display text-xl text-ink">
                      {shop.name}
                    </h2>
                    {shop.address && (
                      <p className="mt-1 text-xs text-muted flex items-center gap-1">
                        📍 {shop.address}
                      </p>
                    )}
                    {shop.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {shop.description}
                      </p>
                    )}
                  </div>

                  {/* DUGME ZA UPRAVLJANJE SALONOM I RADNIM VREMENOM */}
                  <div className="mt-6 pt-4 border-t border-line">
                    <Link
                      href={`/admin/shops/${shop.id}`}
                      className="block w-full text-center bg-black text-white py-2.5 rounded text-sm font-medium hover:bg-gray-800 transition"
                    >
                      ⚙️ Upravljaj salonom i radnim vremenom
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}