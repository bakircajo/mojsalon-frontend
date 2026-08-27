"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createShop, getMyShops } from "@/lib/api";
import MobilePreview from "@/components/MobilePreview";

const THEMES = [
  { id: "noir", name: "Noir", desc: "Tamno i odvažno — za barbershope", bg: "#09090B", text: "#FFFFFF", accent: "#D97706" },
  { id: "steel", name: "Steel", desc: "Industrijski — za servise i radnje", bg: "#0F172A", text: "#F8FAFC", accent: "#3B82F6" },
  { id: "royal", name: "Royal", desc: "Plavo i zlato — visoki luksuz", bg: "#0284C7", text: "#F8FAFC", accent: "#EAB308" },
  { id: "forest", name: "Forest", desc: "Smaragdan ton — prirodna svježina", bg: "#064E3B", text: "#ECFDF5", accent: "#10B981" },
  { id: "espresso", name: "Espresso", desc: "Topla kafa — uglađen stil", bg: "#1C1917", text: "#FAFAF9", accent: "#F97316" },
  { id: "velvet", name: "Velvet", desc: "Noćni glamur — bordo & roze", bg: "#18181B", text: "#FAFAFA", accent: "#EC4899" },
  { id: "nordic", name: "Nordic Light", desc: "Čisto i bijelo — minimalistički", bg: "#F8FAFC", text: "#0F172A", accent: "#6366F1" },
  { id: "gold", name: "Gold Prestige", desc: "Zlatni detalji na crnom", bg: "#1A1A1A", text: "#FEF08A", accent: "#EAB308" },
];

