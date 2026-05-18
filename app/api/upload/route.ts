import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_IMAGE_TYPES,
  BLOB_FOLDERS,
  type BlobFolder,
  MAX_IMAGE_SIZE_BYTES,
  buildBlobPathname,
  isAllowedImageType,
} from "@/lib/blob";
import { env } from "@/lib/env";
import { problem } from "@/lib/problem";
import { requireAdmin } from "@/server/guards";

const SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);

// Server-side blob upload: client multipart form-data ile dosya gönderir,
// burada Vercel Blob'a put() ile yüklenir. Önceki client-direct akış (Vercel
// API'sine doğrudan PUT) production'da 400 + CORS hatası verdiği için kaldırıldı.
// Function body limit'i nedeniyle max dosya 4 MB (limit lib/blob.ts içinde).
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get("file");
    const folder = form.get("folder");

    if (!(file instanceof File)) {
      return problem("Dosya alınamadı.", 400);
    }
    if (typeof folder !== "string" || !(folder in BLOB_FOLDERS)) {
      return problem("Geçersiz klasör.", 400);
    }
    if (!isAllowedImageType(file.type)) {
      return problem(
        `Desteklenmeyen görsel formatı. ${ALLOWED_IMAGE_TYPES.join(", ")} olmalı.`,
        415,
      );
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return problem(`Dosya çok büyük (en fazla ${SIZE_MB} MB).`, 413);
    }

    const pathname = buildBlobPathname(folder as BlobFolder, file.name);
    const result = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Yükleme başarısız.";
    return problem(message, 500);
  }
}
