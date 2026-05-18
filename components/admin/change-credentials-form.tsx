"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { changeCredentials } from "@/server/actions/auth";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi girin"),
    newUsername: z.string().max(100, "Yeni kullanıcı adı en fazla 100 karakter olabilir"),
    newPassword: z.string().max(200, "Yeni şifre en fazla 200 karakter olabilir"),
    newPasswordConfirm: z.string().max(200),
  })
  .refine((data) => data.newPassword.length === 0 || data.newPassword === data.newPasswordConfirm, {
    message: "Yeni şifreler eşleşmiyor",
    path: ["newPasswordConfirm"],
  })
  .refine((data) => data.newPassword.length === 0 || data.newPassword.length >= 8, {
    message: "Yeni şifre en az 8 karakter olmalı",
    path: ["newPassword"],
  })
  .refine((data) => data.newUsername.length === 0 || data.newUsername.length >= 3, {
    message: "Yeni kullanıcı adı en az 3 karakter olmalı",
    path: ["newUsername"],
  });

type FormValues = z.infer<typeof formSchema>;

export function ChangeCredentialsForm({ currentUsername }: { currentUsername: string }) {
  const [pending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newUsername: currentUsername,
      newPassword: "",
      newPasswordConfirm: "",
    },
  });

  function onSubmit(values: FormValues) {
    const usernameChanged = values.newUsername !== currentUsername;
    const passwordProvided = values.newPassword.length > 0;

    if (!usernameChanged && !passwordProvided) {
      toast.error("Yeni kullanıcı adı veya yeni şifre girilmeli");
      return;
    }

    startTransition(async () => {
      try {
        await changeCredentials({
          currentPassword: values.currentPassword,
          newUsername: usernameChanged ? values.newUsername : undefined,
          newPassword: passwordProvided ? values.newPassword : undefined,
        });
        toast.success("Bilgileriniz güncellendi");
        form.reset({
          currentPassword: "",
          newUsername: usernameChanged ? values.newUsername : currentUsername,
          newPassword: "",
          newPasswordConfirm: "",
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Bilgiler güncellenemedi";
        toast.error(message);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mevcut şifre</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Mevcut şifreniz"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni kullanıcı adı</FormLabel>
              <FormControl>
                <Input autoComplete="username" placeholder="Yeni kullanıcı adı" {...field} />
              </FormControl>
              <FormDescription>Aynı kalmasını istiyorsanız bu alanı değiştirmeyin.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni şifre</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                  {...field}
                />
              </FormControl>
              <FormDescription>Şifreyi değiştirmek istemiyorsanız boş bırakın.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPasswordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni şifre (tekrar)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Yeni şifreyi tekrar girin"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Güncelleniyor..." : "Bilgileri Güncelle"}
        </Button>
      </form>
    </Form>
  );
}
