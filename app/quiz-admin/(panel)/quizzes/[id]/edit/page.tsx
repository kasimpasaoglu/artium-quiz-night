import { notFound } from "next/navigation";
import { QuizForm } from "@/components/admin/quiz-form";
import { prisma } from "@/db/prisma";

interface EditQuizPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuizPage({ params }: EditQuizPageProps) {
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
    },
  });

  if (!quiz) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-lg font-semibold">Quizi Düzenle</h1>
        <p className="text-sm text-muted-foreground">
          Tema veya başlık değişikliği yaptıktan sonra kaydetmeyi unutmayın.
        </p>
      </header>
      <QuizForm mode="edit" initialData={quiz} />
    </div>
  );
}
