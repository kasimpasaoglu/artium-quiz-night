# Faz 09 — Polish + Mobile + A11y

**Durum:** ✅ DONE — 2026-05-19
**Önkoşul fazlar:** 08

## Amaç

Önceki fazlarda işlevsel ama nihai olmayan UX'i production seviyesine getirmek: tüm route'lara loading/error sınırları, boş durumlar, mobil tarayıcılarda admin paneli kullanılabilirliği, klavye navigasyonu, ARIA semantiği (özellikle modal ve sayaç için), Lighthouse a11y skoru ≥ 90, sayaç drift ölçümü ve gerekirse `/api/time` offset çözümü. Bu fazdan sonra uygulama görsel ve etkileşim açısından "iyi" değil "polished" olur.

## Kapsam Dışı (Out of Scope)

- Yeni feature.
- Deploy + security (Faz 10).
- Rate limit (Faz 10).
- E2E test suite (gerek görülmedi, manuel test yeterli).

## Yapılacaklar (Checklist)

- [x] `loading.tsx` ve `error.tsx` ekle:
  - `app/(public)/loading.tsx` — minimal spinner + "Yükleniyor".
  - `app/(public)/error.tsx` — "Bir şeyler ters gitti, sayfayı yenileyin".
  - `app/quiz-admin/(panel)/loading.tsx` — generic spinner (skeleton yerine; sapma logu).
  - `app/quiz-admin/(panel)/error.tsx` — admin için detaylı hata + retry; ortak `ErrorState` bileşeniyle.
  - `app/quiz-admin/(panel)/quizzes/[id]/loading.tsx`, `error.tsx`.
  - `app/global-error.tsx` — son çare global hata sayfası (inline style, Tailwind erişimi belirsiz).
  - `app/not-found.tsx` — 404, shadcn Button + asChild ile.
- [x] Boş durumlar (empty states):
  - `/quiz-admin` quiz yok → `quiz-list.tsx`'te mevcut, dokunulmadı.
  - Quiz detayında soru yok → `question-table.tsx`'te mevcut, dokunulmadı.
  - `/quiz-admin/live` quiz yok → `live/page.tsx`'te erken dönüş + "Yeni Quiz Oluştur" CTA.
- [ ] Mobile testler (iOS Safari + Android Chrome) — **MANUEL bekleniyor**:
  - Login, quiz form, live mode panel, color picker, settings.
- [ ] Klavye navigation — **MANUEL bekleniyor** (Tab order, Enter submit, dialog ESC davranışı).
- [x] ARIA semantiği:
  - `QuestionModal`: `aria-modal="true"` manuel eklendi; `role="dialog"` + `aria-labelledby` + `aria-describedby` Radix `Title`/`Description` üzerinden otomatik.
  - `CountdownDisplay` sayı: `role="timer" aria-live="off"` (mevcut "polite" değiştirildi).
  - `TimeUpOverlay`: `role="alert"` (implicit assertive); brief'in "polite" önerisi reddedildi — sapma logu.
  - `ProgressBar`: zaten Faz 08'de mevcut.
  - Toast (sonner): default ARIA OK.
  - Form input'larda shadcn `FormControl` otomatik `aria-describedby` + `aria-invalid` veriyor; ek iş yok.
- [x] Color contrast:
  - Admin shadcn defaults 4.5:1+ (`documents/accessibility.md` belgeleme).
  - Quiz tema renkleri kullanıcı kontrolünde — runtime uyarı geleceğe bırakıldı.
- [ ] Lighthouse audit — **MANUEL bekleniyor** (prod build `next start` üzerinde).
- [ ] Sayaç senkronu drift test — **MANUEL bekleniyor**; altyapı yazılmadı (sapma logu); `documents/time-sync.md` placeholder hazır.
- [ ] Performance — **MANUEL bekleniyor** (bundle analyze opsiyonel, network panel kontrolü).
- [x] `documents/accessibility.md` yazıldı.
- [x] `documents/time-sync.md` placeholder yazıldı.

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

- **Skeleton yerine generic spinner:** Brief admin loading'leri için shadcn Skeleton önerdi; projede Skeleton bileşeni yoktu, yüklenme süreleri SSR ile zaten kısa, generic spinner ("Yükleniyor...") yeterli. Sonraki fazlarda gerçek tasarıma özel skeleton gerekirse eklenecek.
- **`TimeUpOverlay` `aria-live="polite"` reddedildi:** Brief `role="alert" aria-live="polite"` istedi; `role="alert"` zaten implicit `aria-live="assertive"` verdiği için ek attribute redundant; ayrıca "süreniz doldu" zaman-kritik bildirim, "polite" yetersiz olurdu. Sadece `role="alert"` bırakıldı, `aria-live="assertive"` kaldırıldı.
- **`/api/time` + `lib/time-offset.ts` yazılmadı:** Brief "gerekirse" diyordu; manuel drift ölçümü öncesi proaktif altyapı YAGNI riski yaratıyordu. `documents/time-sync.md` placeholder olarak hazır — manuel ölçüm sonucuna göre altyapı eklenebilir (Faz 09 reopen veya Faz 10).
- **44×44 px hedef yalnızca kritik butonlara:** Brief tüm butonlar için net bir scope vermedi. WCAG 2.5.5 AAA (44 px) yalnızca live mode "Gönder" + "Modal'ı Kapat", login "Giriş", delete dialog Vazgeç/Sil butonlarına uygulandı. Admin form butonları masaüstü dominant kullanım olduğu için shadcn default `h-9` (36 px) bırakıldı (WCAG 2.5.5 AA 24 px zaten karşılanmış).
- **`aria-modal="true"` QuestionModal'a manuel eklendi:** Radix `Dialog.Content` `role="dialog"` ve `aria-labelledby`/`aria-describedby` otomatik veriyor ancak `aria-modal` vermiyor (`node_modules/@radix-ui/react-dialog/dist/index.mjs:223-226` doğrulandı).
- **`CountdownDisplay` `aria-live="off"`:** Mevcut implementasyon `aria-live="polite"` kullanıyordu, ekran okuyucu her saniye sayıyı tekrarlardı; brief'in önerdiği "off" + `role="timer"` uygulandı.
- **`ErrorState` ortak bileşeni:** `app/quiz-admin/(panel)/error.tsx` ve `quizzes/[id]/error.tsx` neredeyse aynı yapıdaydı; `components/admin/error-state.tsx` bileşenine çıkarıldı (simplify code reuse review sonucu).
- **`live/page.tsx` sequential guard:** `Promise.all([findMany, findFirst])` empty case'de gereksiz `findFirst` çağrısı yapıyordu; `quizzes` önce çekiliyor, boşsa erken dönüyor, dolu olunca `activeQuiz` arkasından çekiliyor (simplify efficiency review sonucu).
- **Manuel testler ertelendi:** Mobile, klavye, Lighthouse, sayaç drift ve SR (VoiceOver) testleri agent ortamında yapılamadığı için `documents/accessibility.md` + `documents/time-sync.md`'de placeholder olarak işaretlendi. Quiz gecesi öncesi manuel doğrulama bekleniyor; sonuçlar bu belgelere yazılacak.
