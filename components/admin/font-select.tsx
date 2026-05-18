"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_WHITELIST, type FontKey } from "@/lib/fonts";

interface FontSelectProps {
  value: FontKey;
  onChange: (next: FontKey) => void;
  disabled?: boolean;
}

// Font seçici — DESIGN.md §03 whitelist. Her option label kendi fontu ile
// render edilir (preview). Türkçe karakter güvenliği için `latin-ext`
// `lib/fonts.ts` üzerinden zaten garanti.
export function FontSelect({ value, onChange, disabled }: FontSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as FontKey)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Font seçin" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(FONT_WHITELIST).map(([key, font]) => (
          <SelectItem key={key} value={key}>
            <span className={`${font.className} text-base`}>{font.label} — Çağdaş Şişli</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
