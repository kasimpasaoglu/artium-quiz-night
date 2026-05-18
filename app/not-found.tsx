import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

// Root not-found: hem public (`/foo`) hem admin (`notFound()` çağrısı,
// örn. quiz detail) için ortak. Public layout sarmasında değil — bu yüzden
// nötr admin temasında render olur.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold sm:text-3xl">Sayfa bulunamadı</h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        Aradığınız sayfa taşınmış veya hiç var olmamış olabilir. Aşağıdaki bağlantılardan birini
        kullanabilirsiniz.
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/">Ana Sayfa</Link>
        </Button>
        <Button asChild className="min-h-11">
          <Link href={ROUTES.adminHome}>Yönetim Paneli</Link>
        </Button>
      </nav>
    </main>
  );
}
