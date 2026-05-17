# Faz 10 — Security + Deploy + Docs

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 09

## Amaç

Uygulamayı production'a hazır hale getirmek: login endpoint'ine rate limit (Upstash), opsiyonel Sentry error tracking, CSP header, README, Vercel deploy guide, security checklist. Bu fazdan sonra kullanıcı kendi Vercel hesabına deploy edebilir ve ilk quiz gecesini canlı yapabilir.

## Kapsam Dışı (Out of Scope)

- Yeni feature.
- Multi-region deployment.
- Custom domain SSL (Vercel otomatik).
- Backup stratejisi (monsterasp.net kendi panel).

## Yapılacaklar (Checklist)

- [ ] **Rate limit (login brute-force):**
  - `npm i @upstash/ratelimit @upstash/redis`.
  - Kullanıcı Upstash Redis hesabı açar, REST URL + token alır.
  - `.env.example` ekle: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
  - `lib/env.ts` opsiyonel olarak kontrol et (yoksa rate limit no-op, dev'de gerek yok).
  - `lib/ratelimit.ts`:
    ```ts
    import { Ratelimit } from "@upstash/ratelimit";
    import { Redis } from "@upstash/redis";
    import { env } from "@/lib/env";

    export const loginRatelimit = env.UPSTASH_REDIS_REST_URL
      ? new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN!,
          }),
          limiter: Ratelimit.slidingWindow(5, "15 m"),
          analytics: true,
          prefix: "ratelimit:login",
        })
      : null;
    ```
  - `app/api/auth/login/route.ts` başında: IP al (`request.headers.get("x-forwarded-for") ?? "unknown"`), `loginRatelimit?.limit(ip)` çağır, success false → 429 ProblemDetails "Çok fazla başarısız deneme, 15 dakika sonra tekrar deneyin."
- [ ] **Sentry (opsiyonel):**
  - `npm i @sentry/nextjs`.
  - `.env.example` ekle: `NEXT_PUBLIC_SENTRY_DSN` (opsiyonel).
  - `npx @sentry/wizard@latest -i nextjs` (manuel adımlarla da olur).
  - Config dosyalarında `if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;` early-return (env yoksa no-op).
  - Test: `/api/test-error` (sadece dev'de) bir hata fırlatır, Sentry dashboard'da görünür mü.
  - Kapsam dışı: Production deploy edilince doğrulanacak.
- [ ] **CSP headers:**
  - `next.config.ts`'ye `headers()`:
    ```ts
    async headers() {
      return [{
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.pusher.com https://*.sentry.io",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
            "connect-src 'self' wss://ws-*.pusher.com https://sockjs-*.pusher.com https://*.sentry.io https://*.upstash.io",
            "frame-ancestors 'none'",
          ].join("; ") },
        ],
      }];
    }
    ```
- [ ] **README.md:**
  - Proje tanımı.
  - Tech stack tablosu (project.md'den).
  - Kurulum: clone, npm install, `.env.local` doldur, prisma migrate, seed, npm run dev.
  - Default credentials: `admin / admin` (ilk login'den sonra değiştir uyarısı).
  - Faz listesi durumu.
  - Lisans (eğer var).
- [ ] **`documents/deploy.md`:**
  - Vercel projesi oluşturma adımları.
  - Env vars Vercel dashboard'a eklenecek liste (DATABASE_URL, SESSION_SECRET, PUSHER_*, BLOB_READ_WRITE_TOKEN, UPSTASH_*, NEXT_PUBLIC_*).
  - Vercel Blob: dashboard → Storage → Blob create → token kopyala.
  - Pusher: cluster seçimi (`eu`), key'leri kopyala.
  - Upstash Redis: free instance create, REST credentials kopyala.
  - MSSQL connection string formatı (monsterasp.net).
  - İlk deploy sonrası: `vercel env pull .env.local` (local sync), `npx prisma migrate deploy`, `npx prisma db seed` (production DB'ye admin seed — manuel `vercel run` veya local'den production DB'ye yönelterek).
  - Custom domain bağlama (opsiyonel).
  - Önemli: `SESSION_SECRET` production'da rotation rehberi.
  - Health check: `/` ve `/quiz-admin/login` 200 dönüyor mu.
- [ ] **`documents/security.md`:**
  - SQL injection: Prisma parametrize ✓.
  - XSS: React default escape ✓; `dangerouslySetInnerHTML` kullanım denetimi (yok olmalı, varsa whitelist).
  - CSRF: httpOnly cookie + SameSite=Lax + POST-only mutations.
  - Rate limit: login 5/15dk.
  - Auth secrets: `SESSION_SECRET` min 32 char, prod'da rotate edilebilir.
  - Cookie: `Secure` prod-only, `HttpOnly`, `SameSite=Lax`.
  - File upload: Vercel Blob signed URL pattern, sadece admin auth ile.
  - DB connection: TLS (encrypt=true).
  - CSP: header'da listelendi.
  - Eksikler / future hardening: 2FA, audit log, IP whitelist admin panel.
- [ ] `project.md`'yi güncelle: "Çalıştırma" bölümünü doldur, fazları done işaretle (kendi fazı dahil).
- [ ] `.env.example` final review — tüm key'ler + yorumlar doğru.

## Dokunulacak Dosyalar

- `lib/ratelimit.ts` (YENİ).
- `lib/env.ts` — Upstash + Sentry env'leri ekle (opsiyonel).
- `app/api/auth/login/route.ts` — rate limit entegrasyonu.
- `next.config.ts` — `headers()` fonksiyonu.
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (YENİ, Sentry wizard üretir).
- `instrumentation.ts` (YENİ, Sentry wizard üretir).
- `README.md` (YENİ veya mevcut template README'yi değiştir).
- `documents/deploy.md` (YENİ).
- `documents/security.md` (YENİ).
- `.env.example` — final review.
- `project.md` — Çalıştırma bölümü dolu, faz durumları güncel.

## Eklenecek Paketler

- `@upstash/ratelimit@^2`
- `@upstash/redis@^1`
- `@sentry/nextjs@^8` (opsiyonel)

## Veri Modeli / Şema

Yok.

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓
- `npm run format:check` ✓

**Manuel:**
- Login endpoint'e 6 ardışık yanlış password POST → 6.sı 429 ile "Çok fazla deneme...".
- 15 dakika bekle → sayaç sıfırlandı, tekrar 5 deneme hakkı.
- Production'a deploy (Vercel) → `https://<proje>.vercel.app/quiz-admin/login` açılıyor.
- Vercel env vars tam: dashboard'dan kontrol.
- DB connection prod'da çalışıyor mu: login deneyince DB sorgusu başarılı.
- CSP header response'da var mı: DevTools Network → response headers.
- `https://securityheaders.com/?q=<url>` skorlama: A veya A+ hedef.
- Sentry: test endpoint tetikle → Sentry dashboard'da event görünüyor mu (env varsa).
- README adımları takip edilerek temiz bir makinede kurulum başarılı mı.

## Deliverables

- `README.md`:
  - Proje tanımı (kısa).
  - Tech stack tablosu.
  - Kurulum (clone → install → env → migrate → seed → dev).
  - Default credentials uyarısı.
  - Faz durumu özeti (project.md'ye link).
  - Deploy'a link.
- `documents/deploy.md`:
  - Vercel adımları (proje oluştur, env, deploy, custom domain).
  - 3rd party servis kurulumu: Vercel Blob, Pusher, Upstash Redis.
  - MSSQL connection string formatı.
  - Production seed: tek seferlik manuel adım.
  - Health check + smoke test.
- `documents/security.md`:
  - SQL/XSS/CSRF kontrol listesi.
  - Auth secrets ve rotation.
  - CSP detayı.
  - Future hardening önerileri.

## Riskler / Açık Sorular

- **Upstash free tier:** 10K command/gün — login rate limit için fazlasıyla yeterli.
- **Sentry free tier:** 5K event/ay — quiz uygulaması için yeterli; istek-bazlı tracing'de aşılabilir.
- **CSP `'unsafe-inline'` script:** Next.js inline script (preload, hydration) kullanıyor; nonce stratejisine geçmek için ek iş gerekir. İlk sürümde `'unsafe-inline'` kabul, Faz 10+ hardening.
- **Production seed:** `prisma db seed` Vercel'de otomatik çalışmaz; ilk deploy sonrası manuel `vercel env pull` + local'den production DB'ye yönelterek `npx prisma db seed`. Risk: yanlışlıkla local'de prod DB'ye seed atmak. Net adım dokümante edilmeli.
- **MSSQL prod connection encrypt:** monsterasp.net certificate'ı self-signed olabilir; `trustServerCertificate=true` gerekirse not düşülmeli (güvenlik trade-off açıklanmalı).
- **Sentry sourcemaps:** Vercel + Sentry entegrasyonu sourcemaps upload otomatik, ama auth token gerekir; deploy.md'de adım.
- **Custom domain DNS:** Bu kapsam dışı; kullanıcı kendi domain'i bağlarsa Vercel UI rehberlik eder.

---

## Sapma Logu

_Agent faz bitiminde doldurur. Şu an boş._
