"use client";

import { useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import {
  LIVE_CHANNEL,
  LIVE_EVENT,
  type QuestionShowPayload,
  type QuizThemeChangePayload,
  type ThemeSnapshot,
} from "@/lib/schemas/live";

export interface UseLiveSessionResult {
  /** Aktif yayında olan soru. `null` → idle ekran. */
  currentQuestion: QuestionShowPayload | null;
  /** En son geçerli tema. Aktif quiz değiştikçe ya da yeni soru payload'ı geldikçe güncellenir. */
  theme: ThemeSnapshot | null;
  /** Süre dolma sinyali. Modal'ı kapatmaz; yalnızca "Süreniz Doldu" overlay tetiği. */
  isTimeUp: boolean;
}

function themesEqual(a: ThemeSnapshot | null, b: ThemeSnapshot | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.quizId === b.quizId &&
    a.primaryColor === b.primaryColor &&
    a.accentColor === b.accentColor &&
    a.textColor === b.textColor &&
    a.backgroundUrl === b.backgroundUrl &&
    a.fontKey === b.fontKey
  );
}

export function useLiveSession(initialTheme: ThemeSnapshot | null): UseLiveSessionResult {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionShowPayload | null>(null);
  const [theme, setTheme] = useState<ThemeSnapshot | null>(initialTheme);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    const client = getPusherClient();
    const channel = client.subscribe(LIVE_CHANNEL);

    // Aynı değerlerle gelen tema event'leri ThemeApplier'da gereksiz DOM
    // mutate + image preload tetiklemesin diye referans korunur.
    function applyTheme(next: ThemeSnapshot) {
      setTheme((prev) => (themesEqual(prev, next) ? prev : next));
    }

    function onShow(payload: QuestionShowPayload) {
      setCurrentQuestion(payload);
      applyTheme(payload.themeSnapshot);
      setIsTimeUp(false);
    }

    function onEnd() {
      setIsTimeUp(true);
    }

    function onThemeChange({ quizId, theme: next }: QuizThemeChangePayload) {
      applyTheme({ quizId, ...next });
    }

    function onReset() {
      setCurrentQuestion(null);
      setIsTimeUp(false);
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

  return { currentQuestion, theme, isTimeUp };
}
