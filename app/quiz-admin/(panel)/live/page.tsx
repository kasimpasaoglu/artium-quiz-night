import Link from "next/link";
import {
  LiveModePanel,
  type LiveActiveQuiz,
  type LiveQuizListItem,
} from "@/components/admin/live-mode-panel";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/prisma";
import { ROUTES } from "@/lib/routes";

// Live mode admin sayfası: sol kolonda tüm quiz'ler + aktif et CTA; sağ
// kolonda aktif quiz'in soruları + "Gönder" CTA; üstte tema preview +
// "Modal'ı Kapat". Auth `(panel)/layout.tsx` içindeki `requireAdmin()`
// tarafından sağlanır.
export default async function LiveModePage() {
  const quizzes = await prisma.quiz.findMany({
    select: { id: true, title: true, isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (quizzes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-lg font-semibold">Live Mode</h1>
          <p className="text-sm text-muted-foreground">
            Live mode&apos;u kullanmak için önce en az bir quiz oluşturmalısınız.
          </p>
        </header>
        <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-input bg-muted/30 px-6 py-10">
          <p className="text-sm text-muted-foreground">
            Henüz hiç quiz tanımlanmamış. Yeni bir quiz oluşturup ardından bu sayfaya dönerek aktif
            edebilirsiniz.
          </p>
          <Button asChild>
            <Link href={ROUTES.adminQuizNew}>Yeni Quiz Oluştur</Link>
          </Button>
        </div>
      </div>
    );
  }

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
