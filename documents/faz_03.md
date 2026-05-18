# Faz 03 — DB Şema + Migration + Seed

**Durum:** ✅ DONE — 2026-05-18
**Önkoşul fazlar:** 01

## Amaç

Uygulamanın tüm DB modellerini Prisma şemasında tanımlamak, ilk migration'ı MSSQL üzerinde çalıştırmak, MSSQL'in partial unique index ihtiyacını (`Quiz.isActive` için tek aktif quiz garantisi) manuel SQL ile karşılamak, initial admin kullanıcısını (`admin/admin`) seed script'i ile oluşturmak, Prisma client singleton'ını HMR-safe şekilde yerleştirmek. Bu fazdan sonra Faz 04 (auth) ve Faz 05+ (CRUD) DB'ye konuşabilir hale gelir.

## Kapsam Dışı (Out of Scope)

- Auth/login API'leri (Faz 04).
- Quiz/soru CRUD UI veya server actions (Faz 05/06).
- Prisma seed içinde test verisi (sadece initial admin).
- Pusher entegrasyonu (Faz 07).

## Yapılacaklar (Checklist)

- [x] `.env.local` doluluğunu kontrol et: `DATABASE_URL` set. Yoksa kullanıcıya hatırlat.
- [x] `prisma/schema.prisma` modellerini yaz:
  - `AdminUser`: id (uuid), username (unique), passwordHash (nvarchar max), createdAt, updatedAt.
  - `Quiz`: id (uuid), title (nvarchar 200), description (nvarchar max, nullable), backgroundUrl (nvarchar 1000, nullable), primaryColor (char 7), accentColor (char 7), textColor (char 7), fontKey (nvarchar 50), isActive (bool default false), createdAt, updatedAt, questions (relation).
  - `Question`: id (uuid), quizId (FK), text (nvarchar max), imageUrl (nvarchar 1000, nullable), durationSec (int), difficulty (int 1-5), orderIndex (int default 0), createdAt, updatedAt, `@@index([quizId, orderIndex])`.
- [x] `npx prisma migrate dev --name init` çalıştır — migration üretilir, DB'ye uygulanır.
- [x] Üretilen migration SQL dosyasını edit et: `Quiz` tablosu CREATE'inden sonra raw SQL ekle:
  ```sql
  CREATE UNIQUE INDEX UX_Quiz_OnlyOneActive
    ON [Quiz]([isActive])
    WHERE [isActive] = 1;
  ```
  (MSSQL filtered unique index — Prisma şemada ifade edemediği için manuel.)
