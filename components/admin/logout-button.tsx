"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { API_ROUTES, ROUTES } from "@/lib/routes";

export function LogoutButton() {
  const router = useRouter();

  const { run: handleClick, pending } = useServerAction(
    async () => {
      const response = await fetch(API_ROUTES.logout, { method: "POST" });
      if (!response.ok) {
        throw new Error("Çıkış yapılamadı");
      }
    },
    {
      successMessage: "Çıkış yapıldı",
      errorFallback: "Çıkış sırasında bir hata oluştu",
      onSuccess: () => router.replace(ROUTES.adminLogin),
    },
  );

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "Çıkış yapılıyor..." : "Çıkış"}
    </Button>
  );
}
