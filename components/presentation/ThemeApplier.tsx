"use client";

import { useEffect } from "react";
import { cssVarForFont } from "@/lib/fonts";
import type { ThemeSnapshot } from "@/lib/schemas/live";

interface ThemeApplierProps {
  theme: ThemeSnapshot | null;
  children: React.ReactNode;
}

export function ThemeApplier({ theme, children }: ThemeApplierProps) {
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--quiz-primary", theme.primaryColor);
    root.style.setProperty("--quiz-accent", theme.accentColor);
    root.style.setProperty("--quiz-text", theme.textColor);
    root.style.setProperty("--quiz-font", `var(${cssVarForFont(theme.fontKey)})`);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const url = theme?.backgroundUrl ?? null;
    if (!url) {
      root.style.removeProperty("--quiz-background");
      return;
    }
    // Görsel yüklenene kadar eski background ekranda kalır → flash önlenir.
    let cancelled = false;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      if (cancelled) return;
      root.style.setProperty("--quiz-background", `url("${url}")`);
    };
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };
  }, [theme?.backgroundUrl]);

  return <>{children}</>;
}