- [x] Migration'ı reset edip tekrar uygula (raw SQL'in dahil olduğundan emin olmak için): `npx prisma migrate reset` (dev'de). Prod'da `migrate deploy` kullanılacak.
- [x] `db/prisma.ts` — HMR-safe singleton:
  ```ts
  import { PrismaClient } from "@prisma/client";
  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```
- [x] `prisma/seed.ts` — initial admin:
  ```ts
  import { PrismaClient } from "@prisma/client";
  import bcrypt from "bcryptjs";
  const prisma = new PrismaClient();
  async function main() {
    const count = await prisma.adminUser.count();
    if (count === 0) {
      const passwordHash = await bcrypt.hash("admin", 10);
      await prisma.adminUser.create({ data: { username: "admin", passwordHash } });
      console.log("Initial admin oluşturuldu: admin / admin");
    } else {
      console.log("AdminUser zaten var, seed atlandı.");
    }
  }
  main().finally(() => prisma.$disconnect());
  ```
- [x] `package.json` ekle:
  ```json
  "prisma": { "seed": "tsx prisma/seed.ts" }
  ```
- [x] `npx prisma db seed` çalıştır — admin oluştu mu doğrula (`npx prisma studio` ile bak).
- [x] `documents/db-schema.md` yaz: her model + alanlar + ilişkiler + index açıklaması + partial unique index'in neden manuel SQL olduğu.

## Dokunulacak Dosyalar

- `prisma/schema.prisma` — model tanımları.
- `prisma/migrations/<timestamp>_init/migration.sql` — auto-generated + manuel SQL edit (partial index).
- `prisma/seed.ts` (YENİ).
- `db/prisma.ts` (YENİ).
- `package.json` — `prisma.seed` config.
- `documents/db-schema.md` (YENİ).

## Eklenecek Paketler

Yok — Faz 01'de `prisma`, `@prisma/client`, `bcryptjs`, `@types/bcryptjs`, `tsx` zaten eklendi.

## Veri Modeli / Şema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model AdminUser {
  id           String   @id @default(uuid()) @db.UniqueIdentifier
  username     String   @unique @db.NVarChar(100)
  passwordHash String   @db.NVarChar(Max)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Quiz {
  id             String     @id @default(uuid()) @db.UniqueIdentifier
  title          String     @db.NVarChar(200)
  description    String?    @db.NVarChar(Max)
  backgroundUrl  String?    @db.NVarChar(1000)
  primaryColor   String     @db.Char(7)          // "#rrggbb"
  accentColor    String     @db.Char(7)
  textColor      String     @db.Char(7)
  fontKey        String     @db.NVarChar(50)     // lib/fonts.ts whitelist key
  isActive       Boolean    @default(false)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  questions      Question[]
}

model Question {
  id          String   @id @default(uuid()) @db.UniqueIdentifier
  quizId      String   @db.UniqueIdentifier
  quiz        Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  text        String   @db.NVarChar(Max)
  imageUrl    String?  @db.NVarChar(1000)
  durationSec Int
  difficulty  Int                                // 1-5
  orderIndex  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([quizId, orderIndex])
}
```

**Raw SQL (migration sonuna eklenir):**
```sql
CREATE UNIQUE INDEX UX_Quiz_OnlyOneActive
  ON [Quiz]([isActive])
  WHERE [isActive] = 1;
```

**Check constraint (önerilen, manuel SQL):**
```sql
ALTER TABLE [Question] ADD CONSTRAINT CK_Question_Difficulty
  CHECK ([difficulty] >= 1 AND [difficulty] <= 5);
ALTER TABLE [Question] ADD CONSTRAINT CK_Question_DurationSec
  CHECK ([durationSec] >= 5 AND [durationSec] <= 600);
```

## Doğrulama

**Otomatik:**
- `npx prisma validate` ✓
- `npx prisma format` ✓
- `npx prisma migrate dev --name init` ✓ (DB'de tablolar oluştu)
- `npx prisma db seed` ✓
- `npm run typecheck` ✓

**Manuel:**
- `npx prisma studio` → AdminUser tablosunda `admin` user var, passwordHash boş değil.
- MSSQL Management Studio veya `sqlcmd` ile bağlan: `Quiz`, `Question`, `AdminUser` tabloları var, `UX_Quiz_OnlyOneActive` index'i `sys.indexes`'te görünüyor.
- Test: iki Quiz'i `isActive=true` yapmaya çalış → DB exception (unique constraint violation). Bu beklenen davranış.
- Test: difficulty=6 olan soru insert et → check constraint hatası. Beklenen.

## Deliverables

- `documents/db-schema.md`:
  - Her modelin alanları + tipler + nullability + default + index.
  - İlişkiler diyagramı (basit text-based: `Quiz 1-N Question`, `Quiz.isActive UNIQUE WHERE = 1`).
  - Partial unique index'in neden manuel SQL olduğu (Prisma şema dilinde ifade edilemiyor).
  - Check constraint'lerin amacı (uygulama validation'ı + DB-level garantili).
  - `db/prisma.ts` singleton pattern açıklaması + neden HMR-safe.

## Riskler / Açık Sorular

- **MSSQL connection encrypt:** monsterasp.net free instance'da `encrypt=true; trustServerCertificate=false` çalışır mı, yoksa `trustServerCertificate=true` mu gerekir? Bağlantı hatası alınırsa kullanıcıya sor.
- **UUID default:** Prisma `@default(uuid())` MSSQL'de app-side UUID üretir; `@db.UniqueIdentifier` + DB-side `NEWID()` istiyorsak `@default(dbgenerated("newid()"))` gerekir. App-side UUID daha tahmin edilebilir, ilk versiyonda onunla kal.
- **Migration history:** Prod deploy'da `migrate deploy` çalıştırılacak, dev'de `migrate dev`. İlk init'ten sonra `migrations/` klasörü repo'ya commit edilmeli.
- **Seed idempotency:** Seed script `count() === 0` kontrolüyle idempotent — birden fazla çalıştırılırsa yeni admin yaratmaz. Önemli: kullanıcı password değiştirdiğinde seed bunu üzerine yazmamalı.
- **Cascade delete:** `Question` modeli `Quiz` silinince cascade — bu istenen davranış. Ama soruda görsel varsa Vercel Blob'tan silinmez (manuel cleanup gerekir; Faz 05/06'da değerlendir).

---

## Sapma Logu

**Tarih:** 2026-05-18

Memory kuralı: "Brief eski olabilir, çatışmada güncel doğruyu tercih et" (Faz 01 sapma logu Prisma 7'ye taşıma başlattı; bu faz onu tamamlıyor).

### 1. Brief Prisma 5/6 → Prisma 7 driver adapter pattern

Brief örnekleri (`import { PrismaClient } from "@prisma/client"`, `new PrismaClient({ log: [...] })`, `provider = "prisma-client-js"`) Prisma 5/6 paradigmasındaydı. Faz 01 projeyi Prisma 7'ye taşımıştı (`prisma-client` generator, `lib/generated/prisma`, `@prisma/adapter-mssql` runtime'a kurulu). Bu faz adapter pattern'i uyguladı:

```ts
// db/prisma.ts
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaMssql } from "@prisma/adapter-mssql";
const adapter = new PrismaMssql(parseMssqlUrl(env.DATABASE_URL));
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

