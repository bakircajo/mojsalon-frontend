"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import { getPublicShops } from "@/lib/api";
import { isShopOpenNow } from "@/lib/format";
import type { Shop as FullShop } from "@/lib/types";

interface Shop {
  id: number;
  name: string;
  slug: string;
}

export default function HomePage() {
  const [salonQuery, setSalonQuery] = useState("");
  const [results, setResults] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Grid svih objavljenih salona (učitava se jednom, filtrira se lokalno dok korisnik kuca)
  const [allShops, setAllShops] = useState<FullShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  useEffect(() => {
    getPublicShops()
      .then(setAllShops)
      .catch((err) => {
        console.error("Greška pri učitavanju salona:", err);
        setAllShops([]);
      })
      .finally(() => setShopsLoading(false));
  }, []);

  const filteredShops = useMemo(() => {
    const trimmed = salonQuery.trim().toLowerCase();
    if (!trimmed) return allShops;
    return allShops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(trimmed) ||
        (shop.address || "").toLowerCase().includes(trimmed)
    );
  }, [allShops, salonQuery]);

  // Debounced live pretraga dok korisnik kuca
  useEffect(() => {
    const trimmed = salonQuery.trim();

    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/shops/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Greška pri pretrazi salona:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Čeka 300ms nakon zadnjeg pritiska tipke

    return () => clearTimeout(timer);
  }, [salonQuery]);

  const handleSelectShop = (slug: string) => {
    setResults([]);
    setSalonQuery("");
    router.push(`/${slug}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      // Preusmjeri na prvi rezultat ako korisnik samo stisne Enter
      handleSelectShop(results[0].slug);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-xl text-center">
          <h1 className="font-display text-4xl italic text-ink">Pronađi svoj salon</h1>
          <p className="mt-2 text-sm text-muted">
            Unesi naziv salona da otvoriš stranicu i zakažeš termin.
          </p>

          {/* Kontejner za pretragu sa padajućom listom */}
          <div className="relative mt-8 w-full">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={salonQuery}
                onChange={(e) => setSalonQuery(e.target.value)}
                placeholder="Npr. Frizerski Salon Beauty"
                className="flex-1 rounded border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-ink"
              />
              <button
                type="submit"
                className="rounded bg-ink px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Pretraži
              </button>
            </form>

            {/* Padajući rezultati pretrage */}
            {results.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded border border-border bg-white text-left shadow-lg">
                <ul className="max-h-60 overflow-y-auto py-1 text-sm text-ink">
                  {results.map((shop) => (
                    <li
                      key={shop.id}
                      onClick={() => handleSelectShop(shop.slug)}
                      className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-slate-50"
                    >
                      <span className="font-medium">{shop.name}</span>
                      <span className="text-xs text-muted">/{shop.slug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Poruka ako nema rezultata */}
            {salonQuery.trim().length >= 2 && !isLoading && results.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded border border-border bg-white p-3 text-sm text-muted shadow-lg">
                Nijedan salon nije pronađen.
              </div>
            )}
          </div>
        </div>

        {/* Grid svih objavljenih salona */}
        <div className="mt-16">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
            {salonQuery.trim() ? `Rezultati (${filteredShops.length})` : "Svi Saloni"}
          </h2>

          {shopsLoading ? (
            <p className="mt-4 text-sm text-muted">Učitavanje salona...</p>
          ) : filteredShops.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {allShops.length === 0
                ? "Trenutno nema objavljenih salona."
                : "Nijedan salon ne odgovara pretrazi."}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getCoverImage(shop: FullShop): string | null {
  const raw = shop.gallery_images;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] || null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed[0] ? parsed[0] : null;
  } catch {
    return null;
  }
}

function ShopCard({ shop }: { shop: FullShop }) {
  const cover = getCoverImage(shop);
  const open = isShopOpenNow(shop.working_hours);
  const initial = shop.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link
      href={`/${shop.slug}`}
      className="focus-ring group flex flex-col overflow-hidden rounded border border-line bg-white transition-colors hover:border-ink"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-pine-light">
        {cover ? (
          <img
            src={cover}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-4xl italic text-pine">{initial}</span>
          </div>
        )}

        <span
          className={`absolute right-2 top-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider backdrop-blur-sm ${
            open
              ? "border-pine/20 bg-white/90 text-pine"
              : "border-stub/20 bg-white/90 text-stub"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${open ? "bg-pine" : "bg-stub"}`} />
          {open ? "Otvoreno" : "Zatvoreno"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-4 py-3.5 text-left">
        <h3 className="font-display text-lg italic text-ink">{shop.name}</h3>
        {shop.address && (
          <p className="text-xs text-muted">📍 {shop.address}</p>
        )}
      </div>
    </Link>
  );
}