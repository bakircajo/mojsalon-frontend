"use client";

interface MobilePreviewProps {
  data: {
    name: string;
    shop_type: string;
    theme: string;
    accent_color: string;
    font_family: string;
    border_radius: number;
    enabled_sections: string[];
  };
}

const THEME_STYLES: Record<string, { bg: string; text: string; cardBg: string }> = {
  noir: { bg: "#09090B", text: "#FAFAFA", cardBg: "#18181B" },
  steel: { bg: "#0F172A", text: "#F8FAFC", cardBg: "#1E293B" },
  royal: { bg: "#0284C7", text: "#FFFFFF", cardBg: "#0369A1" },
  forest: { bg: "#064E3B", text: "#ECFDF5", cardBg: "#047857" },
  espresso: { bg: "#1C1917", text: "#FAFAF9", cardBg: "#292524" },
  velvet: { bg: "#18181B", text: "#FAFAFA", cardBg: "#27272A" },
  nordic: { bg: "#F8FAFC", text: "#0F172A", cardBg: "#FFFFFF" },
  gold: { bg: "#1A1A1A", text: "#FEF08A", cardBg: "#262626" },
};

const HERO_IMAGES: Record<string, string> = {
  frizerski_salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=700&q=80",
  barbershop: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80",
  beauty_studio: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=700&q=80",
  autoservis: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=700&q=80",
};

export default function MobilePreview({ data }: MobilePreviewProps) {
  const currentTheme = THEME_STYLES[data.theme] || THEME_STYLES.noir;
  const heroImg = HERO_IMAGES[data.shop_type] || HERO_IMAGES.frizerski_salon;

  return (
    // Proširen mobitel na 410px širine i 780px visine sa većim okvirom
    <div className="w-[410px] h-[780px] bg-neutral-900 rounded-[52px] p-4 shadow-2xl border-4 border-neutral-700 relative flex flex-col transition-all">
      {/* Notch */}
      <div className="w-32 h-6 bg-black absolute top-4 left-1/2 -translate-x-1/2 rounded-full z-30 flex items-center justify-end px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
      </div>

      {/* Ekran mobitela sa znatno krupnijim elementima */}
      <div
        className="w-full h-full rounded-[42px] overflow-y-auto flex flex-col justify-between transition-all relative scrollbar-thin scrollbar-thumb-white/20"
        style={{
          backgroundColor: currentTheme.bg,
          color: currentTheme.text,
        }}
      >
        <div>
          {/* Cover Hero Slika */}
          <div className="relative h-52 w-full">
            <img src={heroImg} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span
              className="absolute bottom-4 left-5 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider text-black"
              style={{ backgroundColor: data.accent_color }}
            >
              {data.shop_type.replace("_", " ")}
            </span>
          </div>

          {/* Sadržaj Unutar Ekrana */}
          <div className="p-5 space-y-6">
            {/* Naslov & Info */}
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">
                {data.name || "Naziv Salona"}
              </h2>
              <p className="text-xs opacity-75 flex items-center gap-1.5 font-medium">
                <span>📍 Centar grada, Sarajevo</span> • <span>⭐ 4.9 (120+)</span>
              </p>
            </div>

            {/* Radno Vrijeme Box */}
            <div
              className="p-3.5 rounded-2xl text-xs flex justify-between items-center border border-white/10"
              style={{ backgroundColor: currentTheme.cardBg }}
            >
              <div>
                <p className="font-bold text-sm">Radno vrijeme</p>
                <p className="text-xs opacity-60">Pon - Sub: 09:00 - 20:00</p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-bold">
                Otvoreno
              </span>
            </div>

            {/* Sekcija: Usluge */}
            {data.enabled_sections.includes("services") && (
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: data.accent_color }}>
                    Popularne Usluge
                  </h3>
                  <span className="text-xs font-bold opacity-60">Sve usluge →</span>
                </div>

                <div className="space-y-2.5">
                  <div
                    className="p-4 rounded-2xl flex justify-between items-center border border-white/10"
                    style={{ backgroundColor: currentTheme.cardBg }}
                  >
                    <div>
                      <p className="text-sm font-bold">Kompletan tretman & Stajling</p>
                      <p className="text-xs opacity-60">45 min • Pranje, šišanje, brada</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: data.accent_color }}>
                      35 KM
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-2xl flex justify-between items-center border border-white/10"
                    style={{ backgroundColor: currentTheme.cardBg }}
                  >
                    <div>
                      <p className="text-sm font-bold">Express Šišanje</p>
                      <p className="text-xs opacity-60">25 min</p>
                    </div>
                    <span className="text-sm font-black" style={{ color: data.accent_color }}>
                      20 KM
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sekcija: Tim */}
            {data.enabled_sections.includes("team") && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: data.accent_color }}>
                  Izaberi Majstora
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    className="p-3 rounded-2xl border border-white/10 flex items-center gap-3"
                    style={{ backgroundColor: currentTheme.cardBg }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      className="w-10 h-10 rounded-full object-cover"
                      alt="Emina"
                    />
                    <div>
                      <p className="text-xs font-bold">Emina K.</p>
                      <p className="text-[10px] opacity-60">Senior Stylist</p>
                    </div>
                  </div>

                  <div
                    className="p-3 rounded-2xl border border-white/10 flex items-center gap-3"
                    style={{ backgroundColor: currentTheme.cardBg }}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                      className="w-10 h-10 rounded-full object-cover"
                      alt="Dino"
                    />
                    <div>
                      <p className="text-xs font-bold">Dino M.</p>
                      <p className="text-[10px] opacity-60">Master Barber</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sekcija: Galerija */}
            {data.enabled_sections.includes("gallery") && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: data.accent_color }}>
                  Galerija Radova
                </h3>
                <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=250&q=80" className="w-full h-20 object-cover" alt="G1" />
                  <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=250&q=80" className="w-full h-20 object-cover" alt="G2" />
                  <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=250&q=80" className="w-full h-20 object-cover" alt="G3" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fiksno dugme pri dnu */}
        <div className="p-5 bg-gradient-to-t from-black/80 to-transparent sticky bottom-0">
          <button
            className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-black text-center shadow-xl transition-all"
            style={{ backgroundColor: data.accent_color }}
          >
            Zakazivanje Termina
          </button>
        </div>
      </div>
    </div>
  );
}