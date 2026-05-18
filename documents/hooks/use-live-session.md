# `useLiveSession(initialTheme)`

> **Durum:** ✅ DONE (Faz 08, 2026-05-18).

Public sahnede Pusher Channels üzerinden gelen dört event'i (`question:show`, `question:end`, `quiz:theme-change`, `session:reset`) toplayıp sahne bileşenlerine (`<ThemeApplier>`, `<QuestionModal>`) reactive state olarak sunan client-side hook. `getPusherClient()` singleton üzerinden subscribe eder, unmount'ta cleanup yapar.

## İmza

```ts
function useLiveSession(initialTheme: ThemeSnapshot | null): {
  currentQuestion: QuestionShowPayload | null;
  theme: ThemeSnapshot | null;
  isTimeUp: boolean;
};
```

`initialTheme`: `(public)/page.tsx` server component'i DB'den aktif quiz'i çekip `buildThemeSnapshot()` ile dönüştürür ve hook'a ilk değer olarak verir. Pusher event beklemeden ilk render'da idle ekran doğru tema ile çizilir.

## Davranış

### Event Bindings

| Event | Davranış |
|---|---|
| `question:show` | `setCurrentQuestion(payload)`, `setTheme(payload.themeSnapshot)`, `setIsTimeUp(false)`. Modal açılır, sayaç sıfırlanır. |
| `question:end` | `setIsTimeUp(true)`. **Modal kapanmaz**, yalnız `<TimeUpOverlay>` tetiklenir. |
| `quiz:theme-change` | `setTheme({ quizId, ...theme })`. Yeni quiz aktif edildiyse idle ekran tema güncellenir. |
| `session:reset` | `setCurrentQuestion(null)`, `setIsTimeUp(false)`. Modal kapanır, idle ekrana dönülür. |

### Sapma Notu (Faz 07 Ön Spec → Faz 08 Final)

Faz 07 ön spec'i `closedAt: number | null` (epoch ms) döndürüyordu — modal'ı kapatma tetiği olarak. Faz 08 brief'i farklı UX istedi: süre dolunca modal kapanmaz, yalnız "Süreniz Doldu" overlay tetiklenir, modal yalnız `session:reset` ile kapanır. Bu yüzden `isTimeUp: boolean` flag'ine geçildi; `closedAt` semantiği kaldırıldı.

### Cleanup

```ts
return () => {
  channel.unbind(LIVE_EVENT.questionShow, onShow);
  channel.unbind(LIVE_EVENT.questionEnd, onEnd);
  channel.unbind(LIVE_EVENT.themeChange, onThemeChange);
  channel.unbind(LIVE_EVENT.sessionReset, onReset);
  client.unsubscribe(LIVE_CHANNEL);
};
```

HMR + React 19 StrictMode kombinasyonunda double-effect ile cleanup unbind çalışır; kalıcı subscription leak yok. `getPusherClient()` zaten singleton (HMR'da çoklu WebSocket açmaz).

## Kullanım

```tsx
"use client";

import { useLiveSession } from "@/hooks/use-live-session";

export function PresentationStage({ initialTheme, quizTitle }) {
  const { currentQuestion, theme, isTimeUp } = useLiveSession(initialTheme);
  const activeTheme = theme ?? initialTheme;
  return (
    <ThemeApplier theme={activeTheme}>
      <EmptyState theme={activeTheme} quizTitle={quizTitle} />
      {currentQuestion && (
        <QuestionModal question={currentQuestion} isTimeUp={isTimeUp} />
      )}
    </ThemeApplier>
  );
}
```

## Bağımlılıklar

- `react` — `useState`, `useEffect`.
- `@/lib/pusher-client` — `getPusherClient`.
- `@/lib/schemas/live` — `LIVE_CHANNEL`, `LIVE_EVENT`, payload tipleri.

## Edge Cases

- **HMR'da double-subscribe:** Singleton + `useEffect` cleanup StrictMode'da bile leak'i engeller.
- **Süre client tarafında ölçülür:** Hook süre ile ilgilenmez; `currentQuestion.serverStartAt + durationSec` mantığı `<CountdownDisplay>` içindeki `useCountdown` hook'una emanet edilir.
- **Kaçırılan event:** Pusher Free plan history vermez; reconnect sırasında trigger'lanmış event'ler kaybedilir. Reload anında server component DB'den `Quiz.isActive` çeker — initial tema gelir. Aktif soru (in-flight) state'i kaybolur; admin `session:reset` + tekrar `question:show` ile yeniden başlatır.
- **Race condition (hızlı iki gönder):** Admin UI'da buton `disabled={pending}`. Hook tarafında son gelen `question:show` her zaman state'i overwrite eder.
- **`question:end` event'i hiç gelmeyebilir:** Faz 07 admin UI'da bu event'i tetikleyen CTA yok. `<QuestionModal>` client-side `useCountdown.isFinished` ile bağımsız overlay tetikler — server event gelmese de sahne tutarlı kalır.

## Bağlantılı Belgeler

- `documents/pusher-protocol.md` — Faz 07 event payload kontratı.
- `documents/hooks/use-countdown.md` — Süre ölçümü.
- `documents/theme-system.md` — Tema state akışı ve DOM uygulaması.
