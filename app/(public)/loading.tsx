export default function PublicLoading() {
  return (
    <section className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-[var(--space-breath)] text-quiz-text">
        <span
          className="size-12 animate-spin rounded-full border-rule border-quiz-text/20 border-t-quiz-accent"
          aria-hidden
        />
        <p
          className="font-quiz uppercase opacity-70"
          style={{ fontSize: "var(--text-meta)", letterSpacing: "0.22em" }}
        >
          Yükleniyor
        </p>
      </div>
    </section>
  );
}
