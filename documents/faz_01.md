# Faz 01 — İskelet & Konfigürasyon

**Durum:** ✅ DONE (2026-05-18)
**Önkoşul fazlar:** —

## Amaç

Temiz `create-next-app` template'ini production-ready bir uygulama iskeletine dönüştürmek: tüm runtime + dev paketlerini kurmak, klasör yapısını oturtmak, env validation'ı ayağa kaldırmak, Prisma'yı init etmek (henüz şema yok, sadece datasource), `proxy.ts` iskelet dosyasını yerleştirmek, eslint/prettier/husky dev hijyenini sabitlemek. Bu fazdan sonra her şey yerli yerinde olmalı; sonraki fazlar sadece dosya doldurmaya odaklanacak.

## Kapsam Dışı (Out of Scope)

- UI komponentleri (Faz 02).
- DB şema, migration, seed (Faz 03).
- Auth kodu, login formu (Faz 04).
- Page'lerin içeriği.
- shadcn/ui kurulumu (Faz 02).
- Pusher entegrasyonu kodu (Faz 07).
- Vercel Blob upload kodu (Faz 05).

## Yapılacaklar (Checklist)

- [x] Runtime paketleri kur: `prisma @prisma/client jose bcryptjs zod pusher pusher-js @vercel/blob pino pino-pretty date-fns react-hook-form @hookform/resolvers`
- [x] Dev paketleri kur: `@types/bcryptjs prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged tsx`
- [x] Klasör iskeleti aç (her birinde `.gitkeep` veya boş `index.ts`):
  - `app/(public)/`, `app/quiz-admin/`, `app/api/`
  - `lib/`, `db/`, `prisma/`, `components/ui/`, `components/admin/`, `components/presentation/`
  - `hooks/`, `server/actions/`, `types/`
  - `documents/hooks/`, `documents/utils/`
