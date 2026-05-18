"use client";

import { QUIZ_PRESETS, type QuizPreset } from "@/lib/quiz-presets";

interface PresetChipsProps {
  onSelect: (preset: QuizPreset) => void;
  disabled?: boolean;
}

// DESIGN.md §11 — 4 önerilen tema kombinasyonu. Tek tık ile primaryColor,
// accentColor, textColor ve fontKey alanlarını form'a basar. Admin sonra
// değer değiştirebilir; chip yalnızca başlangıç noktası verir.
export function PresetChips({ onSelect, disabled }: PresetChipsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {QUIZ_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelect(preset)}
          disabled={disabled}
          className="group flex items-center gap-3 rounded-md border border-input bg-background p-2 text-left transition-colors hover:border-ring hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className="flex h-9 w-12 shrink-0 overflow-hidden rounded-sm border border-input"
            aria-hidden
          >
            <span className="flex-1" style={{ backgroundColor: preset.primaryColor }} />
            <span className="flex-1" style={{ backgroundColor: preset.accentColor }} />
            <span className="flex-1" style={{ backgroundColor: preset.textColor }} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{preset.label}</span>
            <span className="truncate text-xs text-muted-foreground">{preset.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
