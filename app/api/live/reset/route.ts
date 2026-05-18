import { NextResponse } from "next/server";
import { triggerLive } from "@/lib/pusher-server";
import { LIVE_EVENT, type SessionResetPayload } from "@/lib/schemas/live";
import { requireAdmin } from "@/server/guards";

// "Modal'ı Kapat" CTA'sı. Açık modal'ı tüm public ekranlarda kapatır.
// Body taşımaz; çağrı sayacı + audit gerekirse Faz 10 rate-limit eklenir.
export async function POST() {
  await requireAdmin();
  const payload: SessionResetPayload = {};
  await triggerLive(LIVE_EVENT.sessionReset, payload);
  return NextResponse.json({ ok: true });
}
