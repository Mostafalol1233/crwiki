const base = String(process.env.VITE_SUPABASE_URL || '').replace(/[\r\n]/g, '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.service_role;
if (!base || !key) throw new Error('Supabase URL or service key is missing');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const sourceUrl = 'https://crossfire.wiki/posts/report-hackers-harassment-crossfire-guide';
const slug = 'report-hackers-harassment-crossfire-guide';

async function json(url, init = {}) {
  const response = await fetch(`${base}/rest/v1/${url}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(`${response.status}: ${text}`);
  return data;
}

const posts = await json(`posts?post_slug=eq.${encodeURIComponent(slug)}&select=id,title,title_ar,content,content_ar,summary,image_url,category,seo_title,seo_description&limit=1`);
if (!Array.isArray(posts) || !posts[0]) throw new Error(`Post not found: ${slug}`);
const post = posts[0];
const matches = await json(`news?or=(news_slug.eq.${encodeURIComponent(slug)},source_url.eq.${encodeURIComponent(sourceUrl)})&select=id,news_slug,source_url&limit=20`);
const now = new Date().toISOString();
const row = {
  title: post.title,
  title_ar: post.title_ar || post.title,
  news_slug: slug,
  content: post.content || '',
  content_ar: post.content_ar || post.content || '',
  html_content: post.content || '',
  raw_html_content: post.content || '',
  image_url: post.image_url || '',
  images: post.image_url ? [post.image_url] : [],
  category: post.category || 'guides',
  source_url: sourceUrl,
  canonical_url: sourceUrl,
  author: 'CrossFire Wiki',
  featured: false,
  preview_on_home: true,
  breaking: false,
  seo_title: post.seo_title || post.title,
  seo_description: post.seo_description || post.summary || '',
  seo_keywords: ['CrossFire', 'report hackers', 'harassment', 'support guide'],
  updated_at: now,
};

if (Array.isArray(matches) && matches[0]?.id) {
  await json(`news?id=eq.${encodeURIComponent(matches[0].id)}`, { method: 'PATCH', body: JSON.stringify(row) });
  console.log(JSON.stringify({ action: 'updated', id: matches[0].id, slug, duplicatesFound: matches.length }, null, 2));
} else {
  const created = await json('news', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ...row, created_at: now }) });
  console.log(JSON.stringify({ action: 'created', id: created?.[0]?.id || null, slug, duplicatesFound: 0 }, null, 2));
}
