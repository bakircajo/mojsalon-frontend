"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";

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
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-12 text-center">
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
      </main>
    </div>
  );
}