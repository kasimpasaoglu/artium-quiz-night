import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { problem } from "@/lib/problem";
import { triggerLive } from "@/lib/pusher-server";
import {
  buildThemeSnapshot,
  LIVE_EVENT,
  type QuizThemeChangePayload,
  themeChangeBodySchema,
} from "@/lib/schemas/live";
import { requireAdmin } from "@/server/guards";

// Admin aktif quiz'i değiştirdiğinde public ekran tema güncellemesi alır.
// `setActiveQuiz` server action'ı DB'yi günceller; bu endpoint sadece Pusher
// üzerinden public ekrana sinyal gönderir.
export async function POST(request: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem("Geçersiz istek gövdesi", 400);
  }

  const parsed = themeChangeBodySchema.safeParse(body);
  if (!parsed.success) {
    return problem(parsed.error.issues[0]?.message ?? "Geçersiz istek", 400);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: parsed.data.quizId },
    select: {
      id: true,
      primaryColor: true,
      accentColor: true,
      textColor: true,
      backgroundUrl: true,
      fontKey: true,
    },
  });

  if (!quiz) {
    return problem("Quiz bulunamadı", 404);
  }

  const snapshot = buildThemeSnapshot(quiz);
  const { quizId, ...theme } = snapshot;
  const payload: QuizThemeChangePayload = { quizId, theme };

  await triggerLive(LIVE_EVENT.themeChange, payload);
  return NextResponse.json({ ok: true });
}
