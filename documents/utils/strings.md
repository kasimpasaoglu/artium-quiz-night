# `lib/strings.ts`

Genel amaçlı string helper'ları. Hem server (action input parsing) hem client (UI text truncation) tarafından kullanılır — pure function'lar, side effect yok.

## `nullableString(value)`

```ts
function nullableString(value: string | undefined | null): string | null
```

Form ya da query'den gelen string benzeri değeri DB'ye yazıma hazırlar:

- `undefined` veya `null` → `null`
- Trim sonrası boş string (`""`, `"   "`) → `null`
- Diğer durumlar → trim'lenmiş ham string

Kullanım yerleri: `server/actions/quiz.ts:parseQuizInput`, `server/actions/question.ts:parseQuestionInput`. Zod schema'ları opsiyonel string field'ları `.optional().or(z.literal(""))` ile kabul ediyor; DB'ye yazılmadan önce boş string'i `NULL`'a çeviriyoruz (`Quiz.description`, `Quiz.backgroundUrl`, `Question.imageUrl` nullable kolonları).

## `truncate(text, limit)`

```ts
function truncate(text: string, limit: number): string
```

Karakter sayısı `limit`'i aşan metni `…` (U+2026) ile keser. UI önizleme metinleri için.

Kullanım yerleri:
- `components/admin/question-table.tsx` (soru metni 100 char preview)
- `components/admin/delete-question-dialog.tsx` (silme onay metni 120 char preview)

Limit parametrik olduğu için her çağrı kendi context'inde uygun sınırı seçer. Çok kısa metinler için (50 char'dan az) UI'da CSS `truncate` class'ı genelde yeter; bu helper React text node'unda kesme istediğimiz zaman (örn. `<span className="font-medium">` içinde) gerekli.

## Bağımlılıklar

Yok — pure JS.

## Test İpuçları

Faz 09 / Faz 10 polish aşamasında unit test eklenebilir. Şu an kullanım sayısı az (4 callsite) ve davranış basit, ekstra test maliyeti gerekli değil.
