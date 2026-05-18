"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/db/prisma";
import { isRecordNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { ROUTES } from "@/lib/routes";
import { type QuizFormInput, quizFormSchema } from "@/lib/schemas/quiz";
import { nullableString } from "@/lib/strings";
import { requireAdmin } from "@/server/guards";

function parseQuizInput(input: QuizFormInput) {
  const parsed = quizFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz form verisi");
  }
  return {
    title: parsed.data.title,
    description: nullableString(parsed.data.description),
    backgroundUrl: nullableString(parsed.data.backgroundUrl),
    primaryColor: parsed.data.primaryColor,
    accentColor: parsed.data.accentColor,
    textColor: parsed.data.textColor,
    fontKey: parsed.data.fontKey,
  };
}

function revalidateAdminQuizPaths(id: string) {
  revalidatePath(ROUTES.adminHome);
  revalidatePath(ROUTES.adminQuizDetail(id));
  revalidatePath(ROUTES.adminQuizEdit(id));
}

export async function createQuiz(input: QuizFormInput) {
  await requireAdmin();
  const data = parseQuizInput(input);
  const quiz = await prisma.quiz.create({ data });
  revalidateAdminQuizPaths(quiz.id);
  redirect(ROUTES.adminQuizDetail(quiz.id));
}

export async function updateQuiz(id: string, input: QuizFormInput) {
  await requireAdmin();
  const data = parseQuizInput(input);
  try {
    await prisma.quiz.update({ where: { id }, data });
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error("Quiz bulunamadı, başka bir oturumda silinmiş olabilir");
    }
    throw error;
  }
  revalidateAdminQuizPaths(id);
}

export async function deleteQuiz(id: string) {
  await requireAdmin();
  // Quiz silindiğinde sorular cascade ile temizlenir (schema). Blob'taki
  // arka plan/soru görselleri orphan kalır — Faz 10'da `del()` ile cleanup.
  try {
    await prisma.quiz.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) {
      throw new Error("Quiz bulunamadı, başka bir oturumda silinmiş olabilir");
    }
    throw error;
  }
  revalidateAdminQuizPaths(id);
  redirect(ROUTES.adminHome);
}

export async function setActiveQuiz(id: string) {
  await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.quiz.updateMany({
        where: { isActive: true, NOT: { id } },
        data: { isActive: false },
      });
      await tx.quiz.update({ where: { id }, data: { isActive: true } });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Başka bir quiz şu an aktif, lütfen sayfayı yenileyip tekrar deneyin");
    }
    throw error;
  }
  revalidateAdminQuizPaths(id);
}

export async function deactivateQuiz(id: string) {
  await requireAdmin();
  await prisma.quiz.update({ where: { id }, data: { isActive: false } });
  revalidateAdminQuizPaths(id);
}
