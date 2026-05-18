"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface CountdownDisplayProps {
  serverStartAt: string;
  durationSec: number;
}

const FINAL_STRETCH_SEC = 5;

export function CountdownDisplay({ serverStartAt, durationSec }: CountdownDisplayProps) {
  const { remaining, progress } = useCountdown(serverStartAt, durationSec);
  const seconds = Math.ceil(remaining);
  const inFinalStretch = remaining > 0 && remaining <= FINAL_STRETCH_SEC;

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-breath)]">
      <span
        className={cn(
          "font-quiz tabular-nums font-bold leading-none tracking-[-0.02em] transition-colors duration-200",
          inFinalStretch ? "text-quiz-accent" : "text-quiz-text",
        )}
        style={{
          fontSize: "var(--text-display)",
          transform: inFinalStretch ? "scale(1.08)" : undefined,
          transition: "transform 200ms var(--motion-ink), color 200ms ease",
        }}
        role="timer"
        aria-live="off"
      >
        {String(seconds).padStart(2, "0")}
      </span>
      <div
        className="h-[var(--stroke-rule)] w-full max-w-3xl overflow-hidden bg-quiz-text/15"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full origin-left bg-quiz-accent"
          style={{
            transform: `scaleX(${progress})`,
            transition: "transform 200ms linear",
          }}
        />
      </div>
    </div>
  );
}
