# Sayaç Senkronu (Time Sync)

## Problem

Public ekrandaki geri sayım (`hooks/use-countdown.ts`) client'ın
`Date.now()` değerini kullanır. Pusher event'iyle gelen `serverStartAt`
bilindiği için tek bir cihazda doğru çalışır, ancak birden fazla cihaz
arasında client clock drift varsa sayaçlar arasında ±1–2 saniye fark
oluşabilir.

## Mevcut Durum (Faz 09)

`/api/time` endpoint'i ve offset hesabı **yazılmadı** (YAGNI). Brief
"gerekirse" diyor; uygulama drift ölçümü öncesi proaktif altyapı yazmak
ölü kod riski yarattığı için bilinçli olarak atlandı.

## Ölçüm Protokolü (Manuel)

Quiz gecesi öncesinde:

1. 3+ cihaz (laptop projeksiyon + 2-3 telefon farklı şebekelerden) eşzamanlı `/` URL'ine bağlanır.
2. Admin paneli (`/quiz-admin/live`) üzerinden 30 saniyelik bir test sorusu "Gönder" ile yayına alınır.
3. Tüm ekranlarda sayaç görsel olarak karşılaştırılır.
   - Saniye farkı **< 1 sn** → sapma kabul edilebilir, altyapı eklenmez.
   - Saniye farkı **≥ 1 sn** → altyapı eklenir (aşağı).

### Ölçüm Sonucu (Doldurulacak)

- **Tarih:** _(ilk quiz gecesi öncesi ölçüm yapılınca doldur)_
- **Cihazlar:** _(örn. MacBook Air 14, iPhone 13 LTE, iPhone 15 Wi-Fi)_
- **Maksimum fark:** _ saniye
- **Karar:** kabul edilebilir / altyapı eklenecek

## Gerekirse: Altyapı Adımları

Drift > 1 sn ölçülürse aşağıdaki dosyalar eklenir.

### 1. `app/api/time/route.ts`

```ts
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ serverNow: new Date().toISOString() });
}
```

### 2. `lib/time-offset.ts`

NTP benzeri tek-shot ölçüm:

```ts
export async function measureOffset(): Promise<number> {
  const t1 = Date.now();
  const res = await fetch("/api/time", { cache: "no-store" });
  const t2 = Date.now();
  const { serverNow } = (await res.json()) as { serverNow: string };
  const rtt = t2 - t1;
  const serverMs = new Date(serverNow).getTime();
  return serverMs + rtt / 2 - t2;
}
```

`offset > 0` ise client geride, `< 0` ise client ileride.

### 3. `hooks/use-countdown.ts` entegrasyonu

Hook'a opsiyonel `offset` parametresi eklenir, `Date.now()` yerine
`Date.now() + offset` kullanılır.

### 4. `components/presentation/PresentationStage.tsx` mount

Sayfa mount olduğunda bir kez `measureOffset()` çağrılır, sonuç
state'e konur ve hook'a geçer. Sürekli sync yok — bir quiz gecesi
içinde meaningful drift birikmediği varsayılır.

## Limitler

- Tek-shot ölçüm. Quiz gecesi boyunca cihaz uyur/uyanırsa drift birikir.
- RTT yarı varsayımı asimetrik network'lerde hata payı bırakır (~50 ms).
- 50+ cihaz farklı LTE/Wi-Fi'da farklı drift gösterebilir — ölçümü temsili
  cihazlar üzerinden yapmak yeterli, sahaya çıkmadan önce kesinleşmeli.

## Karar Geçmişi

- **Faz 09 (2026-05-19):** Altyapı yazılmadı. Brief'in "gerekirse" klauzu
  takip edildi; manuel ölçüm öncesi proaktif kod ölü kod riski.
