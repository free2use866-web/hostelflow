/**
 * Supabase client — used for Storage (medical slip uploads).
 *
 * Keys are managed via the project's Keys/API keys tab:
 *   SUPABASE_URL       (or VITE_SUPABASE_URL)      — e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  (or VITE_SUPABASE_ANON_KEY)
 *
 * The app degrades gracefully when keys are missing: the upload UI hides and
 * existing links still render.
 *
 * SECURITY MODEL (medical data = PHI):
 *  - The bucket must be PRIVATE in the Supabase dashboard. Access is granted
 *    exclusively via short-lived signed URLs minted on demand.
 *  - Uploads are capped by size and MIME type; the <input accept> attribute
 *    is a UI hint, not a control, so the real check happens here.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { safeExternalUrl } from "./security";

const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL =
  env.VITE_SUPABASE_URL ?? env.SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Storage bucket for sick-diet medical slips — MUST be created PRIVATE. */
export const MEDICAL_SLIPS_BUCKET = "medical-slips";

// Hard upload caps — enforced here, not trusted from the file picker.
const MAX_SLIP_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

/** How long a generated access link stays valid. */
const SIGNED_URL_TTL_SECONDS = 600; // 10 minutes

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

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Validate + upload a medical slip. Returns the STORAGE PATH (never a public
 * URL). Mint short-lived access links at read time via getMedicalSlipUrl().
 */
export async function uploadMedicalSlip(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Content-contract checks — don't trust the client-side `accept` filter.
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPG, WebP or PDF files are allowed.");
  }
  if (file.size > MAX_SLIP_BYTES) {
    throw new Error("File exceeds the 5 MB limit.");
  }
  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `slips/${Date.now()}-${randomId()}-${safeName}`;

  const { error } = await supabase.storage
    .from(MEDICAL_SLIPS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    if (error.message?.includes("not found")) {
      throw new Error(
        `Storage bucket "${MEDICAL_SLIPS_BUCKET}" doesn't exist yet. Create it PRIVATE in your Supabase dashboard (Storage → New bucket, do NOT enable public reads).`,
      );
    }
    throw new Error(error.message || "Upload failed.");
  }

  return path;
}

/**
 * Mint a short-lived, scheme-validated access link for a stored slip path.
 * Accepts legacy absolute URLs too (scheme-checked before opening).
 */
export async function getMedicalSlipUrl(ref: string): Promise<string | null> {
  if (!ref) return null;

  // Legacy records may hold an absolute URL — allow-list the scheme only.
  if (/^https?:\/\//i.test(ref)) {
    return safeExternalUrl(ref);
  }

  const supabase = getSupabase();
  if (!supabase) return null;

  // Never hand out permanent public URLs for PHI — sign them, briefly.
  const { data, error } = await supabase.storage
    .from(MEDICAL_SLIPS_BUCKET)
    .createSignedUrl(ref, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error("[supabase] could not sign slip URL:", error?.message);
    return null;
  }
  return safeExternalUrl(data.signedUrl);
}
