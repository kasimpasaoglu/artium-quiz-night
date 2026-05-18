"use client";

import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBlobUpload } from "@/hooks/use-blob-upload";
import { ALLOWED_IMAGE_TYPES, type BlobFolder, MAX_IMAGE_SIZE_BYTES } from "@/lib/blob";

interface ImageUploadProps {
  value: string | null | undefined;
  onChange: (next: string) => void;
  folder: BlobFolder;
  disabled?: boolean;
  description?: string;
}

const ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
const SIZE_MB = MAX_IMAGE_SIZE_BYTES / (1024 * 1024);

// Vercel Blob client-direct upload bileşeni. `useBlobUpload` hook'unu sarar,
// preview + progress + kaldır akışını yönetir. Faz 06 soru görselleri için
// `folder` prop'u ile tekrar kullanılır.
export function ImageUpload({ value, onChange, folder, disabled, description }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress, error, reset } = useBlobUpload(folder);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // aynı dosyayı tekrar seçebilmek için
    if (!file) return;
    try {
      const url = await upload(file);
      onChange(url);
      toast.success("Görsel yüklendi");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Yükleme başarısız";
      toast.error(message);
    }
  }

  function handleRemove() {
    onChange("");
    reset();
  }

  function openPicker() {
    fileInputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={handleFile}
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border border-input bg-muted">
            <Image
              src={value}
              alt="Arka plan önizleme"
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={openPicker}
            >
              Değiştir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={handleRemove}
            >
              Kaldır
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled || isUploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-muted/40 px-4 text-center text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-medium text-foreground">
            {isUploading ? "Yükleniyor..." : "Görsel seç veya bırak"}
          </span>
          <span className="text-xs">JPG, PNG veya WebP · en fazla {SIZE_MB} MB</span>
        </button>
      )}

      {isUploading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${Math.max(progress, 4)}%` }}
            aria-label={`Yükleme ilerlemesi: %${progress}`}
          />
        </div>
      )}

      {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
