"use client";

import { THEME_STYLES, getIndustry } from "@/lib/industries";

export interface PreviewData {
  name: string;
  shop_type: string;
  theme: string;
  accent_color: string;
  logo_url?: string | null;
  enabled_sections: string[];
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") || "vas-salon"
  );
}

export default function BrowserPreview({
  data,
  device,
  onToggleDevice,
}: {
  data: PreviewData;
  device: "mobile" | "desktop";
  onToggleDevice: (d: "mobile" | "desktop") => void;
}) {
  const theme = THEME_STYLES[data.theme] || THEME_STYLES.noir;
  const industry = getIndustry(data.shop_type);
  const isMobile = device === "mobile";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-100 shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-neutral-300 bg-white px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 truncate rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1 font-mono text-[11px] text-neutral-500">
          brand.ba/{slugify(data.name)}
        </div>
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-0.5">
          <button
            type="button"
            onClick={() => onToggleDevice("mobile")}
            className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              isMobile ? "bg-black text-white" : "text-neutral-500 hover:text-black"
            }`}
          >
            Mobitel
          </button>
          <button
            type="button"
            onClick={() => onToggleDevice("desktop")}
            className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              !isMobile ? "bg-black text-white" : "text-neutral-500 hover:text-black"
            }`}
          >
            Desktop
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-neutral-200 p-4">
        <div
          className={
            isMobile
              ? "relative flex h-[600px] w-[300px] shrink-0 flex-col rounded-[44px] border-[6px] border-neutral-800 bg-neutral-900 p-2 shadow-2xl"
              : "h-full w-full"
          }
        >
          {isMobile && (
            <div className="absolute left-1/2 top-2 z-30 flex h-5 w-24 -translate-x-1/2 items-center justify-end rounded-full bg-black px-2.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
          )}
          <div
            className={`overflow-y-auto ${isMobile ? "h-full rounded-[34px]" : "mx-auto max-w-full rounded-xl"}`}
            style={{ backgroundColor: theme.bg, color: theme.text }}
          >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-5 py-3.5"
            style={{ borderColor: `${theme.text}1A` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {data.logo_url ? (
                <img src={data.logo_url} alt="Logo" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              ) : (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
                  style={{ backgroundColor: data.accent_color, color: "#000" }}
                >
                  {(data.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate text-sm font-black uppercase tracking-wide" style={{ color: data.accent_color }}>
                {data.name || "Naziv Salona"}
              </span>
            </div>
            <span className="shrink-0 text-[10px] opacity-50">IG</span>
          </div>

          {/* Hero */}
          <div className="relative h-36 w-full">
            <img src={industry.heroImage} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span
              className="absolute bottom-3 left-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
              style={{ backgroundColor: data.accent_color }}
            >
              {industry.label}
            </span>
          </div>

          <div className="space-y-5 p-5">
            {/* Radno vrijeme — stvarni podrazumijevani raspored (ne izmišljen placeholder) */}
            <div
              className="flex items-center justify-between rounded-xl border p-3 text-xs"
              style={{ borderColor: `${theme.text}1A`, backgroundColor: theme.cardBg }}
            >
              <div>
                <p className="font-bold">Radno vrijeme</p>
                <p style={{ color: theme.muted }} className="text-[11px]">
                  Pon–Pet 08–16 · Sub 08–14 · Ned zatvoreno
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-400">
                Otvoreno
              </span>
            </div>

            {data.enabled_sections.includes("services") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: data.accent_color }}>
                    Usluge
                  </h3>
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: theme.muted }}>
                    Primjer
                  </span>
                </div>
                {industry.sampleServices.map((s) => (
                  <div
                    key={s.title}
                    className="flex items-center justify-between rounded-xl border p-3 text-xs"
                    style={{ borderColor: `${theme.text}1A`, backgroundColor: theme.cardBg }}
                  >
                    <div>
                      <p className="font-bold">{s.title}</p>
                      <p style={{ color: theme.muted }} className="text-[10px]">{s.duration} min</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: data.accent_color }}>{s.price} KM</span>
                  </div>
                ))}
              </div>
            )}

            {data.enabled_sections.includes("team") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: data.accent_color }}>
                    Naš Tim
                  </h3>
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: theme.muted }}>
                    Primjer
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Amer K.", "Ivana M."].map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 rounded-xl border p-2.5 text-xs"
                      style={{ borderColor: `${theme.text}1A`, backgroundColor: theme.cardBg }}
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                        style={{ backgroundColor: `${data.accent_color}33`, color: data.accent_color }}
                      >
                        {name.charAt(0)}
                      </div>
                      <span className="truncate font-bold">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.enabled_sections.includes("gallery") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: data.accent_color }}>
                    Galerija
                  </h3>
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: theme.muted }}>
                    Primjer
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 overflow-hidden rounded-xl">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square" style={{ backgroundColor: theme.cardBg }} />
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest text-black shadow-lg"
              style={{ backgroundColor: data.accent_color }}
            >
              Rezerviši
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
