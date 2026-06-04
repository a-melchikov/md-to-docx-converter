import { pathToFileURL } from "node:url";

import { buildApp } from "./app.js";
import { loadApiEnv } from "./config/env.js";
import { registerGracefulShutdown } from "./lifecycle/graceful-shutdown.js";

export { buildApp } from "./app.js";
export type { BuildAppOptions } from "./app.js";

export async function startApi(): Promise<void> {
  const config = loadApiEnv();
  const app = await buildApp({ config });
  const unregisterShutdown = registerGracefulShutdown(app);

  try {
    await app.listen({ host: config.host, port: config.port });
    app.log.info(
      { host: config.host, port: config.port },
      "md-to-docx API started"
    );
  } catch (error) {
    unregisterShutdown();
    app.log.error({ err: error }, "md-to-docx API failed to start");
    process.exitCode = 1;
  }
}

function isExecutedDirectly(): boolean {
  const entrypoint = process.argv[1];
  return entrypoint ? import.meta.url === pathToFileURL(entrypoint).href : false;
}

if (isExecutedDirectly()) {
  void startApi();
}
