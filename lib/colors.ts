// Hex renk doğrulaması — schema, form girişi, runtime safe-cast'lerde aynı
// kaynaktan beslenir. `#rrggbb` formatı (6 hane, küçük/büyük harf), `#rgb`
// kısayolu DESIGN.md §04 izninde değil.

export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const isHexColor = (value: string): boolean => HEX_COLOR_RE.test(value);

export function safeHexColor(value: string | null | undefined, fallback: string): string {
  return value && HEX_COLOR_RE.test(value) ? value : fallback;
}
