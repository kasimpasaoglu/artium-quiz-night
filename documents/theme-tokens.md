# Tema Token Sözlüğü

Bu döküman Faz 02'de [app/globals.css](../app/globals.css) içine yazılan tüm CSS custom property'lerini özetler. Sonraki fazlar (özellikle Faz 08 ThemeApplier, Faz 05 Quiz CRUD color picker) bu sözlüğe başvurur.

## Token Aileleri

### 1. Quiz Runtime Teması (dinamik)

Bu dört değişken **quiz başına farklıdır**. Faz 08'de `ThemeApplier` komponenti aktif quiz'in renk/font seçimini `:root` üzerine inline style ile yazar. Sadece public route'unda (`app/(public)/...`) etkilidir; admin paneli (`app/quiz-admin/...`) bunlardan etkilenmez.

| Token | Tip | Default (Klasik Sahne) | Rol |
|-------|-----|------------------------|-----|
| `--quiz-primary` | hex | `#1A1815` | Modal arka planı, başlık çubuğu, sayaç dolu segment, time-up baskın rengi. **ASLA metin rengi olarak kullanılmaz.** |
| `--quiz-accent` | hex | `#C4A572` | CTA fill, progress bar fill, soru numarası badge, son 5 saniye sayaç rengi, dekoratif motif fill. Toplam yüzeyin **%20'sini geçemez**. |
| `--quiz-text` | hex | `#F4EFE6` | Sahne içi metin (display, body). Sadece public `/` route'unda kullanılır; admin paneline yansımaz. |
| `--quiz-font` | CSS variable ref | `var(--font-playfair-display)` | `lib/fonts.ts` whitelist'inden 1 font'a refer eder. Body font-family otomatik bu değişkene bağlanır. |

