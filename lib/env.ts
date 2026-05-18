import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL tanımlı olmalı."),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET en az 32 karakter olmalı (JWT imzalama için)."),
  PUSHER_APP_ID: z.string().min(1, "PUSHER_APP_ID tanımlı olmalı."),
  PUSHER_KEY: z.string().min(1, "PUSHER_KEY tanımlı olmalı."),
  PUSHER_SECRET: z.string().min(1, "PUSHER_SECRET tanımlı olmalı."),
  PUSHER_CLUSTER: z.string().min(1, "PUSHER_CLUSTER tanımlı olmalı."),
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1, "NEXT_PUBLIC_PUSHER_KEY tanımlı olmalı."),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().min(1, "NEXT_PUBLIC_PUSHER_CLUSTER tanımlı olmalı."),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Ortam değişkenleri doğrulaması başarısız:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
