"use client";

import { AlertTriangleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
  fallbackMessage?: string;
  extraActions?: ReactNode;
}

export function ErrorState({
  title,
  error,
  reset,
  fallbackMessage = "İşlem tamamlanamadı. Tekrar denemek için aşağıdaki butonu kullanın.",
  extraActions,
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangleIcon className="size-5" aria-hidden />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{error.message || fallbackMessage}</p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">İz: {error.digest}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          Tekrar Dene
        </Button>
        {extraActions}
      </div>
    </div>
  );
}