Tailwind utility erişimi: `bg-quiz-primary`, `text-quiz-text`, `border-quiz-accent`, `font-quiz` (utility'ler `@theme inline` üzerinden otomatik üretilir).

### 2. Admin Sabit Teması

Quiz tema'sından **bağımsız**, hiçbir zaman override edilmez. DESIGN.md §08 admin tema'nın quiz renklerinden ayrı tutulması kuralına uyar.

| Token | Değer | Rol |
|-------|-------|-----|
| `--admin-bg` | `#FAF8F4` | Kreem zemin — top bar, sidebar, ana içerik arkaplanı |
| `--admin-fg` | `#1A1815` | Koyu antrasit — tipografi default rengi |
| `--admin-accent` | `#9C5A2E` | Terakota — focus ring, aktif menu item, brush-stroke motif, CTA |

shadcn'in admin component'leri (`button`, `dialog`, `form` vs.) bu üç token'a bağlanan `--background/--foreground/--primary` shadcn variable'larından beslenir. Aşağıdaki bağlantı tablosu:

| shadcn variable | Bağlandığı admin token / değer |
|-----------------|-------------------------------|
| `--background` | `var(--admin-bg)` |
| `--foreground` | `var(--admin-fg)` |
| `--primary`, `--accent`, `--ring`, `--sidebar-primary` | `var(--admin-accent)` |
| `--primary-foreground`, `--accent-foreground`, `--sidebar-primary-foreground` | `var(--admin-bg)` |
| `--card` | `#FFFFFF` |
| `--secondary`, `--muted`, `--sidebar-accent` | `#EFEAE0` (kreem ton) |
| `--muted-foreground` | `#5B5550` (gri-kahve) |
| `--border`, `--input`, `--sidebar-border` | `#D9D2C5` (yumuşak nötr çerçeve) |
| `--destructive` | `#B23A2F` (warm red, letterpress hissi) |
| `--radius` | `0.125rem` (DESIGN.md §05 — keskin köşeler) |

### 3. Şekil Tokenları (DESIGN.md §05)

Sabit, asla quiz tema'ya göre değişmez. Yasak radius'lar (`rounded-2xl`, `rounded-3xl`, vs.) yerine bu üç değer kullanılır.

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--shape-sharp` | `0` | Modal, sahne, idle stage, table, card |
| `--shape-soft` | `2px` | Buton, input, badge (hafif "elle kesilmiş" hissi) |
| `--shape-pill` | `9999px` | Sadece numerik badge (zorluk göstergesi sayı arka planı) |

### 4. Çizgi Ölçeği (DESIGN.md §05)

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--stroke-hair` | `1px` | Divider, table border, ince çerçeve |
| `--stroke-rule` | `2px` | Form input border, focus ring offset |
| `--stroke-heavy` | `4px` | Section divider, registration mark, top bar alt çizgi |
| `--stroke-poster` | `8px` | Modal kenar çerçevesi, idle stage decorative frame |

Custom utility'ler `globals.css` içinde:
- `border-rule` → `border-width: 2px`
- `border-heavy` → `border-width: 4px`
- `border-poster` → `border-width: 8px`

### 5. Spacing Tokenları (DESIGN.md §06)

Tailwind default spacing scale (`gap-1`...`gap-32`) korunur. Üç ek custom adım:

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--space-stage` | `clamp(3rem, 8vw, 8rem)` | Sahne kompozisyonu kenar boşluğu (modal padding, idle stage padding) |
| `--space-breath` | `clamp(1rem, 2vw, 2rem)` | Section arası "nefes" boşluğu |
| `--space-rule` | `4px` | Hairline aralık (table cell pad, badge içi) |

### 6. Animasyon Süreleri (DESIGN.md §07)

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--duration-micro` | `120ms` | Hover, focus |
| `--duration-small` | `240ms` | Buton state, dropdown |
| `--duration-stage` | `520ms` | Modal entrance/exit, soru değişimi |
| `--duration-curtain` | `820ms` | Perde animasyonu (modal ilk açılış) |
| `--duration-breath` | `4600ms` | İdle nefes döngüsü |

**`prefers-reduced-motion: reduce`** media query'sinde hepsi `0ms`'ye iner (motion duyarlılığı olan kullanıcılar için).

### 7. Timing Fonksiyonları (DESIGN.md §07)

Marka kişiliği taşıyan dört özel cubic-bezier:

| Token | Değer | Anlam |
|-------|-------|-------|
| `--motion-curtain` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Perde açılışı — ağır kumaşın askıya çekilmesi |
| `--motion-spotlight` | `cubic-bezier(0.65, 0, 0.35, 1)` | Odak değişimi — ışığın bir noktaya çekilmesi |
| `--motion-ink` | `cubic-bezier(0.4, 0, 0.6, 1)` | Letterpress düşüş — butona basılma feedback |
| `--motion-breathe` | `cubic-bezier(0.45, 0.05, 0.55, 0.95)` | İdle nefes — sonsuz döngülerde |

### 8. Tipografi Scale — Perfect Fourth 1.333 (DESIGN.md §03)

| Token | Değer | Kullanım |
|-------|-------|----------|
| `--text-display` | `clamp(3.5rem, 8vw, 7.5rem)` | Soru metni, sayaç, idle hero başlık |
| `--text-title` | `clamp(2rem, 4.5vw, 3.5rem)` | Modal alt başlık, admin H1 |
| `--text-section` | `clamp(1.5rem, 2.5vw, 2rem)` | Admin H2, form section title |
| `--text-body` | `clamp(0.95rem, 1.1vw, 1.0625rem)` | Gövde, form label, table cell |
| `--text-meta` | `0.75rem` | Tabular meta, timestamp, badge sayısı |

Tailwind utility erişimi: `text-display`, `text-title`, `text-section`, `text-body`, `text-meta` (utility'ler `@theme inline` üzerinden otomatik üretilir).

### 9. Custom Keyframes (DESIGN.md §07)

Faz 08'in modal koreografisi için hazır tutulan keyframes:

| Keyframe | Davranış |
|----------|----------|
| `breathe` | `opacity: 0.4 → 0.65 → 0.4` — idle spotlight nefesi |
| `ink-press` | `transform: scale(1 → 1.02 → 1)` — letterpress düşüş, sayaç tick pulse |
| `curtain-reveal` | `clip-path: inset(0 100% 0 0) → inset(0 0 0 0)` — perde aralanması, soru metni reveal |

---

## Override Sırası

```
Tailwind utility class
   ↓ (override eder)
@theme inline (color/font utility'leri üretir)
   ↓ (var() ile okur)
:root (default değerler — admin sabit + quiz Klasik Sahne)
   ↓ (Faz 08'de ThemeApplier inline style ile override eder)
public route runtime tema (--quiz-* override'ları)
```

Admin route hiçbir aşamada override almaz; quiz değişikliğine immuni'dir.

## Sapmazlık Garantisi

- **Geometri sabittir, pigment değişir** (DESIGN.md §02 — 4. Kural).
- Şekil, çizgi, spacing, animasyon, tipografi token'ları **immutable**. Sadece `--quiz-primary/accent/text/font` runtime'da değişir.
- Admin token'ları (`--admin-*`) build-time sabittir.

## Referanslar

- [DESIGN.md](DESIGN.md) §03, §04, §05, §06, §07, §13 — token'ların kaynağı.
- [app/globals.css](../app/globals.css) — implementation.
- [lib/fonts.ts](../lib/fonts.ts) — `--font-*` whitelist'i.
