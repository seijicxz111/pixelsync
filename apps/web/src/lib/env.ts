import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_REALTIME_URL: z.string().url(),
  NEXT_PUBLIC_DEMO_MODE: z.coerce.boolean().default(false),
  SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("pixelsync-assets")
});

const defaults = {
  DATABASE_URL:
    process.env.DATABASE_URL ??
    (isProduction ? undefined : "postgresql://postgres:postgres@localhost:5432/pixelsync?schema=public"),
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET:
    process.env.AUTH_SECRET ??
    (isProduction ? undefined : "dev-secret-change-me-dev-secret-change-me"),
  AUTH_URL: process.env.AUTH_URL ?? (isProduction ? undefined : "http://localhost:3000"),
  AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
  AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? (isProduction ? undefined : "http://localhost:3000"),
  NEXT_PUBLIC_REALTIME_URL:
    process.env.NEXT_PUBLIC_REALTIME_URL ?? (isProduction ? undefined : "http://localhost:4000"),
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? (!isProduction).toString(),
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET ?? "pixelsync-assets"
};

const parsed = serverEnvSchema.safeParse(defaults);

if (!parsed.success) {
  throw new Error(`Invalid web environment: ${parsed.error.message}`);
}

export const env = parsed.data;
