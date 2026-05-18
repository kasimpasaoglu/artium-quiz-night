export default function QuizDetailLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span
          className="size-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary"
          aria-hidden
        />
        <span>Quiz yükleniyor...</span>
      </div>
    </div>
  );
}
