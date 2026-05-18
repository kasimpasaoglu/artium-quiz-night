# `useBlobUpload(folder)`

Vercel Blob client-direct upload akışını yöneten React hook. Faz 05'te quiz arka plan görseli, Faz 06'da soru görseli için aynı hook kullanılır.

## İmza

```ts
function useBlobUpload(folder: BlobFolder): {
  upload: (file: File) => Promise<string>;
  isUploading: boolean;
  progress: number;       // 0 - 100
  error: string | null;
  reset: () => void;
};
```

`BlobFolder` tipi `lib/blob.ts`'de tanımlı (`"quizBackground" | "questionImage"`). Hook, dosyayı `BLOB_FOLDERS[folder]/<sanitized-filename>` pathname'i ile yükler; sonuç URL'i `Promise` olarak döner.

## Davranış

- **Preflight:** Dosya `lib/blob.ts` içindeki `ALLOWED_IMAGE_TYPES` ve `MAX_IMAGE_SIZE_BYTES` ile lokal kontrolden geçer. Reddedilirse network çağrısı yapılmaz; `error` state'i set edilir ve Promise reject olur.
- **Multipart:** `multipart: true` ile büyük dosyalar paralel parçalanır ve başarısız parçalar otomatik yeniden denenir.
- **Progress:** `@vercel/blob/client.upload`'un `onUploadProgress` callback'i `percentage` döner; hook bunu state'e basar (`progress`).
- **Hata haritası:** Vercel Blob'un hatası `mapError` ile Türkçe mesaja çevrilir (content type, size, unauthorized, generic).
- **`reset()`:** Sonraki upload öncesi progress + error temizliği için.

## Kullanım

```tsx
"use client";

import { useBlobUpload } from "@/hooks/use-blob-upload";

export function MyForm() {
  const { upload, isUploading, progress, error } = useBlobUpload("quizBackground");

  async function onPick(file: File) {
    try {
      const url = await upload(file);
      // url'i form state'ine yaz
    } catch {
      // hook zaten `error`'a yazdı, toast/etc.
    }
  }

  return (
    <>
      <input type="file" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      {isUploading && <progress value={progress} max={100} />}
      {error && <p role="alert">{error}</p>}
    </>
  );
}
```

`components/admin/image-upload.tsx` bu hook'u sarar; preview + "Değiştir" / "Kaldır" akışını UI'da yönetir.

## Bağımlılıklar

- `@vercel/blob/client` — `upload`, types.
- `lib/blob.ts` — `BLOB_FOLDERS`, `ALLOWED_IMAGE_TYPES`, `MAX_IMAGE_SIZE_BYTES`, `buildBlobPathname`, `isAllowedImageType`.
- `lib/routes.ts` — `API_ROUTES.upload`.

## Server karşılığı

Hook `API_ROUTES.upload` (`/api/upload`) endpoint'ine yönelir. Server tarafı detay için bkz. [blob-upload.md](../blob-upload.md).

## Hata mesajları (Türkçe)

| Durum | Mesaj |
|---|---|
| Format reddi | "Desteklenmeyen görsel formatı (JPG, PNG veya WebP olmalı)" |
| Boyut aşımı | "Dosya çok büyük (en fazla 10 MB)" |
| Auth | "Yükleme yetkiniz yok, lütfen tekrar giriş yapın" |
| Generic | "Yükleme başarısız" |
