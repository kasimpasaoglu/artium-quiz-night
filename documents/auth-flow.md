# Auth Akışı

> Faz 04 çıktısı. JWT (HS256) + httpOnly cookie + Prisma `AdminUser` ile sektör standardı admin auth.

## Bileşenler

| Katman | Dosya | Sorumluluk |
|---|---|---|
| Session imzalama/doğrulama | [`lib/auth.ts`](../lib/auth.ts) | `jose` ile JWT sign/verify, cookie helper'ları |
| Parola | [`lib/password.ts`](../lib/password.ts) | `bcryptjs` hash/compare + timing dummy hash |
| Schema | [`lib/schemas/auth.ts`](../lib/schemas/auth.ts) | `loginSchema`, `usernameField`, `passwordField` |
| Route sabitleri | [`lib/routes.ts`](../lib/routes.ts) | `ROUTES`, `API_ROUTES`, `safeAdminNext` |
| Edge guard | [`proxy.ts`](../proxy.ts) | Cookie doğrula → next/redirect |
| RSC guard | [`server/guards.ts`](../server/guards.ts) | `requireAdmin()` — `React.cache` ile dedupe |
| Login API | [`app/api/auth/login/route.ts`](../app/api/auth/login/route.ts) | POST: parola doğrula → cookie set |
| Logout API | [`app/api/auth/logout/route.ts`](../app/api/auth/logout/route.ts) | POST: cookie temizle |
| Credentials | [`server/actions/auth.ts`](../server/actions/auth.ts) | `"use server"` — kullanıcı adı/şifre güncelle |
| UI | `app/quiz-admin/(auth)/login/page.tsx`, `(panel)/...` | Form'lar, admin shell, panel sayfaları |

## Cookie

| Özellik | Değer |
|---|---|
| Name | `quiz_admin_session` |
| HttpOnly | ✓ |
| Secure | yalnız `env.NODE_ENV === "production"` |
| SameSite | `Lax` |
| Path | `/` |
| Max-Age | `28800` (8 saat) |

`Lax + HttpOnly` kombinasyonu CSRF için yeterli; ek CSRF token gerektirmez. Cookie set/clear politikası tek yerde: `setSessionCookie` / `clearSessionCookie` (`lib/auth.ts`).

## JWT Payload

```ts
{ sub: string,  // AdminUser.id (UUID)
  iat: number,
  exp: number   // iat + 8h
}
```

Algoritma: **HS256**. Secret: `env.SESSION_SECRET` (min 32 char, zod-validated). `verifySession` `sub` alanını `userId` olarak dış dünyaya yansıtır — JWT detayı `lib/auth.ts` boundary'sinde kalır.

## Sekans Diyagramları

### 1. Login

```
Tarayıcı ──POST /api/auth/login {username, password}──> Route Handler (Node)
                                                            │
                                                            ▼
                                                   loginSchema.safeParse
                                                            │
                                                            ▼
                                          prisma.adminUser.findUnique({username})
                                                            │
                                                            ▼
                                          verifyPassword(plain, hash | DUMMY_HASH)
                                                            │
                                              fail ─────────┼─────────── ok
                                                │                       │
                                                ▼                       ▼
                                           401 JSON                signSession(user.id)
                                                                        │
                                                                        ▼
                                                          setSessionCookie(...) + 200
                                                                        │
                                                                        ▼
                                                          Tarayıcı: Set-Cookie + router.replace(safeAdminNext)
```

**Önemli:** Kullanıcı bulunmasa bile `verifyPassword` çağrılır — `DUMMY_PASSWORD_HASH` (sabit, `lib/password.ts`) ile karşılaştırma yapılır. Bu, **username enumeration timing attack**'i engeller.

### 2. Korumalı İstek

