"use client";

import { safeHexColor } from "@/lib/colors";
import { FONT_WHITELIST, type FontKey } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface QuizThemePreviewProps {
  title: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontKey: FontKey;
  backgroundUrl?: string | null;
}

// DESIGN.md §08 idle stage'in küçük versiyonu. Admin form'da renkler + font +
// arka plan görseli değiştikçe canlı önizleme. CSS variable'lar inline style
// ile basılır (tema runtime'da değişebilir gibi).
export function QuizThemePreview({
  title,
  primaryColor,
  accentColor,
  textColor,
  fontKey,
  backgroundUrl,
}: QuizThemePreviewProps) {
  const primary = safeHexColor(primaryColor, "#1A1815");
  const accent = safeHexColor(accentColor, "#C4A572");
  const text = safeHexColor(textColor, "#F4EFE6");
  const fontClass = FONT_WHITELIST[fontKey]?.className ?? "";
  const displayTitle = title.trim() || "Quiz Başlığı";

  return (
    <div
      className={cn(
        "relative isolate aspect-video w-full overflow-hidden border border-input",
        fontClass,
      )}
      style={{ backgroundColor: primary, color: text }}
    >
      {backgroundUrl ? (
        <>
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: `linear-gradient(180deg, color-mix(in oklab, ${primary} 70%, black) 0%, color-mix(in oklab, ${primary} 40%, black) 100%)`,
            }}
            aria-hidden
          />
        </>
      ) : null}

      <span
        className="absolute top-4 left-4 inline-block size-2"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <span
        className="absolute top-4 right-4 text-[0.6rem] tracking-[0.18em] uppercase"
        style={{ color: text, opacity: 0.7 }}
      >
        Artium · Sahne A
      </span>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <h3
          className="text-2xl leading-tight font-semibold sm:text-3xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          {displayTitle}
        </h3>
        <p className="text-[0.7rem] tracking-[0.18em] uppercase" style={{ color: accent }}>
          Artium Sahne ve Sanat Merkezi
        </p>
      </div>

      <span
        className="absolute right-4 bottom-4 inline-block h-0.5 w-12"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
    </div>
  );
}
