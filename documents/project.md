## Tech Stack

| Katman | Teknoloji | Not |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router) + React 19.2.4 | `middleware.ts` yerine `proxy.ts`; async API'ler `await` ile |
| Dil | TypeScript strict | `@/*` alias |
| Styling | Tailwind v4 | `@import "tailwindcss"`, `@theme inline` |
| UI primitives | shadcn/ui + Radix + `lucide-react` + `sonner` | |
| Form & validation | `react-hook-form` + `zod` + `@hookform/resolvers` | |
| ORM | Prisma | provider: `sqlserver` |
| DB | MSSQL | monsterasp.net üzerinde ücretsiz instance |
| Auth | JWT (`jose`) + `bcryptjs`, httpOnly cookie | `proxy.ts` guard + `requireAdmin()` server-action helper |
| Realtime | Pusher Channels | `pusher` server SDK + `pusher-js` client |
| Asset storage | Vercel Blob | `@vercel/blob` client-direct upload |
| Env validation | `zod` ile `lib/env.ts` | build-time check |
| Logger | `pino` + `pino-pretty` | serverless-friendly |
| Rate limit | `@upstash/ratelimit` + Upstash Redis | Faz 10'da login için |
| Date/time | `date-fns` | sayaç matematiği |
| Deploy | Vercel | |
| URL stratejisi | Subpath `/quiz-admin` | route group ile ayrılmış, subdomain değil |
| Dil tag | `<html lang="tr">` | CLAUDE.md Türkçe zorunluluğu |

## Faz Durumu

| # | Faz | Durum | Tamamlanma | Belge |
|---|---|---|---|---|
| 01 | İskelet & Konfigürasyon | ✅ DONE | 2026-05-18 | [faz_01.md](./documents/faz_01.md) |
| 02 | UI Foundation | ✅ DONE | 2026-05-18 | [faz_02.md](./documents/faz_02.md) |
| 03 | DB Şema + Migration + Seed | ✅ DONE | 2026-05-18 | [faz_03.md](./documents/faz_03.md) |
| 04 | Auth Sistemi | ✅ DONE | 2026-05-18 | [faz_04.md](./documents/faz_04.md) |
| 05 | Admin: Quiz CRUD | ✅ DONE | 2026-05-18 | [faz_05.md](./documents/faz_05.md) |
| 06 | Admin: Soru CRUD | ✅ DONE | 2026-05-18 | [faz_06.md](./documents/faz_06.md) |
| 07 | Realtime + Admin Live Mode | ✅ DONE | 2026-05-18 | [faz_07.md](./documents/faz_07.md) |
| 08 | Ana Ekran (Sunum) | ⬜ TODO | — | [faz_08.md](./documents/faz_08.md) |
| 09 | Polish + Mobile + A11y | ⬜ TODO | — | [faz_09.md](./documents/faz_09.md) |
| 10 | Security + Deploy + Docs | ⬜ TODO | — | [faz_10.md](./documents/faz_10.md) |

**Durum sembolleri:** ⬜ TODO · 🟡 IN PROGRESS · ✅ DONE

## Çalıştırma

> Faz 10 tamamlandıktan sonra doldurulacak. Şu an `.env.local` yok, DB şeması yok.
>
> Geçici: `npm run dev` → `http://localhost:3000` (sadece create-next-app template gösterir).

Faz 10 sonrası beklenen akış:
```bash
npm install
cp .env.example .env.local        # değerleri doldur (DATABASE_URL, SESSION_SECRET, PUSHER_*, BLOB_READ_WRITE_TOKEN, ...)
npx prisma migrate deploy
npx prisma db seed                 # initial admin: admin / admin
npm run dev
```

## Faz Sonu Protokolü (Her Agent Uyacak)

1. **`simplify` skill'i** ile yazdığı kodu review et — lüzumsuz soyutlama, tekrar, dead code temizle.
2. **`documents/` altına yaz:**
   - Faza özel deliverable (örn. Faz 07 sonu `documents/pusher-protocol.md`).
   - Yeni eklediği her custom hook için `documents/hooks/<hook-adi>.md` (imza, parametreler, dönüş tipi, kullanım örneği, bağımlılıklar).
   - Yeni eklediği her util fonksiyon için `documents/utils/<util-adi>.md` (aynı format).
   - Bu sayede sonraki agent benzer ihtiyaçta yeniden yazmaz, mevcudu kullanır.
3. **`documents/faz_XX.md` dosyasını güncelle:**
   - Başlıktaki **Durum**'u `✅ DONE` + tamamlama tarihi (ISO) yap.
   - Checklist'i `[x]` olarak işaretle.
   - "Sapma Logu" bölümünü doldur (planlanmadık ne değişti, neden, başka fazı etkiler mi).
   - Sapmalarda Brief ile çelişen yapılarda en dogru en güncel çözümleri tercih et. Brief out of date ve ya ilgili sapmayı düşünmeden hazırlanmış olabilir.
4. **Bu `project.md` tablosunda** kendi satırını `✅ DONE` + tarih olarak işaretle.
5. (Opsiyonel) Stage & commit — message: `feat(faz-XX): <kısa özet>`.

## Dokümanlar (Fazlar İlerledikçe Dolar)

- [Klasör Yapısı](./documents/folder-structure.md) — Faz 01
- [Tema Tokenları](./documents/theme-tokens.md) — Faz 02
- [Font Whitelist](./documents/font-whitelist.md) — Faz 02
- [DB Şema](./documents/db-schema.md) — Faz 03
- [Auth Akışı](./documents/auth-flow.md) — Faz 04
- [Blob Upload Pattern](./documents/blob-upload.md) — Faz 05
- [Soru Modeli](./documents/question-model.md) — Faz 06
- [Pusher Protokolü](./documents/pusher-protocol.md) — Faz 07
- [Tema Sistemi](./documents/theme-system.md) — Faz 08
- [Accessibility](./documents/accessibility.md) — Faz 09
- [Deploy](./documents/deploy.md) — Faz 10
- [Security](./documents/security.md) — Faz 10
- [Hook Sözlüğü](./documents/hooks/)
- [Util Sözlüğü](./documents/utils/)

## Ana Plan Referansı

Bu fazları üreten ana plan dosyası (mimari kararlar, klasör yapısı tablosu, faz briefleri):
`/Users/kasimpasaoglu/.claude/plans/sifirdan-bir-proje-olusturacagiz-abundant-brooks.md`
