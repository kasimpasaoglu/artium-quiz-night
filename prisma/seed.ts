import { loadCliEnv, requireDatabaseUrl } from "../db/load-cli-env";
loadCliEnv();

import { PrismaMssql } from "@prisma/adapter-mssql";
import bcrypt from "bcryptjs";

import { parseMssqlUrl } from "../db/parse-mssql-url";
import { PrismaClient } from "../lib/generated/prisma/client";

// Seed `db/prisma.ts` singleton'ı kullanmaz: o modül `server-only`
// işaretli, CLI bağlamında yüklenemez. Burada disposable bir adapter
// + client oluşturulur, bitince `$disconnect` ile kapatılır.

const ADMIN_USERNAME = "admin";
const ADMIN_DEFAULT_PASSWORD = "admin";

async function main() {
  const adapter = new PrismaMssql(parseMssqlUrl(requireDatabaseUrl()));
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { username: ADMIN_USERNAME },
    });
    if (existing) {
      console.log(`'${ADMIN_USERNAME}' kullanıcısı zaten mevcut — seed atlandı.`);
      return;
    }
    const passwordHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);
    await prisma.adminUser.create({
      data: { username: ADMIN_USERNAME, passwordHash },
    });
    console.log(
      `İlk admin oluşturuldu: kullanıcı adı '${ADMIN_USERNAME}', parola '${ADMIN_DEFAULT_PASSWORD}'.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed başarısız oldu:", error);
  process.exit(1);
});
