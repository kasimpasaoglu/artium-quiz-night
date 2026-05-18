import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/server/guards";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AdminShell username={user.username}>{children}</AdminShell>;
}
