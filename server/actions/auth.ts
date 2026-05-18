"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { ROUTES } from "@/lib/routes";
import { passwordField, usernameField } from "@/lib/schemas/auth";
import { requireAdmin } from "@/server/guards";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const changeCredentialsSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin"),
    newUsername: z.preprocess(emptyToUndefined, usernameField.optional()),
    newPassword: z.preprocess(emptyToUndefined, passwordField.optional()),
  })
  .refine((data) => Boolean(data.newUsername) || Boolean(data.newPassword), {
    message: "Yeni kullanıcı adı veya yeni şifre girilmeli",
    path: ["newPassword"],
  });

export type ChangeCredentialsInput = z.input<typeof changeCredentialsSchema>;

export async function changeCredentials(input: ChangeCredentialsInput) {
  const user = await requireAdmin();

  const parsed = changeCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz form");
  }

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    throw new Error("Mevcut şifre yanlış");
  }

  const data: { username?: string; passwordHash?: string } = {};
  if (parsed.data.newUsername && parsed.data.newUsername !== user.username) {
    data.username = parsed.data.newUsername;
  }
  if (parsed.data.newPassword) {
    data.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  if (Object.keys(data).length === 0) {
    return;
  }

  try {
    await prisma.adminUser.update({ where: { id: user.id }, data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Bu kullanıcı adı zaten kullanılıyor");
    }
    throw error;
  }

  revalidatePath(ROUTES.adminSettings);
}
