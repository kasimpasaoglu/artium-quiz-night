# DESIGN.md — Artium Quiz Night Tasarım Sistemi

> Artium Sahne ve Sanat Merkezi quiz/sunum platformunun **invariant tasarım anayasası**.
> Quiz başına renk + font + arka plan değişir. Bu dokümandaki her şey **değişmez**.

---

## 00. Bu Doküman Nasıl Okunur

Bu doküman bir stil rehberi değil, bir **anayasadır**. Her faz implementatörü kendi bölümüne bakar ve sistemin dışına çıkmaz.

| Faz | Sorumluluk | Bakılacak Bölümler |
|---|---|---|
| Faz 02 | UI Foundation, CSS variable şeması, font whitelist, dekoratif SVG | §03, §04, §05, §13 |
| Faz 05 | Quiz CRUD, color picker, font selector | §04, §09, §11 |
| Faz 06 | Soru CRUD, admin form | §03, §09 |
| Faz 07 | Live mode, admin panel realtime | §09 |
| Faz 08 | Ana Ekran (sunum), modal, sayaç, idle stage | §07, §08, §10 |
| Faz 09 | Polish, mobil, a11y | §07, §09, §12 |

**Değişken vs Sabit ayrımı:**

| Değişken (quiz'den quiz'e farklı) | Sabit (her quiz için aynı) |
|---|---|
| `--quiz-primary` (hex) | Şekil dili (köşe, çizgi, motif) |
| `--quiz-accent` (hex) | Animasyon timing'i ve koreografisi |
| `--quiz-text` (hex) | Tipografi davranış kuralları (scale, hierarchy) |
| `--quiz-font` (15 whitelist'ten biri) | Layout pattern'leri (idle, sahne, time-up) |
| `backgroundUrl` (opsiyonel görsel) | Mikro-detaylar (focus, hover, toast) |
| | Dekoratif SVG motif envanteri |
| | Spacing ve ritim ölçeği |

---

## 01. Estetik Yön: Theatrical Letterpress

### Karar

**Theatrical Letterpress** — sahne perdesi anının dramatik aydınlatması + atölye risograph/letterpress baskı dokusu + şehir konser afişi tipografisi.

Üç eksende okunur:

1. **Sahne (theatrical):** Ağır kararma, izole edilmiş aydınlatma konisi, perde-kenar siluetleri, ışığın bir noktaya çekildiği gizem. Soru modal'ı bir "sahne anı"dır — perdeler aralanır, spot vurur.
2. **Letterpress / Risograph:** Atölyenin gündüz hali. Yüksek kontrastlı tipografi, hafif kayık registration izi (offset), kâğıt grain texture, mat mürekkep hissi. Renkler "üst üste binmiş" gibi durur — overprint sezgisi.
3. **Şehir afişi:** Sokak duvarındaki konser/tiyatro afişi gibi tipografi öne çıkar. Asla "yumuşak SaaS card" değil. Köşeler keskin, kenarlar bilinçli.

### Neden Artium'a Uyar

Artium'un ikiliği (sahne ↔ atölye) tek estetikte çözülür: sahne kısmı animasyon ve aydınlatma diliyle, atölye kısmı tipografi-mürekkep-grain diliyle yaşar. Müzik + resim + tiyatro üçlüsünü tek bir görsel kimlikte tutar (jazz-club çok dar, gallery-minimal çok soğuk, art-deco dönemsel). 15 farklı font + her quiz için farklı renk paleti çeşitliliğini letterpress dili doğal olarak taşır — her afiş zaten kendi font/renk seçimini taşıyor.

### AI Slop Manifestosu — Kesin Yasaklar

Aşağıdaki öğelerin hiçbiri bu projede yer almayacak:

- Indigo/violet/purple gradient (özellikle `from-indigo-500 to-purple-600` türevleri)
- Glassmorphism (`backdrop-blur` dekoratif kullanım — sadece sahne kararması için meşru)
- Rounded-2xl, rounded-3xl, rounded-full (avatar/badge istisnası hariç)
- Inter, Roboto, Arial, system-ui (whitelist'te yok)
- Dashboard SaaS hissi, "Welcome back!" tonu
- Emoji ikon, neon glow, parallax scroll
- Shimmer skeleton (klasik tip)
- Generic hero CTA, "powered by..." footer
- Dekoratif lucide ikon kullanımı (her ikon fonksiyonel olmak zorunda)
- Spinner — idle state'te asla "Bekleniyor..." metni veya yüklenme dönen objesi

---

## 02. Tasarım Anayasası

> **Bu beş kural sistemin temel sözleridir. İhlali kabul edilmez.**
>
> **1. Sahne kararır, ışık tek bir yere düşer.**
> Soru modal'ı açıldığında ekranın geri kalanı dramatik biçimde geri çekilir (backdrop ≥ 0.86 opasite + `backdrop-blur(12px)`). Hiçbir component "duyurmadan" gelmez. Her giriş bir sahne anıdır.
>
> **2. Tipografi mürekkebin yerine geçer.**
> Yazı tipi büyüktür, ağırdır, kararlıdır. Hiçbir başlık `font-weight: 400` değildir; gövde metni dışında her şey en az `600`. Display'de `letter-spacing: -0.03em`, gövdede `0`.
>
> **3. Yumuşaklık yalan söyler.**
> `rounded-2xl`, `rounded-3xl`, `rounded-full` yasaktır (avatar/numerik badge istisnası hariç). Sistem `--shape-sharp: 0` ve `--shape-soft: 2px` üzerine kurulur. Köşeler keskin.
>
> **4. Renk seçilir, sistem onu boyar — sistem renkten doğmaz.**
> Geometri, ritim, tipografi davranışı, animasyon timing'i quiz teması değişse de aynı kalır. Admin pembe + altın seçse de antrasit + kreem seçse de iskelet aynıdır, sadece pigment değişir.
>
> **5. Boşluk dekor değildir, oksijendir.**
> Hiçbir alan "dolduralım" diye doldurulmaz. Idle state'te ekranın %60'ı kasıtlı boştur. Soru metni etrafında minimum `clamp(2rem, 6vw, 6rem)` nefes alanı.

---

## 03. Tipografi Sistemi

### Hierarchy Scale (Perfect Fourth, 1.333 ratio)

Letterpress afiş geleneğinden gelen oran. Beş kademe:

| Token | Değer | Kullanım |
|---|---|---|
| `--text-display` | `clamp(3.5rem, 8vw, 7.5rem)` | Soru metni, sayaç, idle hero başlık |
| `--text-title` | `clamp(2rem, 4.5vw, 3.5rem)` | Modal alt başlık, admin H1 |
| `--text-section` | `clamp(1.5rem, 2.5vw, 2rem)` | Admin H2, form section title |
| `--text-body` | `clamp(0.95rem, 1.1vw, 1.0625rem)` | Gövde, form label, table cell |
| `--text-meta` | `0.75rem` (sabit) | Tabular meta, timestamp, badge sayısı |

### Davranış Kuralları

**Display + Title:**
- `font-weight: 700-900` (font'a göre maksimum bold mevcudu)
- `letter-spacing: -0.03em`
- `line-height: 0.95` (sıkı, afiş hissi)

**Section:**
- `font-weight: 600`
- `letter-spacing: -0.01em`
- `line-height: 1.1`

**Body:**
- `font-weight: 400`
- `letter-spacing: 0`
- `line-height: 1.6` (gerçek okuma için ferah)

**Meta:**
- `font-variant-numeric: tabular-nums`
- `letter-spacing: 0.08em`
- `text-transform: uppercase`
- Afiş hissi: "ARTIUM • SAHNE A • 22:30"

**Sayaç (özel):**
- `font-variant-numeric: tabular-nums`
- `font-weight: 900`
- `letter-spacing: -0.06em`
- Son 5 saniyede: `1.15×` ölçek + renk `--quiz-accent`'a geçer (oran §07'de)

**Soru metni (özel):**
- `max-width: min(78ch, 90vw)`
- `text-wrap: balance`
- `line-height: 1.15`
- Yatay merkezde
- Optimum okuma karakteri: 60-78ch

### Türkçe Karakter Handling

- **Whitelist zorunluluğu:** Her font `subsets: ["latin", "latin-ext"]` ile yüklenir. `latin-ext` Türkçe diakritikleri (ç, ğ, ı, ş, ü, ö) garanti eder.
- **Diakritik çarpışma:** Display fontunda `letter-spacing` negatif olduğunda Ç/Ğ/Ş üst aksanı bir sonraki harfle çarpışabilir. Çözüm:
  - `font-feature-settings: "kern" 1` zorunlu
  - `letter-spacing` minimum `-0.025em` (geçince diakritik biner)
- **Bebas Neue:** Google Fonts versiyonu `latin-ext` destekler (ı, ğ, ş OK), doğrulanmıştır.
- **Yarı-yasak:** Tüm-büyük harf ekranda asla > 40 karakter (Türkçe büyük İ/Ş okunabilirliği bozar). Soru metni hiçbir zaman uppercase değildir; meta tipografi uppercase'tir ama kısadır.

---

## 04. Renk Uygulama Pattern'i

### `--quiz-*` Rolleri (Kesin Tanımlar)

| Token | Rol | Nerede |
|---|---|---|
| `--quiz-primary` | Yüksek-yoğunluk yüzey | Modal arka plan (görsel yoksa), başlık çubuğu, sayaç dolu segment, "Süreniz Doldu" baskın rengi |
| `--quiz-accent` | Vurgu | CTA fill, progress bar fill, soru numarası badge, sayaç son 5 saniye, dekoratif motif fill |
| `--quiz-text` | Sahne içi metin | Sadece sahne (public `/`) içindeki gövde + display. Admin paneli kullanmaz |

**Kesin kurallar:**
- `--quiz-primary` **ASLA** metin rengi olarak kullanılmaz (kontrast kontrolsüz).
- `--quiz-accent` toplam yüzey alanın **%20'sini geçemez** — vurgu olma niteliğini kaybeder.
- `--quiz-text` admin paneline yansımaz (admin teması sabit, §13).

### Background Görseli Üstüne Katman Sırası

Admin `backgroundUrl` tanımlamışsa, alttan üste:

1. **Görsel** — `background-size: cover; background-position: center`
2. **Scrim** — `linear-gradient(180deg, color-mix(in oklab, var(--quiz-primary) 70%, black) 0%, color-mix(in oklab, var(--quiz-primary) 40%, black) 100%)` (primary renk korunur, koyu basılır)
3. **SVG grain** — sabit `noise-grain.svg`, `opacity: 0.04`, `mix-blend-mode: multiply`
4. **Vignette** — `radial-gradient(ellipse at center, transparent 40%, black/30 100%)`
5. **İçerik**

### Default Tema (Idle / Admin Quiz Tanımlamamış)

```
--quiz-primary: #1A1815   (kömür siyahı — sahne duvarı)
--quiz-accent:  #C4A572   (eski pirinç / bakır — sahne aydınlatması)
--quiz-text:    #F4EFE6   (yumuşak kreem — eski kâğıt)
--quiz-font:    Playfair Display  (Türkçe latin-ext OK)
```

Bu default, Artium'un sabit marka rengi olarak da çalışır. Quiz oluşturulduğunda override edilir.

### Kontrast Otomasyonu

Admin'in renk seçimi düşük kontrast üretebilir. Sistem bunu **bloklamaz**, absorbe eder:

- **Modal text shadow (default açık):** `text-shadow: 0 2px 8px color-mix(in oklab, var(--quiz-primary) 80%, black)` — soru metni ve sayaç üzerine uygulanır.
- **Admin uyarısı (Faz 09 polish):** Quiz form'unda `--quiz-text` ile `--quiz-primary` Δ-luminance < 4.5:1 ise form altında nötr uyarı: "Bu renk kombinasyonu projeksiyon için kontrast düşük olabilir. Tema yine de kaydedilecek." Bloklamaz, bilgilendirir.

---

## 05. Şekil Dili

### Köşe Radyusu Sistemi

| Token | Değer | Kullanım |
|---|---|---|
| `--shape-sharp` | `0` | Modal, sahne, ana yüzeyler, idle stage, table, card |
| `--shape-soft` | `2px` | Buton, input, badge (hafif "elle kesilmiş" hissi) |
| `--shape-pill` | `9999px` | Sadece numerik badge (örn. zorluk seviyesi sayı arka planı) |

**Yasak:** `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`. Yukarıdaki üç değer dışındaki her radyus reddedilir.

### Çizgi Kalınlık Ölçeği

| Token | Değer | Kullanım |
|---|---|---|
| `--stroke-hair` | `1px` | Divider, table border, ince çerçeve |
| `--stroke-rule` | `2px` | Admin form input border, focus ring offset |
| `--stroke-heavy` | `4px` | Section divider, registration mark, top bar alt çizgi |
| `--stroke-poster` | `8px` | Modal kenar çerçevesi, idle stage decorative frame |

### Dekoratif SVG Motif Envanteri (7 Adet)

Tüm motifler `public/decorative/` altına yerleştirilir (Faz 02). `currentColor` ile çizilir; sahnedeyken `--quiz-accent` veya `--quiz-text`, admin'de `--admin-accent` ile renklenir.

| Motif | Dosya | Kullanım | Renk |
|---|---|---|---|
| Spotlight Koni | `spotlight-cone.svg` | Idle stage üst köşe, nefes animasyonlu | `--quiz-accent` |
| Perde Kenarı | `curtain-edge.svg` | Modal sol+sağ kenar (mobilde üst+alt) | `--quiz-text` |
| Registration Mark | `registration-mark.svg` | Letterpress baskı işareti — idle köşeleri, admin section köşeleri | `--quiz-accent` |
| Noise Grain | `noise-grain.svg` | Body fixed overlay (256×256 tile) | `currentColor` (mix-blend) |
| Fırça Darbesi | `brush-stroke.svg` | Admin section header altı | `--admin-accent` |
| Nota Noktaları | `note-dots.svg` | Idle alt dekorasyon, divider | `--quiz-text` (0.4 opasite) |
| Soyut Maske | `mask-abstract.svg` | 404 / error sayfası | `--quiz-text` |

**Kural:** Motif SVG path'leri sabittir; sadece renk dinamiktir. Hiçbir motif tema rengine "ait" değildir, hepsi sistemin parçasıdır.

---

## 06. Spacing & Ritim

### Spacing Scale

Tailwind default'lar korunur (`gap-1` ... `gap-32`). Ek olarak üç özel adım:

| Token | Değer | Kullanım |
|---|---|---|
| `--space-stage` | `clamp(3rem, 8vw, 8rem)` | Sahne kompozisyonu kenar boşluğu (modal padding, idle stage padding) |
| `--space-breath` | `clamp(1rem, 2vw, 2rem)` | Section arası "nefes" |
| `--space-rule` | `4px` | Hairline aralık (table cell pad, badge içi) |

### Layout Grid

**Admin paneli:**
- 12-column subtle grid
- Ana içerik `max-width: 1280px`
- Sidebar `240px` sabit
- Ana içerik padding: `--space-stage`

**Public sahne:**
- Asimetrik komposizyon
- Soru metni yatay merkezde, dikey olarak **%42 yükseklikte** (altın oranın üst hissi)
- Alt %58'de sayaç + progress bar + dekorasyon nefes alır

**Akışkan reflow:**
- 1920×1080 (projeksiyon) → 375×667 (mobil) tek `clamp()` ile sürekli akış
- Hiçbir hard breakpoint yok
- Mobilde soru metni dikey ortalanır, sayaç sticky-bottom

---

## 07. Animasyon Dili (CSS-only)

framer-motion / motion kullanılmaz. Tüm animasyonlar CSS transitions + `@keyframes` + clip-path.

### Timing Fonksiyonları (Marka Kişiliği)

| Token | Değer | Anlam |
|---|---|---|
| `--motion-curtain` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Perde açılışı — ağır kumaşın askıya çekilmesi |
| `--motion-spotlight` | `cubic-bezier(0.65, 0, 0.35, 1)` | Odak değişimi — ışığın bir noktaya çekilmesi |
| `--motion-ink` | `cubic-bezier(0.4, 0, 0.6, 1)` | Letterpress düşüş — butona basılma feedback |
| `--motion-breathe` | `cubic-bezier(0.45, 0.05, 0.55, 0.95)` | İdle nefes — sonsuz döngülerde |

### Süreler

| Token | Değer | Kullanım |
|---|---|---|
| `--duration-micro` | `120ms` | Hover, focus |
| `--duration-small` | `240ms` | Buton state, dropdown |
| `--duration-stage` | `520ms` | Modal entrance/exit, soru değişimi |
| `--duration-curtain` | `820ms` | Perde animasyonu (modal ilk açılış) |
| `--duration-breath` | `4600ms` | İdle nefes döngüsü (yarı periyot) |

### Soru Modal Açılış Koreografisi

| Zaman | Aksiyon | Süre | Easing |
|---|---|---|---|
| `0ms` | Backdrop fade-in başlar | `--duration-stage` | `--motion-spotlight` |
| `80ms` | Modal kabı: `scaleY(0.96) translateY(8px) opacity(0)` → `scaleY(1) translateY(0) opacity(1)` | `--duration-curtain` | `--motion-curtain` |
| `260ms` | Soru metni: `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` ("perde yatay aralanır") | `--duration-stage` | `--motion-curtain` |
| `420ms` | Görsel (varsa): `opacity 0 → 1` + `translateY(4px) → 0` | `--duration-stage` | `--motion-ink` |
| `540ms` | Sayaç fade-in + progress bar `scaleX(0) → scaleX(1)` linear başlar | — | — |

### Soru Değişimi (Modal Açıkken Yeni Soru)

Modal kabı kapanmaz, sadece içerik değişir. Sahne sabit, oyuncu değişir.

1. Mevcut metin: `clip-path` ile sağa kapanır (`--duration-stage`, `--motion-ink`)
2. 200ms gecikme
3. Yeni metin: `clip-path` ile soldan açılır

### Sayaç Davranışı

- **1Hz tick:** Sayı değişimi her saniye. Animasyon değil, sayı güncellemesi.
- **Per-tick pulse:** Her saniye geçişte digit'ler `scale(1.02) → scale(1)` (180ms, `--motion-ink`).
- **Son 5 saniye:**
  - Renk: `--quiz-text` → `--quiz-accent` (200ms ease)
  - Font-size: `1.0×` → `1.15×`
  - Her tick'te "döküm" feedback: `translateY(-3px) → 0` (180ms)
- **Progress bar:**
  - Lineer fill, 100ms refresh interval (gözle pürüzsüz)
  - Renk başından sonuna `--quiz-accent`
  - Son saniyede flash yok (renk zaten orada)

### Time-Up Overlay

1. Modal içeriği (soru + sayaç) geri çekilir: `transform: scale(0.94) opacity(0.3); filter: blur(4px)` — 520ms, `--motion-curtain`
2. "Süreniz Doldu" tipografi `clip-path` ile yukarıdan aşağı reveal (perde inişi tersine)
3. Tipografi: display scale, `--quiz-accent` renk, `--quiz-primary` üstüne
4. **Otomatik fade etmez** — admin `session:reset` veya yeni soru gönderene kadar sahnede kalır

### İdle Stage Nefes

- **Spotlight koni:** `opacity: 0.4 → 0.65 → 0.4` (4600ms, `--motion-breathe`, sonsuz)
- **Quiz başlığı:** `letter-spacing: -0.02em ↔ -0.025em` (4600ms, gözle zar zor algılanır)
- **Grain texture:** Statik (performans)
- **Registration marks:** Statik

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-micro: 0; --duration-small: 0;
    --duration-stage: 0; --duration-curtain: 0;
    --duration-breath: 0;
  }
}
```

- Tüm `--duration-*` CSS variable override ile 0ms
- İdle nefes durur
- Modal entrance: sadece opacity fade (clip-path, scale, translate iptal)
- Sayaç pulse durur, sadece sayı değişir

---

## 08. Layout Pattern'leri

### İdle State Ekranı (Intermezzo)

**"Bekleniyor..." metni YASAK.** İdle pasif bir bekleme değil, bir **sahne öncesi atmosfer**.

Kompozisyon:
- **Üst-sol köşe:** Statik spotlight koni SVG (opacity nefes alır)
- **Ekran merkezi (vertical %50):** Quiz başlığı (display tipografi)
- **Başlık altı:** "ARTIUM SAHNE VE SANAT MERKEZİ" meta tipografi (uppercase, tracked)
- **Alt kenar:** Registration mark + tarih + saat (statik tabular-nums meta)
- **Sol+sağ kenar:** Dikey `--stroke-poster` çerçeve (sahne kemeri hissi)
- **Alt-orta:** Nota noktaları motifi (subtle, `--quiz-text` 0.4 opasite)

### Soru Sahnesi (Tam Ekran Takeover)

"Modal" kavramsal olarak Radix Dialog'tur ama görsel olarak full-stage takeover'dır — `max-width` yoktur.

**Backdrop:**
- `background: color-mix(in oklab, var(--quiz-primary) 30%, black) / 0.86`
- `backdrop-filter: blur(12px)`

**Layout (vertical anchor mantığı):**
- **Üst-sol köşe:** Zorluk göstergesi `■■■□□` (1-5, `--quiz-text` veya `--quiz-accent`)
- **Üst-sağ köşe:** Sıra numarası `01 / 12` (meta tipografi)
- **Vertical %42:** Soru metni (display tipografi) + (varsa) görsel `aspect-ratio: 16/9 max-h: 40vh`
- **Vertical %78:** Sayaç (display) + altında progress bar
- **Sol+sağ kenar:** Dikey perde-kenar motifi (entrance'ta açılmış olan perde)

### Time-Up Overlay

Modal-içi katman; soru text ve görsel arkada blur'da kalır (kompozisyon korunur).

- "Süreniz Doldu" display tipografi modal'ın ortasında üst katmanda
- Sayaç gizlenir (`display: none`)
- Progress bar gizlenir (full değil — tamamen kaybolur)
- Zorluk + sıra numarası görünmeye devam eder (sahne meta'sı)
- Admin sıradaki soruyu gönderene veya reset yapana kadar bu durumda kalır

### Mobil Davranış (375×667)

- **Üst %15 (safe-area aware):** Zorluk + sıra numarası side-by-side meta
- **Üst %40:** Soru metni
- **Orta %30:** Görsel (küçülmüş)
- **Alt %25 (sticky-bottom, safe-area aware):** Sayaç + progress bar
- **Perde kenar motifi:** Mobilde sadece üst+alt (yatay sahne hissi), kenar değil

### Admin Paneli Layout

- **Top bar:** Sabit `--admin-bg` zemin, `--stroke-heavy` alt border `--admin-fg`. Sol: Artium tipografi logosu. Sağ: user menu + logout.
- **Sidebar:** 240px sabit. Menu items `--stroke-rule` alt border ayraçlı. Aktif item solunda 4px `--admin-accent` blok.
- **Ana içerik:** `max-width: 1280px`, padding `--space-stage`
- **Tema:** **Sabit Artium teması** — aktif quiz'in renkleri admin paneline yansımaz, sadece public `/` rotasına yansır

---

## 09. Mikro-Detaylar

### Focus Rings

```css
box-shadow: 0 0 0 2px var(--admin-bg),
            0 0 0 4px var(--admin-accent);
