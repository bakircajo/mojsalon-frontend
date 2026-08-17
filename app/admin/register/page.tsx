"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, loginUser, registerUser } from "@/lib/api";
import { saveToken } from "@/lib/auth"; // <-- Dodat uvoz za cuvanje tokena
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
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
      await registerUser(email, password);
      const { access_token } = await loginUser(email, password);

      // 1. Sacuvaj token u localStorage (salon_access_token)
      saveToken(access_token);

      // 2. Azuriraj auth Context
      await login(access_token);

      // 3. Preusmjeri na admin panel (ili na wizard ako nema kreiran salon)
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registracija nije uspjela.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-stub">Vlasnički panel</p>
        <h1 className="mt-2 font-display text-3xl italic text-ink">Otvorite svoj prostor</h1>

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
            minLength={6}
            required
          />
          {error && <p className="text-sm text-stub-dark">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2">
            Registruj se
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted">
          Već imate nalog?{" "}
          <Link href="/admin/login" className="text-ink underline underline-offset-2">
            Prijavite se
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