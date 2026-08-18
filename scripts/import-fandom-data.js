import 'dotenv/config';
import { URLSearchParams } from 'url';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.service_role || process.env.SUPABASE_SERVICE_KEY || '';
const FANWIKI_BASE = process.env.FANDOM_WIKI_BASE || process.env.CROSSFIRE_FANDOM_BASE || 'https://crossfirefps.fandom.com';

function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
    args[key] = value;
    if (argv[i + 1] && !argv[i + 1].startsWith('--')) i += 1;
  }
  return args;
}

function slugify(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fandomApi(path, params = {}) {
  const url = new URL(`${FANWIKI_BASE}/api.php`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Fandom API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getCategoryMembers(category, maxItems = Infinity) {
  const titles = [];
  let continuation = {};

  while (titles.length < maxItems) {
    const data = await fandomApi('', {
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmlimit: '500',
      cmtype: 'page',
      ...continuation,
    });

    for (const item of data?.query?.categorymembers || []) {
      if (item.ns === 0 && item.title) titles.push(item.title);
      if (titles.length >= maxItems) break;
    }

    if (!data?.continue || titles.length >= maxItems) break;
    continuation = data.continue;
    await sleep(200);
  }

  return titles.slice(0, maxItems);
}

async function getPageDetails(titles, limit = 25) {
  const chunks = [];
  for (let i = 0; i < titles.length; i += limit) {
    chunks.push(titles.slice(i, i + limit));
  }

  const results = [];
  for (const chunk of chunks) {
    const query = await fandomApi('', {
      action: 'query',
      prop: 'extracts|pageimages',
      redirects: '1',
      exintro: '1',
      explaintext: '1',
      piprop: 'thumbnail',
      pithumbsize: '900',
      titles: chunk.join('|'),
    });

    const pages = query?.query?.pages || {};
    Object.values(pages).forEach((page) => {
      if (!page || page.missing) return;
      const text = sanitizeText(page.extract || '');
      const thumb = page.thumbnail?.source || '';
      results.push({
        pageid: page.pageid,
        title: page.title,
        extract: text,
        thumbnail: thumb,
        sourceUrl: `${FANWIKI_BASE}/wiki/${encodeURIComponent(page.title.replace(/\s+/g, '_'))}`,
      });
    });
    await sleep(450);
  }

  return results;
}

async function supabaseRequest(path, init = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY first.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
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

async function clearExistingRows(table, slugColumn, slugValue) {
  const encoded = encodeURIComponent(slugValue);
  await supabaseRequest(`${table}?${slugColumn}=eq.${encoded}`, { method: 'DELETE' });
}

function buildRow(table, item, existing = null) {
  if (table === 'weapons') {
    const existingStats = existing?.stats && typeof existing.stats === 'object' ? existing.stats : {};
    const existingDescription = sanitizeText(existing?.description || '');
    const existingCategory = sanitizeText(existing?.category || '');
    const keepExistingDescription = existingDescription && !/^Imported from Fandom:/i.test(existingDescription) && !/^CrossFire weapon\s*[-:]/i.test(existingDescription) && !/^Weapon\s*[-:]/i.test(existingDescription);
    const keepExistingCategory = existingCategory && existingCategory.toLowerCase() !== 'imported';

    return {
      name: item.title,
      category: keepExistingCategory ? existingCategory : 'Imported',
      description: keepExistingDescription ? existingDescription : (item.extract || `Imported from Fandom: ${item.title}`),
      stats: {
        ...existingStats,
        source: 'fandom',
        pageid: item.pageid,
        source_url: item.sourceUrl,
      },
      image_url: item.thumbnail || existing?.image_url || '',
      // The catalogue uses one fixed official card background. Clear legacy
      // thumbnail-backed backgrounds during the full import.
      background_url: '',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return {
    title: item.title,
    post_slug: slugify(item.title),
    content: item.extract || `Imported from Fandom: ${item.title}`,
    summary: (item.extract || '').slice(0, 240),
    image_url: item.thumbnail || '',
    images: item.thumbnail ? [item.thumbnail] : [],
    category: 'wiki-import',
    tags: ['fandom', 'imported'],
    author: 'Fandom Importer',
    views: 0,
    reading_time: 2,
    featured: false,
    preview_on_home: false,
    language: 'en',
    seo_title: item.title,
    seo_description: (item.extract || '').slice(0, 160),
    seo_keywords: ['fandom', 'imported'],
    canonical_url: item.sourceUrl,
    source_url: item.sourceUrl,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function getExistingWeapons() {
  const existing = new Map();
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const rows = await supabaseRequest(`weapons?select=name,category,description,image_url,created_at,stats&limit=${pageSize}&offset=${offset}`, { method: 'GET' });
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row?.name) existing.set(row.name, row);
    }
    if (!Array.isArray(rows) || rows.length < pageSize) break;
    offset += pageSize;
  }

  return existing;
}

async function importRows(table, items, { upsert = false } = {}) {
  let inserted = 0;
  const existingWeapons = table === 'weapons' && upsert ? await getExistingWeapons() : new Map();

  for (const item of items) {
    const existing = existingWeapons.get(item.title) || null;
    const row = buildRow(table, item, existing);
    if (table === 'weapons' && upsert) {
      await supabaseRequest('weapons?on_conflict=name', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(row),
      });
    } else if (table === 'weapons') {
      await clearExistingRows('weapons', 'name', item.title);
      await supabaseRequest('weapons', { method: 'POST', body: JSON.stringify(row) });
    } else {
      await clearExistingRows('posts', 'post_slug', slugify(item.title));
      await supabaseRequest('posts', { method: 'POST', body: JSON.stringify(row) });
    }
    inserted += 1;
    if (inserted % 50 === 0) console.log(`Processed ${inserted}/${items.length}...`);
  }
  return inserted;
}

async function main() {
  const args = parseArgs();
  const table = args.table || 'posts';
  const dryRun = args['dry-run'] === 'true' || args.dryRun === 'true';
  const upsert = args.upsert === 'true' || args.upsert === true;
  const category = args.category || '';
  const titlesArg = args.titles || '';
  const limit = Number(args.limit || 25);

  if (!['posts', 'weapons'].includes(table)) {
    throw new Error('Unsupported table. Use --table posts or --table weapons');
  }

  let titles = [];
  if (titlesArg) {
    titles = titlesArg.split(',').map(t => t.trim()).filter(Boolean);
  } else if (category) {
    titles = await getCategoryMembers(category, limit);
  } else {
    throw new Error('Provide --titles "AK-47,MP5" or --category "Category:Weapons"');
  }

  if (!titles.length) {
    throw new Error('No Fandom pages were found.');
  }

  const selected = titles.slice(0, limit);
  console.log(`Fetching ${selected.length} pages from ${FANWIKI_BASE}...`);
  const pages = await getPageDetails(selected, 20);

  if (dryRun) {
    console.log(`Dry run only. ${pages.length} pages ready to import into ${table}.`);
    console.log(pages.slice(0, 5).map(p => ({ title: p.title, sourceUrl: p.sourceUrl })).slice(0, 5));
    return;
  }

  const inserted = await importRows(table, pages, { upsert });
  console.log(`${upsert ? 'Upserted' : 'Inserted'} ${inserted} rows into ${table}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