outline: none;
```

- 2px offset + 2px ring
- Köşe radyusu outline'a kalıtsal (kare köşe)
- Native ring kapalı

Public sahne tarafında focusable element yok (sunum yüzeyi). Admin'de zorunlu.

### Hover States (Admin)

- **Buton:** Background `color-mix(in oklab, current 88%, black)`, `transform: translateY(-1px)`, transition `--duration-micro` `--motion-ink`
- **Table row:** Background `color-mix(in oklab, var(--admin-bg) 96%, var(--admin-accent))` — solgun accent wash
- **Link:** `text-decoration: underline`, `text-decoration-color: var(--admin-accent)`, `text-underline-offset: 4px`

### Loading Skeleton

Klasik shimmer **yasak**. Yerine letterpress kâğıt hissi:

- Skeleton block: solid `color-mix(in oklab, var(--admin-fg) 92%, var(--admin-bg))`
- Üzerinde 1px `--stroke-rule` divider çizgileri (kâğıt katlanma izi gibi)
- Pulse: `opacity: 0.6 ↔ 1.0` (1.8s ease)

### Toast (sonner customization)

- Köşe: `--shape-soft`
- Border: `--stroke-rule` solid `--admin-accent`
- Background: `color-mix(in oklab, var(--admin-bg) 92%, var(--admin-fg))`
- Tipografi: meta-scale, uppercase
- Icon yerine **typographic glyph:** `■` (başarı), `▲` (uyarı), `●` (hata)
- Position: admin'de top-right (default), uzun form'larda bottom-right'a alınabilir

### Custom Cursor

- `/` rotasında `cursor: none` (projeksiyonda mouse görünmesin)
- `/quiz-admin` altında native cursor

### Decorative Elements (Sayfa Geneli)

- **Body fixed grain:** `noise-grain.svg`, her sayfada, `position: fixed; pointer-events: none; mix-blend-mode: multiply; opacity: 0.06`
- **İdle stage:** Registration marks köşelerde (statik)
- **Admin form section header altı:** `brush-stroke.svg`, `--admin-accent` renkte
- **Admin table header altı:** `--stroke-heavy` divider (letterpress section break)

---

## 10. Marka Sembolleri & Iconography

### Custom SVG Envanteri

§05'te tanımlı 7 motif sistemin marka karakterini taşır. Hangi motif nerede:

| Motif | Yerleşim | Renk Kaynağı |
|---|---|---|
| spotlight-cone | İdle stage üst köşe (animasyonlu) | `--quiz-accent` |
| curtain-edge | Modal sol+sağ kenar (mobilde üst+alt) | `--quiz-text` |
| registration-mark | İdle köşeleri, admin form section köşeleri | `--quiz-accent` / `--admin-accent` |
| noise-grain | Body fixed overlay | `currentColor` (blend) |
| brush-stroke | Admin section header altı | `--admin-accent` |
| note-dots | İdle alt dekorasyon, divider | `--quiz-text` (0.4 opasite) |
| mask-abstract | 404 / error sayfası | `--quiz-text` |

### Lucide Icon Stil Rehberi

- `strokeWidth={1.5}` (default `2` değil — letterpress fine line)
- Color: her zaman `currentColor`
- Boyut sadece 3 değer:
  - `16px` — table row aksiyonu
  - `20px` — form input adornment
  - `24px` — buton + sidebar nav
- **Dekoratif ikon yasak.** İkon ancak bir aksiyonun yanında veya input'un fonksiyonel adornment'ı olarak görünür.

---

## 11. Quiz Tema Örnekleri (4 Preset)

Admin color picker yanında "Önerilen Kombinasyonlar" olarak gösterilebilir. Tek tıkla 4 değer set edilir.

### Preset 1 — Klasik Sahne (= Default Tema)

| Token | Değer |
|---|---|
| primary | `#1A1815` (kömür siyahı) |
| accent | `#C4A572` (eski pirinç / bakır) |
| text | `#F4EFE6` (yumuşak kreem) |
| font | Playfair Display |

