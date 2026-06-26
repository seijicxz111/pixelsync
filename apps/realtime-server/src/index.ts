import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { registerSocketServer } from "./socket";

async function main(): Promise<void> {
  const app = Fastify({
    logger: true
  });

  await app.register(helmet, {
    global: true
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute"
  });

  app.get("/health", async () => ({ ok: true, service: "pixelsync-realtime" }));

  await registerSocketServer(app);

  const shutdown = async (): Promise<void> => {
    logger.info("Shutting down realtime server.");
    await app.close();
    await prisma.$disconnect();
  };

  process.on("SIGINT", () => {
    void shutdown().then(() => process.exit(0));
  });

  process.on("SIGTERM", () => {
    void shutdown().then(() => process.exit(0));
  });

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

void main().catch((error: unknown) => {
  logger.fatal({ error }, "Realtime server failed to start.");
  process.exit(1);
});
