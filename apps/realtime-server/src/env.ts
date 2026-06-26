import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).optional(),
  WEB_ORIGIN: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  MAX_OPERATION_CHANGES: z.coerce.number().int().min(1).max(10_000).default(4096),
  SNAPSHOT_INTERVAL: z.coerce.number().int().min(5).max(500).default(50),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info")
});

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (isProduction ? undefined : "postgresql://postgres:postgres@localhost:5432/pixelsync?schema=public"),
  REDIS_URL: process.env.REDIS_URL,
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? (isProduction ? undefined : "http://localhost:3000"),
  AUTH_SECRET:
    process.env.AUTH_SECRET ??
    (isProduction ? undefined : "dev-secret-change-me-dev-secret-change-me"),
  MAX_OPERATION_CHANGES: process.env.MAX_OPERATION_CHANGES,
  SNAPSHOT_INTERVAL: process.env.SNAPSHOT_INTERVAL,
  LOG_LEVEL: process.env.LOG_LEVEL
});

if (!parsed.success) {
  throw new Error(`Invalid realtime environment: ${parsed.error.message}`);
}

export const env = parsed.data;
