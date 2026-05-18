"use client";

import { ArrowDownIcon, ArrowUpIcon, ImageIcon } from "lucide-react";
import { DeleteQuestionDialog } from "@/components/admin/delete-question-dialog";
import { DifficultyBadge } from "@/components/admin/difficulty-badge";
import { QuestionFormDialog } from "@/components/admin/question-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerAction } from "@/hooks/use-server-action";
import type { QuestionRow } from "@/lib/schemas/question";
import { truncate } from "@/lib/strings";
import { reorderQuestion } from "@/server/actions/question";

interface QuestionTableProps {
  quizId: string;
  questions: QuestionRow[];
}

const TEXT_PREVIEW_LIMIT = 100;

export function QuestionTable({ quizId, questions }: QuestionTableProps) {
  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-input bg-muted/30 px-6 py-10">
        <div>
          <h2 className="text-base font-semibold">Henüz soru yok</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu quize ait ilk soruyu tanımlayarak başlayın.
          </p>
        </div>
        <QuestionFormDialog
          mode="create"
          quizId={quizId}
          trigger={<Button>İlk Soruyu Ekle</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Sorular</h2>
        <QuestionFormDialog
          mode="create"
          quizId={quizId}
          trigger={<Button size="sm">Yeni Soru</Button>}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Soru</TableHead>
            <TableHead className="w-20">Süre</TableHead>
            <TableHead className="w-32">Zorluk</TableHead>
            <TableHead className="w-56 text-right">Eylemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question, index) => (
            <QuestionRow
              key={question.id}
              question={question}
              index={index}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface QuestionRowProps {
  question: QuestionRow;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

function QuestionRow({ question, index, isFirst, isLast }: QuestionRowProps) {
  const reorder = useServerAction(reorderQuestion, {
    errorFallback: "Sıra değiştirilemedi",
  });

  return (
    <TableRow>
      <TableCell className="text-sm font-mono text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          {question.imageUrl && (
            <span
              aria-label="Görsel var"
              title="Görsel var"
              className="mt-0.5 inline-flex size-5 items-center justify-center rounded-sm bg-muted text-muted-foreground"
            >
              <ImageIcon className="size-3" />
            </span>
          )}
          <span className="text-sm text-foreground">
            {truncate(question.text, TEXT_PREVIEW_LIMIT)}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{question.durationSec} sn</TableCell>
      <TableCell>
        <DifficultyBadge value={question.difficulty} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Yukarı taşı"
            title="Yukarı taşı"
            disabled={isFirst || reorder.pending}
            onClick={() => reorder.run(question.id, "up")}
          >
            <ArrowUpIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Aşağı taşı"
            title="Aşağı taşı"
            disabled={isLast || reorder.pending}
            onClick={() => reorder.run(question.id, "down")}
          >
            <ArrowDownIcon className="size-4" />
          </Button>
          <QuestionFormDialog
            mode="edit"
            question={question}
            trigger={
              <Button variant="ghost" size="sm">
                Düzenle
              </Button>
            }
          />
          <DeleteQuestionDialog questionId={question.id} questionText={question.text}>
            <Button variant="destructive" size="sm">
              Sil
            </Button>
          </DeleteQuestionDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
