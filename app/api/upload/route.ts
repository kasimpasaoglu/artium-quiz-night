import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/blob";
import { env } from "@/lib/env";
import { requireAdmin } from "@/server/guards";

// Vercel Blob client-direct upload protokolünün server tarafı. İki tip event
// gelir:
//   1) `blob.generate-client-token` — admin onaylanır, allowed content-type +
//      size limit'leri token'a gömülür.
//   2) `blob.upload-completed` — Vercel'in webhook'u; cookie taşımaz, bu yüzden
//      auth burada yapılamaz. Token üretirken kontrol zaten yapıldı.
//
// `/api/upload` proxy matcher (`/api/admin/*`) dışında bırakılır: callback URL
// Vercel'den geldiğinde cookie yok, proxy yönlendirir ve flow kırılır. Auth
// `onBeforeGenerateToken` içinde sağlanır.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
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
        // `BlobPreconditionFailedError` ve benzeri hatalar Vercel tarafında
        // raporlanır.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme tokeni oluşturulamadı";
    return NextResponse.json({ title: message, status: 400 }, { status: 400 });
  }
}
