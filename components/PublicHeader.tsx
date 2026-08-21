import Link from "next/link";

export default function PublicHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl italic tracking-tight text-ink">
          brand.ba
        </Link>
        <Link
          href="/admin/login"
          className="focus-ring font-mono text-xs uppercase tracking-wider text-muted hover:text-ink"
        >
          Za vlasnike salona →
        </Link>
      </div>
    </header>
  );
}
