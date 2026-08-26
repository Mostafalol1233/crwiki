import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_KEY || '').trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required. No database operation was performed.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Legacy setup is intentionally disabled. It will not seed demo content, create administrators, or mutate production data.');
  const checks = await Promise.all([
    supabase.from('admin_users').select('id').limit(1),
    supabase.from('tickets').select('id').limit(1),
    supabase.from('posts').select('id').limit(1),
  ]);
  const failed = checks.filter((result) => result.error && !/does not exist|relation .* does not exist|42P01/i.test(result.error.message || ''));
  if (failed.length) throw new Error('One or more read-only Supabase checks failed. Review the database configuration manually.');
  console.log('Read-only checks completed. Apply reviewed migrations manually through Supabase before changing schema or policies.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Legacy setup check failed');
  process.exitCode = 1;
});
