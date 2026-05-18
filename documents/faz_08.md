# Faz 08 — Ana Ekran (Sunum)

**Durum:** ✅ DONE — 2026-05-18
**Önkoşul fazlar:** 07

## Amaç

Public ana ekran (`/`) — projeksiyon + katılımcı telefonlarına yansıyan sunum yüzeyi. Aktif quiz'in temasını (background, renkler, font) uygula; Pusher subscribe ederek admin "Gönder" deyince modal aç, soru text + opsiyonel görsel + büyük geri sayan sayaç + progress bar göster; süre dolunca "Süreniz doldu" overlay'i; admin yeni soru yollarsa modal içeriği değişir, kapanmaz; `session:reset` modal'ı kapatır. Responsive: 1920×1080 projeksiyon + 375×667 mobil aynı tasarımda akışkan.

## Kapsam Dışı (Out of Scope)

- A11y, klavye nav, ARIA detayı (Faz 09).
- Sayaç drift kompenzasyonu (`/api/time` offset) — Faz 09'da gerekirse.
- Loading/error state polish (Faz 09).
- Performance optimization (Faz 09).

## Yapılacaklar (Checklist)

- [x] `app/(public)/layout.tsx` — public shell:
  - Server component.
  - `<ThemeApplier initialTheme={...} />` client wrapper (children içine).
  - Footer yok, minimum chrome.
- [x] `app/(public)/page.tsx` — server component:
  - `prisma.quiz.findFirst({ where: { isActive: true } })` aktif quiz.
  - Aktif yoksa: `<EmptyState>` "Quiz başlamadı, beklemede..." nötr tasarım.
  - Aktif varsa: `<PresentationStage initialQuiz={activeQuiz} />` client component.
- [x] `components/presentation/ThemeApplier.tsx` (`"use client"`):
  - Prop: `initialTheme`.
  - Pusher subscribe `quiz:theme-change` event'i (Faz 07 protocol'e göre).
  - `useEffect`'te `document.documentElement.style.setProperty("--quiz-primary", theme.primaryColor)` vb.
  - Font: `document.documentElement.style.setProperty("--quiz-font", FONT_WHITELIST[fontKey].variable)`.
  - Background image preload: `<link rel="preload" href={backgroundUrl} as="image" />` (next/head veya manuel inject).
- [x] `components/presentation/PresentationStage.tsx` (`"use client"`):
  - `useLiveSession()` hook'tan currentQuestion.
  - Background full-screen `<div style={{ backgroundImage: url(...) }}>`.
  - currentQuestion null → arka plan + quiz başlığı tipo. (Sade bekleme ekranı.)
  - currentQuestion var → `<QuestionModal question={...} />`.
- [x] `hooks/use-live-session.ts`:
  - `useEffect` `getPusherClient().subscribe(LIVE_CHANNEL)`.
  - Bind `question:show` → setCurrentQuestion(payload).
  - Bind `question:end` → setCurrentQuestion'un ek state `timeUp: true` set et (modal hala açık ama "Süreniz doldu" göster).
  - Bind `session:reset` → setCurrentQuestion(null).
  - Bind `quiz:theme-change` → setTheme (ThemeApplier kullanır).
  - Cleanup: unbind, unsubscribe.
- [x] `hooks/use-countdown.ts`:
  - Args: `serverStartAt: string`, `durationSec: number`.
  - Return: `{ remaining: number, progress: number /* 0-1 */, isFinished: boolean }`.
  - `useEffect` `setInterval(250ms)`: `elapsed = (Date.now() - new Date(serverStartAt).getTime()) / 1000`, `remaining = max(0, durationSec - elapsed)`, `progress = elapsed / durationSec`.
  - Cleanup interval.
  - Not: Server time offset Faz 09'da gerekirse buraya offset eklenir.
