import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL tanımlı olmalı."),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET en az 32 karakter olmalı (JWT imzalama için)."),
  // Pusher değişkenleri Faz 07'de (realtime) zorunlu olacak; o zamana kadar
  // optional ki Faz 04 build'i .env.local'a placeholder yazmadan çalışsın.
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
  // Vercel Blob client-direct upload Faz 05'te zorunlu (quiz arka plan görseli).
  // Token `vercel env pull .env.local` ile alınır.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Ortam değişkenleri doğrulaması başarısız:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
