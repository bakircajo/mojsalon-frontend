"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  cpLogin,
  getCpUsers,
  createCpUser,
  deleteCpShop,
  deleteCpUser,
  updateCpCredentials,
  resetCpUserPassword,
  CpApiError,
  type AdminUserSummary,
} from "@/lib/cpApi";
import { getCpToken, saveCpToken, clearCpToken } from "@/lib/cpAuth";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("bs-BA", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function ControlPanelPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"users" | "settings">("users");
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [revealedCredential, setRevealedCredential] = useState<{ email: string; password: string } | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const data = await getCpUsers();
      setUsers(data);
      setAuthed(true);
    } catch (err) {
      if (err instanceof CpApiError && err.status === 401) {
        setAuthed(false);
      }
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (!getCpToken()) {
      setCheckingAuth(false);
      return;
    }
    loadUsers().finally(() => setCheckingAuth(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const { access_token } = await cpLogin(loginUsername.trim(), loginPassword);
      saveCpToken(access_token);
      setLoginPassword("");
      await loadUsers();
    } catch (err) {
      setLoginError(err instanceof CpApiError ? err.message : "Prijava nije uspjela.");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    clearCpToken();
    setAuthed(false);
    setUsers([]);
  }

  async function handleDeleteShop(userId: number, shopId: number, shopName: string) {
    if (!confirm(`Da li ste sigurni da želite obrisati salon "${shopName}"? Ova akcija je trajna.`)) return;
    setBusyKey(`shop-${shopId}`);
    try {
      await deleteCpShop(shopId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, shops: u.shops.filter((s) => s.id !== shopId) } : u))
      );
    } catch (err) {
      alert(err instanceof CpApiError ? err.message : "Greška pri brisanju salona.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteUser(userId: number, email: string) {
    if (
      !confirm(
        `Da li ste sigurni da želite obrisati korisnika "${email}"?\n\nOva akcija TRAJNO briše nalog i sve njegove salone, usluge, radnike i rezervacije.`
      )
    )
      return;
    setBusyKey(`user-${userId}`);
    try {
      await deleteCpUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err instanceof CpApiError ? err.message : "Greška pri brisanju korisnika.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const created = await createCpUser(createEmail.trim(), createPassword);
      setUsers((prev) => [
        ...prev,
        {
          id: created.id,
          email: created.email,
          is_active: created.is_active,
          created_at: created.created_at,
          requires_credential_update: created.requires_credential_update,
          email_verified: created.email_verified,
          shops: [],
        },
      ]);
      setShowCreateModal(false);
      // Prikaži lozinku JEDNOM — SuperAdmin je upravo unio, ali ostavljamo je vidljivom
      // da je može kopirati/proslijediti korisniku prije nego zatvori dijalog.
      setRevealedCredential({ email: created.email, password: createPassword });
      setCreateEmail("");
      setCreatePassword("");
    } catch (err) {
      setCreateError(err instanceof CpApiError ? err.message : "Greška pri kreiranju naloga.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleResetPassword(userId: number, email: string) {
    if (
      !confirm(
        `Resetovati lozinku za "${email}"?\n\nStara lozinka prestaje raditi odmah, a korisnik će morati ponovo proći kroz podešavanje naloga (nova lozinka + potvrda emaila).`
      )
    )
      return;
    setResettingId(userId);
    try {
      const result = await resetCpUserPassword(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, requires_credential_update: true, email_verified: false } : u
        )
      );
      setRevealedCredential({ email: result.email, password: result.temporary_password });
    } catch (err) {
      alert(err instanceof CpApiError ? err.message : "Greška pri resetovanju lozinke.");
    } finally {
      setResettingId(null);
    }
  }

  async function handleUpdateCredentials(e: FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage("");
    setSettingsError("");
    try {
      await updateCpCredentials({
        current_password: currentPassword,
        new_username: newUsername.trim() || undefined,
        new_password: newPassword.trim() || undefined,
      });
      setSettingsMessage("Kredencijali su uspješno ažurirani.");
      setCurrentPassword("");
      setNewUsername("");
      setNewPassword("");
    } catch (err) {
      setSettingsError(err instanceof CpApiError ? err.message : "Greška pri ažuriranju kredencijala.");
    } finally {
      setSettingsSaving(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">Master Control Panel</p>
          <h1 className="mt-2 text-3xl font-black text-white">Superadmin Prijava</h1>

          <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Korisničko ime</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Lozinka</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="mt-2 rounded-xl bg-amber-500 py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-amber-400 disabled:opacity-50"
            >
              {loginLoading ? "Prijava..." : "Prijavi se"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalShops = users.reduce((sum, u) => sum + u.shops.length, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">Master Control Panel</p>
            <h1 className="mt-1 text-2xl font-black">Platform Administracija</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {users.length} korisnika • {totalShops} salona
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
              <button
                onClick={() => setActiveTab("users")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "users" ? "bg-white text-black" : "text-neutral-300 hover:text-white"
                }`}
              >
                Korisnici
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "settings" ? "bg-white text-black" : "text-neutral-300 hover:text-white"
                }`}
              >
                Postavke
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
            >
              Odjava
            </button>
          </div>
        </div>

        {activeTab === "users" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-amber-400"
              >
                + Kreiraj Korisnika
              </button>
            </div>

            {usersLoading ? (
              <p className="py-8 text-center text-sm text-neutral-500">Učitavanje korisnika...</p>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">Nema registrovanih korisnika.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {users.map((u) => {
                  const isExpanded = expandedUserId === u.id;
                  return (
                    <div
                      key={u.id}
                      className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition-colors hover:border-neutral-700"
                    >
                      <div
                        className="flex cursor-pointer items-center justify-between gap-3"
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold">{u.email}</p>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                u.email_verified
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {u.email_verified ? "Verifikovan" : "Na čekanju"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            Registrovan {formatDate(u.created_at)} • {u.shops.length}{" "}
                            {u.shops.length === 1 ? "salon" : "salona"}
                          </p>
                        </div>
                        <span className="shrink-0 text-neutral-500">{isExpanded ? "▲" : "▼"}</span>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t border-neutral-800 pt-4">
                          {u.shops.length === 0 ? (
                            <p className="text-xs text-neutral-500">Ovaj korisnik nema kreiran salon.</p>
                          ) : (
                            u.shops.map((shop) => (
                              <div key={shop.id} className="rounded-lg bg-neutral-800/60 p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">{shop.name}</p>
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                      shop.is_published
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-amber-500/20 text-amber-400"
                                    }`}
                                  >
                                    {shop.is_published ? "Objavljen" : "Neobjavljen"}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-400">
                                  {(shop.shop_type || "—").replace("_", " ")} • /{shop.slug || "—"}
                                </p>
                                <button
                                  onClick={() => handleDeleteShop(u.id, shop.id, shop.name)}
                                  disabled={busyKey === `shop-${shop.id}`}
                                  className="w-full rounded-lg bg-red-950 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-900 disabled:opacity-50"
                                >
                                  🗑️ Obriši Ovaj Salon
                                </button>
                              </div>
                            ))
                          )}

                          <button
                            onClick={() => handleResetPassword(u.id, u.email)}
                            disabled={resettingId === u.id}
                            className="w-full rounded-lg bg-neutral-800 py-1.5 text-xs font-bold text-neutral-200 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                          >
                            {resettingId === u.id ? "Resetovanje..." : "🔑 Resetuj Lozinku"}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={busyKey === `user-${u.id}`}
                            className="w-full rounded-lg bg-red-600 py-2 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            {busyKey === `user-${u.id}` ? "Brisanje..." : "🗑️ Obriši Korisnika (Nalog + Salon)"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-bold">Promijeni Superadmin Kredencijale</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Iz sigurnosnih razloga, potrebno je unijeti trenutnu lozinku za bilo koju izmjenu.
            </p>
            <form onSubmit={handleUpdateCredentials} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Trenutna lozinka</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">
                  Novo korisničko ime (opcionalno)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">
                  Nova lozinka (opcionalno)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              {settingsError && <p className="text-sm text-red-400">{settingsError}</p>}
              {settingsMessage && <p className="text-sm text-emerald-400">{settingsMessage}</p>}
              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-amber-400 disabled:opacity-50"
              >
                {settingsSaving ? "Spašavanje..." : "Sačuvaj Izmjene"}
              </button>
            </form>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Kreiraj Korisnički Nalog</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Nalog se odmah kreira i spreman je za prijavu na /admin/login.
            </p>
            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Email</label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Lozinka</label>
                <input
                  type="password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                />
              </div>
              {createError && <p className="text-sm text-red-400">{createError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-amber-400 disabled:opacity-50"
                >
                  {createLoading ? "Kreiranje..." : "Kreiraj Nalog"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                >
                  Odustani
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {revealedCredential && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setRevealedCredential(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-amber-500/40 bg-neutral-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-amber-400">Kredencijali — sačuvajte ih sada</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Ova lozinka se neće ponovo prikazati. Proslijedite je korisniku prije zatvaranja.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Email</label>
                <p className="select-all rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white">
                  {revealedCredential.email}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Lozinka</label>
                <p className="select-all rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-white">
                  {revealedCredential.password}
                </p>
              </div>
            </div>
            <button
              onClick={() => setRevealedCredential(null)}
              className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-black uppercase tracking-wider text-black transition-all hover:bg-amber-400"
            >
              Sačuvano, zatvori
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
