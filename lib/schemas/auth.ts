import { z } from "zod";

export const usernameField = z
  .string()
  .min(3, "Kullanıcı adı en az 3 karakter olmalı")
  .max(100, "Kullanıcı adı en fazla 100 karakter olabilir");

export const passwordField = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(200, "Şifre en fazla 200 karakter olabilir");

// Login formu mevcut bir kullanıcıyı kabul ediyor; create-time min(3)
// kuralı geriye uyumluluğu kırabileceği için yalnız "boş değil" kontrolü.
export const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunludur").max(100),
  password: z.string().min(1, "Şifre zorunludur").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
