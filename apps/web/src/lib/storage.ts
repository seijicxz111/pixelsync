import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export type StoredAsset = {
  path: string;
  publicUrl: string;
};

export async function uploadCanvasExport(input: {
  canvasId: string;
  filename: string;
  pngBytes: Uint8Array;
}): Promise<StoredAsset> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase Storage is not configured.");
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
  const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `canvases/${input.canvasId}/exports/${Date.now()}-${safeFilename}`;
  const { error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, input.pngBytes, {
      contentType: "image/png",
      upsert: false
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
