"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/components/AuthProvider";

export default function AdminNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/admin/dashboard" className="font-display text-xl italic text-ink">
          brand.ba <span className="text-muted">/ vlasnik</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/admin/dashboard"
            className={clsx(
              "font-mono text-xs uppercase tracking-wider text-muted hover:text-ink",
              pathname === "/admin/dashboard" && "text-ink"
            )}
          >
            Moji saloni
          </Link>
          {user && <span className="text-xs text-muted">{user.email}</span>}
          <button
            onClick={logout}
            className="focus-ring font-mono text-xs uppercase tracking-wider text-muted hover:text-ink"
          >
            Odjava
          </button>
        </nav>
      </div>
    </header>
  );
}
