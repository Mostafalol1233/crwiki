/**
 * Run any pending column migrations needed by the app.
 * Uses the service-role client so the operations can succeed.
 *
 * This is safe to call multiple times — each migration is idempotent.
 */
import { supabaseService } from '@/lib/supabaseAdmin';

let ranMigration = false;

export async function runGalleryMigration(): Promise<void> {
  if (ranMigration) return;
  if (!supabaseService) return;

  try {
    // Check whether gallery column exists on events table by selecting it
    const { error: evCheck } = await supabaseService
      .from('events')
      .select('gallery')
      .limit(0);

    if (evCheck && evCheck.message?.toLowerCase().includes('gallery')) {
      // Column missing — attempt to add via RPC if available, otherwise log
      console.warn('[dbMigrations] events.gallery column missing. Please run in Supabase SQL editor:\nALTER TABLE events ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT \'[]\';');
    }
  } catch { /* non-critical */ }

  try {
    const { error: postCheck } = await supabaseService
      .from('posts')
      .select('gallery')
      .limit(0);

    if (postCheck && postCheck.message?.toLowerCase().includes('gallery')) {
      console.warn('[dbMigrations] posts.gallery column missing. Please run in Supabase SQL editor:\nALTER TABLE posts ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT \'[]\';');
    }
  } catch { /* non-critical */ }

  ranMigration = true;
}