**Atmosfer:** Küçük tiyatro salonu, sıcak pirinç sahne aydınlatması, eski kâğıt.
**Background önerisi:** Yok (düz koyu yeterli).

### Preset 2 — Atölye Sabahı

| Token | Değer |
|---|---|
| primary | `#E8DFD2` (kreem zemin) |
| accent | `#9C5A2E` (terakota / toprak) |
| text | `#2A2622` (koyu antrasit) |
| font | Merriweather |

**Atmosfer:** Işıklı bir resim atölyesi, terakota toprak, kreem duvar. Tek **açık zeminli** preset — sistem açık tema'ya da hazır.
**Background önerisi:** Kreem doku, ahşap masa flat-lay.
**Not:** Açık zeminli temada scrim formülü otomatik tersine döner (`color-mix(...white)` üstüne). Bu davranış Faz 08'de `ThemeApplier` içinde luminance kontrolü ile çözülür.

### Preset 3 — Caz Gecesi

| Token | Değer |
|---|---|
| primary | `#0B1E2F` (koyu navy) |
| accent | `#D4A24C` (soluk altın) |
| text | `#EBE4D1` (eski kâğıt) |
| font | Oswald |

**Atmosfer:** Sigara dumanlı caz kulübü, koyu navy, soluk altın, eski sahne ışığı.
**Background önerisi:** Koyu mavi tonlu dumanlı texture.

