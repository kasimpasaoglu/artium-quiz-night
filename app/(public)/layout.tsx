import type { ReactNode } from "react";

// Projeksiyonda mouse görünmesin diye cursor gizli (DESIGN.md §09).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-svh cursor-none bg-quiz-primary text-quiz-text">{children}</div>;
}
