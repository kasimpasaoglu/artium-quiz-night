"use client";

import { useLiveSession } from "@/hooks/use-live-session";
import type { ThemeSnapshot } from "@/lib/schemas/live";
import { EmptyState } from "./EmptyState";
import { QuestionModal } from "./QuestionModal";
import { ThemeApplier } from "./ThemeApplier";

interface PresentationStageProps {
  initialTheme: ThemeSnapshot;
  quizTitle: string;
}

export function PresentationStage({ initialTheme, quizTitle }: PresentationStageProps) {
  const { currentQuestion, theme, isTimeUp } = useLiveSession(initialTheme);
  const activeTheme = theme ?? initialTheme;

  return (
    <ThemeApplier theme={activeTheme}>
      <EmptyState theme={activeTheme} quizTitle={quizTitle} />
      {currentQuestion && <QuestionModal question={currentQuestion} isTimeUp={isTimeUp} />}
    </ThemeApplier>
  );
}
