# `parseMssqlUrl(url)`

`db/parse-mssql-url.ts` — `DATABASE_URL` connection string'lerini `@prisma/adapter-mssql` constructor config'ine indirgeyen pure helper. Aynı modül JDBC URL re-serializer'ı (`formatAsJdbcUrl`) ihraç eder.

## Niçin

Prisma 7 SQL provider runtime'da driver adapter zorunlu. Adapter field-by-field config bekler; Prisma CLI ise JDBC stili URL bekler. Kullanıcı `.env.local`'i hem JDBC hem ADO.NET formatında girebileceği için tek source of truth (`DATABASE_URL`) bu helper ile her iki kullanım yerine de uyumlu hale gelir:

- **Runtime (`db/prisma.ts`):** `parseMssqlUrl(env.DATABASE_URL)` → `PrismaMssql(config)`.
- **CLI (`prisma.config.ts`):** `formatAsJdbcUrl(parseMssqlUrl(process.env.DATABASE_URL))` → `datasource.url`.

## API

### `parseMssqlUrl(url: string): MssqlAdapterConfig`

| Parametre | Tip | Açıklama |
|---|---|---|
| `url` | `string` | `sqlserver://...` (JDBC) **veya** `Server=...;Database=...;User Id=...;Password=...` (ADO.NET). |

**Dönüş:** `MssqlAdapterConfig`

```ts
type MssqlAdapterConfig = {
  server: string;                              // örn. "db52714.public.databaseasp.net"
  port: number;                                // varsayılan 1433
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;                          // default true
    trustServerCertificate: boolean;           // default false
  };
};
```

**Atılan hatalar (hepsi `Error`):**

- Boş değer / desteklenmeyen prefix.
- `server`, `database`, `user`, `password` alanlarından biri eksik.
- Geçersiz port (sayı değil veya ≤ 0).

Hata mesajları Türkçe ve hangi alanın eksik olduğunu belirtir.

### `formatAsJdbcUrl(config: MssqlAdapterConfig): string`

Parse çıktısını `sqlserver://HOST:PORT;database=...;user=...;password=...;encrypt=...;trustServerCertificate=...` formatına serileştirir. Değerleri **ham** kullanır; URL-encoding yapmaz çünkü Prisma JDBC URL'inde parolayı literal alır. Parolada `;` veya `=` varsa runtime parser zaten reject eder (geri çözülemez).

## Desteklenen Formatlar

### JDBC (Prisma standardı)

```
sqlserver://db52714.public.databaseasp.net:1433;database=db52714;user=db52714;password=PASS;encrypt=true;trustServerCertificate=true
```

### ADO.NET (MSSQL araçlarının kopyala-yapıştır çıktısı)

```
Server=db52714.public.databaseasp.net;Database=db52714;User Id=db52714;Password=PASS;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True;
```

- `Server` virgüllü port (`Server=HOST,PORT`) varsa kabul edilir; yoksa `1433` default.
- `Data Source` (Server eşdeğeri), `Initial Catalog` (Database eşdeğeri), `Uid` (User Id eşdeğeri), `Pwd` (Password eşdeğeri) alias'ları okunur.
- Bilinmeyen ek alanlar (örn. `MultipleActiveResultSets`) yok sayılır.

## `.env.local`'de Önemli Quote Notu

dotenv (v17+) `#` karakterini quote dışında satır içi yorum başlangıcı sayar. Parolada `#` varsa **mutlaka çift tırnak içine al**:

```
DATABASE_URL="Server=HOST;Database=DB;User Id=USER;Password=Pa$$#word;Encrypt=True;TrustServerCertificate=True;"
```

Aksi durumda parola truncate olur, `Encrypt` ve `TrustServerCertificate` alanları kaybolur, Prisma cert/auth hatası verir.

## Kullanım Örnekleri

### Runtime singleton

```ts
// db/prisma.ts
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { env } from "@/lib/env";
import { parseMssqlUrl } from "./parse-mssql-url";

const adapter = new PrismaMssql(parseMssqlUrl(env.DATABASE_URL));
export const prisma = new PrismaClient({ adapter });
```

### Prisma CLI (config)

```ts
// prisma.config.ts
import { defineConfig } from "prisma/config";
import { loadCliEnv, requireDatabaseUrl } from "./db/load-cli-env";
import { formatAsJdbcUrl, parseMssqlUrl } from "./db/parse-mssql-url";

loadCliEnv();
const jdbcUrl = formatAsJdbcUrl(parseMssqlUrl(requireDatabaseUrl()));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "node_modules/.bin/tsx prisma/seed.ts" },
  datasource: { url: jdbcUrl },
});
```

`loadCliEnv` / `requireDatabaseUrl` için bkz. `documents/utils/load-cli-env.md`.

## Bağımlılıklar

Yok — pure TypeScript, hiçbir runtime paket import etmez. Test edilebilir ve hızlıdır.
