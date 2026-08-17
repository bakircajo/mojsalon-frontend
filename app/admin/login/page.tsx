"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, loginUser } from "@/lib/api";
import { saveToken } from "@/lib/auth"; // <-- Uvezen saveToken
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { access_token } = await loginUser(email, password);

      // 1. Spasi token u localStorage da ga api.ts (getToken) može pročitati
      saveToken(access_token);

      // 2. Ažuriraj auth Context stanje
      await login(access_token);

      // 3. Preusmjeri na tačnu rute za Admin Dashboard
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Prijava nije uspjela.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-stub">Vlasnički panel</p>
        <h1 className="mt-2 font-display text-3xl italic text-ink">Prijava</h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="password"
            type="password"
            label="Lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-stub-dark">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2">
            Prijavi se
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted">
          Nemate nalog?{" "}
          <Link href="/admin/register" className="text-ink underline underline-offset-2">
            Registrujte se
          </Link>
        </p>
        <p className="mt-2 text-xs text-muted">
          <Link href="/" className="underline underline-offset-2">
            ← Nazad na javnu stranicu
          </Link>
        </p>
      </div>
    </div>
  );
}