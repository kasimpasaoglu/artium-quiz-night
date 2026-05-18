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
import { truncate } from "@/lib/strings";
import { deleteQuestion } from "@/server/actions/question";

interface DeleteQuestionDialogProps {
  questionId: string;
  questionText: string;
  children: React.ReactNode;
}

const PREVIEW_LIMIT = 120;

export function DeleteQuestionDialog({
  questionId,
  questionText,
  children,
}: DeleteQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const { run: handleConfirm, pending } = useServerAction(deleteQuestion, {
    successMessage: "Soru silindi",
    errorFallback: "Soru silinemedi",
    onSuccess: () => setOpen(false),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Soru silinsin mi?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {truncate(questionText, PREVIEW_LIMIT)}
            </span>{" "}
            kalıcı olarak silinecek. Bu işlem geri alınamaz.
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
            onClick={() => handleConfirm(questionId)}
          >
            {pending ? "Siliniyor..." : "Evet, sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
