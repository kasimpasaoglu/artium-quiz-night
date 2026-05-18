"use client";

import { useEffect, useState } from "react";

export interface UseCountdownResult {
  /** Kalan saniye (kesirli). Render tarafı `Math.ceil` ile tam sayıya çevirir. */
  remaining: number;
  /** 0..1 arası ilerleme; sayaç doldukça 1'e yaklaşır. */
  progress: number;
  /** Kalan süre 0'a düştü mü. */
  isFinished: boolean;
}

// 250ms: gözle pürüzsüz progress bar için yeterli, RAF kadar agresif değil.
const TICK_MS = 250;

function compute(serverStartAt: string, durationSec: number): UseCountdownResult {
  const startMs = new Date(serverStartAt).getTime();
  const elapsedSec = Math.max(0, (Date.now() - startMs) / 1000);
  const remaining = Math.max(0, durationSec - elapsedSec);
  const progress = durationSec > 0 ? Math.min(1, Math.max(0, elapsedSec / durationSec)) : 1;
  return { remaining, progress, isFinished: remaining <= 0 };
}

export function useCountdown(serverStartAt: string, durationSec: number): UseCountdownResult {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (compute(serverStartAt, durationSec).isFinished) return;
    const id = setInterval(() => {
      const result = compute(serverStartAt, durationSec);
      setTick((value) => value + 1);
      if (result.isFinished) clearInterval(id);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [serverStartAt, durationSec]);

  return compute(serverStartAt, durationSec);
}
