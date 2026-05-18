"use client";

import { useCallback, useState } from "react";
import { type BlobFolder, MAX_IMAGE_SIZE_BYTES, isAllowedImageType } from "@/lib/blob";
import { API_ROUTES } from "@/lib/routes";

export interface UseBlobUploadResult {
  upload: (file: File) => Promise<string>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);

// Server-side upload hook: dosyayı FormData ile `/api/upload`'a POST eder.
// Server `put()` ile Vercel Blob'a yükler ve final URL'i döner. Cross-origin
// PUT yapılmadığı için CORS sorunu yoktur; karşılığında max dosya boyutu
// Vercel function body limit (4.5 MB) ile sınırlıdır.
export function useBlobUpload(folder: BlobFolder): UseBlobUploadResult {
  const [isUploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const start = useCallback(
    async (file: File): Promise<string> => {
      if (!isAllowedImageType(file.type)) {
        const message = "Desteklenmeyen görsel formatı (JPG, PNG veya WebP olmalı)";
        setError(message);
        throw new Error(message);
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const message = `Dosya çok büyük (en fazla ${SIZE_MB} MB)`;
        setError(message);
        throw new Error(message);
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", folder);

        const response = await fetch(API_ROUTES.upload, {
          method: "POST",
          body: form,
        });

        if (!response.ok) {
          let detail = "Yükleme başarısız";
          try {
            const data = (await response.json()) as { title?: string };
            if (typeof data.title === "string" && data.title.length > 0) {
              detail = data.title;
            }
          } catch {}
          throw new Error(detail);
        }

        const data = (await response.json()) as { url: string };
        setProgress(100);
        return data.url;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Yükleme başarısız";
        setError(message);
        throw new Error(message);
      } finally {
        setUploading(false);
      }
    },
    [folder],
  );

  return { upload: start, isUploading, progress, error, reset };
}