### Preset 4 — Resim Atölyesi

| Token | Değer |
|---|---|
| primary | `#3D2E2A` (bordo-kahve) |
| accent | `#E76F51` (yanmış turuncu) |
| text | `#F2E8DC` (mat kreem) |
| font | Raleway |

**Atmosfer:** Bordo + turuncu palet kazıması, sıcak ahşap, akrilik vibrancy.
**Background önerisi:** Dokulu duvar, palet izi.

---

## 12. Accessibility & Kontrast

### Auto-Scrim (§04)

Background görselinin üstüne scrim **her durumda** uygulanır. Görsel ne olursa olsun text okunabilir kalır.

### Default Text Shadow (Sahne)

Soru metni ve sayaç üzerine modal içinde varsayılan olarak uygulanır:

```css
text-shadow: 0 2px 8px color-mix(in oklab, var(--quiz-primary) 80%, black);
```

### Admin Kontrast Uyarısı (Faz 09)

- Quiz formunda `--quiz-text` ile `--quiz-primary` arasında Δ-luminance hesaplanır
- < 4.5:1 ise form altında nötr uyarı: "Bu renk kombinasyonu projeksiyon için kontrast düşük olabilir. Tema yine de kaydedilecek."
- **Bloklamaz, bilgilendirir.** Admin yaratıcı özgürlüğüne sahiptir.

