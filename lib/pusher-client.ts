"use client";

import PusherClient from "pusher-js";

// Pusher client SDK singleton. Next.js fast refresh sırasında modüller yeniden
// değerlendirilebilir; her render'da `new PusherClient(...)` çağrılırsa
// arka arkaya WebSocket açılıp Pusher'ın 100 connection limiti hızla biter.
// Module-level cache + singleton pattern bunu engeller.
let instance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!instance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      throw new Error("Pusher istemci anahtarları tanımlı değil");
    }
    instance = new PusherClient(key, {
      cluster,
      forceTLS: true,
    });
  }
  return instance;
}
