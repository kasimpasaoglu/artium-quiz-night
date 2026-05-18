# `loadCliEnv()` / `requireDatabaseUrl()`

`db/load-cli-env.ts` — Prisma CLI ve seed gibi CLI bağlamı için minimal env yükleme yardımcıları.

## Niçin

`lib/env.ts` Next.js runtime'ı için `server-only` işaretli — CLI bağlamında import edilemez. Prisma CLI (`prisma.config.ts`) ve seed (`prisma/seed.ts`) iki ayrı process. Her ikisinin de aynı dotenv yükleme sırasını (`.env.local` > `.env`) ve `DATABASE_URL` kontrolünü tekrar etmesi DRY ihlali yaratıyordu — bu helper o iki adımı tek yere taşır.

## API

### `loadCliEnv(): void`

Yan etki olarak `.env.local` (varsa) ve `.env` (varsa) dosyalarını process.env'e yükler. `.env.local` öncelikli; sonra gelen `.env` çağrısı default davranışta override etmediği için yalnız eksik anahtarları doldurur.

`quiet: true` opsiyonu dotenv v17 reklam satırlarını stdout'tan susturur — `prisma migrate diff --script` çıktısının başına karışmasını önler.

```ts
import { loadCliEnv } from "./db/load-cli-env";

loadCliEnv();
// process.env artık DATABASE_URL, SESSION_SECRET, vb. değerleri içerir.
```

### `requireDatabaseUrl(): string`

`process.env.DATABASE_URL` set değilse Türkçe açıklayıcı `Error` fırlatır; setse string olarak döner.

```ts
import { loadCliEnv, requireDatabaseUrl } from "./db/load-cli-env";

loadCliEnv();
const url = requireDatabaseUrl();
// url tip olarak string, undefined değil.
```

## Kullanım

İki call site:

### `prisma.config.ts`

```ts
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

### `prisma/seed.ts`

```ts
import { loadCliEnv, requireDatabaseUrl } from "../db/load-cli-env";
loadCliEnv();

// adapter init için requireDatabaseUrl() çağırılır.
const adapter = new PrismaMssql(parseMssqlUrl(requireDatabaseUrl()));
```

## Neden `lib/env.ts` yerine ayrı?

| | `lib/env.ts` | `db/load-cli-env.ts` |
|---|---|---|
| Bağlam | Next.js runtime (server) | CLI process (Prisma + tsx) |
| `server-only` import | evet | hayır |
| Validation | zod schema (8 env) | minimal (yalnız `DATABASE_URL`) |
| Yükleme sırası | Next.js otomatik (`.env.local` > `.env` > `.env.production`) | manuel `dotenv.config` |

CLI bağlamında zod schema'sının tamamını run etmek gereksiz overhead (Pusher, Blob, vb. CLI'da kullanılmıyor). Bu yüzden iki ayrı yardımcı.

## Bağımlılıklar

`dotenv` (zaten `package.json` devDependencies'te). Başka runtime bağımlılık yok.
