"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createShop, getMyShops } from "@/lib/api";
import { INDUSTRIES, THEMES, ACCENT_COLORS, getIndustry } from "@/lib/industries";
import BrowserPreview from "@/components/onboarding/BrowserPreview";
import LogoUpload from "@/components/onboarding/LogoUpload";

const STEP_KEYS = ["basics", "branding", "sections", "publish"] as const;
type StepKey = (typeof STEP_KEYS)[number];

const STEP_LABELS: Record<StepKey, string> = {
  basics: "Osnovne informacije",
  branding: "Izgled i logo",
  sections: "Sekcije stranice",
  publish: "Objavi",
};

const SECTION_OPTIONS = [
  { id: "services", label: "Cjenovnik & Usluge" },
  { id: "team", label: "Prikaz Radnika i Majstora" },
  { id: "gallery", label: "Galerija Radova" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const [formData, setFormData] = useState({
    name: "",
    shop_type: "barbershop",
    instagram: "",
    theme: "noir",
    accent_color: "#D97706",
    font_family: "editorial",
    border_radius: 12,
    enabled_sections: ["services", "team"] as string[],
    logo_url: null as string | null,
  });

  useEffect(() => {
    getMyShops()
      .then((shops) => {
        if (shops.length > 0) router.replace("/admin");
      })
      .catch(() => {});
  }, []);

  const currentStep = STEP_KEYS[stepIndex];

  const updateForm = (patch: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const selectIndustry = (industryId: string) => {
    const industry = getIndustry(industryId);
    updateForm({ shop_type: industry.id, theme: industry.theme, accent_color: industry.accentColor });
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

  function goNext() {
    if (currentStep === "basics") {
      if (!formData.name.trim()) {
        setNameError("Unesite naziv salona prije nastavka.");
        return;
      }
      setNameError("");
    }
    setStepIndex((i) => Math.min(i + 1, STEP_KEYS.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  const handleFinish = async () => {
    setLoading(true);
    try {
      await createShop({
        name: formData.name.trim(),
        shop_type: formData.shop_type,
        instagram: formData.instagram.trim() || undefined,
        theme: formData.theme,
        accent_color: formData.accent_color,
        font_family: formData.font_family,
        border_radius: formData.border_radius,
        enabled_sections: formData.enabled_sections,
        logo_url: formData.logo_url || undefined,
      });
      router.push("/admin");
    } catch (err: any) {
      alert(err.message || "Greška pri spremanju radnje");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6] text-neutral-900 lg:flex-row">
      {/* Lijevi panel — kontrole */}
      <div className="flex w-full flex-col justify-between p-6 lg:w-[420px] lg:shrink-0 lg:p-10">
        <div>
          <div className="mb-8 flex gap-2">
            {STEP_KEYS.map((key, i) => (
              <div
                key={key}
                className={`h-2 flex-1 rounded-full transition-all ${
                  i <= stepIndex ? "bg-black" : "bg-neutral-300"
                }`}
              />
            ))}
          </div>

          <p className="mb-2 text-xs font-black uppercase tracking-widest text-neutral-400">
            Korak {stepIndex + 1} od {STEP_KEYS.length}
          </p>
          <h1 className="mb-6 text-2xl font-black lg:text-3xl">{STEP_LABELS[currentStep]}</h1>

          {/* KORAK: Osnovne informacije */}
          {currentStep === "basics" && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase text-neutral-700">
                  Naziv brenda / salona
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    updateForm({ name: e.target.value });
                    if (nameError) setNameError("");
                  }}
                  placeholder="npr. Tarik Barbershop"
                  className={`w-full rounded-2xl border-2 bg-white p-4 text-base font-bold outline-none transition-all ${
                    nameError ? "border-red-400" : "border-neutral-300 focus:border-black"
                  }`}
                />
                {nameError && <p className="mt-1.5 text-xs font-semibold text-red-600">{nameError}</p>}
              </div>

              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase text-neutral-700">
                  Kategorija biznisa
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {INDUSTRIES.map((industry) => (
                    <button
                      key={industry.id}
                      type="button"
                      onClick={() => selectIndustry(industry.id)}
                      className={`flex min-h-[100px] flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all ${
                        formData.shop_type === industry.id
                          ? "border-black bg-white shadow-lg ring-2 ring-black"
                          : "border-neutral-200 bg-white hover:border-neutral-400"
                      }`}
                    >
                      <span className="mb-1.5 block text-2xl">{industry.emoji}</span>
                      <span className="block text-xs font-extrabold leading-tight">{industry.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-neutral-500">
                  Odabir kategorije odmah primjenjuje odgovarajuću temu i boju — možete ih promijeniti u sljedećem koraku.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase text-neutral-700">
                  Instagram profil (opcionalno)
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => updateForm({ instagram: e.target.value })}
                  placeholder="@mojsalon_ba"
                  className="w-full rounded-2xl border-2 border-neutral-300 bg-white p-4 text-sm font-semibold outline-none transition-all focus:border-black"
                />
              </div>
            </div>
          )}

          {/* KORAK: Izgled i logo */}
          {currentStep === "branding" && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-extrabold uppercase text-neutral-700">Logo</label>
                <LogoUpload
                  value={formData.logo_url}
                  onChange={(dataUrl) => updateForm({ logo_url: dataUrl })}
                  onColorSuggestion={(hex) => updateForm({ accent_color: hex })}
                />
              </div>

              <div>
                <label className="mb-3 block text-xs font-extrabold uppercase text-neutral-700">Tema</label>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => updateForm({ theme: theme.id })}
                      className={`rounded-2xl border-2 p-3 text-left transition-all ${
                        formData.theme === theme.id
                          ? "border-black bg-white shadow-md ring-2 ring-black"
                          : "border-neutral-200 bg-white hover:border-neutral-400"
                      }`}
                    >
                      <div
                        className="mb-2 flex h-10 items-end justify-between rounded-xl border border-black/10 p-2"
                        style={{ backgroundColor: theme.bg, color: theme.text }}
                      >
                        <span className="text-xs font-black">Aa</span>
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                      </div>
                      <p className="text-xs font-extrabold">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs font-extrabold uppercase text-neutral-700">Akcentna boja</label>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateForm({ accent_color: color })}
                      className={`h-9 w-9 rounded-full border-2 transition-all ${
                        formData.accent_color.toLowerCase() === color.toLowerCase()
                          ? "scale-110 border-black shadow-lg ring-2 ring-black/20"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {!ACCENT_COLORS.some((c) => c.toLowerCase() === formData.accent_color.toLowerCase()) && (
                    <div
                      className="flex h-9 items-center gap-1.5 rounded-full border-2 border-black px-3 text-[10px] font-bold uppercase"
                      style={{ backgroundColor: formData.accent_color, color: "#000" }}
                    >
                      Iz loga
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* KORAK: Sekcije */}
          {currentStep === "sections" && (
            <div className="space-y-2.5">
              <label className="mb-1 block text-xs font-extrabold uppercase text-neutral-700">
                Aktivne sekcije na stranici
              </label>
              {SECTION_OPTIONS.map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => toggleSection(sec.id)}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-neutral-200 bg-white p-4 transition-all hover:border-black"
                >
                  <span className="text-sm font-bold">{sec.label}</span>
                  <input
                    type="checkbox"
                    checked={formData.enabled_sections.includes(sec.id)}
                    readOnly
                    className="h-5 w-5 rounded accent-black"
                  />
                </div>
              ))}
            </div>
          )}

          {/* KORAK: Objavi */}
          {currentStep === "publish" && (
            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-3xl font-black text-white">
                ✓
              </div>
              <p className="text-base text-neutral-600">
                <b className="text-neutral-900">{formData.name}</b> je spreman. Pregledajte kako izgleda desno i
                kliknite dugme ispod da ga objavite uživo za klijente.
              </p>
            </div>
          )}
        </div>

        {/* Navigacija */}
        <div className="mt-10 flex gap-3">
          {stepIndex > 0 && (
            <button
              onClick={goBack}
              className="rounded-2xl border-2 border-neutral-300 bg-white px-6 py-4 text-sm font-extrabold transition-all hover:bg-neutral-100"
            >
              Nazad
            </button>
          )}
          {currentStep !== "publish" ? (
            <button
              onClick={goNext}
              className="flex-1 rounded-2xl bg-black py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:bg-neutral-800"
            >
              Nastavi →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 rounded-2xl bg-black py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-md transition-all hover:bg-neutral-800 disabled:opacity-60"
            >
              {loading ? "Spremanje..." : "Objavi Stranicu 🎉"}
            </button>
          )}
        </div>
      </div>

      {/* Desni panel — živi pregled */}
      <div className="flex min-h-[560px] flex-1 items-center justify-center bg-neutral-200 p-4 lg:p-8">
        <div className="h-full max-h-[820px] w-full">
          <BrowserPreview
            data={{
              name: formData.name,
              shop_type: formData.shop_type,
              theme: formData.theme,
              accent_color: formData.accent_color,
              logo_url: formData.logo_url,
              enabled_sections: formData.enabled_sections,
            }}
            device={device}
            onToggleDevice={setDevice}
          />
        </div>
      </div>
    </div>
  );
}
