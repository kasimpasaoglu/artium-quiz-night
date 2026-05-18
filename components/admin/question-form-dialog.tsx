"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DifficultyBadge } from "@/components/admin/difficulty-badge";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import {
  type QuestionFormInitialData,
  type QuestionFormInput,
  questionFormSchema,
} from "@/lib/schemas/question";
import { createQuestion, updateQuestion } from "@/server/actions/question";

type QuestionFormDialogProps =
  | {
      mode: "create";
      quizId: string;
      trigger: React.ReactNode;
    }
  | {
      mode: "edit";
      question: QuestionFormInitialData;
      trigger: React.ReactNode;
    };

const DEFAULT_VALUES: QuestionFormInput = {
  text: "",
  imageUrl: "",
  durationSec: 30,
  difficulty: 3,
};

function toFormDefaults(data: QuestionFormInitialData): QuestionFormInput {
  return {
    text: data.text,
    imageUrl: data.imageUrl ?? "",
    durationSec: data.durationSec,
    difficulty: data.difficulty,
  };
}

const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5] as const;

export function QuestionFormDialog(props: QuestionFormDialogProps) {
  const [open, setOpen] = useState(false);

  const initialValues = props.mode === "edit" ? toFormDefaults(props.question) : DEFAULT_VALUES;

  const form = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: initialValues,
  });

  function handleOpenChange(next: boolean) {
    if (next) form.reset(initialValues);
    setOpen(next);
  }

  const createAction = useServerAction(createQuestion, {
    successMessage: "Soru eklendi",
    errorFallback: "Soru kaydedilemedi",
    onSuccess: () => {
      form.reset(DEFAULT_VALUES);
      setOpen(false);
    },
  });

  const updateAction = useServerAction(updateQuestion, {
    successMessage: "Soru güncellendi",
    errorFallback: "Soru güncellenemedi",
    onSuccess: () => setOpen(false),
  });

  const pending = createAction.pending || updateAction.pending;
  const watchedDifficulty = useWatch({ control: form.control, name: "difficulty" });

  function onSubmit(values: QuestionFormInput) {
    if (props.mode === "create") {
      createAction.run(props.quizId, values);
    } else {
      updateAction.run(props.question.id, values);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{props.mode === "create" ? "Yeni Soru" : "Soruyu Düzenle"}</DialogTitle>
          <DialogDescription>
            Soru metni, görsel, süre ve zorluk seviyesini belirleyin.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Soru Metni</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      maxLength={1000}
                      placeholder="Soruyu olabildiğince net yazın. Örn. Çağrı Merkezi sezonu kaç bölümdü?"
                      disabled={pending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Görsel (opsiyonel)</FormLabel>
                  <FormControl>
                    <ImageUpload
                      folder="questionImage"
                      value={field.value ?? ""}
                      onChange={(next) => field.onChange(next)}
                      disabled={pending}
                      description="JPG, PNG veya WebP. Sahnede soru ile birlikte gösterilir."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="durationSec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Süre (saniye)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={600}
                        step={5}
                        inputMode="numeric"
                        disabled={pending}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(event) => {
                          const raw = event.target.value;
                          field.onChange(raw === "" ? Number.NaN : Number(raw));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>5 ile 600 saniye arası.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zorluk</FormLabel>
                    <FormControl>
                      <Select
                        disabled={pending}
                        value={String(field.value ?? "")}
                        onValueChange={(next) => field.onChange(Number(next))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Zorluk seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map((value) => (
                            <SelectItem key={value} value={String(value)}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <DifficultyBadge value={Number(watchedDifficulty)} className="mt-1" />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Kaydediliyor..."
                  : props.mode === "create"
                    ? "Soruyu Ekle"
                    : "Değişiklikleri Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
