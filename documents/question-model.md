# Soru Modeli (Question)

> Faz 06 çıktısı. DB şeması Faz 03'te tanımlandı; burada uygulama tarafındaki kurallar, validation sınırları ve sıralama algoritmaları belgeleniyor.

## Alanlar ve Kurallar

| Alan | DB tipi | Form validation | Sahne / UI notu |
|---|---|---|---|
| `id` | `UNIQUEIDENTIFIER` | app-side `uuid()` | — |
| `quizId` | `UNIQUEIDENTIFIER` | route'tan gelir | URL `/quiz-admin/quizzes/[id]`. |
| `text` | `NVARCHAR(MAX)` | zorunlu, `1-1000` char | Sahnede başlık altı gövde olarak büyük punto. |
| `imageUrl` | `NVARCHAR(1000)` | opsiyonel, URL | Vercel Blob `question-images/<safe-filename>`. |
| `durationSec` | `INT` | `5-600` | Sahnede sayaç ve progress bar bunu kullanır. |
| `difficulty` | `INT` | `1-5` | UI rozet (`<DifficultyBadge>`); DB seviyesinde check constraint. |
| `orderIndex` | `INT` | server-controlled | Quiz altında sıralama; admin yukarı/aşağı buton ile yönetir. |
| `createdAt` | `DATETIME2` | — | — |
| `updatedAt` | `DATETIME2` | — | — |

### Neden bu sınırlar?

- **`text` 1-1000:** Sahnede projeksiyondaki okunaklığı koru. 1000 char ≈ 200 kelime; sorunun bir cümlesi 60-80 char civarı olur, üst sınır spam koruması.
- **`durationSec` 5-600:** 5 saniyenin altı moderatörün "Gönder" sonrası soruyu sesli okumaya bile yetmez. 600 saniye (10 dk) üst sınır pratikte yeterli; 20 sorulu bir quiz'te uzun bir soruya 10 dk verirsin, ortalama 30-60 sn.
- **`difficulty` 1-5:** UI'da Select 1-5, DESIGN.md tonlama beklentisi (kolay/orta/zor). 1-10 yapmak admin tarafında fazla seçim yorgunluğu.

### DB check constraint'ler (Faz 03 migration)

```sql
ALTER TABLE [Question] ADD CONSTRAINT CK_Question_Difficulty
  CHECK ([difficulty] >= 1 AND [difficulty] <= 5);
ALTER TABLE [Question] ADD CONSTRAINT CK_Question_DurationSec
  CHECK ([durationSec] >= 5 AND [durationSec] <= 600);
```

Bu garanti **DB-level** — uygulama validation'ını atlasak bile (örn. yarı malformed raw SQL insert), DB reddeder.

### Zod şeması

`lib/schemas/question.ts` field exports + composed `questionFormSchema` yapısı (Faz 05 `lib/schemas/quiz.ts` ile aynı stil):

```ts
questionTextField    // trim + min 1 + max 1000
imageUrlField        // url + max 1000 + optional + "" allow
durationSecField     // number int 5-600
difficultyField      // number int 1-5
```

`questionFormSchema` bu alanların `z.object({...})` bileşimi. `QuestionFormInput = z.input<...>` form callsite'ı için, `QuestionFormData = z.output<...>` server için.

## Sıralama (`reorderQuestion`)

`Question.orderIndex` quiz altında 0-based artan sıra. `@@index([quizId, orderIndex])` UNIQUE **değil** — geçici çakışmalar tolere edilir (tek admin senaryosu).

**Algoritma — iki adım swap:**

```
current   = findUnique(id)
neighbor  = findFirst({
              quizId: current.quizId,
              orderIndex: direction === "up" ? { lt } : { gt },
              orderBy: orderIndex desc/asc,
            })

if (!neighbor) return                       // sınırda no-op
update(current.id,  orderIndex = neighbor.orderIndex)
update(neighbor.id, orderIndex = current.orderIndex)
```

