"use client";

import { useState } from "react";
import { deleteStaff } from "@/lib/api";
import type { Staff } from "@/lib/types";
import EditStaffModal from "./EditStaffModal";

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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="currentColor" strokeWidth={1.6}>
      <path
        d="M5 3h2.5l1 3.5-1.7 1.2a8 8 0 0 0 4.5 4.5l1.2-1.7 3.5 1V14a2 2 0 0 1-2 2C8.5 16 4 11.5 4 5.5a2 2 0 0 1 1-2.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0" stroke="currentColor" strokeWidth={1.6}>
      <path
        d="M3.5 5.5h13v9h-13v-9Zm0 0 6.5 5 6.5-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StaffGrid({
  staffList,
  onChange,
}: {
  staffList: Staff[];
  onChange: (updater: (prev: Staff[]) => Staff[]) => void;
}) {
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(person: Staff) {
    if (!confirm(`Da li ste sigurni da želite obrisati uposlenika "${person.name}"?`)) return;
    setDeletingId(person.id);
    try {
      await deleteStaff(person.id);
      onChange((prev) => prev.filter((s) => s.id !== person.id));
    } catch {
      alert("Greška pri brisanju uposlenika.");
    } finally {
      setDeletingId(null);
    }
  }

  if (staffList.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">Nema unesenih uposlenika.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {staffList.map((person) => (
          <div
            key={person.id}
            className="relative rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="absolute right-3 top-3 flex items-center gap-1">
              <button
                onClick={() => setEditingStaff(person)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                title="Uredi uposlenika"
                aria-label="Uredi uposlenika"
              >
                <PencilIcon />
              </button>
              <button
                onClick={() => handleDelete(person)}
                disabled={deletingId === person.id}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                title="Obriši uposlenika"
                aria-label="Obriši uposlenika"
              >
                <TrashIcon />
              </button>
            </div>

            <div className="flex items-center gap-3 pr-14">
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt={person.name}
                  className="h-12 w-12 shrink-0 rounded-full border border-gray-100 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                  {person.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-gray-900">{person.name}</h3>
                <p className="truncate text-xs text-gray-500">{person.role || "Uposlenik"}</p>
              </div>
            </div>

            {(person.phone || person.email) && (
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                {person.phone && (
                  <div className="flex items-center gap-1.5">
                    <PhoneIcon />
                    <span className="truncate">{person.phone}</span>
                  </div>
                )}
                {person.email && (
                  <div className="flex items-center gap-1.5">
                    <MailIcon />
                    <span className="truncate">{person.email}</span>
                  </div>
                )}
              </div>
            )}

            {person.bio && (
              <p className="mt-3 line-clamp-2 text-xs text-gray-500">{person.bio}</p>
            )}
          </div>
        ))}
      </div>

      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSaved={(updated) => {
            onChange((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setEditingStaff(null);
          }}
        />
      )}
    </>
  );
}
