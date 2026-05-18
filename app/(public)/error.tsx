"use client";

import { useEffect } from "react";

interface PublicErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: PublicErrorProps) {
  useEffect(() => {
    console.error("[public] sahne ekranı yüklenemedi:", error);
  }, [error]);

  return (
    <section className="flex min-h-svh cursor-auto items-center justify-center px-[var(--space-stage)] text-center">
      <div className="flex flex-col items-center gap-[var(--space-breath)] text-quiz-text">
        <p
          className="font-quiz uppercase opacity-70"
          style={{ fontSize: "var(--text-meta)", letterSpacing: "0.22em" }}
        >
          Hata
        </p>
        <h2
          className="font-quiz font-bold leading-[1.02] tracking-[-0.02em]"
          style={{ fontSize: "var(--text-title)", textWrap: "balance" }}
        >
          Bir şeyler ters gitti
        </h2>
        <p className="max-w-prose text-quiz-text/80" style={{ fontSize: "var(--text-body)" }}>
          Sahne ekranı yüklenemedi. Lütfen sayfayı yenileyin.
        </p>
        <button
          type="button"
          onClick={reset}
          className="border-rule min-h-11 min-w-11 cursor-pointer border-quiz-accent bg-transparent px-[var(--space-breath)] py-3 font-quiz uppercase text-quiz-text transition-colors hover:bg-quiz-accent hover:text-quiz-primary"
          style={{ fontSize: "var(--text-meta)", letterSpacing: "0.22em" }}
        >
          Tekrar Dene
        </button>
      </div>
    </section>
  );
}
