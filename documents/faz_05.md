# Faz 05 — Admin: Quiz CRUD

**Durum:** ✅ DONE — 2026-05-18
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

- [x] `lib/blob.ts` — `generateUploadToken(filename)`: `@vercel/blob/client` ile signed URL üretme yardımcısı.
- [x] `app/api/upload/route.ts` (admin guard) — POST: body `{ pathname: string, contentType: string }`, `requireAdmin()` çağır, `handleUpload` ile signed URL döndür.
- [x] `hooks/use-blob-upload.ts` — client hook: file → `@vercel/blob/client` `upload(filename, file, { access: "public", handleUploadUrl: "/api/upload" })` → progress + result URL.
- [x] `components/admin/image-upload.tsx` — file input + preview + upload progress + remove butonu, upload sonrası URL form state'ine yazılır.
- [x] `components/admin/color-picker.tsx` — basit `<input type="color" />` + hex text input yan yana (senkron).
- [x] `components/admin/font-select.tsx` — `lib/fonts.ts` whitelist'inden Select; her option font'un kendi className'i ile render edilir (preview).
- [x] `components/admin/quiz-form.tsx` — react-hook-form + zod, tüm alanlar; createMode vs editMode prop.
- [x] `server/actions/quiz.ts`:
  - `createQuiz(data: QuizFormData)`: `requireAdmin()`, zod validate, prisma create, `revalidatePath("/quiz-admin")`, redirect detay sayfasına.
  - `updateQuiz(id: string, data: QuizFormData)`: `requireAdmin()`, prisma update, revalidate.
  - `deleteQuiz(id: string)`: `requireAdmin()`, prisma delete (cascade soruları siler), revalidate.
  - `setActiveQuiz(id: string)`: `requireAdmin()`, transaction içinde önce tüm `Quiz.isActive=false`, sonra hedef `isActive=true`. (Faz 07'de live mode kullanacak ama action burada definelanır.)
- [x] `app/quiz-admin/page.tsx` — quiz listesi (table: title, isActive badge, oluşturma tarihi, edit/delete butonları, "Yeni Quiz" CTA).
- [x] `app/quiz-admin/quizzes/new/page.tsx` — `<QuizForm mode="create" />`.
- [x] `app/quiz-admin/quizzes/[id]/edit/page.tsx` — quiz'i prisma'dan çek, `<QuizForm mode="edit" initialData={...} />`.
- [x] `app/quiz-admin/quizzes/[id]/page.tsx` (placeholder, Faz 06 dolduracak) — şimdilik "Sorular Faz 06'da gelecek" + quiz başlık.
- [x] Silme: confirm dialog (shadcn) + server action.
- [x] `documents/blob-upload.md` — client-direct upload pattern açıklaması.
- [x] `documents/hooks/use-blob-upload.md` — hook imza, return signature, error handling.

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

**Tarih:** 2026-05-18

Memory kuralı: "Brief eski olabilir, güncel doğruyu tercih et." Faz 04 sapmaları üzerine inşa edildi (`requireAdmin` redirect, `lib/routes.ts`, `lib/schemas/`, `<Form>` primitive, useTransition + toast pattern hepsi reuse).

### 1. DESIGN.md §11 preset chip'leri eklendi

Brief preset chip'lerini bahsetmemişti. DESIGN.md §11 4 tema kombinasyonu öneriyor ("Önerilen Kombinasyonlar — tek tıkla 4 değer set edilir"). Kullanıcı onayı ile bu özellik form'a eklendi:

- `lib/quiz-presets.ts` — 4 sabit (Klasik Sahne / Atölye Sabahı / Caz Gecesi / Resim Atölyesi).
- `components/admin/preset-chips.tsx` — chip UI, click → `form.setValue` ile 4 alan dolar.
- `lib/quiz-presets.ts:DEFAULT_QUIZ_PRESET` form'un create-mode default'u (Klasik Sahne — DESIGN.md §13 default tema ile aynı).

### 2. `isActive` toggle quiz listesinde inline

Brief `setActiveQuiz` server action'ı tanımlıyor ama UI yeri belirtmiyordu. Kullanıcı onayı ile **liste sayfasında inline toggle**:

- `components/admin/quiz-list.tsx` — her satırda "Aktif Yap" / "Pasif Yap" butonu (`useTransition` + toast).
- Form'da `isActive` alanı yok. Faz 07 (live mode) bu UI'ı doğrudan kullanacak.

### 3. Vercel Blob client-direct upload — `/api/upload` proxy matcher dışında

Brief proxy konfigürasyonunu açık bırakmıştı. Şu kararla netleştirildi:

- `proxy.ts` matcher: `["/quiz-admin/:path*", "/api/admin/:path*"]` — `/api/upload` korumasız.
- Auth `app/api/upload/route.ts` içindeki `handleUpload({ onBeforeGenerateToken: async () => { await requireAdmin(); ... } })` callback'inde.
- Sebep: Vercel'in `blob.upload-completed` webhook'u cookie taşımaz; matcher'a alınırsa flow kırılır.

### 4. `BLOB_READ_WRITE_TOKEN` required → kullanıcı `vercel env pull` ile alacak

Faz 04 Pusher env'lerini optional yapmıştı (kullanılmıyordu). Faz 05 Blob upload **doğrudan** bu token'a bağımlı, bu yüzden `lib/env.ts`'de required'a çekildi:

```ts
BLOB_READ_WRITE_TOKEN: z.string().min(1, "BLOB_READ_WRITE_TOKEN zorunlu (Vercel Blob upload).")
```

Kullanıcı henüz token almadı (plan onayında "bu fazda alacağım" dedi). `npm run build` token gelene kadar `.env.local` doğrulamasında patlar — bu plan'da öngörülen davranış. Token alındığında `npm run build` geçer.

### 5. `react-colorful` paketi eklenmedi

Brief opsiyonel diyordu. Native `<input type="color">` + hex text input (yan yana, iki yön bağlı) yeterli kalite veriyor. Faz 09 polish'te değerlendirilebilir.

### 6. AlertDialog yerine Dialog (silme onayı)

`components/ui/` altında AlertDialog yok; yeni `npx shadcn add alert-dialog` çağrısı yapmamak için silme onayı mevcut `Dialog` ile yazıldı (`components/admin/delete-quiz-dialog.tsx`). Destructive button + "Vazgeç" / "Evet, sil" pattern Faz 06 (Question CRUD) için de yeniden kullanılabilir.

### 7. `image-upload` parametrik (`folder`) — Faz 06 reuse

Brief sadece quiz arka plan görseli için tasarlamıştı. Component `folder: "quizBackground" | "questionImage"` prop'u alacak şekilde yazıldı; Faz 06 soru görselleri için aynı bileşen tekrar kullanılır. `lib/blob.ts:BLOB_FOLDERS` map'i tek source.

### 8. `quiz-theme-preview` küçük bileşeni eklendi (brief'te yoktu)

Admin tema değişikliklerinin sahnede nasıl görüneceğini submit etmeden görebilsin diye küçük bir önizleme mockup'ı (`components/admin/quiz-theme-preview.tsx`). DESIGN.md §08 idle stage'in minicompoz'u. Form'da sağda sticky; detay sayfasında tema swatch'inin yanında.

### 9. Helper'ların ortak `lib/` modüllerine taşınması (simplify pass)

`code-simplifier` skill önerisiyle tekrarlanan kod ortak modüllere taşındı:

- **`lib/prisma-errors.ts`** (YENİ): `isUniqueViolation` (P2002), `isRecordNotFound` (P2025). Faz 04'teki `server/actions/auth.ts:isUniqueViolation` buraya taşındı. Faz 06+ aynı helper'ı kullanacak.
- **`lib/colors.ts`** (YENİ): `HEX_COLOR_RE`, `isHexColor`, `safeHexColor`. Daha önce 3 dosyada literal regex vardı; tek noktada tutulur.
- **`lib/fonts.ts:parseFontKey`** (eklenen): DB'den gelen `fontKey` whitelist üyesi garantili değil; bu helper sessizce `DEFAULT_FONT_KEY`'e düşer. `quiz-form.tsx` ve `quizzes/[id]/page.tsx`'teki `as FontKey` cast'leri kaldırıldı.
- `server/actions/quiz.ts:updateQuiz` ve `deleteQuiz` artık `P2025` yakalayıp Türkçe mesaja çeviriyor.
- `revalidateAdminQuizPaths(id)` `id` parametresi zorunlu yapıldı (ölü kod temizliği).
- `image-upload.tsx` `value as string` cast'i, narrowing ile düşürüldü (`{value ? ...}`).

### 10. shadcn ui zaten tam — `npx shadcn add` çağrısı yapılmadı

`components/ui/` zaten gerekli tüm primitive'leri içeriyordu: Form, Input, Label, Button, Card, Badge, Dialog, Dropdown Menu, Select, Separator, Table, Textarea. Faz 05'te yeni primitive eklenmedi; AlertDialog'u Dialog ile ikame edip ekstra paket eklemekten kaçınıldı.

### 11. Kontrast uyarısı (DESIGN.md §04) Faz 09'a ertelendi

Brief de aynı şekilde planlamış. `--quiz-text` vs `--quiz-primary` Δ-luminance kontrolü Faz 09 polish'te `quiz-form` altına nötr uyarı olarak gelecek.

---

## Etki (Sonraki Fazlar)

- **Faz 06 (Soru CRUD):** `lib/prisma-errors.ts`, `lib/colors.ts`, `parseFontKey` reuse. `image-upload.tsx` `folder="questionImage"` ile yeniden kullanılır. `delete-quiz-dialog` pattern'i `delete-question-dialog` için kopyalanabilir (veya `useServerAction` helper'a refactor — sonraki simplify önerisi).
- **Faz 07 (Realtime):** Quiz listesi `setActiveQuiz` / `deactivateQuiz` action'ları zaten yerinde; Pusher kanalı `Quiz.isActive` toggle'ında yayın yapacak.
- **Faz 08 (Public sahne):** Quiz tema alanları (`primaryColor`, `accentColor`, `textColor`, `fontKey`, `backgroundUrl`) `ThemeApplier`'ın okuyacağı kaynak. `QuizThemePreview` bileşeninin tam ekran versiyonu sahne idle state'i için temel alınabilir.
- **Faz 10 (Security + Deploy):** Orphan Blob cleanup (`@vercel/blob.del()`) `deleteQuiz` action'ına eklenir; rate limit `/api/upload`'a uygulanır; kontrast uyarısı (DESIGN.md §04) Faz 09'da değil burada da yer alabilir.

## Doğrulama Sonuçları

- `npm run typecheck` ✓ 0 hata
- `npm run lint` ✓ 0 hata
- `npm run format:check` ✓ tüm dosyalar Prettier uyumlu (`npm run format` ile düzeltildi)
- `npm run build` ⚠️ `BLOB_READ_WRITE_TOKEN` `.env.local` içinde boş olduğu için env validation'da fail oluyor. Bu **plan'da öngörülen davranış**: kullanıcı `vercel env pull .env.local` ile token alacak, sonra build geçecek. Implementation hazır.
- Manuel test: token gelince admin login → `/quiz-admin` → "Yeni Quiz" → preset chip → arka plan upload → kaydet → liste → "Aktif Yap" → "Düzenle" → "Sil" akışı plan'daki "Manuel" checklist'ine göre koşulmalı.
