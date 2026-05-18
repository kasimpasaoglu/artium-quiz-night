"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import { API_ROUTES, safeAdminNext } from "@/lib/routes";
import { type LoginInput, loginSchema } from "@/lib/schemas/auth";

const GENERIC_ERROR = "Geçersiz kullanıcı adı veya şifre";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const { run: onSubmit, pending } = useServerAction(
    async (values: LoginInput) => {
      let response: Response;
      try {
        response = await fetch(API_ROUTES.login, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      } catch {
        throw new Error("Sunucuya ulaşılamadı, lütfen tekrar deneyin");
      }
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { title?: string } | null;
        throw new Error(payload?.title ?? GENERIC_ERROR);
      }
    },
    {
      successMessage: "Giriş başarılı",
      errorFallback: GENERIC_ERROR,
      onSuccess: () => router.replace(safeAdminNext(next)),
    },
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Yönetici Girişi</CardTitle>
        <CardDescription>
          Quiz panellerine erişmek için kullanıcı adı ve şifrenizi girin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı adı</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="username"
                      autoFocus
                      placeholder="Kullanıcı adı"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="Şifre"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