- [x] `lib/env.ts` — zod ile env validation, build-time'da `parse()` çağrısı:
  - `DATABASE_URL` (string, min 1)
  - `SESSION_SECRET` (string, min 32 char)
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (string)
  - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` (string)
  - `BLOB_READ_WRITE_TOKEN` (string, optional in dev)
  - `NODE_ENV` (enum: development|production|test)
  - Export typed `env` objesi.
- [x] `lib/logger.ts` — pino instance: prod'da JSON, dev'de `pino-pretty` transport.
- [x] `npx prisma init --datasource-provider sqlserver` (datasource block oluşur, şema henüz boş — Faz 03 dolduracak).
- [x] `proxy.ts` iskelet (kök dizinde, `middleware.ts` DEĞİL): export `proxy` ve `config.matcher` placeholder (`['/quiz-admin/:path*', '/api/admin/:path*']`), şu an pass-through (NextResponse.next()).
- [x] `.env.example` doldur — yukarıdaki tüm env key'leri + MSSQL connection string format yorumu:
  ```
  # MSSQL connection string (monsterasp.net format):
  # sqlserver://HOST:1433;database=DBNAME;user=USER;password=PASS;encrypt=true;trustServerCertificate=false
  DATABASE_URL=
  ```
- [x] `.prettierrc` — sade config (singleQuote: false, semi: true, trailingComma: "all", printWidth: 100).
- [x] `.prettierignore` — `.next/`, `node_modules/`, `prisma/migrations/`, `*.md` (md dosyaları el ile yazılıyor).
- [x] `eslint.config.mjs` — `eslint-config-prettier` ekle (Prettier ile çakışmaları kapat).
- [x] `package.json` `scripts` ekle: `"format": "prettier --write ."`, `"format:check": "prettier --check ."`, `"typecheck": "tsc --noEmit"`, `"prepare": "husky"`.
- [x] `npx husky init` → `.husky/pre-commit` içinde `npx lint-staged`.
- [x] `package.json`'a `lint-staged` config: `"*.{ts,tsx}": ["eslint --fix", "prettier --write"]`, `"*.{json,css,md}": ["prettier --write"]`.
- [x] `next.config.ts` — `images.remotePatterns` Vercel Blob için:
  ```ts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  }
  ```
- [x] `tsconfig.json` `paths` ekle (mevcut `@/*`'a ek olarak alias'lar opsiyonel, ama açık tutmak okunabilirliği arttırır):
  ```json
  "paths": {
    "@/*": ["./*"]
  }
  ```
  (Mevcut yapı yeterli, ek alias gerekmiyor — kararı dokümante et.)
- [x] `documents/folder-structure.md` yaz: her top-level klasörün ne için olduğunu açıkla.

## Dokunulacak Dosyalar

- `package.json` — bağımlılıklar + scripts + lint-staged config.
- `tsconfig.json` — paths review (mevcut yeter).
- `next.config.ts` — images.remotePatterns.
- `eslint.config.mjs` — prettier eklemesi.
- `.env.example` (YENİ).
- `.prettierrc` (YENİ).
- `.prettierignore` (YENİ).
- `.husky/pre-commit` (YENİ).
- `lib/env.ts` (YENİ).
- `lib/logger.ts` (YENİ).
- `proxy.ts` (YENİ, kök dizinde).
- `prisma/schema.prisma` (YENİ — sadece datasource + generator blokları, model yok).
- Klasör iskelet `.gitkeep`/`index.ts` dosyaları.

## Eklenecek Paketler

**Runtime:**
- `prisma@^6` + `@prisma/client@^6` — ORM
- `jose@^5` — Edge-uyumlu JWT
- `bcryptjs@^2` — şifre hash (Node.js, Edge'de kullanılmaz)
- `zod@^3` — validation + env schema
- `pusher@^5` (server) + `pusher-js@^8` (client) — realtime
- `@vercel/blob@^0.2x` — asset storage
- `pino@^9` + `pino-pretty@^11` (dev) — logger
- `date-fns@^3` — sayaç matematiği
- `react-hook-form@^7` + `@hookform/resolvers@^3` — form

**Dev:**
- `@types/bcryptjs@^2`
- `prettier@^3`
- `eslint-config-prettier@^9`
- `eslint-plugin-prettier@^5`
- `husky@^9`
- `lint-staged@^15`
- `tsx@^4` — Prisma seed çalıştırmak için (Faz 03'te kullanılacak)

> **Sürüm uyarısı:** Her paketi `npm i <paket>` (latest) ile ekle, yukarıdaki major versiyonlar bilgi amaçlı. Major sürüm farkı olursa breaking change kontrolü yap.

## Veri Modeli / Şema

Yok — sadece Prisma datasource bloğu:
```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}
```

## Doğrulama

**Otomatik:**
- `npm install` exit 0
- `npm run typecheck` (tsc --noEmit) ✓
- `npm run lint` ✓
- `npm run format:check` ✓
- `npx prisma validate` ✓ (datasource doğru)

**Manuel:**
- `npm run dev` → http://localhost:3000 hâlâ template gösterir (henüz hiç sayfa değişmedi).
- `cat .env.example` → tüm env key'ler listelenmiş.
- Klasör listesi `tree -L 2 -I node_modules`: tüm planlanmış klasörler mevcut.
- `git commit` denemesi → husky pre-commit hook çalıştı mı, lint-staged tetiklendi mi.

## Deliverables

- `documents/folder-structure.md` — her top-level klasörün amacı (`app/`, `lib/`, `db/`, `prisma/`, `components/`, `hooks/`, `server/`, `types/`, `documents/`) + dosya naming konvansiyonu.
- `.env.example` — her env key + yorum (MSSQL connection string format dahil).

## Riskler / Açık Sorular

- **MSSQL connection string formatı:** Kullanıcı monsterasp.net'ten alacak ve `.env.local`'a koyacak. `.env.example`'da format örneği olmalı; agent bunu doldururken Prisma SQL Server connection string formatına dikkat etmeli (`sqlserver://...` veya `Server=...;...` ikisi de geçerli, Prisma URL formatı tercih edilir).
- **Vercel Blob token:** Local dev'de `BLOB_READ_WRITE_TOKEN` opsiyonel ama Faz 05'te kullanılacak; kullanıcının Vercel projesi açıp token almasına ihtiyacı olacak. `.env.example`'da `# Vercel projesi açtıktan sonra Vercel CLI: vercel env pull` yorumu olsun.
- **Husky v9 init:** Modern Husky (v9+) eski `.husky/_/husky.sh` kullanmıyor; `npx husky init` ile direkt `.husky/pre-commit` oluşturuyor. Eski döküman görürse şaşırmasın.
- **Prisma v6 + MSSQL:** Prisma 6 SQL Server'ı destekliyor, ama bağlantı parametrelerinde encrypt/trustServerCertificate gibi şeyler farklı yorumlanabilir. İlk migration Faz 03'te.

---

## Sapma Logu

**Tarih:** 2026-05-18

### Paket sürüm sapmaları

Brief'in `^X` major sürüm tahminleri `npm install <paket>` (latest) ile aşıldı. Kurulan son major'lar ve brief'teki tahminler:

| Paket | Brief | Kurulan | Not |
|---|---|---|---|
| `prisma` / `@prisma/client` | ^6 | **^7.8.0** | Datasource API değişti — bkz. aşağı. |
| `zod` | ^3 | **^4.4.3** | v4 yeni API; `prettifyError` kullanıldı. |
| `jose` | ^5 | **^6.2.3** | Faz 04'te API farkı kontrolüne dikkat. |
| `bcryptjs` | ^2 | **^3.0.3** | Faz 04'te kullanılacak. |
| `pino` | ^9 | **^10.3.1** | API ileriye uyumlu. |
| `pino-pretty` | ^11 | **^13.1.3** | devDependency'e taşındı (aşağı). |
| `date-fns` | ^3 | **^4.2.1** | Faz 09'da sayaç matematiği. |
| `@hookform/resolvers` | ^3 | **^5.2.2** | Faz 04/05 formlarında doğrulanacak. |

Sonraki fazlar bu yeni API'lere göre yazılacak. Eski brief örnekleri varsa Faz 0X agent'ı yeni API'ye adapte edecek.

### Prisma 7 yapısal değişiklikleri — resmi v7 skill rehberine göre uyduruldu

Brief Prisma 5/6 paradigmasına göre yazılmıştı; **`prisma/skills@prisma-upgrade-v7`** resmi skill rehberi kullanılarak güncel yapıya geçildi. Final durum:

- **`prisma/schema.prisma`** Prisma 7 yeni nesil generator'ı kullanıyor:
  ```prisma
  generator client {
    provider     = "prisma-client"
    output       = "../lib/generated/prisma"
    moduleFormat = "cjs"
  }
  datasource db {
    provider = "sqlserver"
  }
  ```
  - `provider = "prisma-client"` (yeni nesil; eski `prisma-client-js` legacy).
  - `output` mandatory — client `lib/generated/prisma`'ya yazılır (repo dışı, `.gitignore` ignored). Import path: `@/lib/generated/prisma/client`.
  - `moduleFormat = "cjs"` belirtildi çünkü `package.json`'da `"type": "module"` yok (create-next-app CJS-default). Generated client CJS olarak emit edilir; Next.js bundler her iki format'ı da çözer. ESM'e geçmek istenirse `package.json`'a `"type": "module"` eklenip bu satır kaldırılır.
  - Datasource'tan `url` kaldırıldı; URL artık `prisma.config.ts` üzerinden geliyor (Prisma 7 standardı).

- **`prisma.config.ts`** skill'in resmi örneği uygulandı — `env()` helper'ı `prisma/config` paketinden:
  ```ts
  import "dotenv/config";
  import { defineConfig, env } from "prisma/config";

  export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    datasource: { url: env("DATABASE_URL") },
  });
  ```
  `env()` helper type-safe; runtime'da DATABASE_URL **tanımlı değilse** Prisma CLI komutları `PrismaConfigEnvError` atar — bu özelliktir, bug değil. Faz 01 doğrulamasında dummy env ile test edildi.

- **MSSQL Driver Adapter zorunlu**: Prisma 7 SQL provider'lar için driver adapter **zorunluyor** (skill `references/driver-adapters.md`). `@prisma/adapter-mssql` + `mssql` paketleri runtime dependency olarak eklendi. Faz 03'te `db/prisma.ts` wrapper'ı şöyle olacak:
  ```ts
  import { PrismaClient } from "@/lib/generated/prisma/client";
  import { PrismaMssql } from "@prisma/adapter-mssql";

  const adapter = new PrismaMssql({
    server: "...", port: 1433, database: "...",
    user: "...", password: "...",
    options: { encrypt: true, trustServerCertificate: true },
  });
  export const prisma = new PrismaClient({ adapter });
  ```
  Brief'in `.env.example` connection-string formatı (`sqlserver://...`) `PrismaMssql({ connectionString })` desteklenmiyorsa parse edilerek field-by-field config'e dönüştürülmeli — Faz 03 agent kararlaştıracak.

- **`.gitignore`** `/lib/generated/` satırı eklendi (Prisma client output buraya yazılır).

- **`dotenv`** dev dependency olarak eklendi (`prisma.config.ts`'in `dotenv/config` import'u için). Skill `npm install dotenv` (runtime) öneriyor ama uygulamada `dotenv` import'u yok — sadece Prisma CLI sırasında `prisma.config.ts` yüklenirken kullanılıyor. Vercel build sırasında devDep yeterli.

- **`prisma init` `.env` dosyası üretti** — silindi (`.env.local` kullanılacak, Faz 03 sonrası).

### Doğrulama notları (Faz 01 sonu)

- `prisma validate` artık DATABASE_URL set olmasını ister: `DATABASE_URL="sqlserver://dummy:1433;database=test;user=u;password=p;encrypt=true" npx prisma validate` → ✅ valid.
- `npm run typecheck` / `lint` / `format:check` — hepsi yeşil.
- ESM'e geçiş kararı (`"type": "module"` + `moduleFormat = "esm"`) Faz 03'te `prisma generate` + Next.js build testi sırasında verilebilir; şu an CJS default güvenli.
- `tsconfig.json` target `ES2017` (Next.js default). Skill `ES2023` öneriyor ama Next.js + bundler ile ES2017 sorun çıkarmıyor; gerekirse Faz 03'te yükseltilir.

### Faz 03 üzerine etki

- Prisma client import path: `@/lib/generated/prisma/client` (eski `@prisma/client` değil).
- `npx prisma migrate dev` `prisma.config.ts` üzerinden DATABASE_URL'i otomatik bulur — flag yok.
- `prisma generate` Faz 03 sonunda çalıştırılmalı; `lib/generated/prisma/` klasörü oluşacak.
- Driver adapter `PrismaMssql` zorunlu kullanım — `new PrismaClient({ adapter })` pattern.
- Connection-string'i `PrismaMssql` config'ine map etme stratejisi Faz 03'te kararlaştırılacak.

### `pino-pretty` runtime → dev

Brief `pino-pretty`'i runtime listede saymıştı, ancak `lib/logger.ts` yalnızca dev branch'inde `transport: pino-pretty` kullanıyor (prod minimal pino). Pino-pretty production bundle'a girerse cold-start şişer; `devDependencies`'a taşındı. Logger guard'ı `isDev` zaten bu ayrımı yapıyor.

### `lib/logger.ts` HMR worker leak guard

`pino-pretty` `worker_threads` başlatıyor; Next.js dev HMR re-evaluate sırasında her seferinde yeni worker spawn olmaması için `globalThis.logger` singleton pattern uygulandı (Prisma client önerisiyle aynı).

### `proxy.ts` parametre kaldırıldı

Pass-through olduğu için `request: NextRequest` parametresi unused ESLint warning veriyordu; parametre tamamen kaldırıldı. Faz 04'te auth eklenince geri eklenir.

### `lib/env.ts` zod v4 API kullanımı

Manuel `issues.map(...).join("\n")` yerine zod v4 yerleşik `z.prettifyError(error)` çağrısı kullanıldı.

### `tsconfig.json` değişiklik gerekmedi

Mevcut `paths: { "@/*": ["./*"] }` brief'in beklentisini karşılıyor. Karar `documents/folder-structure.md`'de "Path Alias Kararı" başlığı altında belgelendi.

### Etki

Hiçbir sapma sonraki fazları engellemiyor. Tek dikkat edilecek nokta:
- **Faz 03** `npx prisma migrate dev` çalıştırırken DATABASE_URL'in CLI tarafından `.env.local`'dan otomatik yüklenip yüklenmediğini test etmeli; yüklenmiyorsa `prisma.config.ts` re-introduce edilebilir veya `--env-file=.env.local` flag'i kullanılabilir.
- **Faz 04+** yeni major sürümlerin API farklarına dikkat etmeli (özellikle `zod@4`, `jose@6`, `bcryptjs@3`).
