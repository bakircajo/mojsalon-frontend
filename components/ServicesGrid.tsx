"use client";

import { useEffect, useState } from "react";
import { deleteService, getStaffServicePricing } from "@/lib/api";
import { formatPrice, formatDuration } from "@/lib/format";
import type { Service, Staff, StaffServicePricing } from "@/lib/types";
import EditServiceModal from "./EditServiceModal";
import EditStaffPriceModal from "./EditStaffPriceModal";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.6}>
      <path
        d="M13.5 3.5a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12L7.5 15.5l-3.5 1 1-3.5 8.5-8.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.6}>
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9.4a1.5 1.5 0 0 1-1.5 1.4H8.1a1.5 1.5 0 0 1-1.5-1.4L6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ServicesGrid({
  services,
  onChange,
  staffList = [],
}: {
  services: Service[];
  onChange: (updater: (prev: Service[]) => Service[]) => void;
  staffList?: Staff[];
}) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [staffPricing, setStaffPricing] = useState<StaffServicePricing[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [editingPriceFor, setEditingPriceFor] = useState<StaffServicePricing | null>(null);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || null;

  useEffect(() => {
    if (selectedStaffId === null) return;
    let cancelled = false;
    setPricingLoading(true);
    getStaffServicePricing(selectedStaffId)
      .then((data) => {
        if (!cancelled) setStaffPricing(data);
      })
      .catch(() => {
        if (!cancelled) setStaffPricing([]);
      })
      .finally(() => {
        if (!cancelled) setPricingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStaffId]);

  async function handleDelete(service: Service) {
    if (!confirm(`Da li ste sigurni da želite obrisati uslugu "${service.title}"?`)) return;
    setDeletingId(service.id);
    try {
      await deleteService(service.id);
      onChange((prev) => prev.filter((s) => s.id !== service.id));
    } catch {
      alert("Greška pri brisanju usluge.");
    } finally {
      setDeletingId(null);
    }
  }

  if (services.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nema unesenih usluga.</p>;
  }

  return (
    <>
      {staffList.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStaffId(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedStaffId === null ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Svi Radnici
          </button>
          {staffList.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelectedStaffId(person.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedStaffId === person.id ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {person.name}
            </button>
          ))}
        </div>
      )}

      {selectedStaffId === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <button
                  onClick={() => setEditingService(s)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="Uredi uslugu"
                  aria-label="Uredi uslugu"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  disabled={deletingId === s.id}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  title="Obriši uslugu"
                  aria-label="Obriši uslugu"
                >
                  <TrashIcon />
                </button>
              </div>

              <h3 className="pr-14 text-sm font-semibold text-gray-900">{s.title}</h3>
              {s.description && (
                <p className="mt-1 line-clamp-2 pr-14 text-xs text-gray-500">{s.description}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                  {formatPrice(s.price)}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                  {formatDuration(s.duration_minutes)}
                </span>
                {!s.is_active && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                    Neaktivna
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : pricingLoading ? (
        <p className="py-8 text-center text-sm text-gray-500">Učitavanje cijena...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staffPricing.map((s) => (
            <div
              key={s.id}
              className="relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => setEditingPriceFor(s)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title={`Uredi cijenu za ${selectedStaff?.name || "radnika"}`}
                  aria-label="Uredi cijenu za radnika"
                >
                  <PencilIcon />
                </button>
              </div>

              <h3 className="pr-14 text-sm font-semibold text-gray-900">{s.title}</h3>
              {s.description && (
                <p className="mt-1 line-clamp-2 pr-14 text-xs text-gray-500">{s.description}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                  {formatPrice(s.price)}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700">
                  {formatDuration(s.duration_minutes)}
                </span>
                {s.is_overridden && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                    Prilagođeno
                  </span>
                )}
                {!s.is_active && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                    Neaktivna
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={(updated) => {
            onChange((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditingService(null);
          }}
        />
      )}

      {editingPriceFor && selectedStaffId !== null && (
        <EditStaffPriceModal
          staffId={selectedStaffId}
          staffName={selectedStaff?.name || "Radnika"}
          service={editingPriceFor}
          onClose={() => setEditingPriceFor(null)}
          onSaved={(updated) => {
            setStaffPricing((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditingPriceFor(null);
          }}
        />
      )}
    </>
  );
}
