import { QuizForm } from "@/components/admin/quiz-form";

export default function NewQuizPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-lg font-semibold">Yeni Quiz</h1>
        <p className="text-sm text-muted-foreground">
          Tema renklerini, fontu ve arka plan görselini belirleyin. Sorular sonraki adımda eklenir.
        </p>
      </header>
      <QuizForm mode="create" />
    </div>
  );
}
