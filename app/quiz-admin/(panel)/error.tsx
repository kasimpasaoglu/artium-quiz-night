"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/admin/error-state";

interface PanelErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PanelError({ error, reset }: PanelErrorProps) {
  useEffect(() => {
    console.error("[admin-panel] hata:", error);
  }, [error]);

  return <ErrorState title="Bir hata oluştu" error={error} reset={reset} />;
}
