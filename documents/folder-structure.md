# Klasör Yapısı

Faz 01 deliverable'ı: projenin top-level klasör yapısı, her klasörün amacı, naming konvansiyonu ve path alias kararı.

## Top-Level Klasörler

| Klasör | Amaç |
|---|---|
| `app/` | Next.js 16 App Router. Sayfalar, layout'lar, Route Handler'lar burada. |
| `app/(public)/` | Genel erişime açık sayfalar için route group. URL'e yansımaz; sadece organizasyon. Ana ekran (`/`) bu altında. |
| `app/quiz-admin/` | Admin paneli. Auth gerektirir (Faz 04+). |
| `app/api/` | Route Handler'lar (`route.ts`). REST tarzı endpoint'ler için. |
| `lib/` | Sunucu tarafı paylaşımlı util'ler. `env.ts` (zod validation), `logger.ts` (pino), ileride `auth.ts`, `prisma.ts` gibi modüller. |
| `db/` | Prisma client export'u + DB helper'ları (repository pattern). Faz 03'te dolacak. |
| `prisma/` | Prisma schema, migration'lar, seed script. `schema.prisma` Faz 01'de datasource + generator iskeletiyle hazır. |
| `components/ui/` | shadcn/ui generated primitive component'leri (Faz 02). |
| `components/admin/` | Admin paneline özel ortak component'ler. |
| `components/presentation/` | Ana ekran / sunum modu component'leri (modal, sayaç, progress bar). |
| `hooks/` | Paylaşımlı React hook'ları. Her hook için `documents/hooks/<hook-adi>.md` dökümantasyonu beklenir. |
| `server/actions/` | Server Action'lar. CRUD ve domain-specific aksiyonlar. |
| `types/` | Global TypeScript tip tanımları. Domain modeli ile UI arasındaki shared tipler. |
| `documents/` | Proje dokümantasyonu. Faz brief'leri (`faz_NN.md`), deliverable doküman'ları (`folder-structure.md`, `theme-tokens.md`, ...), `hooks/` ve `utils/` alt klasörleri. |
| `documents/hooks/` | Custom hook sözlüğü. Her hook için bir markdown (imza, parametre, dönüş tipi, kullanım, bağımlılık). |
| `documents/utils/` | Util fonksiyon sözlüğü. Aynı format. |
| `public/` | Statik asset'ler. (create-next-app default.) |

## Kök Dosyalar

| Dosya | Amaç |
|---|---|
| `proxy.ts` | Next.js 16 proxy (eski `middleware.ts`). Şu an pass-through; auth guard Faz 04'te eklenecek. Matcher: `/quiz-admin/:path*`, `/api/admin/:path*`. |
| `next.config.ts` | Next.js konfigürasyonu. `images.remotePatterns` Vercel Blob için tanımlı. |
| `tsconfig.json` | TypeScript strict + `@/*` path alias. |
| `eslint.config.mjs` | ESLint flat config. `eslint-config-next` + `eslint-config-prettier`. |
| `.prettierrc` / `.prettierignore` | Prettier konfigürasyonu. |
| `.husky/pre-commit` | `npx lint-staged` — staged dosyalarda ESLint + Prettier. |
| `.env.example` | Tüm env key'leri + Türkçe yorumlar. Yerel dev için `.env.local` kopyalanır. |

## Path Alias Kararı

`tsconfig.json` yalnızca tek bir alias barındırır:

```json
"paths": {
  "@/*": ["./*"]
}
```

Faz_01 brief'i ek alias açmayı bilgi-amaçlı önerdi (örn. `@/lib/*`, `@/components/*`), ancak mevcut single-alias yaklaşımı yeterli okunabilirlik sağlıyor:

- `import { env } from "@/lib/env"` — açık, kısa.
- `import Foo from "@/components/admin/Foo"` — relative path'in altına düşmüyor.

Çoklu alias eklenirse import path'leri daha kısa ama tooling konfigürasyonu (Prettier, ESLint plugin import resolver, jest moduleNameMapper, ...) her birinde tekrarlanması gerekir. Maintenance maliyeti faydadan büyük; bu nedenle tek alias kalsın.

## Naming Konvansiyonu

| Tür | Format | Örnek |
|---|---|---|
| Dosya adları | `kebab-case` | `quiz-list.tsx`, `use-active-quiz.ts` |
| React component export | `PascalCase` | `export function QuizList()` |
| Hook | `useXxx` (camelCase) | `useActiveQuiz`, `useCountdown` |
| Util fonksiyon | `camelCase` | `formatDuration`, `slugify` |
| TS tip / interface | `PascalCase` | `type Quiz`, `interface QuestionPayload` |
| Sabit | `UPPER_SNAKE_CASE` | `MAX_QUESTION_LENGTH` |
| Klasör | `kebab-case` (veya Next route group `(name)`) | `quiz-admin`, `(public)` |

## Server / Client Boundary

- Server Component default — `'use client'` direktifi gerektiğinde dosya tepesinde.
- `lib/` ve `server/` altındaki modüller `import "server-only"` ile koruma altına alınır (env, prisma, logger). Yanlışlıkla client'a sızması derleme hatasıyla yakalanır.
- Component'ler tipik olarak `components/ui/` (primitives) + `components/<domain>/` (composite) hiyerarşisinde.

## Boş Klasör Yönetimi

Henüz dosya barındırmayan klasörler `.gitkeep` ile track edilir. Gerçek dosya geldikçe `.gitkeep` silinir.

Şu an `.gitkeep` barındıran klasörler:

- `app/(public)/`, `app/quiz-admin/`, `app/api/`
- `db/`
- `components/ui/`, `components/admin/`, `components/presentation/`
- `hooks/`
- `server/actions/`
- `types/`
- `documents/hooks/`, `documents/utils/`
