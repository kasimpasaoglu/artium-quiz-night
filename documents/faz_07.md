# Faz 07 — Realtime + Admin Live Mode

**Durum:** ⬜ TODO
**Önkoşul fazlar:** 04, 06

## Amaç

Pusher Channels altyapısını kurmak (server + client SDK), admin live mode ekranını yapmak (quiz seç → aktif yap → o quiz'in sorularını teker teker "Gönder" butonu ile Pusher'a yayınla), gerekli API route'larını yazmak (`/api/live/send`, `/api/live/end`, `/api/live/theme`, `/api/live/reset`). Public ana ekran tarafı (Faz 08) bu altyapıyı dinleyecek. Faz çıktısı `documents/pusher-protocol.md` Faz 08'in input'u.

## Kapsam Dışı (Out of Scope)

- Public ana ekran rendering, modal, sayaç (Faz 08).
- Polish/a11y (Faz 09).
- Rate limit (Faz 10).
- Birden fazla eşzamanlı session (tek aktif quiz, tek aktif channel).

## Yapılacaklar (Checklist)

- [ ] Pusher hesabı: kullanıcı kendisi açar (https://pusher.com — free Sandbox plan).
- [ ] `.env.local` doldur: `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (örn `eu`), `NEXT_PUBLIC_PUSHER_KEY` (=`PUSHER_KEY`), `NEXT_PUBLIC_PUSHER_CLUSTER` (=`PUSHER_CLUSTER`).
- [ ] `lib/env.ts`'de bu key'leri zorunlu hale getir.
- [ ] `lib/pusher-server.ts`:
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
- [ ] `lib/pusher-client.ts`:
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
- [ ] `app/api/live/send/route.ts` (admin guard):
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
- [ ] `app/api/live/end/route.ts` (admin guard):
  - POST body `{ questionId: string }`.
  - `triggerLive("question:end", { questionId })`.
  - 200.
- [ ] `app/api/live/theme/route.ts` (admin guard):
  - POST body `{ quizId: string }`.
  - Quiz'i çek, theme snapshot oluştur.
  - `triggerLive("quiz:theme-change", { quizId, theme })`.
  - 200.
- [ ] `app/api/live/reset/route.ts` (admin guard):
  - POST, body yok.
  - `triggerLive("session:reset", {})`.
  - 200.
- [ ] `app/quiz-admin/live/page.tsx` — server component:
  - Tüm quiz listesi `prisma.quiz.findMany`.
  - Aktif quiz `prisma.quiz.findFirst({ where: { isActive: true }, include: { questions: { orderBy: { orderIndex: "asc" } } } })`.
  - `<LiveModePanel quizzes={...} activeQuiz={...} />`.
- [ ] `components/admin/live-mode-panel.tsx` — client component:
  - Sol kolon: tüm quiz'ler listesi, her birinde "Bu Quiz'i Aktif Et" butonu → `setActiveQuiz(id)` server action (Faz 05'te eklendi) + `/api/live/theme` çağır.
  - Sağ kolon: aktif quiz'in soruları (varsa) — her satırda:
    - Sıra, text snippet, süre, zorluk badge.
    - "Gönder" butonu → `/api/live/send` POST.
    - Son gönderilen soru highlight (state).
  - Üstte "Modal'ı Kapat" butonu → `/api/live/reset`.
  - Üstte: aktif quiz başlığı + theme preview (mini renkli kart).
- [ ] `documents/pusher-protocol.md` yaz — **bu Faz 08 için input** (channel, event, payload şemaları).
- [ ] `documents/hooks/use-live-session.md` — Faz 08'de yazılacak hook için ön spec.

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

_Agent faz bitiminde doldurur. Şu an boş._
