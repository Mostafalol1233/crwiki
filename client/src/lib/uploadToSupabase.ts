/**
 * Unified file upload utility using Supabase Storage.
 * Replaces the old /images/upload Express/Cloudinary endpoint.
 * Uses the service-role client when available (bypasses RLS), falls back to anon client.
 */
import { supabase } from './supabase';
import { supabaseService } from './supabaseAdmin';

const BUCKET = 'media';

export async function uploadToSupabase(
  file: File,
  folder: string = 'uploads',
  customName?: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const client = supabaseService || supabase;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = customName
    ? `${customName}.${ext}`
    : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${safeName}`;

  // Supabase JS v2 doesn't support onUploadProgress natively, but we can
  // simulate start/finish for UI feedback
  onProgress?.(10);

  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  onProgress?.(100);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get public URL after upload');
  return data.publicUrl;
}

/** Ensure the media bucket exists (idempotent — safe to call on startup) */
export async function ensureMediaBucket(): Promise<void> {
  const client = supabaseService || supabase;
  const { data: buckets } = await client.storage.listBuckets();
  if (buckets?.some(b => b.name === BUCKET)) return;
  await client.storage.createBucket(BUCKET, { public: true });
}