- [x] `components/presentation/QuestionModal.tsx`:
  - Radix Dialog (shadcn'den) — `open` always true, no close button, no overlay-click-close.
  - Backdrop blur arkayı (Tailwind `backdrop-blur-xl bg-black/60`).
  - İçerik: soru text (büyük tipo, `clamp(2rem, 5vw, 4rem)`), opsiyonel görsel `next/image` ortada, alt bölüm geri sayım.
  - `<CountdownDisplay serverStartAt={...} durationSec={...} />`.
  - Süre dolunca `<TimeUpOverlay />` (modal içinde, sayaç yerine).
- [x] `components/presentation/CountdownDisplay.tsx`:
  - `useCountdown` hook ile remaining, progress.
  - Büyük sayı (örn 30 → 29 → ...).
  - `<ProgressBar value={progress} />` — quiz tema accentColor ile dolu.
  - `isFinished` true → `<TimeUpOverlay />` (display: replace).
- [x] `components/presentation/TimeUpOverlay.tsx`:
  - "Süreniz Doldu" büyük yazı, fade-in animasyon.
- [x] Responsive: tüm boyutlar `clamp()` veya `vw` ile akışkan, ek media query yok (1920×1080 → 375×667 arası lineer).
- [x] `documents/theme-system.md` yaz.
- [x] `documents/hooks/use-live-session.md` yaz (Faz 07'deki ön spec'i doldur).
- [x] `documents/hooks/use-countdown.md` yaz.

## Dokunulacak Dosyalar

- `app/(public)/layout.tsx` (YENİ).
- `app/(public)/page.tsx` (YENİ).
- `components/presentation/ThemeApplier.tsx` (YENİ).
- `components/presentation/PresentationStage.tsx` (YENİ).
- `components/presentation/QuestionModal.tsx` (YENİ).
- `components/presentation/CountdownDisplay.tsx` (YENİ).
- `components/presentation/TimeUpOverlay.tsx` (YENİ).
- `components/presentation/EmptyState.tsx` (YENİ).
- `hooks/use-live-session.ts` (YENİ).
- `hooks/use-countdown.ts` (YENİ).
- `lib/pusher-client.ts` — Faz 07'de yazıldı, reuse.

## Eklenecek Paketler

Yok — `date-fns`, `pusher-js`, `next/image`, shadcn dialog hepsi mevcut.

## Veri Modeli / Şema

Pusher protocol Faz 07'den (`documents/pusher-protocol.md`). Bu fazda yeni tip yok, sadece tüketim.

**Client state şekli (`useLiveSession`):**
```ts
type LiveSessionState = {
  currentQuestion: QuestionShowPayload | null;
  theme: ThemeSnapshot;
  isTimeUp: boolean;
};
```

**ThemeApplier dynamic CSS variables:**
```css
:root {
  --quiz-primary: <hex>;
  --quiz-accent: <hex>;
  --quiz-text: <hex>;
  --quiz-font: var(--font-<fontKey>);
}
```

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓

**Manuel:**
- İki tarayıcı tab aç: tab1 `/quiz-admin/live`, tab2 `/` (mobile responsive mode'da).
- Tab1'de quiz aktif et → Tab2'de background, renk, font değişti mi.
- Tab1'de soru "Gönder" → Tab2'de modal açıldı (backdrop blur), soru text okunabilir, sayaç başladı (örn 30'dan geriye), progress bar doluyor.
- Sayaç 0'a düştü → "Süreniz Doldu" overlay göründü, sayı kayboldu, progress kayboldu.
- Tab1'de başka soru gönder → Tab2'deki modal yeni soruyla değişti (kapanmadı, içerik update oldu, sayaç sıfırlandı yeni süreden başladı).
- Tab1'de "Modal'ı Kapat" → Tab2'deki modal kapandı, arka plan + quiz başlığı kaldı.
- Tab1'de başka bir quiz'i aktif et → Tab2'de background + renk + font değişti, modal kapalıydı zaten.
- Mobile responsive: 375px genişlikte modal okunaklı, sayaç görünür.
- Projeksiyon: 1920×1080 simulasyonda sayaç ve text okunaklı, geniş ekran boş hissi vermiyor.
- Pusher bağlantı kopması (network throttle): otomatik reconnect (pusher-js davranışı).

## Deliverables

- `documents/theme-system.md`:
  - CSS variable katmanları: globals.css (default) → ThemeApplier (runtime override).
  - Font swap: tüm fontlar build-time preload edilmiş (Faz 02), runtime'da sadece `--quiz-font` variable değişir.
  - Background image preload pattern (`<link rel="preload">` neden gerekli — projeksiyonda flash önler).
  - Theme change event akışı: Admin → /api/live/theme → Pusher → ThemeApplier → CSS variable update.
- `documents/hooks/use-live-session.md`:
  - Imza: `useLiveSession(initialTheme: ThemeSnapshot): LiveSessionState`.
  - Iç akış: Pusher subscribe, event bindings, state machine (idle → question → timeUp → idle).
  - Cleanup detayları (unbind, unsubscribe, channel disconnect).
  - Reconnect davranışı: pusher-js otomatik, ama state recovery için sayfa load'da DB'den `Quiz.isActive` çekilmesi (Faz 08 server component bunu yapıyor).
- `documents/hooks/use-countdown.md`:
  - Imza: `useCountdown(serverStartAt: string, durationSec: number): { remaining: number, progress: number, isFinished: boolean }`.
  - 250ms interval kullanımı (daha sık RAF kullanmıyoruz çünkü çok sık update gerek yok, daha az → laggy).
  - Drift problemi ve Faz 09'da nasıl çözülebileceği (server time offset).
  - Cleanup detay.

## Riskler / Açık Sorular

- **Sayaç drift:** Pusher event geldiği anda `serverStartAt` ile client `Date.now()` arasında client clock drift varsa, multi-ekran arasında ±1-2 saniye fark olabilir. Tek ekran (projeksiyon) için anlamsız; 50+ telefon arasında fark görsel olarak rahatsız edici olur. Faz 09'da gerekirse `/api/time` + `lib/time-offset.ts` ile çöz. İlk versiyonda kabul.
- **Modal'ın asla kapanmaması:** Radix Dialog default'ta ESC + overlay-click kapatır; `onOpenChange={() => {}}` ile bunu engelle. ESC = manuel kapatma admin'in `session:reset`'iyle olmalı.
- **Background preload + Tailwind:** `<link rel="preload">` server-side veya client-side inject edilebilir; `next/head` (Pages router) değil App Router'da `<head>` doğrudan layout'ta yazılır. ThemeApplier client component'ten preload eklerse SSR'den sonra; ilk yüklemede aktif quiz'in background'u zaten server component'ten geliyor (initialTheme).
- **Font değişikliği glitch:** Tüm fontlar `display: swap` ile build-time preload edildiği için runtime font değişikliği FOIT olmadan instant olmalı. Eğer flash olursa `display: optional`'a geç.
- **Empty state tasarımı:** "Quiz başlamadı" ekranı tema yokken nasıl görünür? Default tema renkleri (`globals.css` :root) + Geist font + "Quiz başlamadı, beklemede..." metni + Artium logo (varsa). Tasarım kararı Faz 09 polish'te tekrar gözden geçirilir.

---

## Sapma Logu

- **`useLiveSession` dönüş tipi `closedAt` → `isTimeUp`:** Faz 07 ön spec'i `closedAt: number | null` (epoch ms) dönüyordu ve modal'ı kapatma tetiği olarak tasarlanmıştı. Brief ise süre dolunca modal'ın kapanmamasını, yalnız "Süreniz Doldu" overlay'inin tetiklenmesini istiyordu (modal yalnız `session:reset` ile kapanır). UX talebi normatif olduğu için ön spec geçersizleştirildi; hook `isTimeUp: boolean` döner hale getirildi. `documents/hooks/use-live-session.md` revize edildi.
- **`ThemeApplier` Pusher'a doğrudan subscribe etmiyor:** Brief checklist'i ThemeApplier'ın `quiz:theme-change`'e kendi subscribe etmesini öneriyordu. Tek hook (`useLiveSession`) zaten tüm event'leri topladığı için iki ayrı subscribe duplicate connection + sıralama karmaşası üretirdi. `ThemeApplier` saf bir effect bileşenine indirgendi: prop ile aldığı `theme`'i DOM CSS variable'larına yazar; Pusher dinleme sorumluluğu hook'ta.
- **`useCountdown` setState-in-effect lint kuralı:** İlk implementasyon `useEffect` içinde `setState(compute(...))` çağırıyordu (`react-hooks/set-state-in-effect` lint error). Çözüm: hook tek bir `tick` counter tutar, gerçek değerler her render'da `compute()` ile taze hesaplanır. Effect içinde yalnız `setTick`. Render-time compute → stale paint riski yok.
- **`QuestionModal` shadcn `DialogContent` yerine Radix primitive doğrudan:** shadcn'in `DialogContent` default class'ları (`max-w-sm`, `rounded-xl`, `bg-popover`, center-anchor translate) full-stage takeover ile çakışıyordu. Override için `!` prefix savaşına girmek yerine `radix-ui` `Dialog.Root` + `Dialog.Portal` + `Dialog.Overlay` + `Dialog.Content` doğrudan kullanıldı. `DialogTitle` / `DialogDescription` `sr-only` ile a11y şartı korundu.
- **Background `<link rel="preload">` server-side eklenmedi:** Plan layout `<head>` içinde initial preload öngörüyordu. Pratikte EmptyState bileşeni initial render'da `background-image: var(--quiz-background)` set etmediği (CSS var ilk render'da `--quiz-background` undefined → no-op) için flash riski yok; ThemeApplier client-side `new Image().onload` pattern'i tüm tema geçişlerinde yeterli. Server-side `<link>` preload Faz 09 polish'e bırakıldı.
- **`/` route'u `dynamic = "force-dynamic"`:** Next.js 16 default'unda RSC build-time'da prerender olabilir; aktif quiz state'i sık değişen veri olduğu için segment config ile dynamic'e zorlandı. (`next.config.ts`'te Cache Components aktif değil — `"use cache"` directive'ine geçilmesi gerekmedi.)
