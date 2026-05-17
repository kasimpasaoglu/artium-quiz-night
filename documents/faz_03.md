# Faz 03 — DB Şema + Migration + Seed

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 01

## Amaç

Uygulamanın tüm DB modellerini Prisma şemasında tanımlamak, ilk migration'ı MSSQL üzerinde çalıştırmak, MSSQL'in partial unique index ihtiyacını (`Quiz.isActive` için tek aktif quiz garantisi) manuel SQL ile karşılamak, initial admin kullanıcısını (`admin/admin`) seed script'i ile oluşturmak, Prisma client singleton'ını HMR-safe şekilde yerleştirmek. Bu fazdan sonra Faz 04 (auth) ve Faz 05+ (CRUD) DB'ye konuşabilir hale gelir.

## Kapsam Dışı (Out of Scope)

- Auth/login API'leri (Faz 04).
- Quiz/soru CRUD UI veya server actions (Faz 05/06).
- Prisma seed içinde test verisi (sadece initial admin).
- Pusher entegrasyonu (Faz 07).

## Yapılacaklar (Checklist)

- [ ] `.env.local` doluluğunu kontrol et: `DATABASE_URL` set. Yoksa kullanıcıya hatırlat.
- [ ] `prisma/schema.prisma` modellerini yaz:
  - `AdminUser`: id (uuid), username (unique), passwordHash (nvarchar max), createdAt, updatedAt.
  - `Quiz`: id (uuid), title (nvarchar 200), description (nvarchar max, nullable), backgroundUrl (nvarchar 1000, nullable), primaryColor (char 7), accentColor (char 7), textColor (char 7), fontKey (nvarchar 50), isActive (bool default false), createdAt, updatedAt, questions (relation).
  - `Question`: id (uuid), quizId (FK), text (nvarchar max), imageUrl (nvarchar 1000, nullable), durationSec (int), difficulty (int 1-5), orderIndex (int default 0), createdAt, updatedAt, `@@index([quizId, orderIndex])`.
- [ ] `npx prisma migrate dev --name init` çalıştır — migration üretilir, DB'ye uygulanır.
- [ ] Üretilen migration SQL dosyasını edit et: `Quiz` tablosu CREATE'inden sonra raw SQL ekle:
  ```sql
  CREATE UNIQUE INDEX UX_Quiz_OnlyOneActive
    ON [Quiz]([isActive])
    WHERE [isActive] = 1;
  ```
  (MSSQL filtered unique index — Prisma şemada ifade edemediği için manuel.)
- [ ] Migration'ı reset edip tekrar uygula (raw SQL'in dahil olduğundan emin olmak için): `npx prisma migrate reset` (dev'de). Prod'da `migrate deploy` kullanılacak.
- [ ] `db/prisma.ts` — HMR-safe singleton:
  ```ts
  import { PrismaClient } from "@prisma/client";
  const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
  export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```
- [ ] `prisma/seed.ts` — initial admin:
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
- [ ] `package.json` ekle:
  ```json
  "prisma": { "seed": "tsx prisma/seed.ts" }
  ```
- [ ] `npx prisma db seed` çalıştır — admin oluştu mu doğrula (`npx prisma studio` ile bak).
- [ ] `documents/db-schema.md` yaz: her model + alanlar + ilişkiler + index açıklaması + partial unique index'in neden manuel SQL olduğu.

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

_Agent faz bitiminde doldurur. Şu an boş._
