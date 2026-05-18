import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { problem } from "@/lib/problem";
import { triggerLive } from "@/lib/pusher-server";
import {
  buildThemeSnapshot,
  LIVE_EVENT,
  type QuestionShowPayload,
  sendQuestionBodySchema,
} from "@/lib/schemas/live";
import { requireAdmin } from "@/server/guards";

// Admin "Gönder" dediğinde Pusher'a `question:show` event'i basar.
// `serverStartAt` ISO string olarak payload'a gömülür — Faz 08 client süreyi
// sunucu zamanına göre ölçecek (clock drift toleransı için).
export async function POST(request: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem("Geçersiz istek gövdesi", 400);
  }

  const parsed = sendQuestionBodySchema.safeParse(body);
  if (!parsed.success) {
    return problem(parsed.error.issues[0]?.message ?? "Geçersiz istek", 400);
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.questionId },
    include: { quiz: true },
  });

  if (!question) {
    return problem("Soru bulunamadı", 404);
  }

  const serverStartAt = new Date().toISOString();
  const payload: QuestionShowPayload = {
    questionId: question.id,
    text: question.text,
    imageUrl: question.imageUrl,
    durationSec: question.durationSec,
    difficulty: question.difficulty,
    serverStartAt,
    themeSnapshot: buildThemeSnapshot(question.quiz),
  };

  await triggerLive(LIVE_EVENT.questionShow, payload);
  return NextResponse.json({ ok: true, serverStartAt });
}
