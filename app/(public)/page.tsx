import { EmptyState } from "@/components/presentation/EmptyState";
import { PresentationStage } from "@/components/presentation/PresentationStage";
import { prisma } from "@/db/prisma";
import { buildThemeSnapshot } from "@/lib/schemas/live";

// Aktif quiz state'i sık değişir; statik prerender uygun değil.
export const dynamic = "force-dynamic";

export default async function PublicHome() {
  const activeQuiz = await prisma.quiz.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      primaryColor: true,
      accentColor: true,
      textColor: true,
      backgroundUrl: true,
      fontKey: true,
    },
  });

  if (!activeQuiz) {
    return <EmptyState theme={null} quizTitle={null} />;
  }

  const initialTheme = buildThemeSnapshot(activeQuiz);
  return <PresentationStage initialTheme={initialTheme} quizTitle={activeQuiz.title} />;
}
