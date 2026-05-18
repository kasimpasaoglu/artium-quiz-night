// Vercel Blob için ortak sabitler (lib/blob.ts) — client (`use-blob-upload`)
// hem de server (`app/api/upload/route.ts`) tarafından paylaşılır. Tek noktadan
// kontrat: hangi pathname prefix'leri kabul edilir, hangi content-type'lar
// allow'lanır, max boyut nedir.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Vercel Blob içinde dosyalar bu prefix'lerin altında tutulur. Faz 06 soru
// görselleri için `questionImage` tekrar kullanılır.
export const BLOB_FOLDERS = {
  quizBackground: "quiz-backgrounds",
  questionImage: "question-images",
} as const;

export type BlobFolder = keyof typeof BLOB_FOLDERS;

export function buildBlobPathname(folder: BlobFolder, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${BLOB_FOLDERS[folder]}/${safe}`;
}

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}
