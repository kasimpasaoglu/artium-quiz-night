# Faz 09 — Polish + Mobile + A11y

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 08

## Amaç

Önceki fazlarda işlevsel ama nihai olmayan UX'i production seviyesine getirmek: tüm route'lara loading/error sınırları, boş durumlar, mobil tarayıcılarda admin paneli kullanılabilirliği, klavye navigasyonu, ARIA semantiği (özellikle modal ve sayaç için), Lighthouse a11y skoru ≥ 90, sayaç drift ölçümü ve gerekirse `/api/time` offset çözümü. Bu fazdan sonra uygulama görsel ve etkileşim açısından "iyi" değil "polished" olur.

## Kapsam Dışı (Out of Scope)

- Yeni feature.
- Deploy + security (Faz 10).
- Rate limit (Faz 10).
- E2E test suite (gerek görülmedi, manuel test yeterli).

## Yapılacaklar (Checklist)

- [ ] `loading.tsx` ve `error.tsx` ekle:
  - `app/(public)/loading.tsx` — minimal spinner + "Yükleniyor".
  - `app/(public)/error.tsx` — "Bir şeyler ters gitti, sayfayı yenileyin".
  - `app/quiz-admin/loading.tsx` — skeleton (shadcn).
  - `app/quiz-admin/error.tsx` — admin için detaylı hata + retry butonu.
  - `app/quiz-admin/quizzes/[id]/loading.tsx`, `error.tsx`.
  - `app/global-error.tsx` — son çare global hata sayfası.
  - `app/not-found.tsx` — 404.
- [ ] Boş durumlar (empty states):
  - `/quiz-admin` quiz yok → "Henüz quiz oluşturmadın. İlkini ekle." CTA.
  - Quiz detayında soru yok → "Bu quiz'in henüz sorusu yok. Soru ekle." CTA.
  - `/quiz-admin/live` quiz yok → "Önce quiz oluşturmalısın." link.
- [ ] Mobile testler (iOS Safari + Android Chrome):
  - Login formu tek elle kullanılabilir mi (input boyutu, autofocus, autocomplete attributes).
  - Quiz formu uzun, scroll davranışı tamam mı (özellikle iOS keyboard açılınca alanlar görünüyor mu).
  - Live mode panel mobilde iki kolon yerine stack (mobil-first), butonlar 44×44 px min.
  - Color picker `input[type=color]` mobilde native picker açıyor mu.
  - Settings sayfası mobil-friendly mi.
- [ ] Klavye navigation:
  - Tab order tüm formlarda mantıklı.
  - Login: enter ile submit.
  - Live mode: "Gönder" buton'lara tab ile erişilebilir, enter ile submit.
  - Dialog (question form, delete confirm): focus trap (Radix default), ESC ile kapan (delete confirm), question modal ESC kapatmamalı.
- [ ] ARIA semantiği:
  - `QuestionModal`: `aria-modal="true"`, `aria-labelledby` (soru text ID), `role="dialog"`.
  - `CountdownDisplay` sayı: `role="timer" aria-live="off"` (her saniye okumak rahatsız edici).
  - `TimeUpOverlay`: `role="alert" aria-live="polite"` (tek seferlik bildirim).
  - `ProgressBar`: `role="progressbar" aria-valuenow={remaining} aria-valuemin={0} aria-valuemax={durationSec}`.
  - Toast (sonner): default ARIA OK.
  - Form input'larda `<label>` ile bağlı, `aria-describedby` validation mesajları için.
