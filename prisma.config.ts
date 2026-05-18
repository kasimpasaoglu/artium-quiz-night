import { defineConfig } from "prisma/config";
import { loadCliEnv, requireDatabaseUrl } from "./db/load-cli-env";
import { formatAsJdbcUrl, parseMssqlUrl } from "./db/parse-mssql-url";

loadCliEnv();

// Prisma CLI yalnız JDBC formatını (`sqlserver://...`) kabul eder. Kullanıcı
// `.env.local`'i hem JDBC hem ADO.NET formatında verebileceği için parse-then-
// serialize ile her iki giriş ortak çıkışa indirgenir.
const jdbcUrl = formatAsJdbcUrl(parseMssqlUrl(requireDatabaseUrl()));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node_modules/.bin/tsx prisma/seed.ts",
  },
  datasource: {
    url: jdbcUrl,
  },
});
