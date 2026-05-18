import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionTable } from "@/components/admin/question-table";
import { QuizThemePreview } from "@/components/admin/quiz-theme-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/prisma";
import { parseFontKey } from "@/lib/fonts";
import { ROUTES } from "@/lib/routes";

interface QuizDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      backgroundUrl: true,
      primaryColor: true,
      accentColor: true,
      textColor: true,
      fontKey: true,
      isActive: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          text: true,
          imageUrl: true,
          durationSec: true,
          difficulty: true,
          orderIndex: true,
        },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{quiz.title}</h1>
            {quiz.isActive ? (
              <Badge variant="default">Aktif</Badge>
            ) : (
              <Badge variant="outline">Pasif</Badge>
            )}
          </div>
          {quiz.description && (
            <p className="max-w-prose text-sm text-muted-foreground">{quiz.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link href={ROUTES.adminHome}>Geri</Link>
          </Button>
          <Button asChild>
            <Link href={ROUTES.adminQuizEdit(quiz.id)}>Düzenle</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <QuestionTable quizId={quiz.id} questions={quiz.questions} />
        </div>
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-base font-semibold">Tema</h2>
          <QuizThemePreview
            title={quiz.title}
            primaryColor={quiz.primaryColor}
            accentColor={quiz.accentColor}
            textColor={quiz.textColor}
            fontKey={parseFontKey(quiz.fontKey)}
            backgroundUrl={quiz.backgroundUrl}
          />
          <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="space-y-0.5">
              <dt className="font-medium text-foreground">Birincil</dt>
              <dd className="font-mono uppercase">{quiz.primaryColor}</dd>
            </div>
            <div className="space-y-0.5">
              <dt className="font-medium text-foreground">Vurgu</dt>
              <dd className="font-mono uppercase">{quiz.accentColor}</dd>
            </div>
            <div className="space-y-0.5">
              <dt className="font-medium text-foreground">Metin</dt>
              <dd className="font-mono uppercase">{quiz.textColor}</dd>
            </div>
            <div className="space-y-0.5">
              <dt className="font-medium text-foreground">Font</dt>
              <dd>{quiz.fontKey}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
