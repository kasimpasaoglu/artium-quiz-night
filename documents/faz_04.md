# Faz 04 — Auth Sistemi

**Durum:** ✅ DONE — 2026-05-18
**Önkoşul fazlar:** 02, 03

## Amaç

JWT tabanlı, sektör standardı bir admin auth sistemi kurmak: `jose` ile token sign/verify (Edge runtime uyumlu), `bcryptjs` ile şifre hash/compare, httpOnly secure cookie ile session, `proxy.ts` ile `/quiz-admin/*` ve `/api/admin/*` koruması, server actions için `requireAdmin()` helper (çünkü `proxy.ts` server action endpoint'lerinde çalışmaz), login/logout API, admin'in username + şifre değiştirebileceği settings sayfası. SQL injection vb. yüzeysel açıklara karşı: tüm DB erişimi Prisma parametrize, kullanıcı input'u zod ile validate.

## Kapsam Dışı (Out of Scope)

- Quiz/soru CRUD UI veya server actions (Faz 05/06).
- Rate limiting (Faz 10 — login brute-force koruması orada).
- Multi-admin desteği (şimdilik tek admin).
- Password reset via email (out of scope, manuel hash güncellemesi var).
- 2FA/MFA.

## Yapılacaklar (Checklist)

- [x] `lib/env.ts`'e `SESSION_SECRET` doğrulamasını ekle (zod min 32 char).
- [x] `lib/auth.ts`:
  - `signSession(userId: string): Promise<string>` — jose `SignJWT`, HS256, payload `{ sub: userId }`, expiry 8 saat.
  - `verifySession(token: string): Promise<{ sub: string } | null>` — jose `jwtVerify`, hata yutulup null döner.
  - `hashPassword(plain: string): Promise<string>` — bcrypt salt 10.
  - `verifyPassword(plain: string, hash: string): Promise<boolean>` — bcrypt compare.
  - `SESSION_COOKIE_NAME` constant: `"quiz_admin_session"`.
  - `SESSION_MAX_AGE` constant: `60 * 60 * 8`.
- [x] `app/api/auth/login/route.ts`:
  - POST handler, zod body `{ username, password }` validate.
  - `prisma.adminUser.findUnique({ where: { username } })`.
  - Yoksa veya `verifyPassword` false → 401 ProblemDetails JSON `{ title: "Geçersiz kullanıcı adı veya şifre", status: 401 }`.
  - Geçerli → `signSession(user.id)` → cookie set (`httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`, `maxAge: SESSION_MAX_AGE`).
  - 200 `{ ok: true }`.
- [x] `app/api/auth/logout/route.ts`:
  - POST handler, cookie expire (`maxAge: 0`).
  - 200 `{ ok: true }`.
- [x] `proxy.ts` (Faz 01 iskeletini doldur):
  ```ts
  import { NextRequest, NextResponse } from "next/server";
  import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";

  export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (pathname === "/quiz-admin/login") return NextResponse.next();
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/quiz-admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  export const config = {
    matcher: ["/quiz-admin/:path*", "/api/admin/:path*"],
  };
  ```
- [x] `server/guards.ts`:
  ```ts
  import { cookies } from "next/headers";
  import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth";
  import { prisma } from "@/db/prisma";

  export async function requireAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = token ? await verifySession(token) : null;
    if (!session) throw new Error("UNAUTHORIZED");
    const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
    if (!user) throw new Error("UNAUTHORIZED");
    return user;
  }
  ```
- [x] `app/quiz-admin/layout.tsx` — admin shell (sidebar/topbar iskeletı + `requireAdmin()` çağrısı server component'te, fail durumunda redirect zaten proxy'de yapıldı, ek güvence).
- [x] `app/quiz-admin/login/page.tsx` — react-hook-form + zod, username + password input, submit → `/api/auth/login` POST → success: `router.push(next ?? "/quiz-admin")` + `toast.success("Giriş başarılı")`, fail: `toast.error(...)`.
- [x] `components/admin/login-form.tsx` — client component, form mantığı.
- [x] `app/quiz-admin/settings/page.tsx` — username gösterimi + "kimlik bilgilerini değiştir" form.
- [x] `components/admin/change-credentials-form.tsx` — client component: eski şifre, yeni username (opsiyonel), yeni şifre (min 8), yeni şifre tekrar.
- [x] `server/actions/auth.ts`:
  - `"use server"`, `changeCredentials({ currentPassword, newUsername?, newPassword? })`:
    - `requireAdmin()` ile current user al.
    - `verifyPassword(currentPassword, user.passwordHash)` — false → throw "Mevcut şifre yanlış".
    - Yeni username varsa unique check (kendisinden farklı bir user var mı).
    - Yeni şifre varsa hash'le.
    - `prisma.adminUser.update(...)`.
    - revalidatePath("/quiz-admin/settings").
- [x] Settings sayfasına logout butonu (POST `/api/auth/logout` → redirect `/quiz-admin/login`).
- [x] `documents/auth-flow.md` yaz: JWT akış diyagramı (text), cookie ayarları, proxy nasıl çalışır, requireAdmin nerede kullanılır, server action vs route handler farkı.
- [x] `documents/utils/auth.md` — `lib/auth.ts` helper'larının imza + kullanım.

## Dokunulacak Dosyalar

- `lib/auth.ts` (YENİ).
- `lib/env.ts` — `SESSION_SECRET` zod kontrolü güçlendirme.
- `proxy.ts` — matcher + cookie verify + redirect.
- `server/guards.ts` (YENİ).
- `server/actions/auth.ts` (YENİ).
- `app/api/auth/login/route.ts` (YENİ).
- `app/api/auth/logout/route.ts` (YENİ).
- `app/quiz-admin/layout.tsx` (YENİ).
- `app/quiz-admin/login/page.tsx` (YENİ).
- `app/quiz-admin/settings/page.tsx` (YENİ).
- `components/admin/login-form.tsx` (YENİ).
- `components/admin/change-credentials-form.tsx` (YENİ).
- `components/admin/admin-shell.tsx` (YENİ) — sidebar/topbar, logout buton.

## Eklenecek Paketler

Yok — Faz 01'de `jose`, `bcryptjs`, `@types/bcryptjs`, `zod` zaten eklendi.

## Veri Modeli / Şema

**JWT payload:**
```ts
{
  sub: string,     // AdminUser.id
  iat: number,
  exp: number,     // iat + 8h
}
```

**Cookie:**
```
Name: quiz_admin_session
HttpOnly: true
Secure: true (prod)
SameSite: Lax
Path: /
Max-Age: 28800 (8h)
```

**Zod schemas:**
```ts
const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunludur").max(100),
  password: z.string().min(1, "Şifre zorunludur").max(200),
});

const changeCredentialsSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifrenizi girin"),
  newUsername: z.string().min(3).max(100).optional(),
  newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalı").max(200).optional(),
}).refine((data) => data.newUsername || data.newPassword, {
  message: "Yeni kullanıcı adı veya yeni şifre girilmeli",
});
```

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓

**Manuel:**
- `/quiz-admin` → redirect `/quiz-admin/login?next=/quiz-admin` (proxy çalışıyor).
- Login form → `admin / admin` → 200, cookie set, redirect `/quiz-admin` (settings sayfası gözükür çünkü dashboard henüz yok, fallback layout).
- Login form → yanlış şifre → 401 toast.
- DevTools Application → `quiz_admin_session` cookie: HttpOnly ✓, Secure ✓ (prod), SameSite=Lax.
- `/api/auth/logout` POST → cookie temizlendi → `/quiz-admin` tekrar redirect login.
- Settings → `admin` + yeni şifre → DB'de hash güncellendi (`prisma studio` doğrula) → eski şifreyle login fail, yeni şifreyle login success.
- Yanlış current password → toast "Mevcut şifre yanlış".

## Deliverables

- `documents/auth-flow.md`:
  - Sekans diyagramı (text): User → Login Form → POST /api/auth/login → Prisma → bcrypt → jose.sign → Cookie → Redirect.
  - Protected request akışı: Browser → /quiz-admin → proxy.ts cookie verify → JWT verify → next() veya redirect.
  - Server action akışı: form submit → server action → requireAdmin() → guards.ts → prisma.findUnique → throw/return.
  - Cookie ayarları tablosu (yukarıdaki).
  - JWT payload yapısı.
  - Edge vs Node.js runtime notu: proxy.ts Edge'de (jose Edge-uyumlu), server actions Node.js'te (bcrypt orada).
  - SESSION_SECRET rotation: değiştirilince tüm aktif session'lar invalid olur (kabul edilebilir, tek admin).
- `documents/utils/auth.md`:
  - `signSession`, `verifySession`, `hashPassword`, `verifyPassword` imzaları + örnekler + edge case'ler.

## Riskler / Açık Sorular

- **proxy.ts Edge runtime'da bcrypt çalışmaz:** bcrypt sadece Node.js'te. Proxy sadece JWT verify yapacak (jose), bcrypt server actions / API route handlers'ta. Bu zaten planda doğru.
- **Server action'da `requireAdmin` throw:** "UNAUTHORIZED" error'ı client'a leak edebilir; production'da generic mesaj döndürmek için ek wrapper düşünülebilir, ama ilk versiyonda yeterli.
- **Cookie SameSite=Lax + form POST:** Login formu kendi origin'inden POST yapıyor, sorun yok. CSRF için ek koruma gerek yok (httpOnly + SameSite=Lax kombinasyonu).
- **JWT secret rotation:** Tek admin olduğu için secret değiştirince zorla logout — acceptable.
- **8h session:** Quiz gecesi 4-6 saat, admin ara verirse re-login lazım. İstenirse 24h'a çıkarılabilir; ilk versiyonda 8h.

---

## Sapma Logu

**Tarih:** 2026-05-18

Memory kuralı: "Brief eski olabilir, çatışmada güncel doğruyu tercih et" — Faz 03 sapmalarının üzerine inşa edildi (Prisma 7 adapter pattern, `@/db/prisma`, `@/lib/generated/prisma/client`).

### 1. `SESSION_SECRET` zod kontrolü zaten vardı

Brief'in 1. checklist maddesi `lib/env.ts`'e `SESSION_SECRET` `z.string().min(32)` eklenmesini öneriyordu, ancak bu kural önceki fazlarda zaten konulmuştu. Yeniden yazılmadı; mevcut kural kullanıldı (`lib/env.ts:6-8`).

### 2. Login layout izolasyonu için route group

Brief tek `app/quiz-admin/layout.tsx` öngörüyordu. Login sayfasının admin shell'i (topbar/Logout) göstermemesi gerektiğinden Next.js **route group** pattern'i uygulandı:

```
app/quiz-admin/
  (auth)/
    layout.tsx        → minimal wrapper
    login/page.tsx
  (panel)/
    layout.tsx        → requireAdmin() + AdminShell
    page.tsx          → dashboard placeholder
    settings/page.tsx
```

URL aynı (`/quiz-admin/login`, `/quiz-admin/settings`) — yalnızca dosya yapısı ayrıştırıldı.

### 3. `requireAdmin()` `throw` yerine `redirect`

Brief'in pattern'i:
```ts
if (!session) throw new Error("UNAUTHORIZED");
```

Bunun yerine:
```ts
if (!session) redirect(ROUTES.adminLogin);
```

Avantaj: cookie expire olunca server component/server action otomatik login'e yönlendiriyor. UX daha iyi, framework idiomatic. Caller'da try/catch zorunluluğu yok.

### 4. shadcn `<Form>` abstraction'ı eklendi

Brief manuel `<form>` + react-hook-form öngörüyordu. shadcn `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` primitive'leri eklendi — Faz 05/06 CRUD formları için tutarlı pattern. `npx shadcn add form` komutu interaktif prompt'ta takıldı, `components/ui/form.tsx` upstream shadcn ile birebir uyumlu manuel yazıldı (radix-ui, `Label` reuse, `data-slot` konvansiyonu, `cn` reuse).

### 5. Pusher env'leri Faz 07'ye kadar optional

Brief'in doğrulama adımı `npm run build ✓` istiyordu, ancak `lib/env.ts` Faz 01'de Pusher alanlarını `min(1)` zorunlu işaretlemişti. `.env.local`'da Pusher değerleri olmadan build collect aşaması patlıyordu. Tüm `PUSHER_*` ve `NEXT_PUBLIC_PUSHER_*` alanları `.optional()` yapıldı. **Faz 07 (Realtime)** bunları tekrar required'a almalı.

### 6. `lib/auth.ts` ikiye bölündü (Edge-safety)

Brief tek `lib/auth.ts` öngörüyordu; jose + bcrypt aynı dosyada. `proxy.ts` Edge runtime'da çalıştığı için bcrypt'in transitif olarak Edge bundle'a sızması riski vardı. Simplify pass önerisiyle:

- `lib/auth.ts` → jose (SignJWT, jwtVerify) + cookie helper'ları (`setSessionCookie`, `clearSessionCookie`) — Edge-safe.
- `lib/password.ts` → bcryptjs (`hashPassword`, `verifyPassword`, `DUMMY_PASSWORD_HASH`) — yalnız Node.

### 7. `React.cache(requireAdmin)`

PanelLayout + alt sayfa (settings) aynı request içinde `requireAdmin()` çağırıyordu → 2x Prisma `findUnique`. `cache()` ile sarmalanarak RSC render boyunca tek hit'e indirildi (Next.js best practice).

### 8. `safeAdminNext()` open-redirect koruması

Brief login form için `next` query parametresinin doğrulanmasını açıkça istemiyordu. Naif `next.startsWith("/quiz-admin")` kontrolü `//evil.com/quiz-admin` protocol-relative saldırısına açıktı. `lib/routes.ts:safeAdminNext()` helper'ı `//`, `\`, mutlak olmayan veya admin dışı yolları reddediyor.

### 9. Dummy bcrypt karşılaştırması (timing protection)

Brief sadece "kullanıcı yok ya da şifre yanlış → 401" diyordu. Naif implementasyonda kullanıcı yokken bcrypt çalışmıyordu → ~80ms latency farkı **username enumeration**'a yol açıyordu. `lib/password.ts:DUMMY_PASSWORD_HASH` sabit bir hash; route handler kullanıcıyı bulamadığında bu hash'e `verifyPassword` çağırıyor, sonucu atıyor.

### 10. P2002 unique violation handling

Brief credentials değişiminde yeni username için ön-kontrol (`findUnique` + `if conflict`) öneriyordu. Daha verimli pattern: doğrudan `update`, P2002 hatasını try/catch'le yakalayıp `"Bu kullanıcı adı zaten kullanılıyor"` mesajına çevir. Bir DB round-trip kazanıldı, race condition (TOCTOU) ortadan kalktı.

### 11. Route sabitleri + schema paylaşımı

Brief'te string'ler her dosyada hardcoded'tu (`/quiz-admin/login`, `/api/auth/login`, vb. 6+ noktada). `lib/routes.ts` (`ROUTES`, `API_ROUTES`) ve `lib/schemas/auth.ts` (`loginSchema`, `usernameField`, `passwordField`) eklenerek single source of truth sağlandı.

### 12. Cookie helper'ları DRY

Login + logout route handler'larında 5 alanlı (`httpOnly`, `secure`, `sameSite`, `path`, `maxAge`) cookie konfigürasyonu birebir tekrar ediyordu. `lib/auth.ts:setSessionCookie/clearSessionCookie` ile tek yere alındı. `process.env.NODE_ENV` çağrıları `env.NODE_ENV`'e döndürüldü.

### 13. `verifySession` `sub` → `userId` rename

Brief `verifySession` `{ sub: string }` döndürüyordu — JWT internal claim adı caller boundary'sinde sızıyordu. `{ userId: string }` olarak yeniden adlandırıldı; jose detayı `lib/auth.ts` içinde kapatıldı.

### 14. `useTransition` boilerplate'i şimdilik korundu

Simplify pass önerdi: `useTransition` + try/catch + toast üçlüsü 3 form'da tekrarlıyor; bir `useAsyncAction` hook'una çıkarılabilir. **Skip:** Faz 04'te 3 form var; Faz 05/06 CRUD formları geldiğinde 5+ olur — o zaman değerlendirilir. Erken abstraction'dan kaçınıldı.

---

## Etki (Sonraki Fazlar)

- **Faz 05 (Quiz CRUD):** `requireAdmin()` server action başlangıcında, `<Form>` primitive'i form abstraction olarak, `lib/routes.ts` yeni rotalar için genişletilir.
- **Faz 06 (Soru CRUD):** Aynı pattern. `lib/schemas/` altına `question.ts` eklenecek.
- **Faz 07 (Realtime):** `lib/env.ts` Pusher alanları tekrar `min(1)` required yapılmalı. `requireAdmin()` Pusher channel auth route'unda kullanılabilir.
- **Faz 10 (Security):** Login route'una `@upstash/ratelimit` eklenecek; timing dummy hash ve open-redirect koruması zaten yerinde.

## Doğrulama Sonuçları

- `npm run typecheck` ✓ 0 hata
- `npm run lint` ✓ 0 hata
- `npm run build` ✓ (7 route + Proxy middleware)
- Manuel curl:
  - `/quiz-admin` → 307 `/quiz-admin/login?next=%2Fquiz-admin` ✓
  - `POST /api/auth/login {nonexistent/x}` → 401 + `{"title":"Geçersiz kullanıcı adı veya şifre","status":401}` ✓ (Türkçe karakter doğru)
  - `POST /api/auth/login {admin/admin}` → 200 + `Set-Cookie: quiz_admin_session=<jwt>; Path=/; Max-Age=28800; HttpOnly; SameSite=lax` ✓
  - Cookie ile `/quiz-admin` ve `/quiz-admin/settings` → 200 ✓
  - `POST /api/auth/logout` → 200 + `Set-Cookie: quiz_admin_session=; Max-Age=0` ✓
  - Cookie temizlendikten sonra `/quiz-admin` → 307 login ✓
  - Login HTML render: `Yönetici Girişi`, `Kullanıcı adı`, `Şifre`, `Giriş Yap` Türkçe karakterli ✓
