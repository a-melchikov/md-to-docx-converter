import type { FastifyInstance } from "fastify";

type ShutdownSignal = "SIGINT" | "SIGTERM";

const DEFAULT_SIGNALS: ShutdownSignal[] = ["SIGINT", "SIGTERM"];

export function registerGracefulShutdown(
  app: FastifyInstance,
  signals: ShutdownSignal[] = DEFAULT_SIGNALS
): () => void {
  let shuttingDown = false;
  const handlers = new Map<ShutdownSignal, () => void>();

  for (const signal of signals) {
    const handler = (): void => {
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      void shutdown(app, signal, () => unregisterHandlers(handlers));
    };

    handlers.set(signal, handler);
    process.once(signal, handler);
  }

  return () => unregisterHandlers(handlers);
}

async function shutdown(
  app: FastifyInstance,
  signal: ShutdownSignal,
  cleanup: () => void
): Promise<void> {
  app.log.info({ signal }, "graceful shutdown started");

  try {
    await app.close();
    app.log.info({ signal }, "graceful shutdown completed");
    process.exitCode = 0;
  } catch (error) {
    app.log.error({ err: error, signal }, "graceful shutdown failed");
    process.exitCode = 1;
  } finally {
    cleanup();
  }
}

function unregisterHandlers(handlers: Map<ShutdownSignal, () => void>): void {
  for (const [signal, handler] of handlers) {
    process.off(signal, handler);
  }

  handlers.clear();
}