### Reduced Motion (§07)

- Tüm `--duration-*` 0ms'ye çekilir
- İdle nefes durur
- Modal entrance opacity-only
- Sayaç pulse durur

### Focus Visibility

Her interaktif element §09 focus ring kuralına uyar. Klavye navigasyonu Faz 09 polish kapsamında.

### Keyboard Navigation

- Admin panelinde tab order doğal HTML akışını takip eder
- Modal'lar Radix Dialog kullanır (focus trap dahil)
- Public sahne'de focusable element yoktur

---

## 13. Implementation Notes — Faz 02'ye Bağlanan

### `@theme inline` Şablonu

Faz 02 implementatörü `app/globals.css` içine aşağıdaki bloğu yazar:

```css
@import "tailwindcss";

@theme inline {
  /* Quiz runtime (dinamik, ThemeApplier set eder) */
  --color-quiz-primary: var(--quiz-primary);
  --color-quiz-accent:  var(--quiz-accent);
  --color-quiz-text:    var(--quiz-text);
  --font-quiz:          var(--quiz-font);

  /* Şekil tokenları */
  --shape-sharp:  0;
  --shape-soft:   2px;
  --stroke-hair:  1px;
  --stroke-rule:  2px;
  --stroke-heavy: 4px;
  --stroke-poster: 8px;

  /* Spacing tokenları */
  --space-stage:  clamp(3rem, 8vw, 8rem);
  --space-breath: clamp(1rem, 2vw, 2rem);
  --space-rule:   4px;

  /* Animasyon süreleri */
  --duration-micro:   120ms;
  --duration-small:   240ms;
  --duration-stage:   520ms;
  --duration-curtain: 820ms;
  --duration-breath:  4600ms;

  /* Animasyon timing fonksiyonları */
  --motion-curtain:   cubic-bezier(0.22, 0.61, 0.36, 1);
  --motion-spotlight: cubic-bezier(0.65, 0, 0.35, 1);
  --motion-ink:       cubic-bezier(0.4, 0, 0.6, 1);
  --motion-breathe:   cubic-bezier(0.45, 0.05, 0.55, 0.95);

  /* Tipografi scale */
  --text-display: clamp(3.5rem, 8vw, 7.5rem);
  --text-title:   clamp(2rem, 4.5vw, 3.5rem);
  --text-section: clamp(1.5rem, 2.5vw, 2rem);
  --text-body:    clamp(0.95rem, 1.1vw, 1.0625rem);
  --text-meta:    0.75rem;
}

:root {
  /* Default quiz teması (admin override edene kadar) */
  --quiz-primary: #1A1815;
  --quiz-accent:  #C4A572;
  --quiz-text:    #F4EFE6;
  --quiz-font:    var(--font-playfair-display);

  /* Admin sabit teması */
  --admin-bg:     #FAF8F4;
  --admin-fg:     #1A1815;
  --admin-accent: #9C5A2E;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-micro:   0ms;
    --duration-small:   0ms;
    --duration-stage:   0ms;
    --duration-curtain: 0ms;
    --duration-breath:  0ms;
  }
}
```

