# Faz 06 — Admin: Soru CRUD

**Durum:** ✅ DONE — 2026-05-18
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

- [x] `app/quiz-admin/quizzes/[id]/page.tsx` (Faz 05'teki placeholder'ı doldur):
  - Server component: quiz'i + sorularını `prisma.quiz.findUnique({ include: { questions: { orderBy: { orderIndex: "asc" } } } })`.
  - Yoksa `notFound()`.
  - Quiz başlığı + "Edit Quiz" butonu (Faz 05'e link) + "Live Mode'da Aç" (Faz 07'de aktif olacak buton, şimdilik disabled veya yok).
  - `<QuestionTable questions={...} quizId={id} />` + "Yeni Soru" butonu.
- [x] `components/admin/question-table.tsx` — client component:
  - Table sütunları: # (orderIndex), Text (truncate 80 char), Süre (saniye), Zorluk (badge 1-5), İşlemler (edit/delete/yukarı-aşağı).
  - "Yeni Soru" butonu → `<QuestionFormDialog>` open create mode.
  - Edit row → `<QuestionFormDialog>` open edit mode.
  - Delete row → confirm dialog → `deleteQuestion` action.
  - Yukarı/aşağı butonları → `reorderQuestion` action.
- [x] `components/admin/question-form-dialog.tsx` — shadcn Dialog + form:
  - text (Textarea, min 1, max 1000).
  - imageUrl (image-upload.tsx reuse).
  - durationSec (Input type=number, min 5, max 600, default 30).
  - difficulty (Select 1-5, default 3, stars/badge görsel hint).
  - Submit → `createQuestion` veya `updateQuestion`.
- [x] `server/actions/question.ts`:
  - `createQuestion(quizId: string, data: QuestionFormData)`: requireAdmin, zod validate, son orderIndex+1, prisma.question.create, revalidatePath.
  - `updateQuestion(id: string, data: QuestionFormData)`: requireAdmin, zod, update, revalidate.
  - `deleteQuestion(id: string)`: requireAdmin, prisma delete, kalan soruların orderIndex'ini compact'le (transaction), revalidate.
  - `reorderQuestion(id: string, direction: "up" | "down")`: requireAdmin, transaction içinde swap, revalidate.
- [x] `types/quiz.ts`'e `QuestionFormData` ekle.
- [x] `documents/question-model.md` yaz.

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

**Tarih:** 2026-05-18

Memory kuralı: "Brief eski olabilir, güncel doğruyu tercih et." Faz 04/05 sapmaları (özellikle `lib/prisma-errors.ts`, `lib/schemas/` field-parça pattern'i, `delete-quiz-dialog` Dialog pattern'i, `image-upload` `folder` parametrik prop) bu fazda reuse edildi; brief ile çelişen birkaç nokta güncel yapıya göre adapte edildi.

### 1. `QuestionFormData` ve `QuestionRow` tipi `types/quiz.ts` yerine `lib/schemas/question.ts`'te

Brief `types/quiz.ts:QuestionFormData` öneriyordu; Faz 05'te `types/` klasörü boş bırakılmıştı (schema dosyaları kendi `z.input`/`z.output` tiplerini export ediyor). Faz 06 aynı yaklaşımı sürdürdü:

```ts
// lib/schemas/question.ts
export type QuestionFormInput = z.input<typeof questionFormSchema>;
export type QuestionFormData  = z.output<typeof questionFormSchema>;
export interface QuestionRow { ... }
export type QuestionFormInitialData = Omit<QuestionRow, "orderIndex">;
```

`QuestionRow` ve `QuestionFormInitialData`'nın schema dosyasında durması table + form dialog'un ortak tip kaynağı oluyor (form-dialog ↔ table circular import riskini de ortadan kaldırıyor).

### 2. `useServerAction` hook'u yazıldı (Faz 04 §14 ertelemesi)

`useTransition + try/catch + toast` üçlüsü Faz 04'te 3, Faz 05'te +3, Faz 06'da +4 (toplam 10+) callsite'a ulaştı. Faz 04 §14 "5+ olduğunda değerlendirilir" ertelemesi tetiklendi:

```ts
// hooks/use-server-action.ts
useServerAction(action, { successMessage, errorFallback, onSuccess }) → { run, pending }
```

`pending` ergonomik (`useTransition` detayı kapatılı), `error.message` zaten Türkçe geliyorsa direkt gösterilir, yoksa `errorFallback`. Form submit, button click ve sıralama tarzı tüm callsite'larda uyumlu.

**Kapsam:** İlk Faz 06 PR'ında yalnız Faz 06'nın 4 callsite'ında kullanıldı; sonradan kullanıcı talebiyle Faz 04/05'teki 6 callsite (`login-form`, `logout-button`, `change-credentials-form`, `quiz-form`, `quiz-list`, `delete-quiz-dialog`) bu hook'a back-port edildi. Toplam 10 callsite. `login-form` ve `logout-button` `fetch` tabanlı; non-OK response için action body içinde explicit `throw new Error(...)` ile hook semantiğine uyduruldu.

### 3. `DifficultyBadge` (brief'te yoktu) eklendi

Tablo + form preview iki yerde aynı zorluk hint'i lazımdı. Brief'te `Select 1-5 + Badge` ifadesi vardı ama component ayrımı yapılmamıştı. `components/admin/difficulty-badge.tsx`:

```tsx
<DifficultyBadge value={3} />   // "3 · Orta" — variant: "default"
```

Tek `LEVELS` objesi (label + variant) tutuyor (parallel array değil). 1-5 → "Çok Kolay / Kolay / Orta / Zor / Çok Zor", Badge variant kademeli.

### 4. Reorder iki-adım swap (three-step yerine)

`@@index([quizId, orderIndex])` Faz 03'te UNIQUE değil tanımlanmış. Bu yüzden swap için three-step (current → -1 → neighbor.idx; neighbor → current.idx; current → neighbor.idx) gerekmiyor; iki adım yeterli (`current → neighbor.idx`, `neighbor → current.idx`). UNIQUE composite'e geçilirse three-step gerekir — `reorderQuestion` üstüne comment yazıldı.

### 5. "Live Mode'da Aç" butonu eklenmedi

Brief Faz 06 başlığında "Live Mode'da Aç" butonundan bahsediyordu. Faz 05'te `quiz-list` üzerinde zaten inline `setActiveQuiz` toggle var (her satırda "Aktif Yap" / "Pasif Yap"). Quiz detay sayfasında ikinci bir CTA YAGNI olur; eklenmedi. Faz 07 (Realtime) bu UI'yı doğrudan kullanacak.

### 6. Schema `z.coerce.number()` yerine `z.number()`

Brief `z.coerce.number()` öneriyordu. RHF tipinde `z.input` `unknown`'a düşüyordu (`z.coerce`'un input semantiği) — form initialValues type-uyumsuz oluyordu. Şu çözüm uygulandı:
- Schema `z.number().int().min().max()` (coerce yok)
- Form input'larda explicit cast (`<Input type="number"` için `Number(e.target.value)`, `<Select>` için `Number(next)`)
- `QuestionFormInput` `{ durationSec: number; difficulty: number; ... }` net

