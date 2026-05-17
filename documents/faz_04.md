# Faz 04 — Auth Sistemi

**Durum:** ⬜ TODO
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

- [ ] `lib/env.ts`'e `SESSION_SECRET` doğrulamasını ekle (zod min 32 char).
- [ ] `lib/auth.ts`:
  - `signSession(userId: string): Promise<string>` — jose `SignJWT`, HS256, payload `{ sub: userId }`, expiry 8 saat.
  - `verifySession(token: string): Promise<{ sub: string } | null>` — jose `jwtVerify`, hata yutulup null döner.
  - `hashPassword(plain: string): Promise<string>` — bcrypt salt 10.
  - `verifyPassword(plain: string, hash: string): Promise<boolean>` — bcrypt compare.
  - `SESSION_COOKIE_NAME` constant: `"quiz_admin_session"`.
  - `SESSION_MAX_AGE` constant: `60 * 60 * 8`.
- [ ] `app/api/auth/login/route.ts`:
  - POST handler, zod body `{ username, password }` validate.
  - `prisma.adminUser.findUnique({ where: { username } })`.
  - Yoksa veya `verifyPassword` false → 401 ProblemDetails JSON `{ title: "Geçersiz kullanıcı adı veya şifre", status: 401 }`.
  - Geçerli → `signSession(user.id)` → cookie set (`httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`, `maxAge: SESSION_MAX_AGE`).
  - 200 `{ ok: true }`.
- [ ] `app/api/auth/logout/route.ts`:
  - POST handler, cookie expire (`maxAge: 0`).
  - 200 `{ ok: true }`.
- [ ] `proxy.ts` (Faz 01 iskeletini doldur):
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
- [ ] `server/guards.ts`:
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
- [ ] `app/quiz-admin/layout.tsx` — admin shell (sidebar/topbar iskeletı + `requireAdmin()` çağrısı server component'te, fail durumunda redirect zaten proxy'de yapıldı, ek güvence).
- [ ] `app/quiz-admin/login/page.tsx` — react-hook-form + zod, username + password input, submit → `/api/auth/login` POST → success: `router.push(next ?? "/quiz-admin")` + `toast.success("Giriş başarılı")`, fail: `toast.error(...)`.
- [ ] `components/admin/login-form.tsx` — client component, form mantığı.
- [ ] `app/quiz-admin/settings/page.tsx` — username gösterimi + "kimlik bilgilerini değiştir" form.
- [ ] `components/admin/change-credentials-form.tsx` — client component: eski şifre, yeni username (opsiyonel), yeni şifre (min 8), yeni şifre tekrar.
- [ ] `server/actions/auth.ts`:
  - `"use server"`, `changeCredentials({ currentPassword, newUsername?, newPassword? })`:
    - `requireAdmin()` ile current user al.
    - `verifyPassword(currentPassword, user.passwordHash)` — false → throw "Mevcut şifre yanlış".
    - Yeni username varsa unique check (kendisinden farklı bir user var mı).
    - Yeni şifre varsa hash'le.
    - `prisma.adminUser.update(...)`.
    - revalidatePath("/quiz-admin/settings").
- [ ] Settings sayfasına logout butonu (POST `/api/auth/logout` → redirect `/quiz-admin/login`).
- [ ] `documents/auth-flow.md` yaz: JWT akış diyagramı (text), cookie ayarları, proxy nasıl çalışır, requireAdmin nerede kullanılır, server action vs route handler farkı.
- [ ] `documents/utils/auth.md` — `lib/auth.ts` helper'larının imza + kullanım.

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

_Agent faz bitiminde doldurur. Şu an boş._