```
Tarayıcı ──GET /quiz-admin/settings + Cookie──> proxy.ts (Edge)
                                                    │
                                                    ▼
                                      verifySession(cookie)  (jose, Edge-uyumlu)
                                                    │
                                       null ────────┼──────── { userId }
                                         │                       │
                                         ▼                       ▼
                                  redirect /login?next=...   NextResponse.next()
                                                                 │
                                                                 ▼
                                                  (panel)/layout.tsx → requireAdmin() (RSC + React.cache)
                                                                                │
                                                                                ▼
                                                              prisma.adminUser.findUnique({id})
                                                                                │
                                                                                ▼
                                                                  AdminShell + child page
```

### 3. Server Action (Credentials Değiştirme)

```
ChangeCredentialsForm ──server action invoke──> changeCredentials(input)
                                                    │
                                                    ▼
                                            requireAdmin()  (React.cache: aynı request'te bir kez)
                                                    │
                                                    ▼
                                       changeCredentialsSchema.safeParse
                                                    │
                                                    ▼
                                       verifyPassword(currentPassword)
                                                    │
                                                    ▼
                                       prisma.adminUser.update {username?, passwordHash?}
                                                    │
                                       P2002 ───────┼─────── ok
                                         │                   │
                                         ▼                   ▼
                                Türkçe error throw    revalidatePath(settings)
```

Yeni username unique violation P2002 ile yakalanır ve `"Bu kullanıcı adı zaten kullanılıyor"` mesajına dönüştürülür — ön-kontrol round-trip'i kaldırıldı.

## Runtime Ayrımı (Edge vs Node)

| Modül | Runtime | Sebep |
|---|---|---|
| `lib/auth.ts` (jose + cookie sabitleri) | Edge + Node | `proxy.ts` Edge'de çağırıyor |
| `lib/password.ts` (bcryptjs) | Node yalnız | bcrypt Node API'sine ihtiyaç duyar |
| `proxy.ts` | Edge | Next.js varsayılan proxy runtime |
| Route handlers + Server Actions | Node | Prisma ve bcrypt buradan çağrılır |

`lib/auth.ts` ve `lib/password.ts` ayrı dosyalar olduğu için Edge bundle bcrypt içermez. Tek dosya tutulsa transitif import bcrypt'i Edge bundle'a sızdırabilirdi (kırılgan); ayrım kalıcı çözüm.

## Güvenlik Notları

- **CSRF:** httpOnly + SameSite=Lax + form aynı origin → ek token gerekmez.
- **Username enumeration:** Sabit dummy hash ile constant-time compare; gerçek kullanıcı yokken bile bcrypt çalışır.
- **Open-redirect:** `?next=...` parametresi `safeAdminNext()` ile süzülür; `//evil.com/...`, `http://...`, backslash ve admin dışı yollar reddedilir.
- **SQL injection:** Prisma parametrize sorgu kullanır; raw SQL yok.
- **Session secret rotation:** `SESSION_SECRET` değişirse tüm aktif session'lar invalid olur — tek admin için kabul edilebilir.
- **Rate limit:** Login brute-force koruması Faz 10'a bırakıldı (`@upstash/ratelimit`).

## Initial Seed

`prisma/seed.ts` (Faz 03) `admin / admin` kullanıcısını idempotent oluşturur. İlk login sonrası `/quiz-admin/settings` üzerinden parola değiştirilmeli (üretim öncesi zorunlu).

## Test Komutları (Manuel)

```bash
# Proxy redirect
curl -is http://localhost:3000/quiz-admin
# Expected: 307 → /quiz-admin/login?next=%2Fquiz-admin

# Login (yanlış)
curl -is -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"x","password":"y"}'
# Expected: 401 + Türkçe mesaj, ~80ms (dummy compare)

# Login (admin/admin)
curl -is -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -c jar.txt \
  -d '{"username":"admin","password":"admin"}'
# Expected: 200 + Set-Cookie: quiz_admin_session=...; HttpOnly; SameSite=lax; Max-Age=28800

# Korumalı sayfa
curl -is http://localhost:3000/quiz-admin -b jar.txt
# Expected: 200, panel HTML

# Logout
curl -is -X POST http://localhost:3000/api/auth/logout -b jar.txt -c jar.txt
# Expected: 200 + Set-Cookie: quiz_admin_session=; Max-Age=0
```
