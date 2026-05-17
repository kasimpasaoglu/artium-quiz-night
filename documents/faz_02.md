# Faz 02 — UI Foundation

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 01

## Amaç

UI temelini kurmak: shadcn/ui kurulumu (Tailwind v4 uyumlu), temel komponentleri eklemek, `sonner` toast provider'ı root layout'a bağlamak, Türkçe karakter destekli ~15 Google Font'tan oluşan whitelist'i `next/font/google` ile preload etmek, root layout'u Türkçeleştirmek (`lang="tr"`, metadata, template metinlerinin temizlenmesi), `globals.css`'i quiz-night runtime tema değişkenleri için yeniden organize etmek. Bu faz sonunda admin paneli ve public ekran için kullanılacak görsel altyapı hazır olacak; sonraki fazlar sadece sayfa-bazlı UI yazacak.

## Kapsam Dışı (Out of Scope)

- Page'lerin içeriği (login form, quiz list, vb.) — Faz 04+.
- Form mantığı, validation — Faz 04+.
- DB bağlantısı, auth — Faz 03/04.
- Tema renklerinin runtime'da uygulanması (ThemeApplier component) — Faz 08.
- Mobile-specific responsive ince ayarlar — Faz 09.

## Yapılacaklar (Checklist)

- [ ] `npx shadcn@latest init` — Tailwind v4 uyumlu init, base color olarak "neutral" seç, CSS variables ON.
- [ ] `components.json` üret (shadcn config).
- [ ] Temel shadcn komponentleri ekle (sırayla):
  - `npx shadcn@latest add button input label dialog dropdown-menu form select table badge card separator textarea`
- [ ] `sonner` toast provider — root layout'ta `<Toaster richColors position="top-right" />`.
- [ ] `lib/utils.ts` — `cn()` helper (shadcn init zaten ekler, doğrula).
- [ ] `lib/fonts.ts` — Whitelist:
  ```ts
  import { Inter, Roboto, Montserrat, Poppins, Open_Sans, Lato, Raleway, Playfair_Display, Merriweather, Nunito, Quicksand, Oswald, Bebas_Neue, Rubik, Source_Sans_3 } from "next/font/google";
  ```
  Her font için: `subsets: ["latin", "latin-ext"]` (Türkçe karakter zorunlu), `display: "swap"`, `variable: "--font-<key>"`.
  Export: `FONT_WHITELIST: Record<string, { variable: string; className: string; label: string }>`.
- [ ] `app/layout.tsx`'i güncelle:
  - `<html lang="tr">` (template `en`'den değişti).
  - `metadata`: `{ title: "Artium Quiz Night", description: "Quiz gecesi sunum platformu", icons: { icon: "/favicon.ico" } }`.
  - Tüm font variable'larını `<html className={...allFontVariables}>` ile inject et (Faz 08'de aktif quiz fontu CSS variable swap ile seçilecek; bütün fontlar build-time preload edilmeli).
  - `<body>`'deki `font-family: Arial, Helvetica, sans-serif;` CSS'ini kaldır.
  - `<Toaster />` body'nin sonuna.
- [ ] `app/globals.css`'i yeniden yapılandır:
  - Mevcut `@import "tailwindcss"` kalsın.
  - `@theme inline` bloğunu güncelle: quiz runtime variable'larını rezerve et (`--color-quiz-primary`, `--color-quiz-accent`, `--color-quiz-text`, `--color-quiz-background`, `--font-quiz` → hepsi `var(--quiz-*)`).
  - `:root`'ta default değerler (`--quiz-primary: #6366f1; --quiz-accent: #f59e0b; --quiz-text: #ffffff; --quiz-background: #0f172a; --quiz-font: var(--font-inter);`).
  - Dark mode media query'sini KALDIR (quiz tema bağımsız kontrol edecek).
- [ ] Test: `app/(public)/page.tsx` minimal "Quiz Night — sunum hazır" placeholder (Faz 08 dolduracak, şimdilik sadece görsel kontrol için).
- [ ] `documents/theme-tokens.md` yaz: tüm CSS variable'ların listesi + nereden değiştirildiği (root vs ThemeApplier runtime).
- [ ] `documents/font-whitelist.md` yaz: font key listesi + display label + Türkçe örnek metin önizleme nasıl yapılacağı.

