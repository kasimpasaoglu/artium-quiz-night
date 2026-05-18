# Faz 02 — UI Foundation

**Durum:** ✅ DONE — 2026-05-18
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

- [x] `npx shadcn@latest init` — Tailwind v4 uyumlu init (4.7.0 yeni CLI; `--base=radix --defaults` kullanıldı, base color neutral, CSS variables ON).
- [x] `components.json` üretildi.
- [x] Temel shadcn komponentleri eklendi (11/12; `form` shadcn 4.7.0 registry'sinde bulunamadı, Sapma Logu'na alındı):
  - `button` (init ekledi), `input`, `label`, `dialog`, `dropdown-menu`, `select`, `table`, `badge`, `card`, `separator`, `textarea`.
- [x] `sonner` toast provider — `<Toaster richColors position="top-right" closeButton />` root layout body'sinde.
- [x] `lib/utils.ts` — `cn()` helper (shadcn init otomatik ekledi).
- [x] `lib/fonts.ts` — 15 font whitelist (sapma: Inter + Roboto kaldırıldı, Libre Baskerville + Archivo Black eklendi). Her font `subsets: ["latin", "latin-ext"]`, `display: "swap"`, `variable: "--font-<key>"`. `FONT_WHITELIST as const satisfies Record<string, FontEntry>` ile `FontKey` derive edildi. `cssVarForFont(key)` helper'ı `--font-${key}` döndürür.
- [x] `app/layout.tsx` güncellendi:
  - `<html lang="tr">`.
  - `metadata: { title: "Artium Quiz Night", description: "Artium Sahne ve Sanat Merkezi quiz gecesi sunum platformu", icons }`.
  - 15 font CSS variable'ı `FONT_WHITELIST_VARIABLES` ile `<html className>`'e inject (build-time preload).
  - Geist import'ları kaldırıldı.
  - `<Toaster />` body sonuna.
