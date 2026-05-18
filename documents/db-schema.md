# DB Şeması

> Faz 03 çıktısı. Üç model, bir adapter pattern, iki katman kontrol (uygulama + DB).

## Genel Bakış

| Model | Rol | İlişki |
|---|---|---|
| `AdminUser` | Moderatör giriş hesabı (parola hash + zaman damgaları). | İzole, başka model'e bağlı değil. |
| `Quiz` | Bir gecenin sunum konfigürasyonu (tema renkleri, font, opsiyonel arka plan görseli, aktiflik durumu). | `1 - N Question` (cascade delete). |
| `Question` | Quiz altındaki tek bir soru (metin, opsiyonel görsel, süre, zorluk, sıralama). | `N - 1 Quiz`. |

Bağlantı:

```
AdminUser  (bağımsız)

Quiz 1───N Question
       └─ onDelete: Cascade
       └─ partial unique: en fazla bir Quiz `isActive = 1` olabilir
```

## Modeller

### `AdminUser`

| Alan | Tip | Nullable | Default | Açıklama |
|---|---|---|---|---|
| `id` | `UNIQUEIDENTIFIER` | hayır | `uuid()` (app-side) | Primary key. |
| `username` | `NVARCHAR(100)` | hayır | — | Unique. Faz 04 login formu bu alandan login eder. |
| `passwordHash` | `NVARCHAR(MAX)` | hayır | — | `bcryptjs` ile hash'lenir (cost 10). Düz parola asla yazılmaz. |
| `createdAt` | `DATETIME2` | hayır | `now()` | |
| `updatedAt` | `DATETIME2` | hayır | otomatik | Prisma `@updatedAt`. |

Seed (`prisma/seed.ts`) `count() === 0` olduğunda `admin / admin` satırını oluşturur — idempotent.

### `Quiz`

| Alan | Tip | Nullable | Default | Açıklama |
|---|---|---|---|---|
| `id` | `UNIQUEIDENTIFIER` | hayır | `uuid()` | |
| `title` | `NVARCHAR(200)` | hayır | — | Idle stage başlığı. |
| `description` | `NVARCHAR(MAX)` | evet | — | Sahnede gösterilmez; admin notu. |
| `backgroundUrl` | `NVARCHAR(1000)` | evet | — | Vercel Blob URL (Faz 05). Yoksa düz `--quiz-primary` arka plan. |
| `primaryColor` | `CHAR(7)` | hayır | `#1A1815` | `#rrggbb`. Klasik Sahne preset default'u (DESIGN.md §11). |
| `accentColor` | `CHAR(7)` | hayır | `#C4A572` | Vurgu (CTA fill, sayaç son saniye, badge). |
| `textColor` | `CHAR(7)` | hayır | `#F4EFE6` | Sahne içi gövde + display rengi. |
| `fontKey` | `NVARCHAR(50)` | hayır | `playfair-display` | `lib/fonts.ts` `FONT_WHITELIST` anahtarı. |
| `isActive` | `BIT` | hayır | `0` | Aynı anda en fazla bir Quiz aktif olabilir (partial unique index). |
| `createdAt` | `DATETIME2` | hayır | `now()` | |
| `updatedAt` | `DATETIME2` | hayır | otomatik | |
| `questions` | `Question[]` | — | — | Relation (FK Question.quizId). |

**Klasik Sahne default'ları:** Admin formu doldurmazsa DB-level garanti devreye girer. DESIGN.md §11 Preset 1 ile birebir. Admin form override eder (Faz 05).

### `Question`