### Dark Mode Kararı

`prefers-color-scheme: dark` media query **kaldırılıyor** (Faz 02 plan dahili). Sistem light/dark ayrımı yapmaz; quiz teması bu rolü üstlenir (Klasik Sahne koyu, Atölye Sabahı açık).

### Faz 02'de Eklenmesi Gereken Dekoratif SVG'ler

`public/decorative/` dizini altında:
- `spotlight-cone.svg`
- `curtain-edge.svg`
- `registration-mark.svg`
- `noise-grain.svg` (256×256, repeatable tile)
- `brush-stroke.svg`
- `note-dots.svg`
- `mask-abstract.svg`

### Font Whitelist Zorunluluğu

`lib/fonts.ts` içinde **Playfair Display** mutlaka olmalı — default tema kullanıyor. Diğer 14 font Faz 02 plan'ında zaten tanımlı.

### Tailwind Utility Uzantıları (Faz 02 Değerlendirmesi)

- Tipografi utility'leri `@theme inline` üzerinden otomatik gelir: `text-display`, `text-title`, `text-section`, `text-body`, `text-meta`
- Custom border utility: `border-rule`, `border-heavy`, `border-poster` (stroke variables üzerinden)
- Custom keyframe: `@keyframes breathe`, `@keyframes ink-press`, `@keyframes curtain-reveal`
- Custom transition-duration utility: `duration-stage`, `duration-curtain`

---

## Faz Bağlantı Haritası

| Faz | Bakacağı Bölümler | Anahtar Çıktı |
|---|---|---|
| **Faz 02** (UI Foundation) | §03, §04, §05, §13 | `globals.css` CSS variable şeması + 7 SVG motif + Playfair Display whitelist |
| **Faz 05** (Quiz CRUD) | §04, §09, §11 | Color picker + font selector + preset önerileri + kontrast uyarısı |
| **Faz 06** (Soru CRUD) | §03, §09 | Soru metni tipografisi, admin form mikro-detayları |
| **Faz 07** (Live Mode) | §09 | Admin panel hover/focus/toast davranışları |
| **Faz 08** (Ana Ekran) | §07, §08, §10 | Modal koreografisi, idle stage, time-up overlay, SVG motif yerleşimi |
| **Faz 09** (Polish + A11y) | §07, §09, §12 | Reduced motion, kontrast uyarısı, keyboard nav, loading skeleton |

---

> **Son söz:** Bu doküman bir sistemi tarif eder. Sistem bir karakterdir. Karakter renk değiştirebilir ama kişiliğini değiştirmez. Theatrical Letterpress kişiliğini değiştiren her ekleme, eklemeden önce bu dokümana dönüp tartışılır.
