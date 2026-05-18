import { ChangeCredentialsForm } from "@/components/admin/change-credentials-form";
import { requireAdmin } from "@/server/guards";

export default async function SettingsPage() {
  const user = await requireAdmin();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">
          Mevcut kullanıcı: <span className="font-medium">{user.username}</span>
        </p>
      </header>
      <ChangeCredentialsForm currentUsername={user.username} />
    </div>
  );
}