- [ ] Color contrast:
  - Quiz tema renkleri kullanıcı kontrolünde (uyarı: kontrast düşükse admin'e ipucu, ama zorlamak yok).
  - Admin paneli shadcn default kontrastı 4.5:1+ sağlıyor, ek iş yok.
- [ ] Lighthouse audit:
  - Public `/`: a11y ≥ 90, performance ≥ 80, SEO ≥ 80, best practices ≥ 90.
  - Admin paneli benzer skorlar (auth gerektirdiği için manuel logged-in audit).
- [ ] Sayaç senkronu drift test:
  - 3-5 cihazdan eşzamanlı `/`'a bağlan, admin "Gönder" → ekranlardaki sayaç ±X saniye fark.
  - Fark > 1 saniye ise:
    - `app/api/time/route.ts` — GET → `{ serverNow: new Date().toISOString() }`.
    - `lib/time-offset.ts` — `measureOffset()`: client `t1 = Date.now()`, fetch /api/time, response geldiğinde `t2 = Date.now()`, `rtt = t2 - t1`, `offset = (serverNow + rtt/2) - t1` (yaklaşık NTP-style).
    - `hooks/use-countdown.ts`'i güncelle: `Date.now() + offset` kullan.
    - `PresentationStage` mount'unda bir kez `measureOffset()` çağrısı.
  - Fark < 1 saniye ise bu adım atlanır, sapma loguna "drift kabul edilebilir" not.
- [ ] Performance:
  - `next build` bundle analyze (kullanıcı isterse `@next/bundle-analyzer` ekle, opsiyonel).
  - Background image lazy/preload doğru çalışıyor mu (Network panel).
  - Pusher reconnect davranışı network throttle ile test (slow 3G).
- [ ] `documents/accessibility.md` yaz.
- [ ] (Gerekirse) `documents/time-sync.md` yaz.

## Dokunulacak Dosyalar

- `app/(public)/loading.tsx`, `error.tsx` (YENİ).
- `app/quiz-admin/loading.tsx`, `error.tsx` (YENİ).
- `app/quiz-admin/quizzes/[id]/loading.tsx`, `error.tsx` (YENİ).
- `app/global-error.tsx` (YENİ).
- `app/not-found.tsx` (YENİ).
- `components/presentation/QuestionModal.tsx` — ARIA props.
- `components/presentation/CountdownDisplay.tsx` — role=timer, aria-live, progress bar role.
- `components/presentation/TimeUpOverlay.tsx` — role=alert.
- `components/admin/quiz-form.tsx`, `question-form-dialog.tsx`, `login-form.tsx` — label/aria-describedby kontrol.
- `components/admin/live-mode-panel.tsx` — mobile stack layout.
- `app/api/time/route.ts` (YENİ, gerekirse).
- `lib/time-offset.ts` (YENİ, gerekirse).
- `hooks/use-countdown.ts` — offset entegre (gerekirse).
- `app/quiz-admin/page.tsx`, `quizzes/[id]/page.tsx`, `live/page.tsx` — boş durum CTA.

## Eklenecek Paketler

Yok — opsiyonel `@next/bundle-analyzer` Faz 10'a bırakılabilir.

## Veri Modeli / Şema

**`/api/time` response (gerekirse):**
```ts
{ serverNow: string /* ISO */ }
```

**Time offset:**
```ts
type TimeOffset = number; // milliseconds, client local Date.now() farkı
```

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓
- Lighthouse CI a11y ≥ 90.

**Manuel:**
- iOS Safari (simulator veya gerçek cihaz): admin login → quiz oluştur → soru ekle → live mode → "Gönder" sırasında "/"i başka tarayıcıdan izle. Akış tamam.
- Android Chrome benzer.
- Klavye-only test: mouse kullanmadan login → quiz CRUD → live mode → soru gönder. Mümkün.
- Screen reader (VoiceOver/macOS): modal açılınca duyuruluyor, sayaç okumadan geçiyor, "süreniz doldu" duyuruluyor.
- Multi-cihaz drift testi: 3 telefon + 1 laptop eşzamanlı, sayaç farkı gözle ölçülür.

## Deliverables

- `documents/accessibility.md`:
  - ARIA pattern tablosu (modal, sayaç, progress, toast).
  - Klavye nav haritası.
  - Color contrast kuralı (admin paneli için).
  - Quiz tema renkleri için admin'e ipucu önerisi (gelecekte).
  - Screen reader test sonuçları (VoiceOver pass/fail).
- `documents/time-sync.md` (gerekirse):
  - Drift problemi açıklaması.
  - `/api/time` + `measureOffset()` algoritması (NTP-style yaklaşık).
  - Hook entegrasyonu (`useCountdown` içinde offset uygulanması).
  - Limitler: tek measurement, sürekli sync yok (quiz gecesi içinde drift birikmez).

## Riskler / Açık Sorular

- **Lighthouse skoru:** Background image dynamic olduğu için LCP etkilenebilir; `priority` veya `<link rel="preload">` ile çöz. Bundle size font preload nedeniyle büyük olabilir; Faz 02'de değerlendirildi.
- **Mobile keyboard + form:** iOS'ta input focus olunca viewport kayar, scroll-into-view manuel gerekebilir.
- **Pusher reconnect UX:** Network bozulup düzelirse "yeniden bağlanıyor" toast göstermek iyi UX olur. Sonner ile küçük bir toast yeterli.
- **Drift testinin gerçekçiliği:** 3 cihaz Wi-Fi'da test yapılır; quiz gecesinde 50 telefon farklı LTE/Wi-Fi'da farklı drift gösterebilir. İlk sürümde basit `Date.now()` kullan, geri bildirim alındıkça offset eklenir.
- **A11y skoru 90 altında kalırsa:** En sık problem renk kontrast (Lighthouse otomatik kontrol eder, ama runtime quiz tema rengi nedeniyle değişken). Admin tarafı kontrol edilir.

---

## Sapma Logu

_Agent faz bitiminde doldurur. Şu an boş._
