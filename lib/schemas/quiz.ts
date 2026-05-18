import { z } from "zod";
import { HEX_COLOR_RE } from "@/lib/colors";
import { FONT_WHITELIST } from "@/lib/fonts";
import { optionalImageUrlField } from "@/lib/schemas/shared";

export const titleField = z
  .string()
  .trim()
  .min(1, "Başlık zorunludur")
  .max(200, "Başlık en fazla 200 karakter olabilir");

export const descriptionField = z
  .string()
  .max(1000, "Açıklama en fazla 1000 karakter olabilir")
  .optional()
  .or(z.literal(""));

export const hexColorField = z.string().regex(HEX_COLOR_RE, "Hex renk kodu olmalı (#rrggbb)");

export const backgroundUrlField = optionalImageUrlField;

export const fontKeyField = z
  .string()
  .refine((key) => key in FONT_WHITELIST, "Geçersiz font seçimi");

export const quizFormSchema = z.object({
  title: titleField,
  description: descriptionField,
  backgroundUrl: backgroundUrlField,
  primaryColor: hexColorField,
  accentColor: hexColorField,
  textColor: hexColorField,
  fontKey: fontKeyField,
});

export type QuizFormInput = z.input<typeof quizFormSchema>;
export type QuizFormData = z.output<typeof quizFormSchema>;
