# Pusher Protokolü

> Faz 07 çıktısı. **Faz 08 (Ana Ekran)** bu sözleşmeyi okur, tipleri
> `lib/schemas/live.ts` üzerinden import eder. Elle yeniden yazma — tek source
> of truth schema dosyasıdır; bu doküman onun açıklamasıdır.

## Genel Bakış

| Katman | Konum |
|---|---|
| Server SDK | `lib/pusher-server.ts` (`pusherServer`, `triggerLive`) |
| Client SDK | `lib/pusher-client.ts` (`getPusherClient`) |
| Tipler + olay sabitleri | `lib/schemas/live.ts` (`LIVE_CHANNEL`, `LIVE_EVENT`, payload tipleri) |
| Tema snapshot helper'ı | `buildThemeSnapshot(quiz)` |
| Admin REST endpoint'leri | `app/api/live/{send,end,theme,reset}/route.ts` |
| Admin UI | `app/quiz-admin/(panel)/live/page.tsx` + `components/admin/live-mode-panel.tsx` |

## Kanal

| Özellik | Değer |
|---|---|
| **Kanal adı** | `public-quiz-night-live` |
| **Visibility** | Public — herkes subscribe edebilir (auth gerekmez) |
| **Pusher cluster** | `eu` (Frankfurt) — Türkiye'den en düşük gecikme |
| **Encryption** | `forceTLS: true` (transport), payload encryption yok |

**Neden public?** Sahnedeki sorular projeksiyonda zaten halka açık görünüyor; gizlilik gerekçesi yok. Server tarafı (`/api/live/*`) admin guard ile korunuyor — sadece moderatör yayın yapabilir. Subscribe edenler yalnız okuma yapar.

**Tek aktif session:** Aynı anda en fazla bir quiz `isActive=1` (DB seviyesinde `UX_Quiz_OnlyOneActive` partial unique index garanti veriyor — bkz. `documents/db-schema.md`). Bu yüzden tek kanal yeterli. Multi-session ileride gerekirse kanal adına session id eklenir: `public-quiz-night-live-<sessionId>`.

## Olaylar

Olay sabitleri `lib/schemas/live.ts:LIVE_EVENT`'den okunur. String literal yazma — her zaman sabit kullan.

```ts
import { LIVE_EVENT, LIVE_CHANNEL } from "@/lib/schemas/live";
```

### `question:show`

Admin "Gönder" dediğinde tetiklenir. **Public ekran:** Modal'ı aç, soruyu göster, geri sayım sayacını başlat.

```ts
interface QuestionShowPayload {
  questionId: string;
  text: string;
  imageUrl: string | null;
  durationSec: number;       // 5-600 arası (DB check constraint)
  difficulty: number;         // 1-5 arası (DB check constraint)
  serverStartAt: string;      // ISO 8601, sunucudan trigger zamanı
  themeSnapshot: ThemeSnapshot;
}

interface ThemeSnapshot {
  quizId: string;
  primaryColor: string;       // #rrggbb (geçersizse fallback #1A1815)
  accentColor: string;        // #rrggbb (geçersizse fallback #C4A572)
  textColor: string;          // #rrggbb (geçersizse fallback #F4EFE6)
  backgroundUrl: string | null;
  fontKey: FontKey;           // FONT_WHITELIST üyesi garanti (parseFontKey)
}
```

**`serverStartAt` semantiği:** Client gelen `Date.now()` ile fark hesaplar:
```ts
const elapsedMs = Date.now() - new Date(serverStartAt).getTime();
const remainingSec = Math.max(0, durationSec - elapsedMs / 1000);
```
Sunucu trigger zamanı baz alındığı için public ekrana geç bağlanan istemciler de kalan süreyi doğru hesaplar.

**`themeSnapshot` sebep:** Olay anında geçerli tema payload içine gömülür. Public ekran ayrı bir state lookup yapmaz, payload üzerinden direkt render eder.

### `question:end`

Süre dolduğunda **opsiyonel** olarak server'dan tetiklenir. Public ekran zaten süreyi `durationSec + serverStartAt` ile ölçüyor; bu event multi-ekran tutarlılığı için ek garanti.

```ts
interface QuestionEndPayload {
  questionId: string;
}
```

