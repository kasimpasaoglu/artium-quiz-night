"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { ColorPicker } from "@/components/admin/color-picker";
import { FontSelect } from "@/components/admin/font-select";
import { ImageUpload } from "@/components/admin/image-upload";
import { PresetChips } from "@/components/admin/preset-chips";
import { QuizThemePreview } from "@/components/admin/quiz-theme-preview";
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
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import { parseFontKey } from "@/lib/fonts";
import { DEFAULT_QUIZ_PRESET } from "@/lib/quiz-presets";
import { ROUTES } from "@/lib/routes";
import { type QuizFormInput, quizFormSchema } from "@/lib/schemas/quiz";
import { createQuiz, updateQuiz } from "@/server/actions/quiz";

export interface QuizFormInitialData {
  id: string;
  title: string;
  description: string | null;
  backgroundUrl: string | null;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  fontKey: string;
}

type QuizFormProps =
  | { mode: "create"; initialData?: undefined }
  | { mode: "edit"; initialData: QuizFormInitialData };

const createDefaults: QuizFormInput = {
  title: "",
  description: "",
  backgroundUrl: "",
  primaryColor: DEFAULT_QUIZ_PRESET.primaryColor,
  accentColor: DEFAULT_QUIZ_PRESET.accentColor,
  textColor: DEFAULT_QUIZ_PRESET.textColor,
  fontKey: DEFAULT_QUIZ_PRESET.fontKey,
};

function toFormDefaults(data: QuizFormInitialData): QuizFormInput {
  return {
    title: data.title,
    description: data.description ?? "",
    backgroundUrl: data.backgroundUrl ?? "",
    primaryColor: data.primaryColor,
    accentColor: data.accentColor,
    textColor: data.textColor,
    fontKey: data.fontKey,
  };
}

export function QuizForm(props: QuizFormProps) {
  const router = useRouter();

  const form = useForm<QuizFormInput>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: props.mode === "edit" ? toFormDefaults(props.initialData) : createDefaults,
  });

  const watched = useWatch({ control: form.control });
  const previewFontKey = parseFontKey(watched.fontKey);

  const createAction = useServerAction(createQuiz, {
    errorFallback: "Quiz kaydedilemedi",
  });

  const updateAction = useServerAction(updateQuiz, {
    successMessage: "Quiz güncellendi",
    errorFallback: "Quiz kaydedilemedi",
    onSuccess: () => {
      if (props.mode === "edit") {
        router.push(ROUTES.adminQuizDetail(props.initialData.id));
        router.refresh();
      }
    },
  });

  const pending = createAction.pending || updateAction.pending;

  function onSubmit(values: QuizFormInput) {
    if (props.mode === "create") {
      createAction.run(values);
    } else {
      updateAction.run(props.initialData.id, values);
    }
  }

  const cancelHref =
    props.mode === "edit" ? ROUTES.adminQuizDetail(props.initialData.id) : ROUTES.adminHome;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          <section className="space-y-3">
            <header>
              <h2 className="text-base font-semibold">Önerilen Kombinasyonlar</h2>
              <p className="text-sm text-muted-foreground">
                Tek tıkla başlangıç teması seçin, ardından dilediğiniz alanı düzenleyin.
              </p>
            </header>
            <PresetChips
              disabled={pending}
              onSelect={(preset) => {
                form.setValue("primaryColor", preset.primaryColor, { shouldDirty: true });
                form.setValue("accentColor", preset.accentColor, { shouldDirty: true });
                form.setValue("textColor", preset.textColor, { shouldDirty: true });
                form.setValue("fontKey", preset.fontKey, { shouldDirty: true });
              }}
            />
          </section>

          <section className="space-y-4">
            <header>
              <h2 className="text-base font-semibold">Quiz Bilgileri</h2>
            </header>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlık</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Örn. Kurtlar Vadisi Quiz Night"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Quiz'in atmosferi, tema notları (opsiyonel)."
                      disabled={pending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>İsteğe bağlı, yalnızca yöneticilere görünür.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-4">
            <header>
              <h2 className="text-base font-semibold">Tema</h2>
              <p className="text-sm text-muted-foreground">
                Renkler hex (#rrggbb) formatında; font listesi DESIGN.md whitelist&apos;inden gelir.
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birincil renk</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={pending}
                        ariaLabel="Birincil renk"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accentColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vurgu rengi</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={pending}
                        ariaLabel="Vurgu rengi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="textColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metin rengi</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={pending}
                        ariaLabel="Metin rengi"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="fontKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Font</FormLabel>
                  <FormControl>
                    <FontSelect
                      value={parseFontKey(field.value)}
                      onChange={(next) => field.onChange(next)}
                      disabled={pending}
                    />
                  </FormControl>
                  <FormDescription>Başlık ve büyük metinler bu fontla yazılır.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="space-y-3">
            <header>
              <h2 className="text-base font-semibold">Arka Plan Görseli</h2>
            </header>
            <FormField
              control={form.control}
              name="backgroundUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      folder="quizBackground"
                      value={field.value ?? ""}
                      onChange={(next) => field.onChange(next)}
                      disabled={pending}
                      description="Opsiyonel. Sahne moduna geçildiğinde arka plana uygulanır."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Kaydediliyor..."
                : props.mode === "create"
                  ? "Quiz Oluştur"
                  : "Değişiklikleri Kaydet"}
            </Button>
            <Button asChild variant="ghost" type="button" disabled={pending}>
              <Link href={cancelHref}>Vazgeç</Link>
            </Button>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <header>
            <h2 className="text-base font-semibold">Önizleme</h2>
            <p className="text-sm text-muted-foreground">
              Sahne modunun yaklaşık görüntüsü; nihai hâli quiz seçildiğinde projeksiyona basılır.
            </p>
          </header>
          <QuizThemePreview
            title={watched.title ?? ""}
            primaryColor={watched.primaryColor ?? DEFAULT_QUIZ_PRESET.primaryColor}
            accentColor={watched.accentColor ?? DEFAULT_QUIZ_PRESET.accentColor}
            textColor={watched.textColor ?? DEFAULT_QUIZ_PRESET.textColor}
            fontKey={previewFontKey}
            backgroundUrl={watched.backgroundUrl || null}
          />
        </aside>
      </form>
    </Form>
  );
}
