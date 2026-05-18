import "server-only";
import Pusher from "pusher";
import { env } from "@/lib/env";
import { LIVE_CHANNEL, type LiveEvent } from "@/lib/schemas/live";

// Pusher server SDK singleton. Next.js HMR + serverless invocation'larda aynı
// instance tekrar kullanılır (`globalThis` cache). `db/prisma.ts`'in
// kullandığı pattern ile aynı.
const globalForPusher = globalThis as unknown as { pusherServer?: Pusher };

export const pusherServer =
  globalForPusher.pusherServer ??
  new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.PUSHER_KEY,
    secret: env.PUSHER_SECRET,
    cluster: env.PUSHER_CLUSTER,
    useTLS: true,
  });

if (env.NODE_ENV !== "production") {
  globalForPusher.pusherServer = pusherServer;
}

// Tek kanal üzerinden tipli event publish helper'ı. API route'ları doğrudan
// `pusherServer.trigger` çağırmak yerine bu helper'ı kullanır — kanal adı tek
// yerde, event isimleri `LIVE_EVENT` enum'ı ile sınırlı.
export async function triggerLive<TPayload>(event: LiveEvent, payload: TPayload): Promise<void> {
  await pusherServer.trigger(LIVE_CHANNEL, event, payload);
}