## Dokunulacak Dosyalar

- `app/layout.tsx` — lang=tr, metadata, font variable inject, Toaster, body cleanup.
- `app/globals.css` — quiz tema variable'ları, dark mode kaldırma.
- `app/(public)/page.tsx` (YENİ veya `app/page.tsx`'i route group altına taşı) — placeholder.
- `app/page.tsx` — eğer mevcut template page'i `(public)` route group altına taşınıyorsa silinir.
- `lib/utils.ts` (YENİ — shadcn init eklerse onaylanır).
- `lib/fonts.ts` (YENİ).
- `components.json` (YENİ — shadcn init).
- `components/ui/*.tsx` (YENİ — shadcn add).

## Eklenecek Paketler

- `class-variance-authority@^0.7` — shadcn dependency
- `clsx@^2` — shadcn dependency
- `tailwind-merge@^2` — `cn()` için
- `lucide-react@^0.4xx` — icon set (React 19 uyumlu)
- `sonner@^1` — toast
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slot` — shadcn add otomatik ekler

> **Sürüm uyarısı:** shadcn/ui CLI Tailwind v4 desteğini 2025 başında ekledi. `shadcn@latest` kullan, `shadcn-ui` (eski paket) DEĞİL.

## Veri Modeli / Şema

Yok.

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓ (font preload'lar build aşamasında çekilir)
- `npm run format:check` ✓

**Manuel:**
- `npm run dev` → http://localhost:3000 açılır, Türkçe placeholder "Quiz Night — sunum hazır" gözükür.
- DevTools Network sekmesi: tüm whitelist fontları preload ediliyor mu (15 font dosyası).
- DevTools Elements: `<html lang="tr">`, `<html>` üzerinde font CSS variable'ları var.
- Test sonner: console'dan `toast.success("test")` çağırınca toast çıkıyor mu (geçici test).
- Türkçe karakter render testi: placeholder'da `ç ğ ı ö ş ü Ç Ğ İ Ö Ş Ü` karakterleri eksiksiz görünüyor.

## Deliverables

- `documents/theme-tokens.md` — CSS variable sözlüğü:
  - `--quiz-primary` (hex) — quiz ana rengi, butonlar/vurgular.
  - `--quiz-accent` (hex) — ikincil renk, badge/progress.
  - `--quiz-text` (hex) — modal içi yazı rengi.
  - `--quiz-background` (hex) — fallback arka plan rengi (görsel yüklenmeden önce).
  - `--quiz-font` (CSS variable ref) — `var(--font-<key>)`.
  - Default değerler, ThemeApplier nasıl override eder (Faz 08).
- `documents/font-whitelist.md` — 15 font listesi (key, label, sample text "Yarış başlasın! ÇĞİÖŞÜ").

## Riskler / Açık Sorular

- **shadcn/ui Tailwind v4 init:** CLI'nin Tailwind v4 desteği `@theme inline` syntax'ını koruyor olmalı; init sonrası `globals.css` bozulduysa elle restore et.
- **Çok sayıda font preload:** 15 font preload + her birinin `latin-ext` subset'i toplam ~300-500KB ek yük. Quiz değişimi runtime'da olduğu için tümünü preload etmek zorunluyuz. Performans Faz 09'da ölçülecek; gerekirse "popüler 8 font" preload + diğerleri `display: optional` ile lazy.
- **Bebas Neue + ı/ğ/ş:** Bazı dekoratif fontların Türkçe karakter desteği eksik olabilir; `latin-ext` subset'ini destekleyenleri filtreleyip whitelist'e koy. Bebas Neue dahil tüm seçimleri Google Fonts'tan latin-ext varlığına göre doğrula.
- **Tailwind v4 dark mode:** Default media query kaldırıldı; admin paneli için (quiz tema bağımsız) shadcn dark mode istenir mi? İlk versiyonda light-only, Faz 09'da değerlendirilir.

---

## Sapma Logu

_Agent faz bitiminde doldurur. Şu an boş._
