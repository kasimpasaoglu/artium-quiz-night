# Faz 05 — Admin: Quiz CRUD

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 02, 03, 04

## Amaç

Admin'in quiz tanımlama akışını uçtan uca yapmak: quiz listesi (dashboard), yeni quiz oluşturma formu (başlık, açıklama, primary/accent/text renkleri, font seçimi, arka plan görseli upload), düzenleme, silme. Arkaplan görseli **client-direct upload** ile Vercel Blob'a yüklenecek (server endpoint signed URL üretir, dosya doğrudan Blob'a gider — bu pattern 4.5MB Vercel function body limit'ini aşar). Soru CRUD sonraki fazda.

## Kapsam Dışı (Out of Scope)

- Soru CRUD (Faz 06).
- Live mode / Pusher (Faz 07).
- Public ana ekranda quiz'in görüntülenmesi (Faz 08).
- Quiz silindiğinde Vercel Blob'taki görsellerin temizlenmesi (TODO olarak bırakılır, Faz 10 değerlendirir).
- Drag-to-reorder quiz (sıralama listede createdAt desc).

## Yapılacaklar (Checklist)

- [ ] `lib/blob.ts` — `generateUploadToken(filename)`: `@vercel/blob/client` ile signed URL üretme yardımcısı.
- [ ] `app/api/upload/route.ts` (admin guard) — POST: body `{ pathname: string, contentType: string }`, `requireAdmin()` çağır, `handleUpload` ile signed URL döndür.
- [ ] `hooks/use-blob-upload.ts` — client hook: file → `@vercel/blob/client` `upload(filename, file, { access: "public", handleUploadUrl: "/api/upload" })` → progress + result URL.
- [ ] `components/admin/image-upload.tsx` — file input + preview + upload progress + remove butonu, upload sonrası URL form state'ine yazılır.
- [ ] `components/admin/color-picker.tsx` — basit `<input type="color" />` + hex text input yan yana (senkron).
- [ ] `components/admin/font-select.tsx` — `lib/fonts.ts` whitelist'inden Select; her option font'un kendi className'i ile render edilir (preview).
- [ ] `components/admin/quiz-form.tsx` — react-hook-form + zod, tüm alanlar; createMode vs editMode prop.
- [ ] `server/actions/quiz.ts`:
  - `createQuiz(data: QuizFormData)`: `requireAdmin()`, zod validate, prisma create, `revalidatePath("/quiz-admin")`, redirect detay sayfasına.
  - `updateQuiz(id: string, data: QuizFormData)`: `requireAdmin()`, prisma update, revalidate.
  - `deleteQuiz(id: string)`: `requireAdmin()`, prisma delete (cascade soruları siler), revalidate.
  - `setActiveQuiz(id: string)`: `requireAdmin()`, transaction içinde önce tüm `Quiz.isActive=false`, sonra hedef `isActive=true`. (Faz 07'de live mode kullanacak ama action burada definelanır.)
- [ ] `app/quiz-admin/page.tsx` — quiz listesi (table: title, isActive badge, oluşturma tarihi, edit/delete butonları, "Yeni Quiz" CTA).
- [ ] `app/quiz-admin/quizzes/new/page.tsx` — `<QuizForm mode="create" />`.
- [ ] `app/quiz-admin/quizzes/[id]/edit/page.tsx` — quiz'i prisma'dan çek, `<QuizForm mode="edit" initialData={...} />`.
- [ ] `app/quiz-admin/quizzes/[id]/page.tsx` (placeholder, Faz 06 dolduracak) — şimdilik "Sorular Faz 06'da gelecek" + quiz başlık.
- [ ] Silme: confirm dialog (shadcn) + server action.
- [ ] `documents/blob-upload.md` — client-direct upload pattern açıklaması.
- [ ] `documents/hooks/use-blob-upload.md` — hook imza, return signature, error handling.

## Dokunulacak Dosyalar

- `lib/blob.ts` (YENİ).
- `app/api/upload/route.ts` (YENİ).
- `hooks/use-blob-upload.ts` (YENİ).
- `components/admin/image-upload.tsx` (YENİ).
- `components/admin/color-picker.tsx` (YENİ).
- `components/admin/font-select.tsx` (YENİ).
- `components/admin/quiz-form.tsx` (YENİ).
- `components/admin/delete-quiz-dialog.tsx` (YENİ).
- `server/actions/quiz.ts` (YENİ).
- `app/quiz-admin/page.tsx` (YENİ) — dashboard.
- `app/quiz-admin/quizzes/new/page.tsx` (YENİ).
- `app/quiz-admin/quizzes/[id]/edit/page.tsx` (YENİ).
- `app/quiz-admin/quizzes/[id]/page.tsx` (YENİ — placeholder).
- `types/quiz.ts` (YENİ) — `QuizFormData`, `Quiz` view tipi (Prisma'dan türetilmiş).

## Eklenecek Paketler

Yok — Faz 01'de `@vercel/blob`, `react-hook-form`, `@hookform/resolvers`, `zod` zaten eklendi.

> **Opsiyonel**: Daha güzel color picker için `react-colorful@^5` eklenebilir. İlk versiyonda native `input[type=color]` yeterli.

## Veri Modeli / Şema

**Quiz form zod schema:**
```ts
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const quizFormSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  backgroundUrl: z.string().url("Geçerli bir URL gerekli").optional().or(z.literal("")),
  primaryColor: z.string().regex(HEX_COLOR, "Hex renk kodu olmalı (#rrggbb)"),
  accentColor: z.string().regex(HEX_COLOR, "Hex renk kodu olmalı (#rrggbb)"),
  textColor: z.string().regex(HEX_COLOR, "Hex renk kodu olmalı (#rrggbb)"),
  fontKey: z.string().refine(
    (key) => key in FONT_WHITELIST,
    { message: "Geçersiz font seçimi" },
  ),
});

export type QuizFormData = z.infer<typeof quizFormSchema>;
```

**Upload endpoint contract:**
```ts
// POST /api/upload
// Body: { pathname: string, contentType: string }
// Response: signed upload URL (Vercel Blob handleUpload format)
```

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓
- `npx prisma validate` ✓

**Manuel:**
- Login → `/quiz-admin` quiz listesi (boş, "Yeni Quiz" butonu).
- "Yeni Quiz" → form: başlık "Kurtlar Vadisi Quiz Night", primary `#dc2626`, accent `#facc15`, text `#ffffff`, font "Bebas Neue", background görsel upload (büyük dosya 5MB+ ile test → client-direct upload başarılı olmalı).
- Kaydet → liste güncellendi (revalidatePath).
- Edit → mevcut değerler form'da, değiştir, kaydet.
- Delete → confirm → quiz silindi (sorular yok yine de).
- Vercel Blob dashboard'ında upload edilen dosya görünüyor mu.
- Yanlış hex (#fff gibi 3-haneli) → zod validation hatası Türkçe gösteriliyor.
- Auth: cookie sil → form submit → 401 / redirect.

## Deliverables

- `documents/blob-upload.md`:
  - Pattern: client `upload()` → POST /api/upload (signed URL üretir) → file Blob'a doğrudan → URL döner → form state'e yazılır.
  - 4.5MB Vercel function body limit'inin nasıl aşıldığı (server upload yerine client-direct).
  - `handleUpload` helper API'sinin döndürdüğü payload yapısı.
  - Error handling: upload iptal, auth fail, dosya boyut sınırı (Vercel Blob hobby 50MB/dosya).
  - Cleanup TODO: quiz silinince Blob'tan dosya silme — manuel yapılır veya Faz 10'da `del()` API'si ile otomatize.
- `documents/hooks/use-blob-upload.md`:
  - Imza: `useBlobUpload(): { upload: (file: File) => Promise<string>, isUploading: boolean, progress: number, error: string | null }`.
  - Kullanım örneği.
  - Bağımlılıklar: `@vercel/blob/client`.

## Riskler / Açık Sorular

- **`BLOB_READ_WRITE_TOKEN` local dev'de:** Kullanıcı Vercel projesi oluşturup `vercel env pull .env.local` ile token alacak. Yoksa upload fail. `.env.example`'da uyarı.
- **Cascade delete + Blob:** Quiz silinince DB'deki Question'lar cascade silinir; ama Blob'taki görseller orphan kalır. İlk versiyon kabul ediyor; Faz 10'da `await del(url)` ile cleanup eklenir.
- **isActive flag conflict:** İki admin aynı anda setActiveQuiz çağırırsa race condition; partial unique index DB-level garantili — biri 500 alır, kabul edilebilir. (Tek admin senaryosu var zaten.)
- **Background görseli format/boyut:** İlk versiyonda hiçbir validation yok (jpeg/png/webp tümü kabul). Faz 09'da min boyut + max boyut + format whitelist eklenebilir.
- **Font preview:** Select'te her font'un kendi className'ı ile gösterilmesi (`<SelectItem className={font.className}>Sample</SelectItem>`) Tailwind'de dinamik className üretmek için class'lar build-time'da var olmalı — `lib/fonts.ts`'de export edilen sabit className'ler kullanılır, sorun yok.

---

## Sapma Logu

_Agent faz bitiminde doldurur. Şu an boş._
