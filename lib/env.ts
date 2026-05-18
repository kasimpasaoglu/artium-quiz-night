import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL tanımlı olmalı."),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET en az 32 karakter olmalı (JWT imzalama için)."),
  // Pusher Channels — Faz 07'de realtime yayın altyapısı için zorunlu.
  // Server tarafı (`PUSHER_*`) ile client tarafı (`NEXT_PUBLIC_PUSHER_*`)
  // ayrı namespace'ler: build sırasında client bundle'a yalnız `NEXT_PUBLIC_*`
  // gömülür, secret asla sızmaz.
  PUSHER_APP_ID: z.string().min(1, "PUSHER_APP_ID tanımlı olmalı."),
  PUSHER_KEY: z.string().min(1, "PUSHER_KEY tanımlı olmalı."),
  PUSHER_SECRET: z.string().min(1, "PUSHER_SECRET tanımlı olmalı."),
  PUSHER_CLUSTER: z.string().min(1, "PUSHER_CLUSTER tanımlı olmalı (örn. eu)."),
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1, "NEXT_PUBLIC_PUSHER_KEY tanımlı olmalı."),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1, "NEXT_PUBLIC_PUSHER_CLUSTER tanımlı olmalı."),
  // Vercel Blob client-direct upload Faz 05'te zorunlu (quiz arka plan görseli).
  // Token `vercel env pull .env.local` ile alınır.
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .min(1, "BLOB_READ_WRITE_TOKEN tanımlı olmalı (Vercel Blob store)."),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Ortam değişkenleri doğrulaması başarısız:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
