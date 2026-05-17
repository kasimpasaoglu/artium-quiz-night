# Faz 06 — Admin: Soru CRUD

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 05

## Amaç

Bir quiz altında soru CRUD: quiz detayı sayfasında soru tablosu, ekle/düzenle dialog'u, sil, sıralamayı değiştir. Her soru: text (zorunlu), opsiyonel görsel (Faz 05'teki `image-upload.tsx` pattern reuse), cevap süresi (saniye), zorluk (1-5). Bu fazdan sonra admin tüm quiz'leri ve sorularını tanımlayabilir; canlı yayın akışı Faz 07'de.

## Kapsam Dışı (Out of Scope)

- Live mode, Pusher, "gönder" butonu (Faz 07).
- Public ana ekran (Faz 08).
- Toplu soru import (CSV/JSON) — gerek görülürse sonra.
- Soru kategori/etiket sistemi.
- Soru istatistikleri (kaç defa sorulmuş vb.) — sistem cevap toplamadığı için anlamsız.

## Yapılacaklar (Checklist)

- [ ] `app/quiz-admin/quizzes/[id]/page.tsx` (Faz 05'teki placeholder'ı doldur):
  - Server component: quiz'i + sorularını `prisma.quiz.findUnique({ include: { questions: { orderBy: { orderIndex: "asc" } } } })`.
  - Yoksa `notFound()`.
  - Quiz başlığı + "Edit Quiz" butonu (Faz 05'e link) + "Live Mode'da Aç" (Faz 07'de aktif olacak buton, şimdilik disabled veya yok).
  - `<QuestionTable questions={...} quizId={id} />` + "Yeni Soru" butonu.
- [ ] `components/admin/question-table.tsx` — client component:
  - Table sütunları: # (orderIndex), Text (truncate 80 char), Süre (saniye), Zorluk (badge 1-5), İşlemler (edit/delete/yukarı-aşağı).
  - "Yeni Soru" butonu → `<QuestionFormDialog>` open create mode.
  - Edit row → `<QuestionFormDialog>` open edit mode.
  - Delete row → confirm dialog → `deleteQuestion` action.
  - Yukarı/aşağı butonları → `reorderQuestion` action.
- [ ] `components/admin/question-form-dialog.tsx` — shadcn Dialog + form:
  - text (Textarea, min 1, max 1000).
  - imageUrl (image-upload.tsx reuse).
  - durationSec (Input type=number, min 5, max 600, default 30).
  - difficulty (Select 1-5, default 3, stars/badge görsel hint).
  - Submit → `createQuestion` veya `updateQuestion`.
- [ ] `server/actions/question.ts`:
  - `createQuestion(quizId: string, data: QuestionFormData)`: requireAdmin, zod validate, son orderIndex+1, prisma.question.create, revalidatePath.
  - `updateQuestion(id: string, data: QuestionFormData)`: requireAdmin, zod, update, revalidate.
  - `deleteQuestion(id: string)`: requireAdmin, prisma delete, kalan soruların orderIndex'ini compact'le (transaction), revalidate.
  - `reorderQuestion(id: string, direction: "up" | "down")`: requireAdmin, transaction içinde swap, revalidate.
- [ ] `types/quiz.ts`'e `QuestionFormData` ekle.
- [ ] `documents/question-model.md` yaz.

## Dokunulacak Dosyalar

- `app/quiz-admin/quizzes/[id]/page.tsx` — Faz 05 placeholder dolduruluyor.
- `components/admin/question-table.tsx` (YENİ).
- `components/admin/question-form-dialog.tsx` (YENİ).
- `components/admin/delete-question-dialog.tsx` (YENİ).
- `server/actions/question.ts` (YENİ).
- `types/quiz.ts` — QuestionFormData ekle.
- Faz 05'teki `components/admin/image-upload.tsx` reuse (değişiklik yok).

## Eklenecek Paketler

Yok. (Drag-to-reorder için `@dnd-kit/core` opsiyonel ama basit yukarı/aşağı butonlar yeterli, ekleme.)

## Veri Modeli / Şema

```ts
export const questionFormSchema = z.object({
  text: z.string().min(1, "Soru metni zorunludur").max(1000, "En fazla 1000 karakter"),
  imageUrl: z.string().url("Geçerli URL").optional().or(z.literal("")),
  durationSec: z.coerce.number().int().min(5, "En az 5 saniye").max(600, "En fazla 600 saniye"),
  difficulty: z.coerce.number().int().min(1).max(5),
});

export type QuestionFormData = z.infer<typeof questionFormSchema>;
```

**Server action signatures:**
```ts
async function createQuestion(quizId: string, data: QuestionFormData): Promise<Question>;
async function updateQuestion(id: string, data: QuestionFormData): Promise<Question>;
async function deleteQuestion(id: string): Promise<void>;
async function reorderQuestion(id: string, direction: "up" | "down"): Promise<void>;
```

**Reorder algoritması:**
- `up`: orderIndex'i bir küçük olan soru ile swap.
- `down`: orderIndex'i bir büyük olan soru ile swap.
- Transaction içinde iki update.

**Delete sonrası compact:**
```ts
// silinen sorunun orderIndex'inden büyük olan tüm soruların orderIndex'ini -1
await prisma.question.updateMany({
  where: { quizId, orderIndex: { gt: deleted.orderIndex } },
  data: { orderIndex: { decrement: 1 } },
});
```

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓
- `npx prisma validate` ✓

**Manuel:**
- Faz 05'te oluşturulan quiz'in detayına git → boş tablo + "Yeni Soru".
- 5 soru ekle (farklı süre, farklı zorluk, biri görselli) → tablo dolar.
- Soru 3'ü düzenle → değişiklik yansır.
- Soru 2'yi sil → tablo güncellendi, orderIndex 3,4,5 olan sorular 2,3,4 oldu (sırada boşluk yok).
- Yukarı/aşağı butonları → sıra değişiyor, ilk soruda "yukarı" / son soruda "aşağı" disabled.
- text > 1000 char → zod hata Türkçe gösteriliyor.
- duration = 0 → zod hata.
- Difficulty = 6 → zod hata (DB'ye gitmeden client'ta).
- DB level: difficulty=6 ile direkt SQL insert → CK_Question_Difficulty constraint hatası (Faz 03'te eklenen).
- Auth: cookie sil → server action → 401 / redirect.

## Deliverables

- `documents/question-model.md`:
  - Alan kuralları + zod validation sınırları.
  - DB check constraint'ler (Faz 03 referans).
  - Reorder algoritması açıklaması (basit swap).
  - Delete sonrası orderIndex compact pattern.
  - Soru max 1000 char neden seçildi (görsel ekran için makul üst sınır), durationSec 5-600 (5 saniyenin altı anlamsız, 10 dakika üst sınır).

## Riskler / Açık Sorular

- **Concurrent reorder:** İki tab'dan aynı anda swap yapılırsa orderIndex çakışabilir. Tek admin senaryosu için kabul; ileride `orderIndex` üzerinde optimistic locking veya UNIQUE composite (`quizId`, `orderIndex`) ile katı tutulur.
- **Cascade delete + Blob:** Quiz silinince soru görselleri Blob'ta orphan kalır (Faz 05 risk listesinde de var).
- **Görsel zorunlu mu:** İlk versiyonda opsiyonel. Soru sadece text de olabilir.
- **Drag-to-reorder UX:** Basit yukarı/aşağı butonlar yeterli; çok soru olursa (>20) `@dnd-kit` ile drag eklenebilir.
- **Difficulty görsel:** 1-5 select yerine ⭐ rating component daha güzel olabilir; ilk versiyonda Select yeter, Faz 09 polish'te değerlendir.

---

## Sapma Logu

_Agent faz bitiminde doldurur. Şu an boş._
