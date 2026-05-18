export default function PublicHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-quiz-primary p-[var(--space-stage)] text-center text-quiz-text">
      <h1 className="font-quiz text-display font-bold leading-[0.95] tracking-[-0.03em]">
        Artium Quiz Night
      </h1>
      <p className="mt-[var(--space-breath)] font-quiz text-body opacity-80">
        Sahne hazır — sunum bekleniyor
      </p>
      <p className="mt-[var(--space-breath)] font-quiz text-meta uppercase opacity-60 tracking-[0.08em]">
        ç ğ ı ö ş ü · Ç Ğ İ Ö Ş Ü
      </p>
    </main>
  );
}
