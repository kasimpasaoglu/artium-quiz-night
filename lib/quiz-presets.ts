import type { FontKey } from "@/lib/fonts";

export interface QuizPreset {
  id: string;
  label: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontKey: FontKey;
}

// DESIGN.md §11 — 4 önerilen tema kombinasyonu. Tek tık ile quiz form'undaki
// renk + font alanlarını doldurur. Admin yine bireysel olarak değer değiştirebilir.
export const QUIZ_PRESETS = [
  {
    id: "klasik-sahne",
    label: "Klasik Sahne",
    description: "Küçük tiyatro salonu, pirinç sahne aydınlatması, eski kâğıt.",
    primaryColor: "#1A1815",
    accentColor: "#C4A572",
    textColor: "#F4EFE6",
    fontKey: "playfair-display",
  },
  {
    id: "atolye-sabahi",
    label: "Atölye Sabahı",
    description: "Işıklı resim atölyesi, terakota toprak, kreem duvar.",
    primaryColor: "#E8DFD2",
    accentColor: "#9C5A2E",
    textColor: "#2A2622",
    fontKey: "merriweather",
  },
  {
    id: "caz-gecesi",
    label: "Caz Gecesi",
    description: "Dumanlı caz kulübü, koyu navy, soluk altın.",
    primaryColor: "#0B1E2F",
    accentColor: "#D4A24C",
    textColor: "#EBE4D1",
    fontKey: "oswald",
  },
  {
    id: "resim-atolyesi",
    label: "Resim Atölyesi",
    description: "Bordo + turuncu palet, sıcak ahşap, akrilik canlılık.",
    primaryColor: "#3D2E2A",
    accentColor: "#E76F51",
    textColor: "#F2E8DC",
    fontKey: "raleway",
  },
] as const satisfies readonly QuizPreset[];

export const DEFAULT_QUIZ_PRESET = QUIZ_PRESETS[0];