`log: [...]` opsiyonu ilk versiyonda eklenmedi (Prisma 7 adapter API kararlı oturana kadar yalın tut). Faz 09 polish'inde değerlendirilir.

### 2. Brief `prisma migrate dev --name init` → diff + deploy workflow

Brief `prisma migrate dev` öneriyordu. Bu komut shadow database yaratmaya çalışıyor, monsterasp.net free instance kullanıcısı `CREATE DATABASE` izni yok → `P3014` hatası. Çözüm:

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > migration.sql
# manuel SQL ekle (partial unique index + 2 check constraint)
npx prisma migrate deploy
```

- Migration history korunur (`_prisma_migrations` tablosu).
- Shadow DB gerektirmez.
- `migrate reset` adımı (brief Checklist'te vardı) bu workflow'da gereksiz: manuel SQL ilk uygulamada zaten dahil oldu.
- Üretim ortamında da `migrate deploy` standart, davranış simetrik.

### 3. Brief `--to-schema-datamodel` flag'i Prisma 7'de kaldırıldı

Prisma 7'de `prisma migrate diff` flag adı `--to-schema-datamodel` → `--to-schema`. Brief eski adı kullanıyordu; yeni ad uygulandı.

### 4. `prisma migrate diff` stdout'unu dotenv tip mesajları kirletti

`dotenv@^17.4.2` "tip" reklam satırlarını stdout'a basıyordu (örn. `◇ injected env (9) from .env.local // tip: ...`). Bu satırlar migration.sql'in başına karışıp SQL parser'ı kırıyordu. Çözüm: `prisma.config.ts`'deki `dotenv.config({ ..., quiet: true })` opsiyonu.

### 5. Brief `package.json` `prisma.seed` config'i → `prisma.config.ts` `migrations.seed`

Prisma 7 seed config'ini artık `package.json`'dan değil `prisma.config.ts`'den okuyor. Doğru yer:

```ts
migrations: {
  path: "prisma/migrations",
  seed: "node_modules/.bin/tsx prisma/seed.ts",
},
```

`tsx` PATH'te bulunmadığı için (`spawn tsx ENOENT`) komut explicit `node_modules/.bin/tsx` ile yazıldı. `npx tsx ...` alternatifi de çalışır ama relative path en hızlısı.

### 6. `.env.local` connection string formatı + dotenv quoting

Kullanıcı `.env.local`'i monsterasp.net'ten gelen **ADO.NET** formatında bırakmıştı:

```
DATABASE_URL=Server=HOST; Database=DB; User Id=USER; Password=Pa$$#word; Encrypt=True; TrustServerCertificate=True; MultipleActiveResultSets=True;
```

İki problem:

1. **dotenv `#` yorum kesimi:** Parolada `#` karakteri olduğu için (`Password=2Mg_Bt#98Dc?`), dotenv `#`'den sonrasını yorum saydı → parola truncate oldu, `Encrypt` + `TrustServerCertificate` alanları kayboldu, cert hatası.
2. **Prisma JDBC vs ADO.NET:** Prisma CLI yalnız JDBC formatını (`sqlserver://...`) kabul eder.

Çözüm:
- `.env.local`'deki `DATABASE_URL` değeri çift tırnak içine alındı (`DATABASE_URL="..."`). dotenv tırnak içindeki `#`'i yorum saymaz.
- `db/parse-mssql-url.ts` her iki formatı (JDBC + ADO.NET) parse eder, ortak `MssqlAdapterConfig` döner.
- `formatAsJdbcUrl(config)` Prisma CLI için JDBC URL'e re-serialize eder.
- `prisma.config.ts` parse-then-rebuild ile env'den okunan URL'i normalize edip `datasource.url`'e verir.

Parola URL-encoding'i kaldırıldı (`encodeURIComponent` yoktu); Prisma JDBC URL'inde parola **ham** değer alır, decode etmez. `%23` literal `%23` olarak kullanılır → auth fail. Bu detay `documents/utils/parse-mssql-url.md`'de belgelendi.

### 7. `migration_lock.toml` `provider` adı `sqlserver` → `mssql`