| Alan | Tip | Nullable | Default | Açıklama |
|---|---|---|---|---|
| `id` | `UNIQUEIDENTIFIER` | hayır | `uuid()` | |
| `quizId` | `UNIQUEIDENTIFIER` | hayır | — | FK → `Quiz.id`. |
| `text` | `NVARCHAR(MAX)` | hayır | — | Soru metni. Türkçe karakter zorunlu (latin-ext font'lar). |
| `imageUrl` | `NVARCHAR(1000)` | evet | — | Vercel Blob URL. |
| `durationSec` | `INT` | hayır | — | Geri sayım süresi (saniye). Check constraint: 5-600 arası. |
| `difficulty` | `INT` | hayır | — | 1-5. Check constraint: 1-5 arası. |
| `orderIndex` | `INT` | hayır | `0` | Quiz içinde sıra. `(quizId, orderIndex)` üzerinde index. |
| `createdAt` | `DATETIME2` | hayır | `now()` | |
| `updatedAt` | `DATETIME2` | hayır | otomatik | |

**`@@index([quizId, orderIndex])`:** Faz 07 admin live mode "sıradaki soru" sorgusu bu index'i kullanır.

**Cascade delete:** Quiz silinince soruları da silinir. Görsel'in (`imageUrl`) Vercel Blob'tan otomatik silinmesi sağlanmaz; Faz 05/06 hook gerektirir.

## DB-Level Garanti Katmanı (Manuel SQL)

`prisma/migrations/20260518000000_init/migration.sql` sonunda Prisma'nın üretemediği üç DB özellik manuel olarak eklendi:

### `UX_Quiz_OnlyOneActive` — Partial Unique Index

```sql
CREATE UNIQUE INDEX [UX_Quiz_OnlyOneActive]
  ON [dbo].[Quiz]([isActive])
  WHERE [isActive] = 1;
```

- **Neden manuel?** Prisma şema dili (PSL) filtered (`WHERE`) unique index üretemez. MSSQL native özellik.
- **Garanti:** Veritabanı düzeyinde aynı anda **en fazla** bir `Quiz` satırı `isActive = 1` olabilir. İkinci aktivasyon `UNIQUE_VIOLATION` ile reddedilir.
- **Test:** İki quiz'i aktif yapmaya çalış → ikincisi DB hatası verir.

### `CK_Question_Difficulty` — Check Constraint

```sql
ALTER TABLE [dbo].[Question] ADD CONSTRAINT [CK_Question_Difficulty]
  CHECK ([difficulty] >= 1 AND [difficulty] <= 5);
```

- **Neden manuel?** Prisma int aralık doğrulamasını şemada ifade edemez.
- **Garanti:** `difficulty = 6` veya `0` insert/update'i DB tarafından reddedilir.

### `CK_Question_DurationSec` — Check Constraint

```sql
ALTER TABLE [dbo].[Question] ADD CONSTRAINT [CK_Question_DurationSec]
  CHECK ([durationSec] >= 5 AND [durationSec] <= 600);
```

- **Mantığı:** Çok kısa sayaç (≤ 4 sn) yarış bozar; çok uzun (≥ 10 dk) gecenin akışını kırar.
- **Çift savunma:** Faz 06 admin form zod ile `min(5).max(600)` zorlayacak; bu constraint DB-level redundant garanti.

## Migration Workflow Notu (Brief'ten Sapma)

Brief `npx prisma migrate dev --name init` öneriyordu, ama monsterasp.net free instance kullanıcısının `CREATE DATABASE` izni yok → P3014 shadow DB hatası. Bunun yerine:

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > migration.sql
# manuel SQL'i ekle
npx prisma migrate deploy
```

Migration history korunur, shadow database gerekmez. Detay: `documents/faz_03.md` Sapma Logu.

## Runtime: `db/prisma.ts` Singleton

Prisma 7 SQL provider için driver adapter **zorunlu**. `db/prisma.ts`:

```ts
const adapter = new PrismaMssql(parseMssqlUrl(env.DATABASE_URL));
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

- `server-only` import → istemci bundle'ına sızmaz.
- `globalThis.prisma` singleton → Next.js HMR'da bağlantı havuzu sızıntısını önler.
- `parseMssqlUrl` (`db/parse-mssql-url.ts`) tek source of truth: aynı URL hem CLI hem runtime için. Bkz. `documents/utils/parse-mssql-url.md`.

Seed (`prisma/seed.ts`) singleton'ı kullanmaz — `server-only` CLI bağlamında izinli değil; disposable client kurulur, `$disconnect` ile kapatılır.

## Doğrulama Komutları

```bash
npx prisma validate                  # şema sözdizimi
npx prisma migrate deploy            # üretilen SQL'i uygula
npx prisma generate                  # client (lib/generated/prisma/) üret
npx prisma db seed                   # initial admin (idempotent)
npx prisma studio                    # GUI'de tabloları görüntüle
npm run typecheck                    # TypeScript kontrol
```

## Sonraki Faza Bağlantı

- **Faz 04 (Auth):** `AdminUser.username` üzerinden login; `bcrypt.compare(plain, passwordHash)` ile doğrulama.
- **Faz 05 (Quiz CRUD):** Admin formu `Quiz` modelinin tüm alanlarını yönetir; preset'ler DESIGN.md §11'den seçilir.
- **Faz 06 (Soru CRUD):** `Question` formunda zod `difficulty.min(1).max(5)`, `durationSec.min(5).max(600)` — DB check constraint'leriyle eşleşir.
- **Faz 07 (Live mode):** `Quiz.isActive` toggle'ı `UX_Quiz_OnlyOneActive` ile korunur.
