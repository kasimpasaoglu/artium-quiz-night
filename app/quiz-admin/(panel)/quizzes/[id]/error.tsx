"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/admin/error-state";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

interface QuizDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function QuizDetailError({ error, reset }: QuizDetailErrorProps) {
  useEffect(() => {
    console.error("[quiz-detail] hata:", error);
  }, [error]);

  return (
    <ErrorState
      title="Quiz yüklenemedi"
      error={error}
      reset={reset}
      fallbackMessage="Quiz detayı alınamadı. Tekrar denemek için aşağıdaki butonu kullanın."
      extraActions={
        <Button asChild variant="ghost">
          <Link href={ROUTES.adminHome}>Yönetim Paneline Dön</Link>
        </Button>
      }
    />
  );
}