İlk denemede `migration_lock.toml` `provider = "sqlserver"` (schema.prisma'daki ad) ile yazıldı, ama Prisma 7 internal'da `mssql` adı kullanılıyor → `P3019` mismatch hatası. Lock dosyası `provider = "mssql"` olarak düzeltildi. Schema.prisma'da yine `provider = "sqlserver"` kalıyor (PSL syntax).

### 8. Klasik Sahne preset'i schema-level default

Kullanıcı kararı (plan oturumunda): `Quiz` modelinin tema alanları için DESIGN.md §11 Preset 1 schema default'u eklendi.

```prisma
primaryColor String @default("#1A1815") @db.Char(7)
accentColor  String @default("#C4A572") @db.Char(7)
textColor    String @default("#F4EFE6") @db.Char(7)
fontKey      String @default("playfair-display") @db.NVarChar(50)
```

DB-level garanti; admin form override eder. Brief default vermemişti.

### 9. Migration timestamp manuel

`migrate dev` workflow'unda Prisma timestamp'i kendi üretir. `migrate diff` workflow'unda manuel klasör adı verildi: `20260518000000_init`. Sonraki migration'lar (Faz 06+) için aynı format izlenmeli (`YYYYMMDDHHMMSS_<name>`).

### 10. Seed `db/prisma.ts` singleton'ını kullanmaz

`db/prisma.ts` `import "server-only"` ile işaretli; `tsx` CLI bağlamında bu import izinli değil. Seed `prisma/seed.ts` disposable bir `PrismaClient({ adapter })` kurar, iş bitince `await prisma.$disconnect()` ile kapatır. Singleton patern dev sunucusu için; seed gibi tek atış komutlarda doğru pattern disposable.

### Etki

- Faz 04 (Auth): `import { prisma } from "@/db/prisma"` ile çalışacak. `AdminUser.username` üzerinden login, `bcrypt.compare` ile doğrulama.
- Faz 05+: Aynı singleton kullanılır. Tema alanları default'lu, admin formu override eder.
- Faz 06: Question form'unda zod validation `difficulty 1-5`, `durationSec 5-600` — DB constraint'leriyle eşleşir.
- Faz 07: `Quiz.isActive` toggle'ı `UX_Quiz_OnlyOneActive` ile DB-level korunur.
- Faz 10 (deploy): Vercel build'inde `prisma generate` `postinstall` veya `build` script'ine eklenmesi gerekebilir (`lib/generated/` `.gitignore`'da).

### 11. Simplify pass düzeltmeleri

`simplify` skill review'ı sonrası üç küçük temizleme yapıldı:

- **`db/load-cli-env.ts` (yeni):** `prisma.config.ts` ve `prisma/seed.ts` ikisinde de tekrarlanan `dotenv.config + .env.local + .env + DATABASE_URL kontrolü` bloğu helper'a çıkarıldı. İki callsite tek noktadan beslenir.
- **`db/prisma.ts` adapter init lazy:** `new PrismaMssql(...)` çağrısı `createPrismaClient()` içine alındı; `globalForPrisma.prisma` HMR cache'inden geliyorsa adapter hiç inşa edilmez.
- **`prisma/seed.ts` `count()` → `findUnique({ where: { username } })`:** "Tabloda kayıt var mı" semantiği yerine "admin kullanıcısı var mı" semantiği — daha doğru ve race-aware (paralel insert'te DB unique constraint koruyor). Sabit `ADMIN_USERNAME` + `ADMIN_DEFAULT_PASSWORD` çıkarıldı (magic string yok).

Skip edilen findings (false positive veya premature): native `URL` API ile parser değişimi (JDBC/ADO.NET non-standard format), global singleton ortak abstraction (logger ile farklı NODE_ENV davranışı), bcrypt cost factor sabiti (Faz 04 scope'unda), `Quiz.createdAt` index'i (MVP'de gereksiz), stringly-typed property keys (yalnız 2 callsite).

### Doğrulama Sonuçları

- `npx prisma validate` ✓
- `npx prisma migrate deploy` ✓ (`20260518000000_init` uygulandı, partial index + 2 check constraint dahil)
- `npx prisma generate` ✓ (`lib/generated/prisma/client.ts` oluşturuldu)
- `npx prisma db seed` (1. kez) ✓ — admin oluştu
- `npx prisma db seed` (2. kez) ✓ — "'admin' kullanıcısı zaten mevcut — seed atlandı" (idempotent)
- `npm run typecheck` ✓ 0 hata
- `npm run lint` ✓ 0 hata
- `npm run format:check` ✓ tüm dosyalar Prettier uyumlu