- [x] `app/globals.css` DESIGN.md §13 şablonu birebir uygulandı:
  - `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"` (shadcn 4 init).
  - `@theme inline`: shadcn admin variable'ları + `--color-quiz-primary/accent/text`, `--font-quiz`, `--color-admin-*`, şekil/çizgi/spacing/animasyon/tipografi token'ları (DESIGN.md §03/§05/§06/§07).
  - `:root`: admin sabit tema (`--admin-bg/fg/accent` + shadcn variable'ları DESIGN.md hex değerlerine bağlandı, `--radius: 0.125rem`) + Klasik Sahne default quiz teması (`#1A1815/C4A572/F4EFE6` + Playfair Display).
  - Dark mode `prefers-color-scheme` media query (Faz 01 default'u) yok; shadcn'in `.dark` class block'u tutuldu ama hiç aktif edilmiyor (Faz 09'da değerlendirilir).
  - `--quiz-background` brief'te vardı, kaldırıldı (DESIGN.md §04 sadece primary/accent/text tanımlıyor).
  - `@media (prefers-reduced-motion: reduce)`: tüm `--duration-*` 0ms.
  - `@utility border-rule/heavy/poster` (Tailwind v4 custom utility).
  - `@keyframes breathe / ink-press / curtain-reveal` (Faz 08 modal koreografisi için altyapı).
- [x] `app/page.tsx` silindi → `app/(public)/page.tsx` placeholder oluşturuldu. Türkçe karakter test dizisi (`ç ğ ı ö ş ü Ç Ğ İ Ö Ş Ü`) gömülü; Tailwind utility class'ları (`text-display`, `font-quiz`, `bg-quiz-primary`, `text-quiz-text`, vs.) ile yazıldı.
- [x] `documents/theme-tokens.md` yazıldı — quiz runtime + admin sabit + şekil/çizgi/spacing/animasyon/tipografi/keyframes token sözlüğü.
- [x] `documents/font-whitelist.md` yazıldı — 15 font tablo + Türkçe karakter handling kuralları + diakritik çarpışma çözümü + Faz 05/08 kullanım örnekleri + yasak fontlar.
- [x] 7 dekoratif SVG `public/decorative/` altında oluşturuldu (spotlight-cone, curtain-edge, registration-mark, noise-grain, brush-stroke, note-dots, mask-abstract — hepsi minimal geometrik, `currentColor` uyumlu, viewBox normalize). DESIGN.md §05/§10 envanteri eksiksiz.

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

### Brief ↔ DESIGN.md çatışmaları (DESIGN.md tercih edildi)

Memory kuralı: brief eski olabilir, güncel doğruyu tercih et. Aşağıdaki kararlar kullanıcıdan onay alındıktan veya açık DESIGN.md anayasasından gelerek uygulandı.

1. **Font whitelist — Inter + Roboto çıkarıldı.**
   Brief 15 fontluk whitelist'e `Inter` ve `Roboto`'yu dahil ediyordu. DESIGN.md §01.3 AI Slop Manifestosu bu iki fontu açıkça yasaklıyor ("Inter, Roboto, Arial, system-ui (whitelist'te yok)").
   **Uygulanan:** Yerine **Libre Baskerville** (klasik letterpress serif) ve **Archivo Black** (heavy display sans) eklendi. İkisi de `latin-ext` desteklemekte, Theatrical Letterpress estetiğine uyumlu. Kullanıcı onayı alındı.
   **Etki:** Sonraki fazlar (Faz 05 font selector, Faz 08 ThemeApplier) bu 15 font listesi üzerinden çalışır.

2. **Default tema değerleri — jenerik palet → Klasik Sahne preset.**
   Brief default: `#6366f1` (indigo) + `#f59e0b` (amber) + `#ffffff` + `#0f172a` + Inter.
   **Uygulanan:** DESIGN.md §13 + §11 Klasik Sahne preset: `--quiz-primary: #1A1815` (kömür siyahı), `--quiz-accent: #C4A572` (eski pirinç), `--quiz-text: #F4EFE6` (yumuşak kreem), `--quiz-font: var(--font-playfair-display)`. Kullanıcı onayı alındı.
   **Etki:** Idle stage, admin tarafından quiz oluşturulmadığı sürece bu paletle render olur (Faz 08 placeholder zaten bu rengi kullanıyor).

3. **`--quiz-background` variable kaldırıldı.**
   Brief 5 quiz variable tanımlamıştı (`primary/accent/text/background/font`). DESIGN.md §04 yalnızca üç renk rolü tanımlıyor (`primary/accent/text`); arka plan görseli `backgroundUrl` üzerinden gelir, fallback için `--quiz-primary` yeterli.
   **Uygulanan:** `--quiz-background` tanımlanmadı. `:root` blok 4 quiz variable içeriyor.
   **Etki:** Faz 03 schema'sında `Quiz` modelinde `backgroundColor` alanı YOK; `backgroundUrl` (string, opsiyonel) ve `primaryColor/accentColor/textColor` yeterli. Faz 03 plan'ı buna göre yazılmalı.

4. **Admin sabit teması eklendi (`--admin-bg/fg/accent`).**
   Brief admin tarafının quiz tema'sından nasıl izole edileceğini açıklamamıştı. DESIGN.md §08 + §13 admin tema'nın quiz renklerinden bağımsız olduğunu söyler ve `#FAF8F4 / #1A1815 / #9C5A2E` üçlüsünü tanımlar.
   **Uygulanan:** `:root` blok bu üç token'ı tanımlıyor; shadcn'in `--background/--foreground/--primary/--accent/--ring/--sidebar-*` variable'ları admin token'larına bağlandı. `--radius: 0.125rem` (letterpress keskin köşeler).
   **Etki:** shadcn primitive'leri admin panelinde DESIGN.md admin tema'sını otomatik kullanır. Quiz tema'sı admin'e yansımaz.

5. **Tipografi + spacing + animasyon + timing + şekil + çizgi token'larının tam set'i eklendi.**
   Brief sadece quiz runtime variable'larından bahsediyor, DESIGN.md §13 implementation şablonu çok daha geniş set tanımlıyor.
   **Uygulanan:** `@theme inline` bloğuna `--shape-sharp/soft/pill`, `--stroke-hair/rule/heavy/poster`, `--space-stage/breath/rule`, `--duration-micro/small/stage/curtain/breath`, `--motion-curtain/spotlight/ink/breathe`, `--text-display/title/section/body/meta` eklendi.
   **Etki:** Faz 08 modal koreografisi, Faz 05 admin form, Faz 09 polish tüm bu token'ları kullanır. Bu altyapı şimdi hazır olduğu için sonraki fazlar yeniden token tanımlamayacak.

6. **Custom keyframes ve custom utility'ler eklendi.**
   Brief animasyon altyapısından bahsetmiyor.
   **Uygulanan:** `@keyframes breathe / ink-press / curtain-reveal` ve `@utility border-rule / border-heavy / border-poster` (Tailwind v4 syntax).
   **Etki:** Faz 08 modal entrance, idle nefes, sayaç pulse bu keyframes üzerinde inşa edilir.

### shadcn 4.7.0 sürprizi

7. **shadcn 4.x yeni CLI flag'leri.**
   Brief `npx shadcn@latest init` veya benzeri komutla `--base-color` flag'ini varsayıyordu. shadcn 4.7.0'da bu flag kaldırılmış; yerine `--base <radix|base>` (component library) ve `--preset <name>` (preset config — default `base-nova`) flag'leri var.
   **Uygulanan:** `npx shadcn@latest init --yes --defaults --base=radix --no-monorepo` ile init yapıldı. `components.json` `style: "radix-nova"`, `baseColor: "neutral"`, `cssVariables: true`, `iconLibrary: "lucide"` olarak oluştu. `--base radix` Radix UI tabanını seçer; bu DESIGN.md modal/dialog/dropdown stratejisi ile tutarlı.
   **Etki:** Sonraki fazlar shadcn add komutlarını aynı yeni CLI sözdizimi ile çağırmalı (`--yes --overwrite` flag'leri var, `--force` yok).

8. **`form` component shadcn 4.7.0 registry'sinde bulunamadı.**
   shadcn 4'te `form` component'i nova-radix preset registry'sinde gözükmüyor (`add form --yes` 0 dosya oluşturdu, registry check geçti ama indirme olmadı). Hata mesajı verilmedi, sessizce skip.
   **Uygulanan:** Faz 02'de `form` eklenmedi (11/12 component). `react-hook-form` paketi zaten Faz 01'de kuruluydu.
   **Etki:** Faz 04 (Auth login form) ve Faz 05+ (Admin form'lar) gerektiğinde `Controller / FormProvider` ile elle wrapper yazılacak veya alternatif kaynak'tan (registry URL) eklenecek. Ek bir engelleyici değil.

9. **shadcn paket modernizasyonu — unified `radix-ui` paketi.**
   Brief eski shadcn versiyonuna göre `@radix-ui/react-dialog`, `react-dropdown-menu`, `react-label`, `react-select`, `react-separator`, `react-slot` paketlerinin ayrı eklenmesini bekliyordu. shadcn 4.7.0 yeni unified `radix-ui` paketini (`^1.4.3`) kuruyor; tüm primitive'ler tek import altında.
   **Uygulanan:** `radix-ui@^1.4.3` `package.json`'da. Ek olarak `tw-animate-css@^1.4.0` (shadcn 4 Tailwind v4 init eklentisi), `lucide-react@^1.16.0`, `class-variance-authority`, `clsx`, `tailwind-merge` kuruldu.
   **Etki:** shadcn component import path'leri `radix-ui` üzerinden olur. Bu sapma, sonraki fazların component'lerinden bağımsız (transparan).

10. **shadcn init `globals.css` ve `lib/utils.ts`'i otomatik yazdı.**
    Brief `lib/utils.ts`'in init tarafından eklendiğini doğru tahmin etmişti. Buna ek olarak shadcn `globals.css`'i kendi default tema (`oklch` neutral) ile overwrite etti.
    **Uygulanan:** Üstüne DESIGN.md §13 şablonu yazıldı, shadcn'in admin variable'larını admin sabit tema değerlerine bağladım. Plan'da öngörülen risk gerçekleşti ve kontrollü şekilde absorbe edildi.
    **Etki:** Yok (DESIGN.md anayasa olarak çalışıyor).

### Simplify Review düzeltmeleri

11. **`FONT_WHITELIST` `as const satisfies` ile derive edilen `FontKey`.**
    İlk sürümde `FontKey` manual union literal listesi ile yazılmıştı + `cssVar` field her entry'de redundant olarak duruyordu. Simplify review'da:
    - `FONT_WHITELIST as const satisfies Record<string, FontEntry>` → `FontKey = keyof typeof FONT_WHITELIST` (single source of truth).
    - `cssVar` field kaldırıldı (`--font-${key}` template ile derive edilir). Yardımcı export: `cssVarForFont(key)`.
    - `documents/font-whitelist.md` kullanım örneği güncellendi.

12. **`app/(public)/page.tsx` inline style → Tailwind utility class'lar.**
    İlk sürümde 4 element'in her birinde `style={{ ... }}` inline blokları vardı (`fontFamily`, `fontSize`, `letterSpacing`, vs.). `@theme inline`'da zaten `text-display/title/section/body/meta` + `font-quiz` + `bg-quiz-primary/text-quiz-text` Tailwind utility'leri üretildiği için inline style sprawl gereksizdi.
    - Tüm style'lar utility class'a çevrildi. `--space-stage/breath` için arbitrary value (`p-[var(--space-stage)]`, `mt-[var(--space-breath)]`) kullanıldı.
    - Gereksiz wrapper `<div>` kaldırıldı (`<main>` `flex-col` ile dikey sıralama yeterli).

### Doğrulama Sonuçları (2026-05-18)

- `npm run typecheck` → 0 hata
- `npm run lint` → 0 hata
- `npm run format:check` → tüm dosyalar Prettier uyumlu
- `npm run build` → ✓ Compiled successfully (1.9s), 4 static page generated, Proxy middleware aktif
- Bundle: `/` route prerendered as static content (Server Component placeholder)
