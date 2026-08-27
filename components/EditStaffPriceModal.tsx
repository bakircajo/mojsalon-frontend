"use client";

import { useState } from "react";
import { upsertStaffServicePrice, deleteStaffServicePrice } from "@/lib/api";
import type { StaffServicePricing } from "@/lib/types";

export default function EditStaffPriceModal({
  staffId,
  staffName,
  service,
  onClose,
  onSaved,
}: {
  staffId: number;
  staffName: string;
  service: StaffServicePricing;
  onClose: () => void;
  onSaved: (updated: StaffServicePricing) => void;
}) {
  const [price, setPrice] = useState(String(service.price));
  const [durationMinutes, setDurationMinutes] = useState(String(service.duration_minutes));
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!price) return;
    setSaving(true);
    try {
      const updated = await upsertStaffServicePrice(staffId, service.id, {
        price: parseFloat(price),
        duration_minutes: parseInt(durationMinutes, 10),
      });
      onSaved(updated);
    } catch {
      alert("Greška pri spašavanju cijene za radnika.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevert() {
    if (!confirm(`Vratiti "${service.title}" na osnovnu cijenu (ukloniti posebnu cijenu za ${staffName})?`)) return;
    setReverting(true);
    try {
      const updated = await deleteStaffServicePrice(staffId, service.id);
      onSaved(updated);
    } catch {
      alert("Greška pri vraćanju na osnovnu cijenu.");
    } finally {
      setReverting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Cijena za {staffName}</h3>
        <p className="mt-1 text-xs text-gray-500">{service.title}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Cijena (KM)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Trajanje</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Spašavanje..." : "Sačuvaj za ovog radnika"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Odustani
            </button>
          </div>

          {service.is_overridden && (
            <button
              type="button"
              onClick={handleRevert}
              disabled={reverting}
              className="w-full rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {reverting ? "Vraćanje..." : "Vrati na osnovnu cijenu"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
