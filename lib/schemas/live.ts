import { z } from "zod";
import { safeHexColor } from "@/lib/colors";
import { type FontKey, parseFontKey } from "@/lib/fonts";

// Faz 07 — Pusher kanalı üzerinden taşınan event payload'larının tek source of
// truth'u. Aynı tip hem server route handler'larında (`triggerLive`) hem de
// Faz 08 `useLiveSession` hook'unda kullanılır. Bu dosya tipleri ve API
// kontratını birlikte tanımlar; `documents/pusher-protocol.md` doğrudan
// referans alır.

export const LIVE_CHANNEL = "public-quiz-night-live";

export const LIVE_EVENT = {
  questionShow: "question:show",
  questionEnd: "question:end",
  themeChange: "quiz:theme-change",
  sessionReset: "session:reset",
} as const;

export type LiveEvent = (typeof LIVE_EVENT)[keyof typeof LIVE_EVENT];

export interface ThemeSnapshot {
  quizId: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundUrl: string | null;
  fontKey: FontKey;
}

export interface QuestionShowPayload {
  questionId: string;
  text: string;
  imageUrl: string | null;
  durationSec: number;
  difficulty: number;
  serverStartAt: string;
  themeSnapshot: ThemeSnapshot;
}

export interface QuestionEndPayload {
  questionId: string;
}

export interface QuizThemeChangePayload {
  quizId: string;
  theme: Omit<ThemeSnapshot, "quizId">;
}

export type SessionResetPayload = Record<string, never>;

// Tema renkleri + font_key DB'den gelse de değişebilir (eski kayıt, manuel
// müdahale). `buildThemeSnapshot` Faz 03 default'larına düşerek tipi garanti
// eder; payload tüketicisi (Faz 08 sahne ekranı) her zaman geçerli değer alır.
export interface QuizThemeSource {
  id: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundUrl: string | null;
  fontKey: string;
}

export function buildThemeSnapshot(quiz: QuizThemeSource): ThemeSnapshot {
  return {
    quizId: quiz.id,
    primaryColor: safeHexColor(quiz.primaryColor, "#1A1815"),
    accentColor: safeHexColor(quiz.accentColor, "#C4A572"),
    textColor: safeHexColor(quiz.textColor, "#F4EFE6"),
    backgroundUrl: quiz.backgroundUrl,
    fontKey: parseFontKey(quiz.fontKey),
  };
}

// Route handler body parser'ları — zod ile parse + Türkçe hata mesajı.
export const sendQuestionBodySchema = z.object({
  questionId: z.string().min(1, "questionId zorunludur"),
});

export const endQuestionBodySchema = z.object({
  questionId: z.string().min(1, "questionId zorunludur"),
});

export const themeChangeBodySchema = z.object({
  quizId: z.string().min(1, "quizId zorunludur"),
});
