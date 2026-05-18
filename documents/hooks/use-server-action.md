# `useServerAction(action, options)`

Server action callsite'larında tekrar eden `useTransition + try/catch + toast` üçlüsünü tek noktaya alan client-side hook. Faz 06'da soru CRUD + reorder + silme dialog'unda kullanılır. Faz 04 §14'te ertelenen abstraction; 10+ callsite'a ulaştığı için bu fazda yazıldı.

## İmza

```ts
function useServerAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: {
    successMessage?: string;
    errorFallback?: string;
    onSuccess?: () => void;
  },
): {
  run: (...args: TArgs) => void;
  pending: boolean;
};
```

`TArgs` ve `TResult` generic'leri action imzasından otomatik çıkarılır; callsite'ta tip belirtmek gerekmez.

## Davranış

- **`useTransition`** sarması: `pending` state otomatik, `run(...args)` `startTransition` içinde async çağrıyı yapar.
- **Başarı:** `successMessage` set edildiyse `toast.success(...)`, sonra `onSuccess?.()`.
- **Hata:** `error.message` (Error instance ise) ya da `errorFallback` ya da `"İşlem başarısız"` → `toast.error(...)`. `onSuccess` çağrılmaz.
- **`error.message` Türkçe gelirse direkt göster:** Server action throw'larında Türkçe mesaj atılıyor (`lib/prisma-errors.ts` haritalama, manuel `throw new Error("...")`). Hook ek bir mapping yapmaz.

## Kullanım Örnekleri

### 1. Button click (parametrik action)

```tsx
const { run: handleDelete, pending } = useServerAction(deleteQuestion, {
  successMessage: "Soru silindi",
  errorFallback: "Soru silinemedi",
  onSuccess: () => setOpen(false),
});

<Button onClick={() => handleDelete(questionId)} disabled={pending}>
  {pending ? "Siliniyor..." : "Sil"}
</Button>
```

### 2. Form submit (RHF + zodResolver)

```tsx
const { run, pending } = useServerAction(createQuestion, {
  successMessage: "Soru eklendi",
  errorFallback: "Soru kaydedilemedi",
  onSuccess: () => { form.reset(); setOpen(false); },
});

<form onSubmit={form.handleSubmit((values) => run(quizId, values))}>
  ...
</form>
```

### 3. İki action aynı bileşende (form-dialog: create/edit)

```tsx
const createAction = useServerAction(createQuestion, { ... });
const updateAction = useServerAction(updateQuestion, { ... });
const pending = createAction.pending || updateAction.pending;

function onSubmit(values) {
  if (mode === "create") createAction.run(quizId, values);
  else updateAction.run(id, values);
}
```

## Bağımlılıklar

- `react` — `useTransition`.
- `sonner` — `toast.success`, `toast.error`.

## Kapsam Notu

Faz 06 callsite'larında kullanılır:
- `components/admin/question-form-dialog.tsx` (create + update)
- `components/admin/delete-question-dialog.tsx`
- `components/admin/question-table.tsx` (reorder up/down)

Faz 04/05'teki eski callsite'lar (`login-form`, `change-credentials-form`, `delete-quiz-dialog`, `quiz-form`, `quiz-list`) bu hook'a **port edilmedi** — PR yalın kalsın diye. İleride bir simplify pass'inde back-port edilebilir.

## Edge Cases

- **`successMessage` yoksa toast yok:** Reorder gibi sessiz işlemlerde sadece `errorFallback` veriyoruz, başarıda toast atılmaz.
- **`error.message` boş string:** `error instanceof Error && !error.message` → `errorFallback` devreye girer.
- **Form submit'te `run`'ın imza eşleşmesi:** `form.handleSubmit((values) => run(values))` ya da `form.handleSubmit(run)` ikisi de çalışır; `run` tipi `(values: ...) => void` form callback ile uyumlu.
- **Tek `pending` flag bütün form'u disable etmek için yeterli mi?** Evet — `useServerAction` aynı transition'ı paylaşıyor; ek bir `isSubmitting` state'i gerekmez.
