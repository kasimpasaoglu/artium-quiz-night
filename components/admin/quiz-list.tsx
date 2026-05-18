"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { DeleteQuizDialog } from "@/components/admin/delete-quiz-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/lib/routes";
import { deactivateQuiz, setActiveQuiz } from "@/server/actions/quiz";

export interface QuizListRow {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: Date;
}

interface QuizListProps {
  quizzes: QuizListRow[];
}

export function QuizList({ quizzes }: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-input bg-muted/30 px-6 py-10">
        <p className="text-sm text-muted-foreground">
          Henüz quiz oluşturulmamış. İlk quiz&apos;i tanımlayarak başlayın.
        </p>
        <Button asChild>
          <Link href={ROUTES.adminQuizNew}>Yeni Quiz Oluştur</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Başlık</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>Oluşturma</TableHead>
          <TableHead className="text-right">Eylemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quizzes.map((quiz) => (
          <QuizRow key={quiz.id} quiz={quiz} />
        ))}
      </TableBody>
    </Table>
  );
}

function QuizRow({ quiz }: { quiz: QuizListRow }) {
  const [pending, startTransition] = useTransition();

  function handleToggleActive() {
    startTransition(async () => {
      try {
        if (quiz.isActive) {
          await deactivateQuiz(quiz.id);
          toast.success("Quiz pasif edildi");
        } else {
          await setActiveQuiz(quiz.id);
          toast.success("Quiz aktif edildi");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Durum güncellenemedi";
        toast.error(message);
      }
    });
  }

  return (
    <TableRow>
      <TableCell>
        <Link
          href={ROUTES.adminQuizDetail(quiz.id)}
          className="font-medium text-foreground hover:underline"
        >
          {quiz.title}
        </Link>
      </TableCell>
      <TableCell>
        {quiz.isActive ? (
          <Badge variant="default">Aktif</Badge>
        ) : (
          <Badge variant="outline">Pasif</Badge>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(quiz.createdAt, "d MMM yyyy, HH:mm", { locale: tr })}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant={quiz.isActive ? "outline" : "secondary"}
            size="sm"
            disabled={pending}
            onClick={handleToggleActive}
          >
            {quiz.isActive ? "Pasif Yap" : "Aktif Yap"}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.adminQuizEdit(quiz.id)}>Düzenle</Link>
          </Button>
          <DeleteQuizDialog quizId={quiz.id} quizTitle={quiz.title}>
            <Button type="button" variant="destructive" size="sm">
              Sil
            </Button>
          </DeleteQuizDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
