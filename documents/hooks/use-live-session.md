# `useLiveSession()` — Ön Spec

> **Durum:** Faz 07'de yalnız spec yazıldı, implementasyon Faz 08'de tamamlanır.
> Bu doküman public ekran (`(public)/page.tsx`) tarafından bağlanacak hook için
> kontrat görevi görür.

## Amaç

Pusher kanalına (`LIVE_CHANNEL`) subscribe olur, dört event'i (`question:show`,
`question:end`, `quiz:theme-change`, `session:reset`) dinler ve sahne
bileşenlerinin tüketeceği reactive state'i döndürür. `getPusherClient`
singleton üzerinden çalışır, cleanup'ı yapar.

## İmza (Faz 08 dolduracak)

```ts
function useLiveSession(): UseLiveSessionResult;

interface UseLiveSessionResult {
  /** Açık soru — yoksa idle ekran render edilir. */
  currentQuestion: QuestionShowPayload | null;
  /** En son tema (aktif quiz değiştikçe güncellenir). */
  theme: ThemeSnapshot | null;
  /** `session:reset` veya `question:end` ile tetiklenir; ekran bunu modal kapama tetiği olarak kullanır. */
  closedAt: number | null;
}
```

`closedAt` epoch ms değeri — değişimi React'in re-render'a karar verme kararsızlığını
çözer. `boolean` flag yerine `number` kullanıldığı için aynı sebepten tekrar
tetiklenebilir.

## İç Plan

```ts
"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import {
  LIVE_CHANNEL,
  LIVE_EVENT,
  type QuestionShowPayload,
  type QuestionEndPayload,
  type QuizThemeChangePayload,
  type ThemeSnapshot,
} from "@/lib/schemas/live";

export function useLiveSession(initialTheme: ThemeSnapshot | null): UseLiveSessionResult {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionShowPayload | null>(null);
  const [theme, setTheme] = useState<ThemeSnapshot | null>(initialTheme);
  const [closedAt, setClosedAt] = useState<number | null>(null);

  useEffect(() => {
    const client = getPusherClient();
    const channel = client.subscribe(LIVE_CHANNEL);

    function onShow(payload: QuestionShowPayload) {
      setCurrentQuestion(payload);
      setTheme(payload.themeSnapshot);
    }

    function onEnd(_payload: QuestionEndPayload) {
      setClosedAt(Date.now());
    }

    function onThemeChange({ quizId, theme }: QuizThemeChangePayload) {
      setTheme({ quizId, ...theme });
    }

    function onReset() {
      setCurrentQuestion(null);
      setClosedAt(Date.now());
    }

    channel.bind(LIVE_EVENT.questionShow, onShow);
    channel.bind(LIVE_EVENT.questionEnd, onEnd);
    channel.bind(LIVE_EVENT.themeChange, onThemeChange);
    channel.bind(LIVE_EVENT.sessionReset, onReset);

    return () => {
      channel.unbind(LIVE_EVENT.questionShow, onShow);
      channel.unbind(LIVE_EVENT.questionEnd, onEnd);
      channel.unbind(LIVE_EVENT.themeChange, onThemeChange);
      channel.unbind(LIVE_EVENT.sessionReset, onReset);
      client.unsubscribe(LIVE_CHANNEL);
    };
  }, []);

  return { currentQuestion, theme, closedAt };
}
```

## `initialTheme` Parametresi

Server component (`(public)/page.tsx`) DB'den aktif quiz'in temasını çekip
hook'a inject eder. Public ekran ilk yüklemede Pusher event beklemeden idle
ekranı doğru tema ile render eder. Pusher reconnect sonrası gelen
`quiz:theme-change` event'i state'i tazeler.

## Bağımlılıklar

- `react` — `useState`, `useEffect`.
- `@/lib/pusher-client` — `getPusherClient`.
- `@/lib/schemas/live` — tipler + olay sabitleri.

## Edge Case'ler

- **HMR'da double-subscribe:** `getPusherClient` singleton + `useEffect` cleanup birlikte StrictMode'da bile leak'i engeller.
- **Süre client tarafında ölçülür:** Hook süre ile ilgilenmez; `currentQuestion.serverStartAt + durationSec` mantığı sahne bileşeninde (countdown component) yer alır.
- **Kaçırılan event:** Pusher Free plan history vermez. Hook reload anında DB'den initial state alır (`initialTheme`). Aktif soru var ise public ekran "yayın başladı, modal'ı bekleyin" gibi bir hint gösterebilir; ürün kararı Faz 08'de verilir.
- **Race condition (hızlı iki gönder):** Backend tarafında çift tıklama disabled. Hook tarafında son gelen `question:show` her zaman state'i overwrite eder, sorun yok.

## Faz 08 Yapılacaklar

- [ ] Bu hook'u `hooks/use-live-session.ts` olarak yaz.
- [ ] Test: `bind/unbind/unsubscribe` cleanup'ı React DevTools veya Pusher dashboard "active connections" ile doğrula.
- [ ] Sahne bileşenleri (`components/presentation/`) hook çıktısını consume etsin.
- [ ] Bu doküman implement edilince **Durum:** ✅ DONE olarak güncellenir.
