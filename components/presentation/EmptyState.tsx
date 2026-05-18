import type { ThemeSnapshot } from "@/lib/schemas/live";

interface EmptyStateProps {
  theme: ThemeSnapshot | null;
  quizTitle: string | null;
}

// DESIGN.md §08: idle ekran pasif bekleme değil sahne öncesi atmosfer
// ("Bekleniyor..." metni yasak). Tema yoksa globals.css :root default'ları
// (Klasik Sahne preset) geçerli kalır.
export function EmptyState({ theme, quizTitle }: EmptyStateProps) {
  const hasBackground = Boolean(theme?.backgroundUrl);

  return (
    <section
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-quiz-primary text-center text-quiz-text"
      style={
        hasBackground
          ? {
              backgroundImage: "var(--quiz-background)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {hasBackground && (
        <span className="pointer-events-none absolute inset-0 bg-quiz-primary/70" aria-hidden />
      )}

      <span
        className="pointer-events-none absolute -top-[20vmin] -left-[20vmin] size-[70vmin] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--quiz-accent) 70%, transparent) 0%, transparent 65%)",
          animation: "breathe var(--duration-breath) var(--motion-breathe) infinite",
        }}
        aria-hidden
      />

      <span
        className="pointer-events-none absolute inset-y-[var(--space-stage)] left-0 w-[var(--stroke-heavy)] bg-quiz-accent/30"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-y-[var(--space-stage)] right-0 w-[var(--stroke-heavy)] bg-quiz-accent/30"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-[var(--space-breath)] px-[var(--space-stage)]">
        <p
          className="font-quiz uppercase opacity-60"
          style={{
            fontSize: "var(--text-meta)",
            letterSpacing: "0.24em",
          }}
        >
          Artium Sahne ve Sanat Merkezi
        </p>
        <h1
          className="font-quiz font-bold leading-[0.95] tracking-[-0.03em]"
          style={{ fontSize: "var(--text-display)", textWrap: "balance" }}
        >
          {quizTitle ?? "Artium Quiz Night"}
        </h1>
        <p
          className="font-quiz uppercase opacity-70"
          style={{
            fontSize: "var(--text-meta)",
            letterSpacing: "0.18em",
          }}
        >
          ◆ Sahne hazır ◆
        </p>
      </div>
    </section>
  );
}
