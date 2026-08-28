"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-stub">Vlasnički panel</p>
        <h1 className="mt-2 font-display text-3xl italic text-ink">Registracija je zatvorena</h1>
        <p className="mt-4 text-sm text-muted">
          Nalozi se više ne otvaraju samostalno — kreira ih isključivo administrator platforme.
          Ako očekujete pristup, obratite se administratoru da vam napravi nalog.
        </p>

        <Link href="/admin/login" className="mt-8 block">
          <Button type="button" className="w-full">
            Idi na prijavu
          </Button>
        </Link>

        <p className="mt-4 text-xs text-muted">
          <Link href="/" className="underline underline-offset-2">
            ← Nazad na javnu stranicu
          </Link>
        </p>
      </div>
    </div>
  );
}
