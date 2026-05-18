import { type NextRequest, NextResponse } from "next/server";
import { problem } from "@/lib/problem";
import { triggerLive } from "@/lib/pusher-server";
import { endQuestionBodySchema, LIVE_EVENT, type QuestionEndPayload } from "@/lib/schemas/live";
import { requireAdmin } from "@/server/guards";

// Süre dolduğunda opsiyonel server-side trigger. Client zaten süreyi
// `durationSec + serverStartAt` ile ölçüyor; bu event multi-ekran tutarlılığı
// için ek garanti. Admin "Süreyi Erken Bitir" gibi bir CTA da bunu çağırabilir.
export async function POST(request: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem("Geçersiz istek gövdesi", 400);
  }

  const parsed = endQuestionBodySchema.safeParse(body);
  if (!parsed.success) {
    return problem(parsed.error.issues[0]?.message ?? "Geçersiz istek", 400);
  }

  const payload: QuestionEndPayload = { questionId: parsed.data.questionId };
  await triggerLive(LIVE_EVENT.questionEnd, payload);
  return NextResponse.json({ ok: true });
}
