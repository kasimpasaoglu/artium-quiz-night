// Admin paneldeki API route fetch'lerini `useServerAction` hook'una uyumlu
// throw semantiğine çevirir. Login, logout ve Faz 07 live-mode-panel'in dört
// fetch'i aynı pattern'i paylaşıyor (try/catch + non-OK throw). Tek yerde
// toplandı.
//
// Pattern:
//   await postJson(API_ROUTES.liveSend, { questionId });
// → 2xx ise JSON parse edip döner; non-OK ise `payload.title` veya fallback
//   ile `Error` fırlatır (`useServerAction` toast.error olarak gösterir).

interface ProblemPayload {
  title?: string;
}

const NETWORK_ERROR = "Sunucuya ulaşılamadı, lütfen tekrar deneyin";

export async function postJson<TResponse = unknown>(
  url: string,
  body: unknown,
  options: { errorFallback?: string } = {},
): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ProblemPayload | null;
    throw new Error(payload?.title ?? options.errorFallback ?? "İşlem başarısız");
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json().catch(() => undefined as TResponse)) as TResponse;
}