const ACCENT_COLORS = [
  "#D97706", "#3B82F6", "#EF4444", "#10B981", "#8B5CF6", "#EC4899", "#EAB308", "#06B6D4", "#F97316"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "Barber & Beauty Studio",
    shop_type: "barbershop",
    instagram: "@mojsalon_ba",
    theme: "noir",
    accent_color: "#D97706",
    font_family: "editorial",
    border_radius: 12,
    enabled_sections: ["services", "team", "gallery"],
  });

  useEffect(() => {
    getMyShops()
      .then((shops) => {
        if (shops.length > 0) router.replace("/admin");
      })
      .catch(() => {});
  }, []);

  const updateForm = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section: string) => {
    setFormData((prev) => {
      const exists = prev.enabled_sections.includes(section);
      return {
        ...prev,
        enabled_sections: exists
          ? prev.enabled_sections.filter((s) => s !== section)
          : [...prev.enabled_sections, section],
      };
    });
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 5);
      await createShop({ ...formData, slug });
      router.push("/admin");
    } catch (err: any) {
      alert(err.message || "Greška pri spremanju radnje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-neutral-900 flex flex-col lg:flex-row">
      {/* Lijevi panel sa kontrolama */}
      <div className="w-full lg:w-6/12 p-6 lg:p-12 flex flex-col justify-between">
        <div>
          <div className="flex space-x-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full transition-all ${
                  i <= step ? "bg-black" : "bg-neutral-300"
                }`}
              />
            ))}
          </div>

          <p className="text-xs font-black tracking-widest text-neutral-400 uppercase mb-2">
            KORAK {step} OD 4
          </p>

          {/* KORAK 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black mb-2">Osnovne informacije</h1>
                <p className="text-base text-neutral-600">Unesite naziv radnje i odaberite vrstu djelatnosti.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase mb-2 text-neutral-700">Naziv brenda / salona</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-neutral-300 bg-white font-bold text-base outline-none focus:border-black transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase mb-2 text-neutral-700">Kategorija biznisa</label>
                  <div className="grid grid-cols-2 gap-3.5">
                    {[
                      { id: "frizerski_salon", label: "Frizerski salon", emoji: "💇‍♀️" },
                      { id: "barbershop", label: "Barbershop", emoji: "💈" },
                      { id: "beauty_studio", label: "Beauty Studio", emoji: "💅" },
                      { id: "autoservis", label: "Autoservis & Detailing", emoji: "🔧" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateForm("shop_type", item.id)}
                        className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all min-h-[110px] ${
                          formData.shop_type === item.id
                            ? "border-black bg-white shadow-lg ring-2 ring-black"
                            : "border-neutral-200 bg-white hover:border-neutral-400"
                        }`}
                      >
                        <span className="text-3xl block mb-2">{item.emoji}</span>
                        <span className="font-extrabold text-sm block leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase mb-2 text-neutral-700">Instagram Profil</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => updateForm("instagram", e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-neutral-300 bg-white text-base font-semibold outline-none focus:border-black transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* KORAK 2: Prikaz tema bez unutrašnjeg skrola */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black mb-2">Paleta i Tematika</h1>
                <p className="text-base text-neutral-600">Izaberite vizuelni identitet vaše online stranice.</p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => updateForm("theme", theme.id)}
                    className={`p-4 rounded-2xl text-left border-2 transition-all ${
                      formData.theme === theme.id
                        ? "border-black bg-white shadow-md ring-2 ring-black"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <div
                      className="h-12 rounded-xl mb-3 p-2.5 flex justify-between items-end border border-black/10"
                      style={{ backgroundColor: theme.bg, color: theme.text }}
                    >
                      <span className="text-xs font-black">Aa</span>
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    </div>
                    <p className="font-extrabold text-sm">{theme.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{theme.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KORAK 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-black mb-2">Boje i Sekcije</h1>
                <p className="text-base text-neutral-600">Prilagodite detalje i raspored elemenata.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-extrabold uppercase mb-3 text-neutral-700">Glavna akcentna boja</label>
                  <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateForm("accent_color", color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          formData.accent_color === color ? "border-black scale-110 shadow-lg ring-2 ring-black/20" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase mb-3 text-neutral-700">Aktivne sekcije na stranici</label>
                  <div className="space-y-2.5">
                    {[
                      { id: "services", label: "Cjenovnik & Traka Usluga" },
                      { id: "team", label: "Prikaz Radnika i Majstora" },
                      { id: "gallery", label: "Galerija Radova" },
                    ].map((sec) => (
                      <div
                        key={sec.id}
                        onClick={() => toggleSection(sec.id)}
                        className="flex items-center justify-between p-4 bg-white border-2 border-neutral-200 rounded-2xl cursor-pointer hover:border-black transition-all"
                      >
                        <span className="text-sm font-bold">{sec.label}</span>
                        <input
                          type="checkbox"
                          checked={formData.enabled_sections.includes(sec.id)}
                          readOnly
                          className="w-5 h-5 accent-black rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KORAK 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center text-3xl font-black">
                ✓
              </div>
              <h1 className="text-3xl lg:text-4xl font-black">Sve je spremno!</h1>
              <p className="text-base text-neutral-600">
                Vaša stranica je u potpunosti prilagođena. Klikom na dugme objavljujete je uživo za vaše klijente.
              </p>
            </div>
          )}
        </div>

        {/* Navigacijska dugmad */}
        <div className="flex space-x-3 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-6 py-4 rounded-2xl border-2 border-neutral-300 font-extrabold text-sm bg-white hover:bg-neutral-100 transition-all"
            >
              Nazad
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-4 bg-black text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md"
            >
              Nastavi →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 py-4 bg-black text-white rounded-2xl font-extrabold text-sm uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md"
            >
              {loading ? "Spremanje..." : "Objavi Stranicu 🎉"}
            </button>
          )}
        </div>
      </div>

      {/* Desni panel sa mobilnim prikazom */}
      <div className="w-full lg:w-6/12 bg-neutral-200 p-6 lg:p-10 flex items-center justify-center min-h-[820px]">
        <MobilePreview data={formData} />
      </div>
    </div>
  );
}