**Faz 08 notu:** Client süreyi kendisi ölçüyor; bu event handler "Süreniz doldu" mesajını **erkenden** tetikleyebilir (örn. admin tarafından erken bitirme CTA'sı eklenirse). İlk versiyonda Faz 07 admin UI'da bu CTA yok; endpoint hazır ama tetiklenmiyor.

### `quiz:theme-change`

Admin aktif quiz'i değiştirdiğinde — public ekran tema bilgisini günceller (renkler, font, arka plan).

```ts
interface QuizThemeChangePayload {
  quizId: string;
  theme: Omit<ThemeSnapshot, "quizId">;
}
```

**Akış:**
1. Admin live mode panel'inde "Aktif Et" butonu → `setActiveQuiz(id)` server action (`UX_Quiz_OnlyOneActive` index garanti).
2. Server action onSuccess callback'inde `POST /api/live/theme { quizId }`.
3. Endpoint quiz'i çeker, snapshot kurar, `quiz:theme-change` event'i tetikler.

**Public ekran davranışı:** Soru modal'ı kapalıysa idle ekran tema güncellenir (background, font, başlık rengi). Modal açıksa açık soru aynı tema ile render edilmeye devam eder; bir sonraki `question:show` zaten yeni temayı taşıyor.

### `session:reset`

Admin "Modal'ı Kapat" deyince — açık modal'ı tüm public ekranlarda kapatır.

```ts
type SessionResetPayload = Record<string, never>;
```

**Public ekran davranışı:** Açıksa modal'ı kapat, idle ekrana dön.

## Sıra Örneği

Tipik bir gece akışı:

```
1. Admin login → /quiz-admin/live
2. "Quiz A"yı aktif et            → quiz:theme-change { quizId, theme }
3. Soru 1 "Gönder"                → question:show { ...payload }
   ... (durationSec saniye geçer, client süreyi ölçer)
4. Soru 2 "Gönder"                → question:show { ...payload }
5. Soru 3 "Gönder"                → question:show { ...payload }
6. "Modal'ı Kapat"                → session:reset
7. "Quiz B"yi aktif et            → quiz:theme-change { quizId, theme }
8. Soru "Gönder"                  → question:show { ...payload }
   ...
9. Tarayıcı kapatılır             → pusher-js cleanup
```

## Server Tarafı — Trigger Pattern

```ts
import { triggerLive } from "@/lib/pusher-server";
import { LIVE_EVENT, buildThemeSnapshot } from "@/lib/schemas/live";

await triggerLive(LIVE_EVENT.questionShow, {
  questionId, text, imageUrl, durationSec, difficulty,
  serverStartAt: new Date().toISOString(),
  themeSnapshot: buildThemeSnapshot(quiz),
});
```

- `triggerLive` kanal adını + event isim sabitini tek noktaya alır.
- `await` zorunlu — Pusher SDK promise döndürür. Beklenmezse route handler erken döner ve event broadcast'i kaybedilebilir.
- Trigger'dan önce auth guard çağrılmış olmalı: tüm `/api/live/*` route'ları başında `await requireAdmin()`.

## Client Tarafı — Subscribe Pattern

```ts
import { getPusherClient } from "@/lib/pusher-client";
import { LIVE_CHANNEL, LIVE_EVENT, type QuestionShowPayload } from "@/lib/schemas/live";

const client = getPusherClient();
const channel = client.subscribe(LIVE_CHANNEL);

channel.bind(LIVE_EVENT.questionShow, (payload: QuestionShowPayload) => {
  // modal'ı aç, sayacı başlat
});

channel.bind(LIVE_EVENT.questionEnd, ({ questionId }) => {
  // "Süreniz doldu" tetikle
});

channel.bind(LIVE_EVENT.themeChange, ({ theme }) => {
  // CSS variable'ları güncelle
});

channel.bind(LIVE_EVENT.sessionReset, () => {
  // modal kapat
});

// Cleanup (Faz 08 useEffect return):
channel.unbind_all();
client.unsubscribe(LIVE_CHANNEL);
```

- `getPusherClient` singleton — HMR'da çoklu WebSocket açmasını engeller.
- `channel.bind` tip güvenliği için handler imzasında payload tipini açıkça yaz.
- Cleanup şart; aksi halde React 19 StrictMode + Fast Refresh kombinasyonu connection sızdırır.

## Hata & Reconnect Davranışı

- **Bağlantı kopması:** `pusher-js` otomatik reconnect yapar (exponential backoff). Public ekran tarafı ek kontrol gerektirmez.
- **Kaçırılan event'ler:** Reconnect sırasında trigger'lanan event'ler **kaybedilir** — Pusher event history özelliği Sandbox/Free plan'da yok. Faz 08 kabul edilebilir: kaçırılan soruyu görmek için projeksiyon ekranı zaten katılımcı tarafından da görülüyor; admin gerekirse `session:reset` + tekrar `question:show` tetikler.
- **Server 401 redirect:** Auth cookie geçersizse `requireAdmin()` `redirect()` çağırır; fetch sonucu HTML döner, `postJson` JSON parse hatası alır ve `errorFallback` toast'ı gösterir. UX ideal değil ama Faz 10 rate-limit + explicit 401 ile iyileştirilebilir.

## Limitler

| Limit | Değer | Kaynak | Etki |
|---|---|---|---|
| Eşzamanlı bağlantı | 100 | Pusher Sandbox plan | Gece ~50-100 katılımcı için sınıra yakın; aşılırsa yeni bağlantılar reddedilir |
| Event payload | 10 KB | Pusher tüm planlar | `themeSnapshot` dahil ~500 byte, sorun yok |
| Aylık mesaj | 200.000 | Sandbox plan | Tipik gece ~50 soru × ~100 katılımcı = 5.000 — bol marj |

**Escalation:** Üst plan (Startup, $49/ay) 500 connection + 1M mesaj sağlar. Alternatif: Ably (benzer API, daha cömert free tier). Faz 10 deploy guide bu kararı son anda dondurur.

## Çift Tıklama & Race

- "Gönder" butonu submit anında `disabled={send.pending}` — admin hızlı çift tıkla ikinci event'i tetikleyemez.
- "Aktif Et" benzer şekilde `disabled={activate.pending}`.
- DB seviyesinde `UX_Quiz_OnlyOneActive` ikinci aktivasyonu reddeder; `isUniqueViolation` Türkçe mesajla yakalanır.

## Test Akışı

Manuel test için:

1. `https://dashboard.pusher.com` → App seç → **Debug Console**.
2. Channel filter: `public-quiz-night-live`.
3. Admin panel'de işlemleri yap; sağdaki Event listesinde JSON payload anında görünür.
4. Birden fazla tarayıcı sekmesinde public ekranı (Faz 08'de yazılacak) açıp olay yayılımını test et.

## Sonraki Faz Bağlantısı

- **Faz 08 (Ana Ekran):** `documents/hooks/use-live-session.md` ön spec'ini doldurur. `getPusherClient` ile subscribe eder, dört event'i bind eder, state'i `(public)/page.tsx` üzerinden sahnedeki modal/idle bileşenlerine besler.
- **Faz 10 (Security + Deploy):** `/api/live/*` endpoint'lerine Upstash Redis rate-limit. Pusher Production cluster + connection limit doğrulaması.
