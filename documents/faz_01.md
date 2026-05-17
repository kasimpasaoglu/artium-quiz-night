# Faz 01 — İskelet & Konfigürasyon

**Durum:** ⬜ TODO
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

- [ ] Runtime paketleri kur: `prisma @prisma/client jose bcryptjs zod pusher pusher-js @vercel/blob pino pino-pretty date-fns react-hook-form @hookform/resolvers`
- [ ] Dev paketleri kur: `@types/bcryptjs prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged tsx`
- [ ] Klasör iskeleti aç (her birinde `.gitkeep` veya boş `index.ts`):
  - `app/(public)/`, `app/quiz-admin/`, `app/api/`
  - `lib/`, `db/`, `prisma/`, `components/ui/`, `components/admin/`, `components/presentation/`
  - `hooks/`, `server/actions/`, `types/`
  - `documents/hooks/`, `documents/utils/`
- [ ] `lib/env.ts` — zod ile env validation, build-time'da `parse()` çağrısı:
  - `DATABASE_URL` (string, min 1)
  - `SESSION_SECRET` (string, min 32 char)
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (string)
  - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` (string)
  - `BLOB_READ_WRITE_TOKEN` (string, optional in dev)
  - `NODE_ENV` (enum: development|production|test)
  - Export typed `env` objesi.
- [ ] `lib/logger.ts` — pino instance: prod'da JSON, dev'de `pino-pretty` transport.
- [ ] `npx prisma init --datasource-provider sqlserver` (datasource block oluşur, şema henüz boş — Faz 03 dolduracak).
- [ ] `proxy.ts` iskelet (kök dizinde, `middleware.ts` DEĞİL): export `proxy` ve `config.matcher` placeholder (`['/quiz-admin/:path*', '/api/admin/:path*']`), şu an pass-through (NextResponse.next()).
- [ ] `.env.example` doldur — yukarıdaki tüm env key'leri + MSSQL connection string format yorumu:
  ```
  # MSSQL connection string (monsterasp.net format):
  # sqlserver://HOST:1433;database=DBNAME;user=USER;password=PASS;encrypt=true;trustServerCertificate=false
  DATABASE_URL=
  ```
- [ ] `.prettierrc` — sade config (singleQuote: false, semi: true, trailingComma: "all", printWidth: 100).
- [ ] `.prettierignore` — `.next/`, `node_modules/`, `prisma/migrations/`, `*.md` (md dosyaları el ile yazılıyor).
- [ ] `eslint.config.mjs` — `eslint-config-prettier` ekle (Prettier ile çakışmaları kapat).
- [ ] `package.json` `scripts` ekle: `"format": "prettier --write ."`, `"format:check": "prettier --check ."`, `"typecheck": "tsc --noEmit"`, `"prepare": "husky"`.
- [ ] `npx husky init` → `.husky/pre-commit` içinde `npx lint-staged`.
- [ ] `package.json`'a `lint-staged` config: `"*.{ts,tsx}": ["eslint --fix", "prettier --write"]`, `"*.{json,css,md}": ["prettier --write"]`.
- [ ] `next.config.ts` — `images.remotePatterns` Vercel Blob için:
  ```ts
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  }
  ```
- [ ] `tsconfig.json` `paths` ekle (mevcut `@/*`'a ek olarak alias'lar opsiyonel, ama açık tutmak okunabilirliği arttırır):
  ```json
  "paths": {
    "@/*": ["./*"]
  }
  ```
  (Mevcut yapı yeterli, ek alias gerekmiyor — kararı dokümante et.)
- [ ] `documents/folder-structure.md` yaz: her top-level klasörün ne için olduğunu açıkla.

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

_Agent faz bitiminde doldurur. Şu an boş._
