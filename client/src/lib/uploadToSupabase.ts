/**
 * Unified file upload utility using Supabase Storage.
 * Always uses the service-role client to bypass RLS.
 */
import { supabase } from './supabase';
import { supabaseService } from './supabaseAdmin';

const BUCKET = 'media';
let bucketReady = false;

/** Ensure the media bucket exists — called automatically before every upload */
async function ensureBucket(client: any): Promise<void> {
  if (bucketReady) return;
  try {
    const { data: buckets } = await client.storage.listBuckets();
    if (!buckets?.some((b: any) => b.name === BUCKET)) {
      await client.storage.createBucket(BUCKET, { public: true });
    }
    bucketReady = true;
  } catch {
    // Bucket may already exist or creation not permitted — proceed anyway
    bucketReady = true;
  }
}

export async function uploadToSupabase(
  file: File,
  folder: string = 'uploads',
  customName?: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  // Service-role client bypasses all RLS policies
  const client = supabaseService || supabase;

  await ensureBucket(client);

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = customName
    ? `${customName}.${ext}`
    : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${safeName}`;

  onProgress?.(10);

  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  onProgress?.(100);

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Could not get public URL after upload');
  return data.publicUrl;
}

/** Ensure the media bucket exists (idempotent) */
export async function ensureMediaBucket(): Promise<void> {
  const client = supabaseService || supabase;
  await ensureBucket(client);
}
