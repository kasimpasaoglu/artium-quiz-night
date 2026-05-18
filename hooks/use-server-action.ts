"use client";

import { useTransition } from "react";
import { toast } from "sonner";

export interface UseServerActionOptions {
  successMessage?: string;
  errorFallback?: string;
  onSuccess?: () => void;
}

export interface UseServerActionResult<TArgs extends unknown[]> {
  run: (...args: TArgs) => void;
  pending: boolean;
}

export function useServerAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseServerActionOptions = {},
): UseServerActionResult<TArgs> {
  const [pending, startTransition] = useTransition();

  function run(...args: TArgs) {
    startTransition(async () => {
      try {
        await action(...args);
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        options.onSuccess?.();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : (options.errorFallback ?? "İşlem başarısız");
        toast.error(message);
      }
    });
  }

  return { run, pending };
}