Bu seçim form ergonomisini artırdı (Number.isFinite check'i durationSec için anlamlı: kullanıcı boş input bırakırsa NaN, `value=""` UI'da görünür).

### 7. `nullableString` ve `truncate` ortak modüllere taşındı (simplify pass)

`server/actions/quiz.ts:nullableString` ve `server/actions/question.ts:nullableString` birebir aynı tanım taşıyordu. Aynı şekilde `truncate` `question-table.tsx` + `delete-question-dialog.tsx`'te iki kopya local function vardı. `lib/strings.ts` altında tek noktaya alındı:

```ts
// lib/strings.ts
export function nullableString(value: string | undefined | null): string | null
export function truncate(text: string, limit: number): string
```

Faz 05 §9'da `lib/prisma-errors.ts`, `lib/colors.ts`, `parseFontKey` ortak modüllere taşınmasının devamı.

### 8. `lib/schemas/shared.ts` ile schema field reuse

`lib/schemas/question.ts:imageUrlField` ve `lib/schemas/quiz.ts:backgroundUrlField` aynı şekildeydi (`z.string().url().max(1000).optional().or(z.literal(""))`). `lib/schemas/shared.ts:optionalImageUrlField` altında tek tanım var, ikisi de re-export ediyor. Faz 07+ benzer URL field'lara genişletilebilir.

