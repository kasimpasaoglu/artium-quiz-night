import { z } from "zod";

export const optionalImageUrlField = z
  .string()
  .url("Geçerli bir URL gerekli")
  .max(1000)
  .optional()
  .or(z.literal(""));
