import "server-only";
import { PrismaMssql } from "@prisma/adapter-mssql";
import { env } from "@/lib/env";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { parseMssqlUrl } from "./parse-mssql-url";

// Prisma 7 SQL provider'ları için driver adapter zorunludur. Adapter
// `parseMssqlUrl` çıktısıyla başlatılır; runtime aynı `DATABASE_URL`'i
// kullanır, böylece migration ve uygulama tek bağlantı sözleşmesini paylaşır.
//
// Dev'de Next.js HMR her re-evaluate'de yeni `PrismaClient` üretmesin diye
// `globalThis` üzerinde singleton tutulur (bağlantı havuzu sızıntısını önler).

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMssql(parseMssqlUrl(env.DATABASE_URL));
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
