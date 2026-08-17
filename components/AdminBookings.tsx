"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getShopBookings, updateBookingStatus, deleteBooking } from "@/lib/api";
import type { Booking } from "@/lib/types";

interface AdminBookingsProps {
  shopId: number;
}

export default function AdminBookings({ shopId }: AdminBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter stanja
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getShopBookings(shopId);
      setBookings(data);
    } catch (err) {
      console.error("Greška pri učitavanju rezervacija:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [shopId]);

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      loadBookings();
    } catch (err) {
      alert("Greška pri izmjeni statusa");
    }
  };

  const handleDelete = async (bookingId: number) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovu rezervaciju?")) return;
    try {
      await deleteBooking(bookingId);
      loadBookings();
    } catch (err) {
      alert("Greška pri brisanju rezervacije");
    }
  };

  // Filtriranje rezervacija u realnom vremenu
  const filteredBookings = bookings.filter((b) => {
    // Pretraga po imenu, emailu ili telefonu
    const matchesSearch =
      b.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.client_phone.includes(searchQuery);

    // Filter po statusu
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

    // Filter po datumu (YYYY-MM-DD)
    const matchesDate = !dateFilter || b.start_time.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Kontrolna traka za filtere */}
      <Card className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between">
        {/* Pretraga */}
        <div className="flex-1">
          <Input
            id="search"
            placeholder="Pretraži klijenta (ime, email, telefon)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter po datumu */}
        <div>
          <input
            type="date"
            className="w-full p-2.5 rounded-sm border border-line text-sm outline-none bg-white font-mono"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* Filter po statusu */}
        <div>
          <select
            className="w-full p-2.5 rounded-sm border border-line text-sm outline-none bg-white font-mono uppercase"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Svi statusi</option>
            <option value="CONFIRMED">Potvrđeno</option>
            <option value="PENDING">Na čekanju</option>
            <option value="CANCELLED">Otkazano</option>
          </select>
        </div>

        {(searchQuery || dateFilter || statusFilter !== "ALL") && (
          <Button
            variant="secondary"
            onClick={() => {
              setSearchQuery("");
              setDateFilter("");
              setStatusFilter("ALL");
            }}
          >
            Ocisti
          </Button>
        )}
      </Card>

      {/* Lista / Tabela rezervacija */}
      {loading ? (
        <p className="text-sm text-muted">Učitavanje rezervacija…</p>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted">
          Nema pronađenih rezervacija za odabrane filtere.
        </Card>
      ) : (
        <div className="overflow-x-auto border border-line bg-white rounded-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-zinc-50 font-mono text-[11px] uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">Klijent</th>
                <th className="p-4">Kontakt</th>
                <th className="p-4">Termin</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50/50">
                  <td className="p-4 font-medium text-ink">{b.client_name}</td>
                  <td className="p-4 text-xs text-muted space-y-0.5">
                    <div>{b.client_email}</div>
                    <div>{b.client_phone}</div>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    {new Date(b.start_time).toLocaleString("bs-BA", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider font-bold ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 font-mono text-xs">
                    {b.status !== "CANCELLED" && (
                      <button
                        onClick={() => handleStatusChange(b.id, "CANCELLED")}
                        className="text-rose-600 hover:underline"
                      >
                        Otkaži
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-muted hover:text-ink hover:underline"
                    >
                      Obriši
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}