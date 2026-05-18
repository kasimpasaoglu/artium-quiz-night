import Link from "next/link";
import { QuizList, type QuizListRow } from "@/components/admin/quiz-list";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/prisma";
import { ROUTES } from "@/lib/routes";

export default async function AdminHomePage() {
  const quizzes = await prisma.quiz.findMany({
    select: { id: true, title: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: QuizListRow[] = quizzes;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Yönetim Paneli</h1>
          <p className="text-sm text-muted-foreground">
            Quiz tanımlarınızı yönetin, aktif quizi seçin, soruları sonraki adımda ekleyin.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.adminQuizNew}>Yeni Quiz</Link>
        </Button>
      </header>
      <QuizList quizzes={rows} />
    </div>
  );
}
