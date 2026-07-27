import 'dotenv/config';
import { WEAPONS, FORUM_POSTS } from '../shared/crossfire-regions.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.service_role || process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY first.');
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function request(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(`Supabase request failed for ${path}: ${response.status} ${text}`);
  }

  return body;
}

async function clearExistingRows(table, column, value) {
  const encoded = encodeURIComponent(value);
  await request(`${table}?${column}=eq.${encoded}`, { method: 'DELETE' });
}

async function seedWeapons() {
  let inserted = 0;
  for (const weapon of WEAPONS) {
    const row = {
      name: weapon.name,
      category: weapon.category || 'Uncategorized',
      description: weapon.description || '',
      stats: {
        slug: weapon.slug,
        releaseEra: weapon.releaseEra || '',
        regions: weapon.regions || {},
      },
      image_url: '',
      background_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await clearExistingRows('weapons', 'name', weapon.name);
    await request('weapons', {
      method: 'POST',
      body: JSON.stringify(row),
    });
    inserted += 1;
  }
  return inserted;
}

async function seedPosts() {
  let inserted = 0;
  for (const post of FORUM_POSTS) {
    const row = {
      title: post.title,
      post_slug: post.slug,
      content: `${post.excerpt}\n\nSource: ${post.link}`,
      summary: post.excerpt,
      image_url: '',
      images: [],
      category: post.region === 'global' ? 'global-wiki' : 'community',
      tags: post.tags || [],
      author: post.author,
      views: 0,
      reading_time: 2,
      featured: post.region === 'global',
      preview_on_home: true,
      language: 'en',
      seo_title: post.title,
      seo_description: post.excerpt,
      seo_keywords: post.tags || [],
      canonical_url: post.link,
      source_url: post.link,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await clearExistingRows('posts', 'post_slug', post.slug);
    await request('posts', {
      method: 'POST',
      body: JSON.stringify(row),
    });
    inserted += 1;
  }
  return inserted;
}

async function main() {
  const weaponsInserted = await seedWeapons();
  const postsInserted = await seedPosts();
  console.log(`Seed complete: ${weaponsInserted} weapons and ${postsInserted} posts inserted into Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
