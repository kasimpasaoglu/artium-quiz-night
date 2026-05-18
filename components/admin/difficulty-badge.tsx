import { Badge } from "@/components/ui/badge";

const LEVELS = [
  { label: "Çok Kolay", variant: "secondary" },
  { label: "Kolay", variant: "secondary" },
  { label: "Orta", variant: "default" },
  { label: "Zor", variant: "default" },
  { label: "Çok Zor", variant: "destructive" },
] as const;

interface DifficultyBadgeProps {
  value: number;
  className?: string;
}

export function DifficultyBadge({ value, className }: DifficultyBadgeProps) {
  const idx = Math.min(Math.max(Math.round(value) - 1, 0), LEVELS.length - 1);
  const level = LEVELS[idx];
  return (
    <Badge variant={level.variant} className={className}>
      <span aria-hidden="true" className="font-mono">
        {idx + 1}
      </span>
      <span className="sr-only">Zorluk seviyesi {idx + 1}: </span>
      {level.label}
    </Badge>
  );
}
