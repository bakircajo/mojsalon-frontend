"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import AdminNav from "@/components/AdminNav";
import { deleteBooking, getShop, getShopBookings, updateBookingStatus } from "@/lib/api";
import type { Booking, BookingStatus, Shop } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const STATUS_FLOW: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function ShopBookingsPage() {
  return (
    <RequireAuth>
      <BookingsContent />
    </RequireAuth>
  );
}

function BookingsContent() {
  const params = useParams();
  const rawId = params?.shopId || params?.id;
  const shopId = Number(rawId);

  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  function load() {
    if (!shopId || Number.isNaN(shopId)) return;
    setLoading(true);
    Promise.all([getShop(shopId), getShopBookings(shopId)])
      .then(([shopData, bookingData]) => {
        setShop(shopData);

        let loaded: Booking[] = [];
        if (Array.isArray(bookingData)) {
          loaded = bookingData;
        } else if (bookingData && Array.isArray((bookingData as any).data)) {
          loaded = (bookingData as any).data;
        }
        setBookings(loaded);
      })
      .catch((err) => console.error("Greška pri učitavanju:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (shopId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function handleStatusChange(bookingId: number, status: BookingStatus) {
    setUpdatingId(bookingId);
    try {
      const updated = await updateBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch {
      alert("Greška pri promjeni statusa.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(bookingId: number) {
    if (!confirm("Da li ste sigurni da želite obrisati ovu rezervaciju?")) return;
    setDeletingId(bookingId);
    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setSelectedIds((prev) => prev.filter((id) => id !== bookingId));
    } catch {
      alert("Greška pri brisanju rezervacije.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Obriši ${selectedIds.length} selektovanih rezervacija?`)) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteBooking(id)));
      setBookings((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
      setSelectedIds([]);
    } catch {
      alert("Greška pri brisanju selektovanih rezervacija.");
    }
  }

  const visibleBookings =
    filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const handleSelectAll = () => {
    if (selectedIds.length === visibleBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleBookings.map((b) => b.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCSV = () => {
    const selectedData = bookings.filter((b) => selectedIds.includes(b.id));

    if (selectedData.length === 0) {
      alert("Izaberite barem jednu rezervaciju za izvoz.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "ID,Klijent,Email,Telefon,Termin,Status\n";

    selectedData.forEach((b: any) => {
      const clientName = b.client_name || b.customer_name || b.name || "N/A";
      const clientEmail = b.client_email || b.customer_email || b.email || "N/A";
      const clientPhone = b.client_phone || b.customer_phone || b.phone || "N/A";
      const startTime = b.start_time || b.booking_time || b.date;

      csvContent += `${b.id},"${clientName}","${clientEmail}","${clientPhone}","${formatDateTime(startTime)}","${b.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rezervacije_radnja_${shopId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AdminNav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href={`/admin/shops/${shopId}`}
          className="text-xs text-gray-500 underline underline-offset-2"
        >
          ← Nazad na {shop ? shop.name : "radnju"}
        </Link>

        {/* DIRETKNI KONTROLNI BOX */}
        <div className="mt-4 p-4 border-4 border-black bg-yellow-100 rounded">
          <p className="font-bold text-black text-sm uppercase">
            ⚡ DIKTAN PRATILAC KODA: Pronađeno rezervacija u bazi: {bookings.length}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="font-display text-3xl italic text-black">Rezervacije</h1>
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["ALL", ...STATUS_FLOW] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border border-black px-3 py-1 font-mono text-xs uppercase ${
                  filter === s ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                {s === "ALL" ? "Sve" : s}
              </button>
            ))}
          </div>

          {visibleBookings.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 border border-black text-xs font-bold bg-white hover:bg-gray-100"
              >
                {selectedIds.length === visibleBookings.length ? "Odznači sve" : "Označi sve"}
              </button>

              {selectedIds.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-black text-white text-xs font-bold"
                  >
                    📄 Izvezi ({selectedIds.length})
                  </button>

                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                  >
                    🗑️ OBRIŠI SELEKTOVANO ({selectedIds.length})
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Lista sa čestim HTML-om bez eksternih UI komponenti */}
        <div className="mt-6 flex flex-col gap-4">
          {loading ? (
            <p className="p-4 font-mono text-sm">Učitavanje podataka...</p>
          ) : visibleBookings.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-400 text-center bg-white">
              <p className="text-gray-600 font-bold">Nema rezervacija za prikaz u ovom filteru.</p>
              <p className="text-xs text-gray-500 mt-1">
                Ukupno u bazi: {bookings.length}
              </p>
            </div>
          ) : (
            visibleBookings.map((b: any) => {
              const name = b.client_name || b.customer_name || b.name || "Nepoznat klijent";
              const email = b.client_email || b.customer_email || b.email || "-";
              const phone = b.client_phone || b.customer_phone || b.phone || "-";
              const time = b.start_time || b.booking_time || b.date;

              return (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-5 border-2 border-black bg-white shadow-sm"
                >
                  {/* CHECKBOX I PODACI */}
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(b.id)}
                      onChange={() => handleSelectOne(b.id)}
                      className="h-6 w-6 cursor-pointer border-2 border-black accent-black"
                    />
                    <div>
                      <p className="font-bold text-black text-base">{name}</p>
                      <p className="text-xs text-gray-600">{email} · {phone}</p>
                      <p className="mt-1 font-mono text-xs text-gray-500">{formatDateTime(time)}</p>
                    </div>
                  </div>

                  {/* STATUS I KANTA */}
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-gray-200 text-xs font-mono font-bold uppercase rounded border border-gray-400">
                      {b.status}
                    </span>

                    <select
                      value={b.status}
                      disabled={updatingId === b.id}
                      onChange={(e) => handleStatusChange(b.id, e.target.value as BookingStatus)}
                      className="border border-black bg-white px-2 py-1 font-mono text-xs uppercase"
                    >
                      {STATUS_FLOW.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    {/* DUGME KANTA */}
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 font-bold text-xs hover:bg-red-700 transition-colors rounded"
                      title="Obriši rezervaciju"
                    >
                      🗑️ Obriši
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}