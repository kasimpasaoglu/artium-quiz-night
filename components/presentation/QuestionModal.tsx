"use client";

import type { QuestionShowPayload } from "@/lib/schemas/live";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useState } from "react";
import { CountdownDisplay } from "./CountdownDisplay";
import { TimeUpOverlay } from "./TimeUpOverlay";

interface QuestionModalProps {
  question: QuestionShowPayload;
  isTimeUp: boolean;
}

// shadcn DialogContent default styling'i (max-w-sm, rounded-xl, center-anchor)
// full-stage takeover ile çakıştığı için Radix primitive'i doğrudan kullanılıyor.
export function QuestionModal({ question, isTimeUp }: QuestionModalProps) {
  // Server `question:end` event'i kaçırılsa bile overlay client tarafında tetiklenir.
  const clientFinished = useClientTimeout(question.serverStartAt, question.durationSec);
  const showTimeUp = isTimeUp || clientFinished;

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xl data-open:animate-in data-open:fade-in-0"
          style={{ animationDuration: "var(--duration-stage)" }}
        />
        <DialogPrimitive.Content
          aria-modal="true"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className="fixed inset-0 z-50 flex flex-col text-quiz-text outline-none data-open:animate-in data-open:fade-in-0"
          style={{
            backgroundColor: "color-mix(in oklab, var(--quiz-primary) 75%, black)",
            animationDuration: "var(--duration-stage)",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Aktif soru</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {question.text}
          </DialogPrimitive.Description>

          <header className="flex items-center justify-between px-(--space-stage) pt-(--space-stage)">
            <DifficultyPips value={question.difficulty} />
            <span
              className="font-quiz uppercase opacity-60"
              style={{ fontSize: "var(--text-meta)", letterSpacing: "0.22em" }}
            >
              Süre · {question.durationSec} sn
            </span>
          </header>

          <span
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-(--stroke-heavy) bg-quiz-accent/30 md:block"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-(--stroke-heavy) bg-quiz-accent/30 md:block"
            aria-hidden
          />

          <div
            key={question.questionId}
            className="relative flex flex-1 flex-col items-center justify-center gap-(--space-stage) px-(--space-stage) py-(--space-breath)"
          >
            {question.imageUrl && (
              <div
                className="relative w-full max-w-4xl overflow-hidden"
                style={{
                  aspectRatio: "16 / 9",
                  maxHeight: "40vh",
                }}
              >
                <Image
                  src={question.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 90vw, 60vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}
            <h2
              className="font-quiz font-bold leading-[1.02] tracking-[-0.02em] text-center"
              style={{
                fontSize: "var(--text-title)",
                maxWidth: "min(78ch, 90vw)",
                textWrap: "balance",
                animation: "curtain-reveal var(--duration-stage) var(--motion-curtain) forwards",
              }}
            >
              {question.text}
            </h2>
          </div>

          <footer
            className={cn(
              "px-(--space-stage) pb-(--space-stage) transition-opacity duration-300",
              showTimeUp ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          >
            <CountdownDisplay
              serverStartAt={question.serverStartAt}
              durationSec={question.durationSec}
            />
          </footer>

          {showTimeUp && <TimeUpOverlay />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface DifficultyPipsProps {
  value: number;
}

function DifficultyPips({ value }: DifficultyPipsProps) {
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Zorluk: ${value}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn("size-2", i < value ? "bg-quiz-accent" : "bg-quiz-text/25")}
          aria-hidden
        />
      ))}
    </span>
  );
}

// Modal seviyesinde tick yapmıyor; tek `setTimeout` ile süre bittiğinde
// `finished` true olur. Sayaç tick'i `CountdownDisplay` içindeki
// `useCountdown` hook'unun sorumluluğunda — tek interval, tek truth.
function useClientTimeout(serverStartAt: string, durationSec: number): boolean {
  const isFinishedNow = () => new Date(serverStartAt).getTime() + durationSec * 1000 <= Date.now();

  const [finished, setFinished] = useState(isFinishedNow);
  // Yeni soruda (deps değişti) `finished`'i render sırasında sıfırla — Modal
  // remount edilmez, kabuk fade-in animasyonu tekrar tetiklenmez. React docs:
  // "Storing information from previous renders" pattern'i.
  const [prevKey, setPrevKey] = useState(serverStartAt);
  if (prevKey !== serverStartAt) {
    setPrevKey(serverStartAt);
    setFinished(isFinishedNow());
  }

  useEffect(() => {
    if (finished) return;
    const remainingMs = new Date(serverStartAt).getTime() + durationSec * 1000 - Date.now();
    const id = setTimeout(() => setFinished(true), Math.max(0, remainingMs));
    return () => clearTimeout(id);
  }, [finished, serverStartAt, durationSec]);

  return finished;
}
