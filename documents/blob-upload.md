# Vercel Blob Client-Direct Upload

Faz 05'te quiz arka plan görseli (Faz 06'da soru görselleri) Vercel Blob'a **client-direct** yöntemiyle yüklenir. Server endpoint yalnız signed token üretir; dosya doğrudan Blob altyapısına gönderilir. Bu sayede Vercel function body'sinin **4.5 MB** sınırı aşılır — kullanıcı 10 MB'a kadar dosya yükleyebilir.

## Akış (sekans)

```
[Tarayıcı]                            [Next.js Route Handler]                 [Vercel Blob]
    │                                            │                                  │
    │ 1. upload(pathname, file, opts)            │                                  │
    │───────────────────────────────────────────▶│                                  │
    │   POST /api/upload                         │                                  │
    │   body: { type: "blob.generate-client-token", payload: { pathname, ... } }    │
    │                                            │                                  │
    │                                            │  2. handleUpload({ ... })        │
    │                                            │     onBeforeGenerateToken:       │
    │                                            │       a) await requireAdmin()    │
    │                                            │       b) allowedContentTypes     │
    │                                            │       c) maximumSizeInBytes      │
    │                                            │  3. clientToken üret             │
    │                                            │──── BLOB_READ_WRITE_TOKEN ──────▶│
    │                                            │                                  │
    │ 4. clientToken döner                       │                                  │
    │◀───────────────────────────────────────────│                                  │
    │                                            │                                  │
    │ 5. PUT dosya (multipart)                                                      │
    │──────────────────────────────────────────────────────────────────────────────▶│
    │                                                                               │
    │ 6. PutBlobResult { url, pathname, contentType, ... }                          │
    │◀──────────────────────────────────────────────────────────────────────────────│
    │                                                                               │
    │ 7. POST /api/upload                        │                                  │
    │    body: { type: "blob.upload-completed", payload: { blob, tokenPayload } }   │
    │───────────────────────────────────────────▶│                                  │
    │                                            │ 8. handleUpload → onUploadCompleted │
    │                                            │    (DB write opsiyonel; bu projede no-op)│
    │ 9. { type: "blob.upload-completed", response: "ok" }                          │
    │◀───────────────────────────────────────────│                                  │
```

## Server tarafı — `app/api/upload/route.ts`

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  const result = await handleUpload({
    body,
    request,
    token: env.BLOB_READ_WRITE_TOKEN,
    onBeforeGenerateToken: async () => {
      await requireAdmin();
      return {
        allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
        maximumSizeInBytes: MAX_IMAGE_SIZE_BYTES,
        addRandomSuffix: true,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      };
    },
    onUploadCompleted: async () => {
      // URL form üzerinden quiz/soru kaydına yazılır; burada DB write yok.
    },
  });
  return NextResponse.json(result);
}
```

### Önemli noktalar

- **Auth:** `onBeforeGenerateToken` içinde `requireAdmin()` çağrılır. Token üretilmeden önce admin doğrulanır; başarısızsa redirect (Next.js `NEXT_REDIRECT` error) yukarı bubble olur ve client `401`'i toast'a basar.
- **Proxy:** `proxy.ts` matcher'ı `/api/admin/:path*` ile sınırlı. `/api/upload` matcher'ın dışında; çünkü Vercel'in `blob.upload-completed` webhook'u cookie taşımaz — proxy bunu yönlendirirse flow kırılır. Auth `onBeforeGenerateToken` callback'inde yapılır.
- **`addRandomSuffix: true`:** Aynı isimli dosyalar override edilmez; her upload benzersiz bir URL üretir.
- **`cacheControlMaxAge: 1 yıl`:** Görseller içerikleri değişmez (random suffix), uzun cache güvenli.
- **`token` opsiyonu:** Vercel dağıtımında `BLOB_READ_WRITE_TOKEN` otomatik tanınır; biz `env` üzerinden explicit veriyoruz ki local dev'de de çalışsın.

## Client tarafı — `hooks/use-blob-upload.ts`

Bkz. [hooks/use-blob-upload.md](hooks/use-blob-upload.md).

## Allowed content types ve boyut

`lib/blob.ts` tek nokta:

```ts
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const BLOB_FOLDERS = {
  quizBackground: "quiz-backgrounds",
  questionImage: "question-images",
};
```

Hem client (pre-check) hem server (token claim) bu sabitleri kullanır. Server tarafında Vercel Blob altyapısı **content-type'ı ayrıca doğrular**; client preflight bypass edilirse Vercel reddeder.

## 4.5 MB body limit'i nasıl aşıldı

Klasik server upload (`fetch('/api/upload', { body: file })`) Vercel serverless function gövdesinde dosyayı toplar — bu gövde Vercel Hobby/Pro planlarında **4.5 MB** ile sınırlı. Client-direct upload'da function yalnızca **küçük JSON token isteği** alır; dosyanın kendisi Vercel Blob'un upload endpoint'ine **doğrudan** PUT edilir. Böylece 10 MB (veya plan limit'i kadar — Hobby'de 50 MB/dosya, 500 MB toplam) yüklenebilir.

## Orphan görseller (Faz 10 TODO)

- Quiz silindiğinde Prisma cascade ile sorular silinir, ama Blob'taki görseller **kalır**.
- Faz 10'da `@vercel/blob` `del(url)` API'si ile cleanup yapılır: `deleteQuiz` action'ı önce ilgili tüm görselleri toplar, sonra DB silmesinden önce/sonra `del()` çağırır.
- Şu an için: Blob dashboard'undan periyodik manuel temizleme.

## Hata kaynakları

| Hata | Sebep | Kullanıcıya gösterim |
|---|---|---|
| 401 / `UNAUTHORIZED` | Cookie yok veya geçersiz | "Yükleme yetkiniz yok, lütfen tekrar giriş yapın" |
| Content-type reddi | JPG/PNG/WebP dışı dosya | "Desteklenmeyen görsel formatı (JPG, PNG veya WebP olmalı)" |
| Boyut aşımı | > 10 MB | "Dosya çok büyük (en fazla 10 MB)" |
| Token üretim hatası | `BLOB_READ_WRITE_TOKEN` yok / geçersiz | "Yükleme tokeni oluşturulamadı" |

## İlişkili dosyalar

- [lib/blob.ts](../lib/blob.ts) — sabitler
- [app/api/upload/route.ts](../app/api/upload/route.ts) — server handler
- [hooks/use-blob-upload.ts](../hooks/use-blob-upload.ts) — client hook
- [components/admin/image-upload.tsx](../components/admin/image-upload.tsx) — UI bileşeni
