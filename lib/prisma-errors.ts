// Prisma error code helper'ları — server actions arası paylaşımlı.
// Prisma 7'de `PrismaClientKnownRequestError` instance'larında `.code` alanı
// bulunur (örn. `P2002` unique violation, `P2025` record not found).
// `instanceof` kontrolüne girmeden duck-typed kontrol Prisma 7 + driver adapter
// kombinasyonunda da güvenli.

const hasErrorCode = (error: unknown, code: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code: unknown }).code === code;

export const isUniqueViolation = (error: unknown): boolean => hasErrorCode(error, "P2002");

export const isRecordNotFound = (error: unknown): boolean => hasErrorCode(error, "P2025");
