/**
 * Supabase client — used for Storage (medical slip uploads).
 *
 * Keys are managed via the project's Keys/API keys tab:
 *   SUPABASE_URL       (or VITE_SUPABASE_URL)      — e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  (or VITE_SUPABASE_ANON_KEY)
 *
 * The app degrades gracefully when keys are missing: the upload UI hides and
 * existing links still render.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Storage bucket for sick-diet medical slips (create it in the Supabase dashboard). */
export const MEDICAL_SLIPS_BUCKET = "medical-slips";

let client: SupabaseClient | null = null;

/** Lazily-created singleton; returns null when keys are not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

/**
 * Upload a medical slip and return its public URL.
 * Bucket must exist and allow public reads (or use signed URLs later).
 */
export async function uploadMedicalSlip(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `slips/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;

  const { error } = await supabase.storage
    .from(MEDICAL_SLIPS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    if (error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${MEDICAL_SLIPS_BUCKET}" doesn't exist yet. Create it in your Supabase dashboard (Storage → New bucket, enable public reads).`,
      );
    }
    throw new Error(error.message || "Upload failed.");
  }

  const { data } = supabase.storage.from(MEDICAL_SLIPS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
