"use client";

import { useEffect, useState } from "react";
import { deleteService, getStaffServicePricing, upsertStaffServicePrice } from "@/lib/api";
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

function TagIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={1.6}>
      <path
        d="M9 3.5H4.5A1 1 0 0 0 3.5 4.5V9a1 1 0 0 0 .29.71l6.5 6.5a1 1 0 0 0 1.42 0l4.6-4.6a1 1 0 0 0 0-1.42l-6.5-6.5A1 1 0 0 0 9 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
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
  const [assignServiceId, setAssignServiceId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || null;
  const assignedServiceIds = new Set(staffPricing.map((p) => p.id));
  const unassignedServices = services.filter((s) => !assignedServiceIds.has(s.id));

  // Nema "Svi Radnici" taba — uvijek je aktivan tačno jedan radnik (prvi po defaultu),
  // osim ako radnja uopšte nema radnika (tada se prikazuje ravna lista svih usluga).
  useEffect(() => {
    if (staffList.length === 0) {
      setSelectedStaffId(null);
      return;
    }
    if (selectedStaffId === null || !staffList.some((p) => p.id === selectedStaffId)) {
      setSelectedStaffId(staffList[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffList]);

  useEffect(() => {
    setAssignServiceId("");
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

  async function handleAssignService() {
    if (selectedStaffId === null || !assignServiceId) return;
    setAssigning(true);
    try {
      const assigned = await upsertStaffServicePrice(selectedStaffId, Number(assignServiceId), {});
      setStaffPricing((prev) => [...prev, assigned]);
      setAssignServiceId("");
    } catch {
      alert("Greška pri dodjeli usluge radniku.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Obrisati uslugu "${service.title}" u potpunosti? Nestat će kod SVIH radnika.`)) return;
    setDeletingId(service.id);
    try {
      await deleteService(service.id);
      onChange((prev) => prev.filter((s) => s.id !== service.id));
      setStaffPricing((prev) => prev.filter((s) => s.id !== service.id));
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
                {s.is_shop_wide && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Globalna
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
      ) : pricingLoading ? (
        <p className="py-8 text-center text-sm text-gray-500">Učitavanje usluga...</p>
      ) : (
        <div>
          {unassignedServices.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-gray-50 p-3">
              <select
                value={assignServiceId}
                onChange={(e) => setAssignServiceId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Dodaj postojeću uslugu ovom radniku...</option>
                {unassignedServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssignService}
                disabled={!assignServiceId || assigning}
                className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {assigning ? "Dodavanje..." : "Dodaj"}
              </button>
            </div>
          )}

          {staffPricing.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {selectedStaff?.name || "Ovaj radnik"} nema dodijeljenih usluga.
            </p>
          ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staffPricing.map((s) => (
            <div
              key={s.id}
              className="relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="absolute right-3 top-3 flex items-center gap-1">
                <button
                  onClick={() => {
                    const base = services.find((sv) => sv.id === s.id);
                    if (base) setEditingService(base);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="Uredi osnovne podatke usluge (naziv, opis, bazna cijena)"
                  aria-label="Uredi osnovne podatke usluge"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => setEditingPriceFor(s)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                  title={`Cijena za ${selectedStaff?.name || "radnika"} / ukloni od radnika`}
                  aria-label="Cijena za radnika / ukloni od radnika"
                >
                  <TagIcon />
                </button>
                <button
                  onClick={() => {
                    const base = services.find((sv) => sv.id === s.id);
                    if (base) handleDelete(base);
                  }}
                  disabled={deletingId === s.id}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  title="Obriši uslugu u potpunosti (kod svih radnika)"
                  aria-label="Obriši uslugu u potpunosti"
                >
                  <TrashIcon />
                </button>
              </div>

              <h3 className="pr-20 text-sm font-semibold text-gray-900">{s.title}</h3>
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
                {s.is_shop_wide && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    Globalna
                  </span>
                )}
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
        </div>
      )}

      {editingService && (
        <EditServiceModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={(updated) => {
            onChange((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setStaffPricing((prev) =>
              prev.map((s) =>
                s.id === updated.id
                  ? {
                      ...s,
                      title: updated.title,
                      description: updated.description,
                      is_active: updated.is_active,
                      // Bazna cijena/trajanje se odražavaju samo ako radnik nema svoj override.
                      price: s.is_overridden ? s.price : updated.price,
                      duration_minutes: s.is_overridden ? s.duration_minutes : updated.duration_minutes,
                    }
                  : s
              )
            );
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
          onRemoved={() => {
            setStaffPricing((prev) => prev.filter((s) => s.id !== editingPriceFor.id));
            setEditingPriceFor(null);
          }}
        />
      )}
    </>
  );
}
