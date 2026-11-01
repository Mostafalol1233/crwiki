const base = String(process.env.VITE_SUPABASE_URL || '').replace(/[\r\n]/g, '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.service_role;
if (!base || !key) throw new Error('Supabase URL and service key are required');
const image = (path) => `https://crossfire.wiki${path}`;
const report = `${base}/storage/v1/object/public/media/editorial/reporting/crossfire-support-center.jpg`;
const updates = [
  ['crossfire-west-latest-events-october-2026', { image_url: image('/highlights/crossfire-roadmap-2026.jpg'), og_image: image('/highlights/crossfire-roadmap-2026.jpg') }],
  ['crossfire-west-october-2026-events-calendar', { image_url: image('/highlights/crossfire-roadmap-2026.jpg'), og_image: image('/highlights/crossfire-roadmap-2026.jpg') }],
  ['crossfire-weapon-tier-list-best-guns', { image_url: image('/portal/weapons.jpg'), og_image: image('/portal/weapons.jpg') }],
  ['crossfire-beginners-guide-complete', { image_url: image('/feature-crossfire.jpg'), og_image: image('/feature-crossfire.jpg') }],
  ['report-hackers-harassment-crossfire-guide', { image_url: report, og_image: report, featured: false, preview_on_home: false }],
  ['report-hackers-harassment-crossfire-complete-guide', { image_url: report, og_image: report, featured: false, preview_on_home: false }],
];
for (const [slug, patch] of updates) {
  const response = await fetch(`${base}/rest/v1/posts?post_slug=eq.${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${slug}: ${response.status}: ${text}`);
  const rows = JSON.parse(text);
  console.log(slug, rows.length ? { id: rows[0].id, image_url: rows[0].image_url, featured: rows[0].featured, preview_on_home: rows[0].preview_on_home } : 'not found');
}
