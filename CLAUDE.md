<!-- BEGIN:nextjs-agent-rules -->


## Kısa Tanım

Artium ekibinin gösteri merkezinde düzenlediği bilgi yarışması geceleri için bir **sunum + moderasyon platformu**. Klasik bir yarışma uygulaması değil: sistem cevap toplamaz, skor tutmaz — moderatör admin panelinden quiz tanımlar (tema renkleri, font, arka plan görseli) ve quiz altında sorular hazırlar (text + opsiyonel görsel + cevap süresi + zorluk). Yarışma gecesi "live mode" üzerinden quiz seçilir, sorular "Gönder" butonu ile teker teker yayınlanır. Ana ekran (`/`) hem projeksiyona hem de katılımcı telefonlarına yansır; aktif quiz'in teması uygulanır, gönder dendiği an modal açılır, gönderilen soru + geri sayan sayaç + progress bar çıkar, süre dolunca "Süreniz doldu" mesajı görünür. Cevap değerlendirmesi sözlü/elle yapılır.



## Kurallar

**Bu Next.js Bildiğin Next.js Değil**
Projede **Next.js 16 (App Router) + React 19** kullanılıyor — API'ler, konvansiyonlar ve dosya yapısı training data'dan farklı olabilir. Kod yazmadan önce `node_modules/next/dist/docs/` içindeki ilgili rehberi oku, deprecation uyarılarını ciddiye al.

- `middleware.ts` yerine `proxy.ts`.
- Server Component default; istemci kodu `'use client'` ile ayrı parçalarda.
- Async API'ler (`cookies()`, `headers()`, `params`, `searchParams`) `await` ile çözülür.

**Proje dökümanı** `documents/project.md` dosyasıdır. MVP versiyonu tamamlanana kadar her agent bu dokumanı okumalıdır.

**UI/UX Tasarımı** konularında referans dokuman `documents/DESIGN.md` dosyasıdır. Bu tarz görevlerde okunmalıdır.

**Türkçe karakter zorunluluğu:** `ç`, `ğ`, `ı`, `ö`, `ş`, `ü` ve büyük halleri (`Ç`, `Ğ`, `İ`, `Ö`, `Ş`, `Ü`) eksiksiz yazılır. Form label, validation mesajı, toast, buton, placeholder, empty state, hata mesajı, `zod`/`yup` schema mesajı, `notify()` çağrısı, ProblemDetails text, API description, exception message, commit message, PR body, code comment hepsi dahil. Kaynak metinde eksik karakter varsa tamamlayarak taşı.

- **Kullanıcı yazı stilini taklit etme:** Kullanıcı İngilizce klavye, kısaltma, lowercase veya eksik noktalama ile yazıyor olabilir. Agent her zaman düzgün Türkçe (karakterler tam, noktalama yerinde, cümle yapısı net) yanıt verir; kullanıcının üslubu agent çıktısını bozmaz.

**Her zaman verilen göreve uygun skilleri bul ve kullan** Skill setlerini kontrol etmeden göreve başlama.

<!-- END:nextjs-agent-rules -->