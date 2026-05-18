# Tema Sistemi

> Faz 08 deliverable. Public sahnede aktif quiz'in renk/font/background bilgilerinin DOM'a uygulanma sürecini açıklar. Faz 02 CSS variable mimarisi üstüne kurulur (`documents/theme-tokens.md` referans alır).

## Katman Mimarisi

| Katman | Konum | Sorumluluk |
|---|---|---|
| **Default tema** | `app/globals.css` `:root` | Klasik Sahne preset değerleri (DESIGN.md §11) |
| **Initial tema** | `app/(public)/page.tsx` (server) | DB'den aktif quiz çek, `buildThemeSnapshot()` ile snapshot |
| **State** | `hooks/use-live-session.ts` | Pusher event'lerini dinleyip `theme` state'i tutar |
| **DOM uygulayıcı** | `components/presentation/ThemeApplier.tsx` | `document.documentElement.style.setProperty(...)` |
| **Realtime tetikleyici** | `app/api/live/theme/route.ts` | Admin "Aktif Et" sonrası `quiz:theme-change` event |

## CSS Variable Bağları

```css
:root {
  /* globals.css default — Klasik Sahne preset */
  --quiz-primary: #1a1815;
  --quiz-accent: #c4a572;
  --quiz-text: #f4efe6;
  --quiz-font: var(--font-playfair-display);
}
```

`ThemeApplier` `useEffect` içinde:

```ts
root.style.setProperty("--quiz-primary", theme.primaryColor);
root.style.setProperty("--quiz-accent", theme.accentColor);
root.style.setProperty("--quiz-text", theme.textColor);
root.style.setProperty("--quiz-font", `var(${cssVarForFont(theme.fontKey)})`);
```

`cssVarForFont(key)` (`lib/fonts.ts`) `--font-${key}` döner. Tüm whitelist fontları root `<html>` className'inde (`FONT_WHITELIST_VARIABLES`) build-time preload edilmiştir; runtime'da yalnız `--quiz-font` değişkeni rebind edilir.

## Tailwind Token Eşlemesi

`@theme inline` (globals.css):

```css
--color-quiz-primary: var(--quiz-primary);
--color-quiz-accent: var(--quiz-accent);
--color-quiz-text: var(--quiz-text);
--font-quiz: var(--quiz-font);
```

Sonuç: `bg-quiz-primary`, `text-quiz-accent`, `font-quiz` utility'leri public sahne bileşenlerinde kullanılır.

## Font Swap (Flash Önleme)

- **Faz 02:** 15 font `next/font/google` ile build-time download, `display: swap`, tüm variable'lar `<html>` className'inde.
- **Runtime:** ThemeApplier `--quiz-font` CSS var'ını yeni font variable'ına bağlar.
- **Sonuç:** FOIT yok, font swap network fetch'siz instant.

## Background Preload Pattern

Tema değişirken yeni görsel yüklenene kadar eski görsel ekranda durur (flash önler):

```ts
useEffect(() => {
  const url = theme?.backgroundUrl;
  if (!url) {
    root.style.removeProperty("--quiz-background");
    return;
  }
  let cancelled = false;
  const img = new Image();
  img.src = url;
  img.onload = () => {
    if (cancelled) return;
    root.style.setProperty("--quiz-background", `url("${url}")`);
  };
  return () => {
    cancelled = true;
    img.onload = null;
  };
}, [theme?.backgroundUrl]);
```

`EmptyState` ve modal kompozisyonu `backgroundImage: var(--quiz-background)` ile arka planı uygular.

## Theme Change Olay Akışı

```
Admin (quiz-admin/live)
  └─ "Aktif Et" tıklama
     ├─ server action setActiveQuiz(id)       // DB isActive update
     └─ POST /api/live/theme { quizId }
        ├─ requireAdmin()
        ├─ prisma.quiz.findUnique → tema verisi
        ├─ buildThemeSnapshot(quiz)
        └─ triggerLive("quiz:theme-change", { quizId, theme })
            ↓
       Pusher Channels (public-quiz-night-live)
            ↓
Public sahne (her cihaz):
  └─ channel.bind("quiz:theme-change", onThemeChange)
     └─ useLiveSession setTheme(...)
        └─ ThemeApplier prop güncellendi
           ├─ useEffect → CSS var override
           └─ useEffect → background image preload
              ↓
          DOM güncel.
```

## Edge Cases

- **Aktif quiz yok:** ThemeApplier `theme === null` görür, no-op. globals.css default'ları geçerli, EmptyState `quizTitle={null}` ile "Artium Quiz Night" başlığını gösterir.
- **Geçersiz hex renk:** `buildThemeSnapshot` (`lib/schemas/live.ts`) `safeHexColor(value, fallback)` ile garanti; fallback'ler `#1A1815`, `#C4A572`, `#F4EFE6`.
- **Bilinmeyen fontKey:** `parseFontKey()` whitelist üyesi değilse `DEFAULT_FONT_KEY = "playfair-display"`'e düşer.
- **Background URL 404 / ağ hatası:** `img.onerror` bağlı değil, sessizce yutulur; eski background ekranda kalır, zemin rengi (`--quiz-primary`) okunaklığı korur.
- **Modal açıkken tema değişimi:** ThemeApplier CSS var'ları günceller; modal payload kendi `themeSnapshot`'ını taşıdığı için içerik zaten yeni tema ile yazılmış olur. `quiz:theme-change` event'i pratikte modal kapalıyken meaningful (idle ekran update'i).

## `prefers-reduced-motion`

`globals.css` `@media (prefers-reduced-motion: reduce)` blok'unda `--duration-*` tüm değerler 0ms'e düşer. ThemeApplier'ın kendisi animasyon kullanmaz (CSS var override anlık); reduced-motion ek olarak idle stage'deki spotlight koni nefesini ve modal entrance koreografisini durdurur.

## Bağlantılı Belgeler

- `documents/theme-tokens.md` — Faz 02 CSS variable mimarisi.
- `documents/font-whitelist.md` — Faz 02 15 font listesi.
- `documents/pusher-protocol.md` — Faz 07 event protokolü (`quiz:theme-change`).
- `documents/hooks/use-live-session.md` — Faz 08 state taşıyıcı.
- `documents/DESIGN.md` §04 (Renk), §11 (Preset'ler), §13 (Implementation Notes).
