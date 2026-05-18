# `useCountdown(serverStartAt, durationSec)`

Sahnedeki aktif soru için kalan süreyi ölçen client-side hook. Server `question:show` payload'ı içindeki `serverStartAt` (ISO 8601) baz alınır; client `Date.now()` ile fark hesaplanır, böylece geç bağlanan istemciler de doğru kalan süreyi görür.

## İmza

```ts
function useCountdown(serverStartAt: string, durationSec: number): {
  remaining: number;     // 0..durationSec (kesirli saniye)
  progress: number;      // 0..1
  isFinished: boolean;   // remaining <= 0
};
```

## Davranış

- **250ms tick:** `setInterval(250)` tek bir tick sayacını arttırır; gerçek değerler her render'da `Date.now()` üzerinden taze hesaplanır. Effect içinde state senkronizasyonu yapılmaz → stale paint riski yok ve `react-hooks/set-state-in-effect` lint kuralı ihlal edilmez.
- **Server-anchored:** Hesap `serverStartAt`'a göre yapılır; gec bağlanan ekran kalan süreyi doğru bulur.
- **Reset:** `serverStartAt` veya `durationSec` değiştiğinde `useEffect` dependency tetiklenir; interval `clearInterval` + yeniden `setInterval`.
- **`isFinished`:** `remaining <= 0` true. Çağıran taraf (modal) bunu görür ve `<TimeUpOverlay>` render eder.

## Kullanım

```tsx
const { remaining, progress, isFinished } = useCountdown(
  question.serverStartAt,
  question.durationSec,
);

return (
  <>
    <span>{String(Math.ceil(remaining)).padStart(2, "0")}</span>
    <div style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }} />
  </>
);
```

## Tick Hızı Gerekçesi

| Frekans | Pro | Con |
|---|---|---|
| `setInterval(1000)` | Sayı yeterli, çok ucuz | Progress bar adımlı, gözle pürüzlü |
| `setInterval(250)` ✅ | Sayı 1Hz, progress pürüzsüz | Re-render maliyeti ihmal edilir |
| `requestAnimationFrame` | 60Hz pürüzsüz | Pil tüketimi, gereksiz |

DESIGN.md §07 "Sayaç Davranışı" 100ms progress refresh öneriyor; 250ms onun yarısı kadar pürüzsüz, 4× ucuz — pratik denge.

## Drift Problemi (Faz 09 Notu)

Pusher event'i client'a ulaştığında server `Date.now()` ile client `Date.now()` arasında saat farkı varsa, multi-ekran arasında ±1-2 sn drift gözlenebilir. Tek projeksiyon ekranı için anlamsız; 50+ telefon arasında görsel rahatsızlık verebilir. Faz 09 planı: `/api/time` endpoint + `lib/time-offset.ts`. İlk yüklemede server time farkı ölçülür, `Date.now() + offset` formülü uygulanır.

İmza bozulmaz — offset hook içinde otomatik devreye girer, çağıran taraf değişmez.

## Bağımlılıklar

- `react` — `useState`, `useEffect`.

## Edge Cases

- **`durationSec = 0`:** `progress = 1`, `isFinished = true` ilk render'da. Pratikte DB check constraint `5..600`, bu durum oluşmaz.
- **`serverStartAt` geçersiz ISO:** `new Date(...).getTime()` `NaN` döner, `remaining` `NaN`. Faz 07'de `triggerLive` her zaman `new Date().toISOString()` koyduğundan oluşmaz.
- **`serverStartAt` gelecek tarih:** Negatif elapsed → `Math.max(0, ...)` sıfırlar; remaining = durationSec. Sayaç ilerlemez. Pratikte server `new Date()` koyduğu için oluşmaz.
- **Tab background'a gidip dönme:** `Date.now()` mutlak hesap yaptığı için sayaç atlamış olur — beklenen davranış (projeksiyon hep önde).

## Bağlantılı Belgeler

- `documents/hooks/use-live-session.md` — Bu hook'u tüketen üst seviye Pusher hook'u.
- `documents/pusher-protocol.md` — `question:show` payload kontratı.
- `documents/DESIGN.md` §07 — Animasyon dili ve sayaç koreografisi.
