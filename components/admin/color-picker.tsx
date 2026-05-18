"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { isHexColor } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (next: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

// İki yön bağlı renk seçici: native `<input type="color">` (görsel) + hex
// metin alanı (manuel giriş). Hex doğrulaması parent zod schema ile yapılır;
// burada yalnızca senkronizasyon.
export function ColorPicker({
  value,
  onChange,
  onBlur,
  disabled,
  className,
  ariaLabel,
}: ColorPickerProps) {
  const swatchId = useId();
  const safeValue = isHexColor(value) ? value : "#000000";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor={swatchId}
        className="relative inline-flex size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-input"
        style={{ backgroundColor: safeValue }}
        aria-label={ariaLabel ? `${ariaLabel} renk seçici` : "Renk seçici"}
      >
        <input
          id={swatchId}
          type="color"
          value={safeValue}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder="#rrggbb"
        spellCheck={false}
        autoComplete="off"
        inputMode="text"
        className="font-mono uppercase"
        aria-label={ariaLabel}
      />
    </div>
  );
}
