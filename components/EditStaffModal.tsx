"use client";

import { useState } from "react";
import { updateStaff } from "@/lib/api";
import type { Staff } from "@/lib/types";

export default function EditStaffModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: Staff;
  onClose: () => void;
  onSaved: (updated: Staff) => void;
}) {
  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState(staff.role || "");
  const [avatarUrl, setAvatarUrl] = useState(staff.avatar_url || "");
  const [bio, setBio] = useState(staff.bio || "");
  const [phone, setPhone] = useState(staff.phone || "");
  const [email, setEmail] = useState(staff.email || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateStaff(staff.id, {
        name: name.trim(),
        role: role.trim() || "Stilista",
        avatar_url: avatarUrl.trim() || undefined,
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      onSaved(updated);
    } catch {
      alert("Greška pri spašavanju izmjena.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Uredi Uposlenika</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Ime i prezime</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Uloga</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="npr. Senior Barber"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="061 234 567"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ime@salon.ba"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">URL slike (opcionalno)</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Biografija (opcionalno)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Spašavanje..." : "Sačuvaj Izmjene"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Odustani
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
