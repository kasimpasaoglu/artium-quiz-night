import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { LogoutButton } from "./logout-button";

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <Link href={ROUTES.adminHome} className="text-sm font-semibold">
          Artium Quiz Night · Yönetim
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href={ROUTES.adminLive} className="text-muted-foreground hover:text-foreground">
            Live Mode
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href={ROUTES.adminSettings} className="text-muted-foreground hover:text-foreground">
            Ayarlar
          </Link>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{username}</span>
          <LogoutButton />
        </nav>
      </header>
      <main className="px-4 py-6">{children}</main>
    </div>
  );
}
