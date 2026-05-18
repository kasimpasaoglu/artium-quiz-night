# Font Whitelist (15 Google Font)

Faz 02'de [lib/fonts.ts](../lib/fonts.ts) içinde tanımlanan, **`next/font/google`** üzerinden `subsets: ["latin", "latin-ext"]` ile build-time preload edilen 15 Google Font'un sözlüğü. Faz 05 quiz form'unda admin bu listeden bir font seçer; Faz 08 ThemeApplier `--quiz-font` CSS variable'ını seçilen entry'nin Google Font CSS variable'ına bağlar (`cssVarForFont(key)` helper'ı `--font-${key}` döndürür).

## Tablo

| Key | Etiket | next/font Adı | CSS Variable | Sınıf | Preset Önerisi | Karakter |
|-----|--------|----------------|----------------|---------|------------------|----------|
| `playfair-display` | Playfair Display | `Playfair_Display` | `--font-playfair-display` | display serif | **Klasik Sahne (Default)** | Yarış Başlasın! ÇĞİÖŞÜ |
| `merriweather` | Merriweather | `Merriweather` | `--font-merriweather` | reading serif | **Atölye Sabahı** | Yarış Başlasın! ÇĞİÖŞÜ |
| `libre-baskerville` | Libre Baskerville | `Libre_Baskerville` | `--font-libre-baskerville` | klasik letterpress serif | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `oswald` | Oswald | `Oswald` | `--font-oswald` | condensed sans | **Caz Gecesi** | YARIŞ BAŞLASIN ÇĞİÖŞÜ |
| `bebas-neue` | Bebas Neue | `Bebas_Neue` | `--font-bebas-neue` | display sans | — | YARIŞ BAŞLASIN ÇĞİÖŞÜ |
| `archivo-black` | Archivo Black | `Archivo_Black` | `--font-archivo-black` | heavy display sans | — | YARIŞ BAŞLASIN ÇĞİÖŞÜ |
| `raleway` | Raleway | `Raleway` | `--font-raleway` | elegant sans | **Resim Atölyesi** | Yarış Başlasın! ÇĞİÖŞÜ |
| `montserrat` | Montserrat | `Montserrat` | `--font-montserrat` | geometric sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `poppins` | Poppins | `Poppins` | `--font-poppins` | rounded sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `open-sans` | Open Sans | `Open_Sans` | `--font-open-sans` | neutral sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `lato` | Lato | `Lato` | `--font-lato` | warm sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `nunito` | Nunito | `Nunito` | `--font-nunito` | rounded sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `quicksand` | Quicksand | `Quicksand` | `--font-quicksand` | playful sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `rubik` | Rubik | `Rubik` | `--font-rubik` | geometric sans | — | Yarış Başlasın! ÇĞİÖŞÜ |
| `source-sans-3` | Source Sans 3 | `Source_Sans_3` | `--font-source-sans-3` | technical sans | — | Yarış Başlasın! ÇĞİÖŞÜ |

**Toplam:** 3 serif + 12 sans / display sans. Hepsi `latin-ext` subset desteğine sahip (Türkçe ç, ğ, ı, ö, ş, ü garantili).

## Türkçe Karakter Handling (DESIGN.md §03.3)

### 1. `latin-ext` Zorunluluğu

Tüm font'lar `subsets: ["latin", "latin-ext"]` ile yüklenir. `latin-ext` Türkçe diakritikleri (ç, ğ, ı, ö, ş, ü) kapsar.

### 2. Diakritik Çarpışma

Display fontunda `letter-spacing` negatif olduğunda Ç/Ğ/Ş üst aksanı bir sonraki harfle çarpışabilir. Çözüm CSS:

```css
.display-text {
  font-feature-settings: "kern" 1;
  letter-spacing: max(-0.025em, -0.03em);
}
```

- `font-feature-settings: "kern" 1` kerning aktif tutar.
- `letter-spacing` minimum `-0.025em`; geçince diakritik biner.

### 3. Bebas Neue + Türkçe

Bebas Neue'nun Google Fonts versiyonu **latin-ext destekler** (ı, ğ, ş, ç render OK — DESIGN.md §03.3 doğrulanmış). Yine de:

- Tüm-büyük harf ekranda asla > 40 karakter (Türkçe büyük İ/Ş okunabilirliği bozulur).
- Soru metni hiçbir zaman uppercase değildir.
- Meta tipografi uppercase'tir ama kısadır (örn. "ARTIUM • SAHNE A").

## Build-Time Preload

`app/layout.tsx`'te tüm 15 font'un CSS variable'ları `<html className={FONT_WHITELIST_VARIABLES}>` üzerinden inject edilir. Next.js build zamanında font dosyalarını optimize eder ve `display: swap` ile FOIT'u önler.

**Network maliyeti (Faz 09'da ölçülecek):** Tahmini ~300-500 KB latin-ext subset toplam. Eğer optimize gerekirse:

- En çok kullanılan 8 font preload, geri kalan 7'si `display: optional` ile lazy.
- Veya tüm font'lar lazy (sadece aktif quiz fontu eager preload — Faz 08'de runtime decision).

## Kullanım Örneği (Faz 05 Form)

```tsx
import { FONT_WHITELIST, type FontKey } from "@/lib/fonts";

// Color picker yanında font selector dropdown:
const options = Object.entries(FONT_WHITELIST).map(([key, entry]) => ({
  value: key as FontKey,
  label: entry.label,
  // Önizleme: aynı font'la "Yarış Başlasın!" göster
  previewClass: entry.className,
}));
```

## Kullanım Örneği (Faz 08 ThemeApplier)

```tsx
import { cssVarForFont, type FontKey } from "@/lib/fonts";

// CSS variable swap:
const cssVar = cssVarForFont(quiz.fontKey as FontKey);
document.documentElement.style.setProperty("--quiz-font", `var(${cssVar})`);
```

## Default ve Fallback

- Default: `playfair-display` (Klasik Sahne preset, DESIGN.md §11).
- Fallback: Browser system serif/sans. CSS body'de `font-family: var(--quiz-font)` tanımlı, `--quiz-font` her zaman `lib/fonts.ts`'ten bir değişkene refer eder.

## Yasak Font'lar (DESIGN.md §01.3)

Şu fontlar whitelist'te **yer almaz** ve admin form'unda da seçenek olarak sunulmaz:

- **Inter** — AI Slop yasakları
- **Roboto** — AI Slop yasakları
- **Arial** — yetersiz tipografi karakteri
- **system-ui** — generic SaaS hissi

## Referanslar

- [DESIGN.md](DESIGN.md) §01.3 (AI Slop), §03 (Tipografi sistemi), §11 (4 preset tema).
- [lib/fonts.ts](../lib/fonts.ts) — implementation.
- [app/layout.tsx](../app/layout.tsx) — `<html className>` inject noktası.
