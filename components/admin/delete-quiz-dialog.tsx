"use client";

import { useState } from "react";
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
import { useServerAction } from "@/hooks/use-server-action";
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
  const { run: handleConfirm, pending } = useServerAction(deleteQuiz, {
    successMessage: "Quiz silindi",
    errorFallback: "Quiz silinemedi",
    onSuccess: () => setOpen(false),
  });

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
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => handleConfirm(quizId)}
          >
            {pending ? "Siliniyor..." : "Evet, sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