Transaction içinde iki update. UNIQUE composite index gelirse three-step swap (current → -1 → neighbor.idx; neighbor → current.idx; current → neighbor.idx) gerekecek.

**Sınır davranışı:** En üstteki sorunun "yukarı"sı ya da en alttakinin "aşağı"sı `neighbor === null` → no-op + sessizce dön. UI seviyesinde butonlar zaten `disabled`.

## Silme + Sıra Sıkıştırması

`deleteQuestion(id)` transaction:

```
deleted = delete({ id }, select: { quizId, orderIndex })
updateMany({
  quizId:      deleted.quizId,
  orderIndex:  { gt: deleted.orderIndex },
}, {
  orderIndex:  { decrement: 1 }
})
```

Sonuç: `orderIndex` sırasında boşluk kalmaz. Örn. `[0,1,2,3,4]` → silinen `idx=2` → kalan `[0,1,2,3]` (eski 3 ve 4 → 2 ve 3).

**Cascade not:** `Quiz` silinince Question'lar şema tarafından cascade silinir (`onDelete: Cascade`). Ama `Question.imageUrl` Vercel Blob'taki dosya **orphan** kalır — Faz 05'teki aynı kararlı temkin: Faz 10'da `@vercel/blob.del()` çağrısı eklenecek.

## Yeni Soru Yaratma

`createQuestion(quizId, input)` transaction:

```
last       = aggregate({ _max: orderIndex }, where: { quizId })
nextOrder  = (last._max.orderIndex ?? -1) + 1
create({ ...data, quizId, orderIndex: nextOrder })
```

Aggregate transaction içinde yapılmasının nedeni: aynı anda iki create isteğinde aynı `nextOrder` çıkma riskini READ_COMMITTED altında **azaltmak**. UNIQUE constraint olmadığı için yine de tek admin senaryosu varsayımıyla ihmal edilebilir. İleri seviye koruma `serializable` izolasyon ya da composite UNIQUE — Faz 10 değerlendirir.

## Server Actions

`server/actions/question.ts` (Faz 06):

| Action | İmza | Yan etki |
|---|---|---|
| `createQuestion` | `(quizId, input) => Promise<void>` | DB insert + `revalidatePath(adminQuizDetail)` |
| `updateQuestion` | `(id, input) => Promise<void>` | DB update + revalidate (`P2025` → Türkçe hata) |
| `deleteQuestion` | `(id) => Promise<void>` | DB delete + compact + revalidate |
| `reorderQuestion` | `(id, "up" \| "down") => Promise<void>` | Swap + revalidate; sınırda no-op |

Tüm action'lar başında `await requireAdmin()`. Hata yakalama `lib/prisma-errors.ts:isRecordNotFound` ile.

## UI Akışı

- `app/quiz-admin/(panel)/quizzes/[id]/page.tsx` — quiz + `questions` (orderBy `orderIndex` asc) ile çekilir.
- `components/admin/question-table.tsx` — table + per-row `useServerAction`'lı reorder.
- `components/admin/question-form-dialog.tsx` — Dialog + Form (create/edit aynı bileşen).
- `components/admin/delete-question-dialog.tsx` — onay dialog.
- `components/admin/difficulty-badge.tsx` — `<Badge>` + Türkçe etiket (Çok Kolay/Kolay/Orta/Zor/Çok Zor).

## Açık Konular (Sonraki Fazlara)

- **Cascade cleanup:** Blob orphan dosyalar (Faz 10).
- **Concurrent create race:** Tek admin için ihmal; aksi durumda composite UNIQUE veya serializable.
- **Drag-to-reorder:** Soru sayısı 20'yi aşarsa `@dnd-kit/core` ile değiştirilebilir (Faz 09 polish).
- **Yıldız rating:** Zorluk için Select yerine ⭐ component (Faz 09 polish değerlendirir).
