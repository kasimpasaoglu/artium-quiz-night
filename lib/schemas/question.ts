import { z } from "zod";
import { optionalImageUrlField } from "@/lib/schemas/shared";

export const questionTextField = z
  .string()
  .trim()
  .min(1, "Soru metni zorunludur")
  .max(1000, "Soru metni en fazla 1000 karakter olabilir");

export const imageUrlField = optionalImageUrlField;

export const durationSecField = z
  .number({ message: "Süre sayısal olmalı" })
  .int("Süre tam sayı olmalı")
  .min(5, "Süre en az 5 saniye olmalı")
  .max(600, "Süre en fazla 600 saniye olmalı");

export const difficultyField = z
  .number({ message: "Zorluk sayısal olmalı" })
  .int("Zorluk tam sayı olmalı")
  .min(1, "Zorluk 1-5 arası olmalı")
  .max(5, "Zorluk 1-5 arası olmalı");

export const questionFormSchema = z.object({
  text: questionTextField,
  imageUrl: imageUrlField,
  durationSec: durationSecField,
  difficulty: difficultyField,
});

export type QuestionFormInput = z.input<typeof questionFormSchema>;
export type QuestionFormData = z.output<typeof questionFormSchema>;

export interface QuestionRow {
  id: string;
  text: string;
  imageUrl: string | null;
  durationSec: number;
  difficulty: number;
  orderIndex: number;
}

export type QuestionFormInitialData = Omit<QuestionRow, "orderIndex">;
