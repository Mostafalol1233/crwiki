/*
 * Read-only compatibility checks for optional gallery columns.
 * Schema changes must be reviewed and applied manually in Supabase; the browser
 * must never run migrations or use a service-role credential.
 */
import { supabase } from '@/lib/supabase';

let ranMigration = false;

export async function runGalleryMigration(): Promise<void> {
  if (ranMigration) return;
  ranMigration = true;

  try {
    const { error: eventCheck } = await supabase.from('events').select('gallery').limit(0);
    if (eventCheck && eventCheck.message?.toLowerCase().includes('gallery')) {
      console.warn('[dbMigrations] events.gallery is missing. Apply a reviewed migration manually in Supabase.');
    }
  } catch { /* optional column check is non-critical */ }

  try {
    const { error: postCheck } = await supabase.from('posts').select('gallery').limit(0);
    if (postCheck && postCheck.message?.toLowerCase().includes('gallery')) {
      console.warn('[dbMigrations] posts.gallery is missing. Apply a reviewed migration manually in Supabase.');
    }
  } catch { /* optional column check is non-critical */ }
}
