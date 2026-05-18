"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_ROUTES, ROUTES } from "@/lib/routes";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const response = await fetch(API_ROUTES.logout, { method: "POST" });
        if (!response.ok) {
          throw new Error("Çıkış yapılamadı");
        }
        toast.success("Çıkış yapıldı");
        router.replace(ROUTES.adminLogin);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Çıkış sırasında bir hata oluştu";
        toast.error(message);
      }
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "Çıkış yapılıyor..." : "Çıkış"}
    </Button>
  );
}
