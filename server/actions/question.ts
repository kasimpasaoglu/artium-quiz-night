"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { ROUTES } from "@/lib/routes";
import { type QuestionFormInput, questionFormSchema } from "@/lib/schemas/question";
import { nullableString } from "@/lib/strings";
import { requireAdmin } from "@/server/guards";

function parseQuestionInput(input: QuestionFormInput) {
  const parsed = questionFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz form verisi");
  }
  return {
    text: parsed.data.text,
    imageUrl: nullableString(parsed.data.imageUrl),
    durationSec: parsed.data.durationSec,
    difficulty: parsed.data.difficulty,
  };
}

function revalidateQuestionsPath(quizId: string) {
  revalidatePath(ROUTES.adminQuizDetail(quizId));
}

export async function createQuestion(quizId: string, input: QuestionFormInput) {
  await requireAdmin();
  const data = parseQuestionInput(input);
  await prisma.$transaction(async (tx) => {
    const last = await tx.question.aggregate({
      _max: { orderIndex: true },
      where: { quizId },
    });
    const nextOrder = (last._max.orderIndex ?? -1) + 1;
    await tx.question.create({
      data: { ...data, quizId, orderIndex: nextOrder },
    });
  });
  revalidateQuestionsPath(quizId);
}

export async function updateQuestion(id: string, input: QuestionFormInput) {
  await requireAdmin();
  const data = parseQuestionInput(input);
  try {
    const updated = await prisma.question.update({
      where: { id },
      data,
      select: { quizId: true },
    });
    revalidateQuestionsPath(updated.quizId);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error("Soru bulunamadı, başka bir oturumda silinmiş olabilir");
    }
    throw error;
  }
}

export async function deleteQuestion(id: string) {
  await requireAdmin();
  try {
    const { quizId } = await prisma.$transaction(async (tx) => {
      const deleted = await tx.question.delete({
        where: { id },
        select: { quizId: true, orderIndex: true },
      });
      await tx.question.updateMany({
        where: { quizId: deleted.quizId, orderIndex: { gt: deleted.orderIndex } },
        data: { orderIndex: { decrement: 1 } },
      });
      return deleted;
    });
    revalidateQuestionsPath(quizId);
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error("Soru bulunamadı, başka bir oturumda silinmiş olabilir");
    }
    throw error;
  }
}

// İki adım swap yeterli çünkü `@@index([quizId, orderIndex])` UNIQUE değil.
// İleride UNIQUE composite'e geçilirse three-step swap (current → -1, neighbor →
// current.idx, current → neighbor.idx) gerekecek.
export async function reorderQuestion(id: string, direction: "up" | "down") {
  await requireAdmin();
  const quizId = await prisma.$transaction(async (tx) => {
    const current = await tx.question.findUnique({
      where: { id },
      select: { id: true, quizId: true, orderIndex: true },
    });
    if (!current) {
      throw new Error("Soru bulunamadı, başka bir oturumda silinmiş olabilir");
    }
    const neighbor = await tx.question.findFirst({
      where: {
        quizId: current.quizId,
        orderIndex: direction === "up" ? { lt: current.orderIndex } : { gt: current.orderIndex },
      },
      orderBy: { orderIndex: direction === "up" ? "desc" : "asc" },
      select: { id: true, orderIndex: true },
    });
    if (!neighbor) return current.quizId;
    await tx.question.update({
      where: { id: current.id },
      data: { orderIndex: neighbor.orderIndex },
    });
    await tx.question.update({
      where: { id: neighbor.id },
      data: { orderIndex: current.orderIndex },
    });
    return current.quizId;
  });
  revalidateQuestionsPath(quizId);
}