### 9. Question form Dialog wrapping + RHF reset

Dialog wrapping pattern'inde RHF `defaultValues` prop'u prop değişimine reaktif değil — `mode="edit"` aynı bileşen instance'ında farklı `question` ile çağrılırsa form taze değerleri göstermez. İlk implementasyonda `useEffect(open dep)` ile reset yapılmıştı; simplify pass'te `<Dialog onOpenChange>` handler'a alındı (event-driven, daha temiz):

```tsx
function handleOpenChange(next: boolean) {
  if (next) form.reset(initialValues);
  setOpen(next);
}
```

eslint-disable yorumu kalktı, hook dep listesi karmaşası kalktı.

### 10. `QuestionFormDialog` discriminated union sadeleştirildi

Brief'in `quizId?: undefined` / `question?: undefined` ek koruma alanları gerekmiyordu (TS discriminated union zaten `mode` üzerinden daraltıyor). Sadeleştirildi:

```ts
| { mode: "create"; quizId: string; trigger }
| { mode: "edit";   question: QuestionFormInitialData; trigger }
```

### 11. Tabloda görsel preview yerine icon işaret

Brief "image küçük thumb" diyordu. 50+ satırlık tabloda her satırda `<Image>` lazy olsa bile DOM/bandwidth maliyetli. `lucide-react:ImageIcon` rozetle "görsel var" işareti yeterli ve hızlı. Form-dialog'da preview zaten ImageUpload bileşeninde (büyük) görünüyor.

### 12. Per-row `useServerAction(reorderQuestion)` — kabul edilen mikro maliyet

`QuestionRow` her instance'ında kendi `useServerAction` hook'u var; N satır = N `useTransition`. Tek paylaşımlı transition kullanılsa her sıralama tıklamasında diğer butonlar da disable olur, UX kötüleşir. Mevcut pattern tek admin senaryosunda ve <50 soru beklenen quiz boyutunda kabul edilebilir maliyet.

---

## Etki (Sonraki Fazlar)

- **Faz 07 (Realtime):** Active quiz altındaki sorular `Quiz.isActive` toggle'ı + "Gönder" butonu ile Pusher channel'a yayınlanacak. `Question` modelinin tüm alanları (text, imageUrl, durationSec, difficulty) projeksiyon ekranına aynen taşınır. `reorderQuestion` server action'ı moderasyon sırasında sıra ayarlamak için kullanılabilir.
- **Faz 08 (Public sahne):** `QuestionFormDialog`'da preview göstermek için temel layout mantığı `<DialogContent>` içinde, sahne için ayrı bir component yazılır (full-screen, countdown, theme tokens).
- **Faz 09 (Polish):** Drag-to-reorder (`@dnd-kit/core`) opsiyonel; difficulty için ⭐ rating component değerlendirilir; image-upload tabloda thumbnail (lazy + intersection observer); soru sayısı eşik üstünde pagination veya virtualization.
- **Faz 10 (Security + Deploy):** Soru silindiğinde `Question.imageUrl` Blob orphan kalıyor — `del()` cleanup eklenir. `setActiveQuiz` ve `reorderQuestion` için rate-limit eklenebilir.
- **Faz 04/05'teki `useTransition + toast` callsite'ları:** Faz 06 sonrası back-port pass'inde `useServerAction`'a taşındı; tüm callsite'lar tek pattern kullanıyor.

## Doğrulama Sonuçları

- `npx prisma validate` ✓ "schema is valid 🚀"
- `npm run typecheck` ✓ 0 hata
- `npm run lint` ✓ 0 uyarı (React Compiler `form.watch` uyarısı `useWatch` ile giderildi)
- `npm run format:check` ✓ tüm dosyalar Prettier uyumlu
- `npm run build` ✓ (11 route, Proxy middleware dahil; `/quiz-admin/quizzes/[id]` artık `QuestionTable` ile dolu)
- Manuel test sırası (kod hazır, kullanıcı tarafından runtime'da koşulacak): brief'in "Manuel" checklist'i — 12 madde.
