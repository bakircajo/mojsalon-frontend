"use client";

import { FormEvent, useEffect, useState } from "react";
import { getMe, updateMyProfile, ApiError } from "@/lib/api";

export default function AccountSettings() {
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getMe()
      .then((me) => {
        setCurrentEmail(me.email);
        setNewEmail(me.email);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmNewPassword) {
      setError("Nova lozinka i potvrda lozinke se ne poklapaju.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile({
        current_password: currentPassword,
        new_email: newEmail.trim() !== currentEmail ? newEmail.trim() : undefined,
        new_password: newPassword || undefined,
      });
      setCurrentEmail(updated.email);
      setNewEmail(updated.email);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccess("Podaci naloga su uspješno ažurirani.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Greška pri ažuriranju naloga.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Učitavanje...</p>;
  }

  return (
    <div className="max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Moj Nalog</h2>
      <p className="mt-1 text-xs text-gray-500">
        Trenutni login email: <span className="font-medium text-gray-700">{currentEmail}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Novi Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="border-t pt-4">
          <label className="mb-1 block text-xs font-medium text-gray-700">Trenutna Lozinka</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Obavezno za bilo koju izmjenu"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nova Lozinka (opcionalno)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Potvrdi Novu Lozinku</label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            minLength={6}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Spašavanje..." : "Sačuvaj Izmjene"}
        </button>
      </form>
    </div>
  );
}
