# Faz 07 — Realtime + Admin Live Mode

**Durum:** ✅ DONE — 2026-05-18
**Önkoşul fazlar:** 04, 06

## Amaç

Pusher Channels altyapısını kurmak (server + client SDK), admin live mode ekranını yapmak (quiz seç → aktif yap → o quiz'in sorularını teker teker "Gönder" butonu ile Pusher'a yayınla), gerekli API route'larını yazmak (`/api/live/send`, `/api/live/end`, `/api/live/theme`, `/api/live/reset`). Public ana ekran tarafı (Faz 08) bu altyapıyı dinleyecek. Faz çıktısı `documents/pusher-protocol.md` Faz 08'in input'u.

## Kapsam Dışı (Out of Scope)

- Public ana ekran rendering, modal, sayaç (Faz 08).
- Polish/a11y (Faz 09).
- Rate limit (Faz 10).
- Birden fazla eşzamanlı session (tek aktif quiz, tek aktif channel).

## Yapılacaklar (Checklist)

- [ ] Pusher hesabı: kullanıcı kendisi açar (https://pusher.com — free Sandbox plan). _(Kullanıcı eylemi; build dummy env ile doğrulandı.)_
- [ ] `.env.local` doldur: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (örn `eu`), `NEXT_PUBLIC_PUSHER_KEY` (=`PUSHER_KEY`), `NEXT_PUBLIC_PUSHER_CLUSTER` (=`PUSHER_CLUSTER`). _(Kullanıcı eylemi; `.env.example` cluster=eu default yorumu ile güncellendi.)_
- [x] `lib/env.ts`'de bu key'leri zorunlu hale getir.
- [x] `lib/pusher-server.ts`:
  ```ts
  import Pusher from "pusher";
  import { env } from "@/lib/env";

  export const pusherServer = new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.PUSHER_KEY,
    secret: env.PUSHER_SECRET,
    cluster: env.PUSHER_CLUSTER,
    useTLS: true,
  });

  export const LIVE_CHANNEL = "public-quiz-night-live";

  export async function triggerLive<T>(event: string, data: T) {
    await pusherServer.trigger(LIVE_CHANNEL, event, data);
  }
  ```
- [x] `lib/pusher-client.ts`:
  ```ts
  "use client";
  import PusherClient from "pusher-js";

  let instance: PusherClient | null = null;

  export function getPusherClient(): PusherClient {
    if (!instance) {
      instance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        forceTLS: true,
      });
    }
    return instance;
  }
  ```
- [x] `app/api/live/send/route.ts` (admin guard):
  - POST body `{ questionId: string }`.
  - `requireAdmin()`.
  - `prisma.question.findUnique({ where: { id }, include: { quiz: true } })` — yoksa 404.
  - Payload oluştur:
    ```ts
    {
      questionId, text, imageUrl, durationSec, difficulty,
      serverStartAt: new Date().toISOString(),
      themeSnapshot: {
        quizId, primaryColor, accentColor, textColor, backgroundUrl, fontKey
      }
    }
    ```
  - `triggerLive("question:show", payload)`.
  - 200 `{ ok: true, serverStartAt }`.
- [x] `app/api/live/end/route.ts` (admin guard):
  - POST body `{ questionId: string }`.
  - `triggerLive("question:end", { questionId })`.
  - 200.
- [x] `app/api/live/theme/route.ts` (admin guard):
  - POST body `{ quizId: string }`.
  - Quiz'i çek, theme snapshot oluştur.
  - `triggerLive("quiz:theme-change", { quizId, theme })`.
  - 200.
- [x] `app/api/live/reset/route.ts` (admin guard):
  - POST, body yok.
  - `triggerLive("session:reset", {})`.
  - 200.
- [x] `app/quiz-admin/(panel)/live/page.tsx` — server component:
  - Tüm quiz listesi `prisma.quiz.findMany`.
  - Aktif quiz `prisma.quiz.findFirst({ where: { isActive: true }, include: { questions: { orderBy: { orderIndex: "asc" } } } })`.
  - `<LiveModePanel quizzes={...} activeQuiz={...} />`.
- [x] `components/admin/live-mode-panel.tsx` — client component:
  - Sol kolon: tüm quiz'ler listesi, her birinde "Bu Quiz'i Aktif Et" butonu → `setActiveQuiz(id)` server action (Faz 05'te eklendi) + `/api/live/theme` çağır.
  - Sağ kolon: aktif quiz'in soruları (varsa) — her satırda:
    - Sıra, text snippet, süre, zorluk badge.
    - "Gönder" butonu → `/api/live/send` POST.
    - Son gönderilen soru highlight (state).
  - Üstte "Modal'ı Kapat" butonu → `/api/live/reset`.
  - Üstte: aktif quiz başlığı + theme preview (mini renkli kart).
- [x] `documents/pusher-protocol.md` yaz — **bu Faz 08 için input** (channel, event, payload şemaları).
- [x] `documents/hooks/use-live-session.md` — Faz 08'de yazılacak hook için ön spec.

## Dokunulacak Dosyalar

- `lib/pusher-server.ts` (YENİ).
- `lib/pusher-client.ts` (YENİ).
- `lib/env.ts` — Pusher env key'leri zorunlu.
- `app/api/live/send/route.ts` (YENİ).
- `app/api/live/end/route.ts` (YENİ).
- `app/api/live/theme/route.ts` (YENİ).
- `app/api/live/reset/route.ts` (YENİ).
- `app/quiz-admin/live/page.tsx` (YENİ).
- `components/admin/live-mode-panel.tsx` (YENİ).
- `components/admin/admin-shell.tsx` — sidebar'a "Live Mode" linki ekle.
- `server/actions/quiz.ts` — `setActiveQuiz` action zaten Faz 05'te tanımlı, doğrula (yoksa ekle).

## Eklenecek Paketler

Yok — Faz 01'de `pusher`, `pusher-js` zaten eklendi.

## Veri Modeli / Şema

### Pusher Protocol

**Channel:** `public-quiz-night-live` (public, auth gerektirmez — herkes subscribe edebilir).

**Events:**

#### `question:show`
Admin "Gönder" dediğinde tetiklenir.
```ts
{
  questionId: string,
  text: string,
  imageUrl: string | null,
  durationSec: number,
  difficulty: number,         // 1-5
  serverStartAt: string,      // ISO 8601, Pusher'a trigger'lanma zamanı
  themeSnapshot: {
    quizId: string,
    primaryColor: string,
    accentColor: string,
    textColor: string,
    backgroundUrl: string | null,
    fontKey: string,
  }
}
```

#### `question:end`
Süre dolduğunda opsiyonel olarak server'dan tetiklenir (client zaten süreyi ölçecek; bu event multiple ekran senkronu için ek garanti).
```ts
{ questionId: string }
```

#### `quiz:theme-change`
Admin aktif quiz'i değiştirdiğinde — public ekran tema bilgisini yenilemek için.
```ts
{
  quizId: string,
  theme: {
    primaryColor: string,
    accentColor: string,
    textColor: string,
    backgroundUrl: string | null,
    fontKey: string,
  }
}
```

#### `session:reset`
Admin "Modal'ı Kapat" deyince — açık modal'ı kapatır.
```ts
{}
```

## Doğrulama

**Otomatik:**
- `npm run typecheck` ✓
- `npm run lint` ✓
- `npm run build` ✓

**Manuel:**
- Pusher dashboard → Debug Console → channel `public-quiz-night-live` subscribe.
- Login → `/quiz-admin/live` → quiz listesi gözüküyor.
- Bir quiz'i aktif et → DB'de isActive=true (önceki active false), Pusher console'da `quiz:theme-change` event.
- Soru "Gönder" → Pusher console'da `question:show` event, payload doğru (text, durationSec, themeSnapshot dolu, serverStartAt ISO).
- "Modal'ı Kapat" → `session:reset` event.
- Başka bir tarayıcıdan auth cookie olmadan `/api/live/send` POST → 401.
- Birkaç saniye arayla iki soru gönder → ikinci event de tetiklenir (admin önceki sorunun süresini beklemez).

## Deliverables

- **`documents/pusher-protocol.md`** (Faz 08 input):
  - Channel adı + visibility (public, auth yok).
  - Tüm event'ler, payload TypeScript tipleri (yukarıdaki).
  - Event sırası örneği: `quiz:theme-change` → `question:show` → (süre dolar, client ölçer) → `question:show` (yeni soru) → ... → `session:reset`.
  - Server'dan trigger pattern (`pusher.trigger(channel, event, data)`).
  - Client'tan subscribe pattern (`pusher.subscribe(channel).bind(event, handler)`).
  - Hata durumları: bağlantı kopması, reconnect davranışı (pusher-js otomatik).
  - Multi-session ileride: channel adına session id eklemek (`public-quiz-night-live-<sessionId>`).
- `documents/hooks/use-live-session.md` (ön spec, Faz 08 dolduracak):
  - Imza taslağı: `useLiveSession(): { currentQuestion: QuestionShowPayload | null, theme: Theme | null }`.
  - Iç: subscribe LIVE_CHANNEL, bind question:show/end/reset, state set.
  - Cleanup: unbind + unsubscribe + disconnect.

## Riskler / Açık Sorular

- **Pusher free tier limit:** 100 max simultaneous connection. Quiz gecesi ~50-100 katılımcı için sınıra yakın olabilir; aşılırsa bağlantı reddedilir. Faz 10 deploy guide'da uyarı, gerekirse Pusher paid plan veya Ably'ye geçiş.
- **Auth eksikliği client tarafı:** Public channel olduğu için kim isterse subscribe edebilir — quiz içeriği zaten halka açık (ana ekrandan görüyor), sorun değil. `/api/live/*` endpoint'leri admin guard ile korunuyor, sadece admin yayın yapabiliyor.
- **Race condition iki "Gönder":** Admin hızlı iki kere tıklarsa iki event tetiklenir — public ekran ikincisini gösterir, kabul edilebilir. UI'da "Gönder" butonu submit sırasında disabled olmalı (loading state).
- **`question:end` gerekli mi:** Client zaten süreyi `durationSec` + `serverStartAt` ile ölçüyor. `question:end` redundant gibi görünebilir ama multi-ekran tutarlılığı + admin'in "süreniz doldu" stage'ini erken tetikleme isteği için tutmak iyi. Faz 08 implementasyonunda gereksizse kaldırılır.
- **Pusher payload boyut:** `themeSnapshot` ile birlikte ~500 byte; Pusher event max 10KB, çok altında. Sorun yok.
- **Cluster seçimi:** Türkiye'den en yakın cluster `eu` (Frankfurt) veya `eu-west-2`. Test edilip seçilmeli.

---

## Sapma Logu

**Tarih:** 2026-05-18

Memory kuralı: "Brief eski olabilir, güncel doğruyu tercih et." Faz 04/05/06 sapmalarında kurulan pattern'ler (route handler inline `requireAdmin`, schema-tipi tek source of truth, ortak `lib/` util modülleri) bu fazda devam etti. Brief ile çelişen birkaç nokta güncel yapıya göre adapte edildi.

### 1. `app/quiz-admin/live/page.tsx` → `app/quiz-admin/(panel)/live/page.tsx`

Brief `app/quiz-admin/live/page.tsx` öneriyordu. Mevcut admin yapısı `(panel)` route group altında: `(panel)/page.tsx`, `(panel)/quizzes/...`, `(panel)/settings/page.tsx`. `requireAdmin()` `(panel)/layout.tsx`'te tek noktada çağrılıyor (cache wrap, RSC dedupe). Live mode sayfası bu hiyerarşiye girince ek auth çağırması gerekmedi, navigation pattern'i Faz 04'te kurulduğu gibi devam etti.

### 2. Sidebar yerine header navbar — "Live Mode" linki

Brief "sidebar'a Live Mode linki ekle" diyordu. `components/admin/admin-shell.tsx` Faz 04'te **header navbar** olarak yazılmış (sidebar yok). "Ayarlar" linkinin soluna `Live Mode` linki eklendi (separator dot ile). Sidebar refactor'u faz scope'unun dışında ve gerekçesi yok (admin sayfaları az sayıda).

### 3. `proxy.ts` matcher'a `/api/live/*` eklenmedi

Brief'te explicit yazmasa da düşünülmüş olabilir. Mevcut yapı (Faz 05 `/api/upload`) her route handler'ında inline `await requireAdmin()` çağırıyor; proxy yalnız `/api/admin/:path*` + `/quiz-admin/:path*` matcher'ı kullanıyor. Faz 07'nin dört `/api/live/*` route'u aynı pattern'i izledi — başında inline guard, proxy değişmedi. Bu Vercel Blob upload callback'i (`/api/upload`) kullanıcı session'ı olmadan çalıştığı için zorunlu pattern; tutarlılık adına Faz 07 de aynı şekilde yazıldı.

### 4. `useServerAction` + fetch wrapper'ı `lib/api-fetch.ts:postJson` ortak modülüne taşındı

Faz 04 `login-form.tsx` ve `logout-button.tsx`'te aynı pattern (try/catch + non-OK throw + Türkçe payload.title) inline yazılmıştı. Faz 07'de dört callsite daha eklendi: live-mode-panel'in `setActiveQuiz + theme`, `send`, `reset`. Toplam **6 callsite** (Faz 04'in 2'si + Faz 07'nin 4'ü) "rule of 3" sınırını rahatça aşıyor. `lib/api-fetch.ts`:

```ts
postJson<TResponse>(url, body, { errorFallback }): Promise<TResponse>
```

`useServerAction` semantiğine birebir uyumlu (Error throw'u toast.error tetikler). Faz 07'de yalnız yeni 4 callsite bu helper'ı kullanıyor; Faz 04'in 2 callsite'ı back-port edilmedi (out-of-scope; sonraki refactor pass'ine bırakıldı, `documents/hooks/use-server-action.md` notu güncellenebilir).

### 5. `lib/problem.ts` ortak Problem response helper

`app/api/live/{send,end,theme}/route.ts` her birinde aynı `problem(title, status)` local helper'ı vardı (`NextResponse.json({ title, status }, { status })`). Simplify pass'te `lib/problem.ts` ortak modülüne taşındı. Bonus: `app/api/upload/route.ts`'in tek satırlık `NextResponse.json({ title: message, status: 400 }, ...)` çağrısı da aynı helper'a bağlandı — toplam 4 callsite. Client tarafı `postJson` `payload.title`'ı toast'a verdiği için response şekli tek tip olmak şart.

### 6. `lib/schemas/live.ts` — tipler + body schema'ları + helper tek dosyada

Brief tipleri ayrı dosyalara dağıtmayı önermiyordu ama implementasyon tartışılabilirdi. Faz 06 §1 sapması (`lib/schemas/question.ts:QuestionRow + QuestionFormInitialData`) ile aynı yaklaşım: payload tipleri + olay sabitleri (`LIVE_EVENT`, `LIVE_CHANNEL`) + body parser schema'ları + `buildThemeSnapshot()` helper'ı tek dosyada. Faz 08 (Ana Ekran) bu dosyayı tek bir import ile tüm sözleşmeyi alacak; `documents/pusher-protocol.md` doğrudan bu dosyayı referans alır.

### 7. `pusher-server.ts` `globalThis` singleton

Brief modül-level `new Pusher({...})` öneriyordu. Faz 03 `db/prisma.ts` pattern'i ile aynı `globalForPusher` cache'i kullanıldı — Next.js HMR + serverless invocation'larda aynı instance tekrar kullanılır, üretim modunda cache yazılmaz (`NODE_ENV !== "production"` guard).

### 8. `pusher-client.ts` çift env validation

Server tarafı `lib/env.ts` ile Pusher key'leri zorunlu hale geldi ama client component'ler `lib/env.ts`'yi import edemez (`server-only`). `getPusherClient` runtime'da `process.env.NEXT_PUBLIC_*` kontrol edip yoksa açıklayıcı Türkçe `Error` fırlatır — geliştirici yanlış env ile ekran açarsa toast'ta net mesaj görür.

### 9. `setActiveQuiz` + `liveTheme` endpoint zincirleme

Brief "setActiveQuiz çağır + `/api/live/theme` çağır" iki ayrı adım olarak listeliyordu. Tek `useServerAction` içinde sırayla yapıldı:

```ts
useServerAction(async (id) => {
  await setActiveQuiz(id);
  await postJson(API_ROUTES.liveTheme, { quizId: id }, { ... });
}, { successMessage: "Quiz aktif edildi", ... });
```

İlk adım hata atarsa ikinci adıma geçilmez; toast tek mesaj gösterir. Buton tek seferde disabled (race riski yok).

### 10. `LiveModePanel` içinde alt component'ler

Brief tek bileşen düşündüğünü hissettiriyordu. Implementasyon dört iç bileşene bölündü: `ActiveBanner`, `QuizColumn`, `QuizListRow`, `QuestionColumn`, `SendQuestionRow`. Hepsi panele özel — ayrı dosyaya çıkarmak YAGNI. Quiz/soru listesi boş state'leri buradan kolayca yönetiliyor.

### 11. "Tekrar Gönder" UX hint

Brief'te yoktu. `lastSentQuestionId` local state (persist edilmez) — son gönderilen soru satırı vurgulanır, buton metni "Tekrar Gönder" olur. Moderatör hangi soruyu son yayına aldığını hatırlamak zorunda kalmaz. Refresh sonrası bilgi gider, kabul edilebilir.

### 12. `LIVE_EVENT` enum-as-const

Brief event isimlerini string literal olarak kullanıyordu. `lib/schemas/live.ts:LIVE_EVENT` `as const` objesi ile yazıldı; `LiveEvent` type union'ı `triggerLive` imzasını daraltıyor. Tipo riski sıfırlanır, refactor güvenli.

### 13. Pusher hesabı + `.env.local` kullanıcı eylemi

Pusher hesabı açma ve `.env.local`'a değer yazma kullanıcı eylemleri. Build doğrulaması dummy env (`PUSHER_APP_ID=dummy ...`) ile yapıldı; route'lar oluştu, page data collection geçti. Gerçek Pusher Debug Console testleri kullanıcı tarafından koşulacak (brief'in "Manuel" listesi).

---

## Etki — Sonraki Fazlar

- **Faz 08 (Ana Ekran):** `useLiveSession` hook'u ön spec'i (`documents/hooks/use-live-session.md`) `getPusherClient` + `LIVE_CHANNEL` + dört event'i bind etmeyi anlatıyor. Payload tipleri (`QuestionShowPayload`, `ThemeSnapshot`, …) `lib/schemas/live.ts`'den import edilir; dokümandan elle tip yazılmaz. `(public)/page.tsx` server component DB'den initial tema çeker, hook'a inject eder.
- **Faz 10 (Security + Deploy):** `/api/live/*` endpoint'leri Upstash rate-limit ile sarılır (admin double-trigger sıklığı). `lib/api-fetch.ts:postJson` `login-form`/`logout-button`'a back-port edilebilir (out-of-scope).

## Doğrulama Sonuçları

- `npm run typecheck` ✓ 0 hata
- `npm run lint` ✓ 0 uyarı
- `npm run format:check` ✓ tüm dosyalar Prettier uyumlu
- `npm run build` ✓ (16 route, `/api/live/{send,end,theme,reset}` + `/quiz-admin/live` yeni; dummy Pusher env ile çalıştırıldı, kullanıcı gerçek değerlerle tekrar koşar)
- `npx prisma validate` ✓ "schema is valid 🚀"
- Manuel test sırası (Pusher hesabı açıldıktan sonra koşulacak): brief'in "Manuel" checklist'i — 7 madde.
