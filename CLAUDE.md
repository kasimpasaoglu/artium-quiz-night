<!-- BEGIN:nextjs-agent-rules -->
# Bu Next.js Bildiğin Next.js Değil

Projede **Next.js 16 (App Router) + React 19** kullanılıyor — API'ler, konvansiyonlar ve dosya yapısı training data'dan farklı olabilir. Kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili rehberi oku, deprecation uyarılarını ciddiye al.

- `middleware.ts` yerine `proxy.ts`.
- Server Component default; istemci kodu `'use client'` ile ayrı parçalarda.
- Async API'ler (`cookies()`, `headers()`, `params`, `searchParams`) `await` ile çözülür.


**Türkçe karakter zorunluluğu:** `ç`, `ğ`, `ı`, `ö`, `ş`, `ü` ve büyük halleri (`Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`) eksiksiz yazılır. Form label, validation mesajı, toast, buton, placeholder, empty state, hata mesajı, `zod`/`yup` schema mesajı, `notify()` çağrısı, ProblemDetails text, API description, exception message, commit message, PR body, code comment hepsi dahil. Kaynak metinde eksik karakter varsa tamamlayarak taşı.
- **Kullanıcı yazı stilini taklit etme:** Kullanıcı İngilizce klavye, kısaltma, lowercase veya eksik noktalama ile yazıyor olabilir. Agent her zaman düzgün Türkçe (karakterler tam, noktalama yerinde, cümle yapısı net) yanıt verir; kullanıcının üslubu agent çıktısını bozmaz.

<!-- END:nextjs-agent-rules -->