# Auth Helper Sözlüğü

> Faz 04 çıktısı. `lib/auth.ts`, `lib/password.ts`, `lib/routes.ts`, `lib/schemas/auth.ts` modüllerinin imza ve kullanım kılavuzu.

## `lib/auth.ts` — Session + Cookie

`import "server-only"` ile koruma altında. `proxy.ts` (Edge) ve route handler'lar/server action'lar (Node) tarafından kullanılır.

### Sabitler

| İsim | Tip | Değer | Kullanım |
|---|---|---|---|
| `SESSION_COOKIE_NAME` | `string` | `"quiz_admin_session"` | Cookie adı (set + read) |
| `SESSION_MAX_AGE` | `number` | `28800` (8 saat) | Cookie + JWT exp |

### `signSession(userId)`

```ts
async function signSession(userId: string): Promise<string>
```

HS256 imzalı JWT döner. Payload: `{ sub: userId, iat, exp }`. Secret: `env.SESSION_SECRET`.

**Örnek:**
```ts
const token = await signSession(user.id);
```

### `verifySession(token)`

```ts
async function verifySession(token: string): Promise<{ userId: string } | null>
```

JWT doğrular. Geçersiz/expired ise `null` (hata yutulur — caller branch'lemesi basit kalır). Başarılıysa `{ userId }` (JWT `sub` claim'i; `userId` adı caller boundary'sinde tutarlılık için).

**Örnek:**
```ts
const session = token ? await verifySession(token) : null;
if (!session) redirect(ROUTES.adminLogin);
const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
```

### `setSessionCookie(cookies, token)` / `clearSessionCookie(cookies)`

```ts
function setSessionCookie(cookies: CookieJar, token: string): void
function clearSessionCookie(cookies: CookieJar): void
```

Cookie politikasını (HttpOnly, Secure, SameSite, Path, Max-Age) tek yerde tutar. `CookieJar` Next.js `NextResponse.cookies` arayüzüne uyumlu minimal tip — `set(name, value, options)` metodu olan her objeyi kabul eder.

**Örnek:**
```ts
const response = NextResponse.json({ ok: true });
setSessionCookie(response.cookies, token);
return response;
```

**Edge case:** `clearSessionCookie` `maxAge: 0` ile cookie'yi expire eder; tarayıcı bir sonraki istekte göndermez.

## `lib/password.ts` — Parola

`import "server-only"`. Node runtime'a özgü (bcrypt). Edge'den **çağrılmamalı**.

### `hashPassword(plain)` / `verifyPassword(plain, hash)`

```ts
async function hashPassword(plain: string): Promise<string>
async function verifyPassword(plain: string, hash: string): Promise<boolean>
```

bcrypt cost factor `10`. `verifyPassword` constant-time karşılaştırma yapar (bcrypt API garantisi).

### `DUMMY_PASSWORD_HASH`

Sabit, kullanılamaz bir bcrypt hash'i. **Amacı:** kullanıcı bulunamadığında `verifyPassword`'a bu hash verip aynı bcrypt latency'sini ödemek; aksi halde "kullanıcı var/yok" timing attack'i mümkün olurdu.

```ts
const user = await prisma.adminUser.findUnique({ where: { username } });
const ok = await verifyPassword(plain, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
if (!user || !ok) return invalidCredentials();
```

## `lib/routes.ts` — Sabitler + Helper

### `ROUTES`

```ts
const ROUTES = {
  adminHome: "/quiz-admin",
  adminLogin: "/quiz-admin/login",
  adminSettings: "/quiz-admin/settings",
}
```

`as const` literal tipler. `<Link href={ROUTES.adminHome}>` ve `redirect(ROUTES.adminLogin)` çağrılarında string-typo riskini ortadan kaldırır.

### `API_ROUTES`

```ts
const API_ROUTES = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
}
```

Client `fetch()` çağrılarında kullanılır.

### `safeAdminNext(next)`

```ts
function safeAdminNext(next: string | undefined | null): string
```

Login form'undan gelen `?next=<path>` parametresini open-redirect'e karşı süzer. Kabul edilenler: `/quiz-admin` veya `/quiz-admin/...` ile başlayan göreceli yollar. Reddedilenler:

- `null`/`undefined` → `/quiz-admin`
- Protocol-relative (`//evil.com/...`)
- Backslash (`\evil.com`)
- Mutlak değil (`evil.com`)
- Admin dışı yollar (`/foo`)

**Örnek:**
```ts
router.replace(safeAdminNext(next));
```

## `lib/schemas/auth.ts` — Zod Schema'lar

### `usernameField` / `passwordField`

Yeniden kullanılabilir `z.string()` parçaları. Create-time kuralları (`username.min(3)`, `password.min(8)`). Form ve server action'lar bu alanları compose eder; mesajlar tek noktadan.

### `loginSchema`

```ts
const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı zorunludur").max(100),
  password: z.string().min(1, "Şifre zorunludur").max(200),
});
```

Login formu mevcut bir kullanıcıyı doğruluyor; create-time `min(3)/min(8)` kuralı geriye uyumluluğu kırabileceği için yalnızca "boş değil" kontrolü. Hem `route.ts` hem `login-form.tsx` aynı schema'yı import eder (single source of truth).

`LoginInput` type export'u (`z.infer<typeof loginSchema>`).
