// Jedinstven izvor istine za "industry starter kits" — biranje kategorije u onboardingu
// odmah primjenjuje temu, akcentnu boju i primjer usluga, tako da pregled izgleda gotovo
// umjesto generično. Isti podaci se koriste i u wizardu i u živom pregledu.

export interface IndustryConfig {
  id: string;
  label: string;
  emoji: string;
  theme: string;
  accentColor: string;
  heroImage: string;
  sampleServices: { title: string; duration: number; price: number }[];
}

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: "barbershop",
    label: "Barbershop",
    emoji: "💈",
    theme: "noir",
    accentColor: "#D97706",
    heroImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80",
    sampleServices: [
      { title: "Muško šišanje", duration: 30, price: 20 },
      { title: "Šišanje + brada", duration: 45, price: 30 },
    ],
  },
  {
    id: "frizerski_salon",
    label: "Frizerski salon",
    emoji: "💇‍♀️",
    theme: "velvet",
    accentColor: "#EC4899",
    heroImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    sampleServices: [
      { title: "Feniranje", duration: 30, price: 15 },
      { title: "Farbanje kose", duration: 90, price: 60 },
    ],
  },
  {
    id: "beauty_studio",
    label: "Beauty Studio",
    emoji: "💅",
    theme: "gold",
    accentColor: "#EAB308",
    heroImage: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=900&q=80",
    sampleServices: [
      { title: "Manikura", duration: 45, price: 25 },
      { title: "Trepavice", duration: 60, price: 35 },
    ],
  },
  {
    id: "autoservis",
    label: "Autoservis & Detailing",
    emoji: "🔧",
    theme: "steel",
    accentColor: "#3B82F6",
    heroImage: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=80",
    sampleServices: [
      { title: "Mali servis", duration: 60, price: 80 },
      { title: "Detailing unutrašnjosti", duration: 120, price: 100 },
    ],
  },
];

export function getIndustry(shopType: string): IndustryConfig {
  return INDUSTRIES.find((i) => i.id === shopType) || INDUSTRIES[0];
}

export const THEME_STYLES: Record<string, { bg: string; text: string; cardBg: string; muted: string }> = {
  noir: { bg: "#09090B", text: "#FAFAFA", cardBg: "#18181B", muted: "#A1A1AA" },
  steel: { bg: "#0F172A", text: "#F8FAFC", cardBg: "#1E293B", muted: "#94A3B8" },
  royal: { bg: "#0284C7", text: "#FFFFFF", cardBg: "#0369A1", muted: "#E0F2FE" },
  forest: { bg: "#064E3B", text: "#ECFDF5", cardBg: "#047857", muted: "#A7F3D0" },
  espresso: { bg: "#1C1917", text: "#FAFAF9", cardBg: "#292524", muted: "#A8A29E" },
  velvet: { bg: "#18181B", text: "#FAFAFA", cardBg: "#27272A", muted: "#A1A1AA" },
  nordic: { bg: "#F8FAFC", text: "#0F172A", cardBg: "#FFFFFF", muted: "#64748B" },
  gold: { bg: "#1A1A1A", text: "#FEF08A", cardBg: "#262626", muted: "#D6D3D1" },
};

export const THEMES = [
  { id: "noir", name: "Noir", desc: "Tamno i odvažno — za barbershope", ...THEME_STYLES.noir, accent: "#D97706" },
  { id: "steel", name: "Steel", desc: "Industrijski — za servise i radnje", ...THEME_STYLES.steel, accent: "#3B82F6" },
  { id: "royal", name: "Royal", desc: "Plavo i zlato — visoki luksuz", ...THEME_STYLES.royal, accent: "#EAB308" },
  { id: "forest", name: "Forest", desc: "Smaragdan ton — prirodna svježina", ...THEME_STYLES.forest, accent: "#10B981" },
  { id: "espresso", name: "Espresso", desc: "Topla kafa — uglađen stil", ...THEME_STYLES.espresso, accent: "#F97316" },
  { id: "velvet", name: "Velvet", desc: "Noćni glamur — bordo & roze", ...THEME_STYLES.velvet, accent: "#EC4899" },
  { id: "nordic", name: "Nordic Light", desc: "Čisto i bijelo — minimalistički", ...THEME_STYLES.nordic, accent: "#6366F1" },
  { id: "gold", name: "Gold Prestige", desc: "Zlatni detalji na crnom", ...THEME_STYLES.gold, accent: "#EAB308" },
];

export const ACCENT_COLORS = [
  "#D97706", "#3B82F6", "#EF4444", "#10B981", "#8B5CF6", "#EC4899", "#EAB308", "#06B6D4", "#F97316",
];
