import {
  LiveModePanel,
  type LiveActiveQuiz,
  type LiveQuizListItem,
} from "@/components/admin/live-mode-panel";
import { prisma } from "@/db/prisma";

// Live mode admin sayfası: sol kolonda tüm quiz'ler + aktif et CTA; sağ
// kolonda aktif quiz'in soruları + "Gönder" CTA; üstte tema preview +
// "Modal'ı Kapat". Auth `(panel)/layout.tsx` içindeki `requireAdmin()`
// tarafından sağlanır.
export default async function LiveModePage() {
  const [quizzes, activeQuiz] = await Promise.all([
    prisma.quiz.findMany({
      select: { id: true, title: true, isActive: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quiz.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        primaryColor: true,
        accentColor: true,
        textColor: true,
        backgroundUrl: true,
        fontKey: true,
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
    }),
  ]);

  const quizList: LiveQuizListItem[] = quizzes;
  const active: LiveActiveQuiz | null = activeQuiz;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Live Mode</h1>
        <p className="text-sm text-muted-foreground">
          Quiz seçin, aktif edin ve soruları teker teker yayına alın. Public ekran Pusher üzerinden
          güncellenir.
        </p>
      </header>
      <LiveModePanel quizzes={quizList} activeQuiz={active} />
    </div>
  );
}
