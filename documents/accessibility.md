# Accessibility (a11y)

Bu doküman Artium Quiz Night uygulamasının erişilebilirlik kurallarını ve
mevcut uygulamayı özetler. Hedef: WCAG 2.1 AA + projeksiyon/mobil
ortamda kullanılabilir bir sunum yüzeyi.

## ARIA Pattern Tablosu

| Bileşen | Rol / Attribute | Dosya | Not |
|---|---|---|---|
| `QuestionModal` | `role="dialog"` (Radix default), `aria-modal="true"`, `aria-labelledby` ve `aria-describedby` (Radix `Title` + `Description` üzerinden otomatik) | `components/presentation/QuestionModal.tsx` | `Title` ve `Description` `sr-only`; modal `session:reset` dışında kapanmaz (ESC + overlay-click engellendi) |
| `CountdownDisplay` (sayaç) | `role="timer"` + `aria-live="off"` | `components/presentation/CountdownDisplay.tsx` | Her saniye okumak rahatsız edici olduğu için `aria-live="off"`; bildirim modal başlığı (`Title`) üzerinden tek seferlik yapılır |
| `CountdownDisplay` (progress) | `role="progressbar"` + `aria-valuenow` (0–100) + `aria-valuemin=0` + `aria-valuemax=100` | aynı dosya | İlerleme yüzdesi |
| `TimeUpOverlay` | `role="alert"` (implicit `aria-live="assertive"`) | `components/presentation/TimeUpOverlay.tsx` | "Süreniz Doldu" tek seferlik kritik bildirim; `aria-live` ayrıca verilmez |
| `DifficultyPips` | `aria-label="Zorluk: X/5"` | `QuestionModal.tsx` | Sayısal değer SR'a okunur, pip span'ları `aria-hidden` |
| Form alanları | shadcn `Form` + `FormControl` otomatik `aria-describedby` (FormDescription + FormMessage) + `aria-invalid` | `components/ui/form.tsx` | Tüm admin formları bu pattern'i kullanır |

## Klavye Navigation Haritası

### Login (`/quiz-admin/login`)
- `Tab`: Kullanıcı adı → Şifre → Giriş Yap butonu.
- `Enter` (herhangi bir input içinde): Form submit.
- `autoFocus` ilk inputta.

### Quiz Form (`/quiz-admin/quizzes/new`, `.../edit`)
- `Tab` sırası: Başlık → Açıklama → Renkler → Font → Background → Submit.
- `autoFocus` Başlık input'unda.
- Color picker (`input[type=color]`): native picker `Enter` veya tıklama ile açılır.

### Live Mode (`/quiz-admin/live`)
- `Tab` sırası: "Modal'ı Kapat" → quiz aktif et butonları (sol kolon) → soru "Gönder" butonları (sağ kolon).
- `Enter` butonlar üzerinde: aksiyon tetikler.

### Question Dialog (modal)
- `Tab` focus dialog içinde kilitli (Radix focus trap default).
- `ESC`: Question modal'da kapatılmaz (sunum kasası), delete confirm dialog'larda kapatır.

## Color Contrast

- Admin paneli `--admin-bg: #faf8f4` üzerine `--admin-fg: #1a1815` → ≈ 14.5:1 (AAA).
- Buton `--admin-accent: #9c5a2e` üzerine `--primary-foreground: #faf8f4` → ≈ 5.4:1 (AA).
- Public quiz teması renkleri yönetici tarafından kontrol edildiği için runtime'da otomatik kontrast garanti edilmez. Default tema (Klasik Sahne) ve preset'ler (`lib/quiz-presets.ts`) AA+ kontrasta sahiptir; admin'in özel renk girdiği durumda ipucu/uyarı gösterimi gelecek iterasyona bırakılmıştır.

## Mobile Dokunma Hedefleri (44×44 px)

Kritik aksiyonlar için WCAG 2.5.5 AAA (44×44 px) min hedef uygulandı:
- Live mode "Gönder" ve "Modal'ı Kapat" butonları.
- Login "Giriş Yap" butonu.
- Delete dialog'ları "Vazgeç" + "Evet, sil" butonları.

Diğer admin form butonları (masaüstü dominant) shadcn default `h-9` (36 px) — WCAG 2.5.5 AA (24 px) zaten karşılanmış durumda; AAA tüm panel için uygulanmadı.

## iOS Klavye Davranışı

`app/globals.css` içinde:

```css
input,
textarea,
select {
  scroll-margin-block: 6rem;
}
```

Bu kural iOS Safari'de focus olunca alanı görünür yapar, klavye altında
kalmasını engeller. Ek olarak shadcn Input default `text-base` mobil
(16 px) → iOS Safari focus zoom davranışı tetiklenmez.

## Screen Reader Testi (MANUEL)

Bu bölüm cihaz testinden sonra doldurulmalı.

- **macOS VoiceOver + Safari** (`/`):
  - [ ] Sahne ekranı yüklenince başlık duyuruluyor.
  - [ ] Modal açıldığında "Aktif soru" duyurusu geliyor.
  - [ ] Sayaç sessiz (her saniye okumuyor).
  - [ ] "Süreniz Doldu" duyurusu tek seferlik geliyor.
- **iOS VoiceOver + Safari** (admin live mode):
  - [ ] "Gönder" butonu odaklanınca soru içeriği duyuruluyor.
  - [ ] "Modal'ı Kapat" butonu erişilebilir.
- **Android TalkBack + Chrome**:
  - [ ] Form alanları label + error message duyuruyor.

## Lighthouse Hedefleri

`next build && next start` ile prod build üzerinde:
- `/` → a11y ≥ 90, performance ≥ 80, SEO ≥ 80, best practices ≥ 90.
- `/quiz-admin` (logged-in) → benzer skorlar.

Skorlar manuel test esnasında ölçülecek ve gerekirse iyileştirme yapılacak.

## Reduced Motion

`@media (prefers-reduced-motion: reduce)` altında tüm animasyon süreleri
0 ms'e set ediliyor (`globals.css`). Curtain reveal, breathe, ink press
gibi sahne animasyonları kullanıcı tercihine saygı gösterir.

## Bilinen Sınırlar

- Quiz tema renkleri için runtime kontrast uyarısı yok.
- Pusher reconnect sırasında SR bildirimi yok (gelecek polish).
- Live mode panelinde sürükle-bırak ile soru sıralama erişilebilir değil
  (henüz feature yok; ileride eklenirse klavye alternatifi gerekli).
