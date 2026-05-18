import "server-only";
import pino, { type Logger } from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Next.js dev HMR her sıcak yeniden yüklemede modülü yeniden değerlendirir.
// pino-pretty `worker_threads` başlattığı için her seferinde yeni worker
// sızdırmamak için instance'ı globalThis üzerinde singleton tutuyoruz.
const globalForLogger = globalThis as unknown as { logger?: Logger };

export const logger: Logger =
  globalForLogger.logger ??
  pino(
    isDev
      ? { transport: { target: "pino-pretty", options: { colorize: true } } }
      : { level: process.env.LOG_LEVEL ?? "info" },
  );

if (isDev) globalForLogger.logger = logger;
