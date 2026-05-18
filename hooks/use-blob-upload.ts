"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useState } from "react";
import {
  type BlobFolder,
  MAX_IMAGE_SIZE_BYTES,
  buildBlobPathname,
  isAllowedImageType,
} from "@/lib/blob";
import { API_ROUTES } from "@/lib/routes";

export interface UseBlobUploadResult {
  upload: (file: File) => Promise<string>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

const SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);

function mapError(error: unknown): string {
  if (error instanceof Error) {
    const m = error.message.toLowerCase();
    if (m.includes("content type")) {
      return "Desteklenmeyen görsel formatı (JPG, PNG veya WebP olmalı)";
    }
    if (m.includes("size") || m.includes("too large")) {
      return `Dosya çok büyük (en fazla ${SIZE_MB} MB)`;
    }
    if (m.includes("unauthorized") || m.includes("401")) {
      return "Yükleme yetkiniz yok, lütfen tekrar giriş yapın";
    }
    return error.message;
  }
  return "Yükleme başarısız";
}

// Client-direct upload hook: dosya doğrudan Vercel Blob'a yüklenir; sunucu
// yalnızca signed token üretir (`/api/upload`). 4.5MB Vercel function body
// limit'i bu yöntemle aşılır.
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

      console.log("[blob-upload] start", {
        name: file.name,
        type: file.type,
        size: file.size,
        folder,
      });

      try {
        const pathname = buildBlobPathname(folder, file.name);
        console.log("[blob-upload] pathname", pathname);
        const result = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: API_ROUTES.upload,
          contentType: file.type,
          onUploadProgress: ({ percentage }) => setProgress(percentage),
        });
        setProgress(100);
        return result.url;
      } catch (err) {
        console.error("[blob-upload] raw error", err);
        const message = mapError(err);
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
