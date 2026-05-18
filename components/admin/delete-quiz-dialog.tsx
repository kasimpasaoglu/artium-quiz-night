"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteQuiz } from "@/server/actions/quiz";

interface DeleteQuizDialogProps {
  quizId: string;
  quizTitle: string;
  children: React.ReactNode;
}

// Shadcn AlertDialog mevcut değil; Dialog + destructive button ile silme onayı.
// Onay sonrası `deleteQuiz` server action'ı redirect ile listeye döner.
export function DeleteQuizDialog({ quizId, quizTitle, children }: DeleteQuizDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteQuiz(quizId);
        toast.success("Quiz silindi");
        setOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Quiz silinemedi";
        toast.error(message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quiz silinsin mi?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{quizTitle}</span> kalıcı olarak silinecek
            ve bu quize bağlı tüm sorular da kaybolacak. Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending ? "Siliniyor..." : "Evet, sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
