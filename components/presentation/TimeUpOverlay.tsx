export function TimeUpOverlay() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 px-[var(--space-stage)] text-center backdrop-blur-md animate-in fade-in-0 zoom-in-95"
      style={{ animationDuration: "var(--duration-stage)" }}
      aria-live="assertive"
    >
      <p
        className="font-quiz font-bold uppercase tracking-[-0.02em] text-quiz-accent"
        style={{
          fontSize: "var(--text-display)",
          textShadow: "0 0 32px color-mix(in oklab, var(--quiz-primary) 80%, black)",
        }}
      >
        Süreniz Doldu
      </p>
    </div>
  );
}
