import dotenv from "dotenv";

// Prisma CLI ve seed CLI birbirinden bağımsız process'ler. Next.js runtime
// env yüklemesi (`lib/env.ts`) `server-only` olduğu için burada kullanılamaz;
// bu helper CLI bağlamı için minimal env loader sağlar.
//
// Sıra: `.env.local` > `.env`. İkinci `dotenv.config` default'ta override
// etmediği için yalnız eksik anahtarları doldurur. `quiet: true` dotenv v17
// reklam satırlarını stdout'tan siler — `prisma migrate diff --script`
// çıktısının başına karışmasını önler.

export function loadCliEnv(): void {
  dotenv.config({ path: ".env.local", quiet: true });
  dotenv.config({ path: ".env", quiet: true });
}

export function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL tanımlı değil (.env.local veya .env).");
  }
  return value;
}
