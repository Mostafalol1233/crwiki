/**
 * supabaseShim.ts
 * Compatibility shim for public reads while the application migrates its
 * administrative mutations to authenticated server endpoints.
 */
import { supabase } from './supabase';

// Never use a service-role credential in browser code. Supabase RLS remains the
// final authority for any direct client-side operation.
const db = () => supabase;

function slugify(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const m =
    url.match(/[?&]v=([^&#]+)/) ||
    url.match(/youtu\.be\/([^?&#]+)/) ||
    url.match(/\/embed\/([^?&#]+)/) ||
    url.match(/\/shorts\/([^?&#]+)/);
  return m ? m[1] : url.length === 11 ? url : '';
}

function parseUrlParams(url: string): { path: string; params: URLSearchParams } {
  const [path, qs = ''] = url.split('?');
  return { path, params: new URLSearchParams(qs) };
}

// ─── Auto SEO generation ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function autoGenerateSEO(title: string, contentHtml: string): {
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
} {
  const plain = stripHtml(contentHtml || '');
  const seo_title = title ? title.slice(0, 60).trim() : '';
  const seo_description = plain ? plain.slice(0, 160).trim() : (title ? title.slice(0, 160) : '');
  // Simple keyword extraction: significant words from title + first 200 chars of content
  const raw = `${title} ${plain.slice(0, 200)}`.toLowerCase();
  const stopWords = new Set(['the','a','an','and','or','in','on','of','to','for','with','at','by','is','was','are','were','be','been','being','it','its','this','that','from','as','have','has','had','not','but','we','they','you','he','she','do','did','does','will','can','could','would','should','our','their','your','his','her','all','new','more','over','about','up','out','into','so','if']);
  const kws = [...new Set(
    raw.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w))
  )].slice(0, 10);
  return { seo_title, seo_description, seo_keywords: kws };
}

// ─── Server-side scraping via Vite middleware (no CORS issues) ────────────────
// Delegates to cfScrapePlugin in vite.config.ts which uses undici + cheerio

async function scrapePageViaProxy(url: string): Promise<{
  title: string; content: string; summary: string; image: string; contentLength: number;
}> {
  const res = await fetch('/api/scrape/single-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.error || `Scrape failed with status ${res.status}`);
  return {
    title: data.title || '',
    content: data.content || '',
    summary: data.excerpt || data.seoDescription || '',
    image: data.image || data.mainImage || '',
    contentLength: data.contentLength || 0,
  };
}

// ─── Field mappers ────────────────────────────────────────────────────────────

function normalizePost(p: any) {
  return {
    id: String(p.id || ''),
    title: p.title || '',
    post_slug: p.post_slug || '',
    content: p.content || '',
    summary: p.summary || '',
    image: p.image_url || '',
    imageUrl: p.image_url || '',
    images: p.images || [],
    category: p.category || '',
    tags: p.tags || [],
    author: p.author || '',
    views: p.views || 0,
    readingTime: p.reading_time || 1,
    featured: p.featured || false,
    previewOnHome: p.preview_on_home !== false,
    language: p.language || 'en',
    seoTitle: p.seo_title || '',
    seoDescription: p.seo_description || '',
    seoKeywords: p.seo_keywords || [],
    canonicalUrl: p.canonical_url || '',
    ogImage: p.og_image || '',
    sourceUrl: p.source_url || '',
    date: p.created_at || '',
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

function denormalizePost(d: any) {
  const tags = Array.isArray(d.tags) ? d.tags
    : d.tags ? String(d.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  const keywords = Array.isArray(d.seoKeywords) ? d.seoKeywords
    : d.seoKeywords ? String(d.seoKeywords).split(',').map((k: string) => k.trim()).filter(Boolean) : [];
  return {
    title: d.title || '',
    post_slug: d.post_slug || slugify(d.title || ''),
    content: d.content || '',
    summary: d.summary || '',
    image_url: d.image || d.imageUrl || '',
    images: d.images || [],
    category: d.category || 'General',
    tags,
    author: d.author || 'Bimora Team',
    reading_time: d.readingTime || 1,
    featured: d.featured || false,
    preview_on_home: d.previewOnHome !== false,
    language: d.language || 'en',
    seo_title: d.seoTitle || '',
    seo_description: d.seoDescription || '',
    seo_keywords: keywords,
    canonical_url: d.canonicalUrl || '',
    og_image: d.ogImage || '',
    source_url: d.sourceUrl || '',
  };
}

function normalizeEvent(e: any) {
  return {
    id: String(e.id || ''),
    title: e.title || '',
    titleAr: e.title_ar || '',
    event_name_slug: e.event_name_slug || '',
    description: e.description || '',
    descriptionAr: e.description_ar || '',
    date: e.date || '',
    type: e.type || 'upcoming',
    image: e.image_url || '',
    imageUrl: e.image_url || '',
    images: e.images || [],
    featured: e.featured || false,
    location: e.location || '',
    seoTitle: e.seo_title || '',
    seoDescription: e.seo_description || '',
    canonicalUrl: e.canonical_url || '',
    sourceUrl: e.source_url || '',
    order: e.sort_order || 9999,
    createdAt: e.created_at,
  };
}

function denormalizeEvent(d: any) {
  return {
    title: d.title || '',
    title_ar: d.titleAr || '',
    event_name_slug: d.event_name_slug || slugify(d.title || ''),
    description: d.description || '',
    description_ar: d.descriptionAr || '',
    date: d.date || '',
    type: d.type || 'upcoming',
    image_url: d.image || d.imageUrl || '',
    images: d.images || [],
    featured: d.featured || false,
    location: d.location || '',
    seo_title: d.seoTitle || '',
    seo_description: d.seoDescription || '',
    canonical_url: d.canonicalUrl || '',
    source_url: d.sourceUrl || '',
  };
}

function normalizeNews(n: any) {
  return {
    id: String(n.id || ''),
    title: n.title || '',
    news_slug: n.news_slug || '',
    titleAr: n.title_ar || '',
    dateRange: n.date_range || '',
    image: n.image_url || '',
    imageUrl: n.image_url || '',
    images: n.images || [],
    category: n.category || '',
    content: n.content || '',
    contentAr: n.content_ar || '',
    htmlContent: n.html_content || '',
    author: n.author || '',
    featured: n.featured || false,
    previewOnHome: n.preview_on_home !== false,
    seoTitle: n.seo_title || '',
    seoDescription: n.seo_description || '',
    canonicalUrl: n.canonical_url || '',
    createdAt: n.created_at,
  };
}

function denormalizeNews(d: any) {
  return {
    title: d.title || '',
    news_slug: d.news_slug || slugify(d.title || ''),
    title_ar: d.titleAr || '',
    date_range: d.dateRange || '',
    image_url: d.image || d.imageUrl || '',
    images: d.images || [],
    category: d.category || 'News',
    content: d.content || '',
    content_ar: d.contentAr || '',
    author: d.author || 'Bimora Team',
    featured: d.featured || false,
    preview_on_home: d.previewOnHome !== false,
    seo_title: d.seoTitle || '',
    seo_description: d.seoDescription || '',
    canonical_url: d.canonicalUrl || '',
  };
}


function normalizeStringArray(value: any): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    } catch { }
    return trimmed.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizePrices(value: any): { item: string; price: number }[] {
  const source = typeof value === 'string'
    ? (() => {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try { return JSON.parse(trimmed); } catch { return trimmed.split('\n'); }
    })()
    : value;

  if (!Array.isArray(source)) return [];
  return source
    .map((entry: any) => {
      if (typeof entry === 'string') {
        const [item = '', rawPrice = '0'] = entry.split(':');
        return { item: item.trim(), price: Number.parseFloat(rawPrice.trim()) || 0 };
      }
      return {
        item: String(entry?.item || '').trim(),
        price: Number.parseFloat(String(entry?.price ?? 0)) || 0,
      };
    })
    .filter((entry) => entry.item);
}

function normalizeSeller(s: any) {
  return {
    id: String(s.id || ''),
    name: s.name || '',
    seller_name_slug: s.seller_name_slug || '',
    description: s.description || '',
    images: normalizeStringArray(s.images),
    prices: normalizePrices(s.prices),
    email: s.email || '',
    phone: s.phone || '',
    whatsapp: s.whatsapp || '',
    discord: s.discord || '',
    website: s.website || '',
    facebook: s.facebook || '',
    twitter: s.twitter || '',
    instagram: s.instagram || '',
    youtube: s.youtube || '',
    tiktok: s.tiktok || '',
    telegram: s.telegram || '',
    featured: s.featured || false,
    promotionText: s.promotion_text || '',
    averageRating: s.average_rating || 0,
    totalReviews: s.total_reviews || 0,
    rank: s.rank || 9999,
  };
}

// ─── Announcement helpers (stored in posts with category='ANNOUNCEMENT') ─────

const ANN_CATEGORY = '__ANNOUNCEMENT__';

function annToPost(ann: any, type: 'global' | 'seller', sellerSlug = '') {
  return {
    title: type === 'global' ? '__global_announcement__' : `__seller_announcement__:${sellerSlug}`,
    post_slug: type === 'global' ? '__global-announcement__' : `__seller-announcement__-${sellerSlug}`,
    content: ann.contentHtmlEn || ann.contentHtml || '',
    summary: ann.contentHtmlAr || '',
    category: ANN_CATEGORY,
    tags: type === 'global' ? ['global'] : [`seller:${sellerSlug}`],
    author: 'admin',
    featured: ann.active !== false,
    image_url: ann.imageUrl || '',
    og_image: ann.linkUrl || '',
    source_url: ann.direction || 'auto',
    preview_on_home: ann.dismissible !== false,
    language: 'en',
  };
}

function postToAnn(p: any) {
  return {
    id: p.id,
    contentHtml: p.content || '',
    contentHtmlEn: p.content || '',
    contentHtmlAr: p.summary || '',
    imageUrl: p.image_url || '',
    linkUrl: p.og_image || '',
    active: p.featured !== false,
    dismissible: p.preview_on_home !== false,
    direction: p.source_url || 'auto',
    updatedAt: p.updated_at,
  };
}

// ─── Main shim ────────────────────────────────────────────────────────────────

export async function supabaseShim(rawUrl: string, method: string, body?: any): Promise<any> {
  const { path, params } = parseUrlParams(rawUrl.replace(/^\/api/, ''));
  const M = method.toUpperCase();
  const client = db();

  // ── Stats ──────────────────────────────────────────────────────────────────
  if (path === '/stats') {
    const [postsR, eventsR, newsR] = await Promise.all([
      client.from('posts').select('*', { count: 'exact', head: true }).neq('category', ANN_CATEGORY),
      client.from('events').select('*', { count: 'exact', head: true }),
      client.from('news').select('*', { count: 'exact', head: true }),
    ]);
    return { totalPosts: postsR.count || 0, totalEvents: eventsR.count || 0, totalNews: newsR.count || 0, totalComments: 0, totalViews: 0, recentPosts: [] };
  }

  // ── Posts ──────────────────────────────────────────────────────────────────
  if (path === '/posts') {
    const limit = parseInt(params.get('limit') || '20');
    const offset = parseInt(params.get('offset') || '0');
    if (M === 'GET') {
      const { data, count, error } = await client.from('posts').select('*', { count: 'exact' })
        .neq('category', ANN_CATEGORY)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return { items: (data || []).map(normalizePost), total: count || 0 };
    }
    if (M === 'POST') {
      const row = denormalizePost(body);
      // Auto-generate SEO if missing
      if (!row.seo_title || !row.seo_description) {
        const seo = autoGenerateSEO(row.title, row.content);
        if (!row.seo_title) row.seo_title = seo.seo_title;
        if (!row.seo_description) row.seo_description = seo.seo_description;
        if (!row.seo_keywords || !row.seo_keywords.length) row.seo_keywords = seo.seo_keywords;
      }
      const { data, error } = await client.from('posts').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return normalizePost(data);
    }
  }

  // PATCH/DELETE /api/posts/:id
  const postMatch = path.match(/^\/posts\/(.+)$/);
  if (postMatch) {
    const id = postMatch[1];
    if (M === 'PATCH') {
      const row = denormalizePost(body);
      const { data, error } = await client.from('posts').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return normalizePost(data);
    }
    if (M === 'DELETE') {
      const { error } = await client.from('posts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  if (path === '/events') {
    const limit = parseInt(params.get('limit') || '20');
    const offset = parseInt(params.get('offset') || '0');
    if (M === 'GET') {
      const { data, count, error } = await client.from('events').select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return { items: (data || []).map(normalizeEvent), total: count || 0 };
    }
    if (M === 'POST') {
      const row = denormalizeEvent(body);
      // Auto-generate SEO if missing
      if (!row.seo_title || !row.seo_description) {
        const seo = autoGenerateSEO(row.title, row.description);
        if (!row.seo_title) row.seo_title = seo.seo_title;
        if (!row.seo_description) row.seo_description = seo.seo_description;
      }
      const { data, error } = await client.from('events').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return normalizeEvent(data);
    }
  }

  if (path === '/events/reorder' && M === 'PATCH') {
    const orders: { id: string; order: number }[] = body?.orders || [];
    await Promise.all(orders.map(o => client.from('events').update({ sort_order: o.order }).eq('id', o.id)));
    return { success: true };
  }

  const eventMatch = path.match(/^\/events\/(.+)$/);
  if (eventMatch) {
    const id = eventMatch[1];
    if (M === 'PATCH') {
      const row = denormalizeEvent(body);
      const { data, error } = await client.from('events').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return normalizeEvent(data);
    }
    if (M === 'DELETE') {
      const { error } = await client.from('events').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
  }

  // ── News ───────────────────────────────────────────────────────────────────
  if (path === '/news') {
    const limit = parseInt(params.get('limit') || '20');
    const offset = parseInt(params.get('offset') || '0');
    if (M === 'GET') {
      const { data, count, error } = await client.from('news').select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(error.message);
      return { items: (data || []).map(normalizeNews), total: count || 0 };
    }
    if (M === 'POST') {
      const row = denormalizeNews(body);
      // Auto-generate SEO if missing
      if (!row.seo_title || !row.seo_description) {
        const seo = autoGenerateSEO(row.title, row.content);
        if (!row.seo_title) row.seo_title = seo.seo_title;
        if (!row.seo_description) row.seo_description = seo.seo_description;
      }
      const { data, error } = await client.from('news').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return normalizeNews(data);
    }
  }

  const newsMatch = path.match(/^\/news\/(.+)$/);
  if (newsMatch) {
    const id = newsMatch[1];
    if (M === 'PATCH') {
      const row = denormalizeNews(body);
      const { data, error } = await client.from('news').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return normalizeNews(data);
    }
    if (M === 'DELETE') {
      const { error } = await client.from('news').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
  }

  // ── Weapons ────────────────────────────────────────────────────────────────
  if (path === '/weapons' || path === '/weapons/search') {
    if (M === 'GET') {
      const q = params.get('q') || '';
      let query = client.from('weapons').select('*', { count: 'exact' }).order('name');
      if (q) query = query.ilike('name', `%${q}%`);
      const limit = parseInt(params.get('limit') || '200');
      const offset = parseInt(params.get('offset') || '0');
      query = query.range(offset, offset + limit - 1);
      const { data, count, error } = await query;
      if (error) throw new Error(error.message);
      const items = (data || []).map((w: any) => ({ id: String(w.id), name: w.name, image: w.image_url || '', imageUrl: w.image_url || '', category: w.category || '', description: w.description || '', stats: w.stats || {} }));
      return { items, total: count || 0, data: items };
    }
    if (M === 'POST') {
      const { data, error } = await client.from('weapons').insert([{ name: body.name, image_url: body.image || body.imageUrl || '', category: body.category || '', description: body.description || '', stats: body.stats || {} }]).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name, image: data.image_url, category: data.category, description: data.description, stats: data.stats || {} };
    }
  }

  const weaponMatch = path.match(/^\/weapons\/(.+)$/);
  if (weaponMatch) {
    const id = weaponMatch[1];
    if (M === 'PATCH') {
      const { data, error } = await client.from('weapons').update({ name: body.name, image_url: body.image || body.imageUrl, category: body.category, description: body.description, stats: body.stats }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name, image: data.image_url, category: data.category, description: data.description, stats: data.stats };
    }
    if (M === 'DELETE') {
      const { error } = await client.from('weapons').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    }
  }

  // ── Modes ──────────────────────────────────────────────────────────────────
  if (path === '/modes') {
    if (M === 'GET') {
      const { data, error } = await client.from('modes').select('*').order('name');
      if (error) throw new Error(error.message);
      return (data || []).map((m: any) => ({ id: String(m.id), name: m.name, image: m.image_url || '', description: m.description || '', type: m.type || '', category: m.category || '' }));
    }
    if (M === 'POST') {
      const { data, error } = await client.from('modes').insert([{ name: body.name, image_url: body.image || '', description: body.description || '', type: body.type || '', category: body.category || '' }]).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name, image: data.image_url, description: data.description };
    }
  }

  const modeMatch = path.match(/^\/modes\/(.+)$/);
  if (modeMatch) {
    const id = modeMatch[1];
    if (M === 'PATCH') {
      const { data, error } = await client.from('modes').update({ name: body.name, image_url: body.image || body.imageUrl, description: body.description, type: body.type, category: body.category }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name };
    }
    if (M === 'DELETE') {
      await client.from('modes').delete().eq('id', id);
      return { success: true };
    }
  }

  // ── Ranks ──────────────────────────────────────────────────────────────────
  if (path === '/ranks') {
    if (M === 'GET') {
      const { data, error } = await client.from('ranks').select('*').order('tier');
      if (error) throw new Error(error.message);
      return (data || []).map((r: any) => ({ id: String(r.id), name: r.name, imageUrl: r.image_url || '', image: r.image_url || '', tier: r.tier || 0, expRequired: r.exp_required || 0, description: r.description || '' }));
    }
    if (M === 'POST') {
      const { data, error } = await client.from('ranks').insert([{ name: body.name, image_url: body.image || body.imageUrl || '', tier: body.tier || 0, exp_required: body.expRequired || 0, description: body.description || '' }]).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name };
    }
  }

  const rankMatch = path.match(/^\/ranks\/(.+)$/);
  if (rankMatch) {
    const id = rankMatch[1];
    if (M === 'PATCH') {
      const { data, error } = await client.from('ranks').update({ name: body.name, image_url: body.image || body.imageUrl, tier: body.tier, exp_required: body.expRequired, description: body.description }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name };
    }
    if (M === 'DELETE') {
      await client.from('ranks').delete().eq('id', id);
      return { success: true };
    }
  }

  // ── Mercenaries ────────────────────────────────────────────────────────────
  if (path === '/mercenaries') {
    if (M === 'GET') {
      const { data, error } = await client.from('mercenaries').select('*').order('order_index');
      if (error) throw new Error(error.message);
      return (data || []).map((m: any) => ({ id: String(m.id), name: m.name, image: m.image_url || '', role: m.role || '', voiceLines: m.sounds || [], order: m.order_index || 0 }));
    }
    if (M === 'POST') {
      const { data, error } = await client.from('mercenaries').insert([{ name: body.name, image_url: body.image || '', role: body.role || '', sounds: body.voiceLines || body.sounds || [], order_index: body.order || 9999 }]).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name };
    }
  }

  const mercMatch = path.match(/^\/mercenaries\/(.+)$/);
  if (mercMatch) {
    const id = mercMatch[1];
    if (M === 'PATCH') {
      const { data, error } = await client.from('mercenaries').update({ name: body.name, image_url: body.image || body.imageUrl, role: body.role, sounds: body.voiceLines || body.sounds, order_index: body.order }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), name: data.name };
    }
    if (M === 'DELETE') {
      await client.from('mercenaries').delete().eq('id', id);
      return { success: true };
    }
  }

  // ── Sellers ────────────────────────────────────────────────────────────────
  if (path === '/sellers') {
    if (M === 'GET') {
      const { data, error } = await client.from('sellers').select('*').order('rank');
      if (error) throw new Error(error.message);
      return (data || []).map(normalizeSeller);
    }
    if (M === 'POST') {
      const { data, error } = await client.from('sellers').insert([{
        name: body.name, seller_name_slug: body.seller_name_slug || slugify(body.name || ''),
        description: body.description || '', images: body.images || [], prices: body.prices || [],
        email: body.email || '', phone: body.phone || '', whatsapp: body.whatsapp || '',
        discord: body.discord || '', website: body.website || '',
        facebook: body.facebook || '', twitter: body.twitter || '',
        instagram: body.instagram || '', youtube: body.youtube || '',
        tiktok: body.tiktok || '', telegram: body.telegram || '',
        featured: body.featured || false,
        promotion_text: body.promotionText || '', rank: body.rank || 9999,
      }]).select().single();
      if (error) throw new Error(error.message);
      return normalizeSeller(data);
    }
  }

  const sellerMatch = path.match(/^\/sellers\/([^/]+)\/reviews\/([^/]+)$/);
  if (sellerMatch && M === 'DELETE') {
    const reviewId = sellerMatch[2];
    await client.from('seller_reviews').delete().eq('id', reviewId);
    return { success: true };
  }

  const sellerIdMatch = path.match(/^\/sellers\/(.+)$/);
  if (sellerIdMatch) {
    const id = sellerIdMatch[1];
    if (M === 'PATCH') {
      const { data, error } = await client.from('sellers').update({
        name: body.name,
        seller_name_slug: body.seller_name_slug || slugify(body.name || ''),
        description: body.description, images: body.images, prices: body.prices,
        email: body.email, phone: body.phone, whatsapp: body.whatsapp, discord: body.discord,
        website: body.website,
        facebook: body.facebook ?? '', twitter: body.twitter ?? '',
        instagram: body.instagram ?? '', youtube: body.youtube ?? '',
        tiktok: body.tiktok ?? '', telegram: body.telegram ?? '',
        featured: body.featured, promotion_text: body.promotionText, rank: body.rank,
      }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return normalizeSeller(data);
    }
    if (M === 'DELETE') {
      await client.from('sellers').delete().eq('id', id);
      return { success: true };
    }
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  if (path.startsWith('/reviews/seller/by-slug/')) {
    const slug = decodeURIComponent(path.replace('/reviews/seller/by-slug/', ''));
    const { data } = await client.from('seller_reviews').select('*').eq('seller_slug', slug).order('created_at', { ascending: false });
    return data || [];
  }

  // ── Tickets ────────────────────────────────────────────────────────────────
  if (path === '/tickets') {
    if (M === 'GET') {
      const { data, error } = await client.from('tickets').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  }

  const ticketMatch = path.match(/^\/tickets\/(.+)$/);
  if (ticketMatch) {
    const id = ticketMatch[1];
    if (M === 'PATCH') {
      const { data, error } = await client.from('tickets').update(body).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    if (M === 'DELETE') {
      await client.from('tickets').delete().eq('id', id);
      return { success: true };
    }
  }

  // ── Tutorials (Videos) ────────────────────────────────────────────────────
  if (path === '/tutorials') {
    const limit = parseInt(params.get('limit') || '100');
    const offset = parseInt(params.get('offset') || '0');
    const category = params.get('category') || '';
    if (M === 'GET') {
      let query = client.from('tutorials').select('*', { count: 'exact' }).order('order_index', { ascending: true }).order('created_at', { ascending: false });
      if (category) query = (query as any).eq('category', category);
      query = (query as any).range(offset, offset + limit - 1);
      const { data, count, error } = await query;
      if (error) throw new Error(error.message);
      const items = (data || []).map((t: any) => ({
        id: String(t.id),
        title: t.title || '',
        description: t.description || '',
        youtubeUrl: t.youtube_url || '',
        youtubeId: t.youtube_id || '',
        category: t.category || 'tutorial',
        order: t.order_index || 0,
        tutorial_slug: t.tutorial_slug || String(t.id),
        createdAt: t.created_at,
      }));
      return { items, total: count || 0 };
    }
    if (M === 'POST') {
      const ytId = extractYouTubeId(body.youtubeUrl || body.youtube_url || '');
      const { data, error } = await client.from('tutorials').insert([{
        title: body.title || '',
        description: body.description || '',
        youtube_url: body.youtubeUrl || body.youtube_url || '',
        youtube_id: body.youtubeId || body.youtube_id || ytId || '',
        category: body.category || 'tutorial',
        order_index: body.order || body.order_index || 0,
      }]).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), title: data.title, youtubeId: data.youtube_id, category: data.category };
    }
  }

  const tutorialMatch = path.match(/^\/tutorials\/(.+)$/);
  if (tutorialMatch) {
    const id = tutorialMatch[1];
    if (M === 'GET') {
      const { data, error } = await client.from('tutorials').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), title: data.title, description: data.description, youtubeUrl: data.youtube_url, youtubeId: data.youtube_id, category: data.category, order: data.order_index, tutorial_slug: data.tutorial_slug || String(data.id), createdAt: data.created_at };
    }
    if (M === 'PATCH') {
      const ytId = body.youtubeUrl ? extractYouTubeId(body.youtubeUrl) : body.youtube_id;
      const { data, error } = await client.from('tutorials').update({
        title: body.title, description: body.description,
        youtube_url: body.youtubeUrl || body.youtube_url,
        youtube_id: body.youtubeId || body.youtube_id || ytId,
        category: body.category, order_index: body.order ?? body.order_index,
        tutorial_slug: body.tutorial_slug,
      }).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return { id: String(data.id), title: data.title, youtubeId: data.youtube_id };
    }
    if (M === 'DELETE') {
      await client.from('tutorials').delete().eq('id', id);
      return { success: true };
    }
  }

  // ── Site Settings ──────────────────────────────────────────────────────────
  if (path === '/settings/site' || path === '/public/settings/site' || path === '/admin/settings/site') {
    if (M === 'GET') {
      const { data } = await client.from('site_settings').select('*').limit(1).single();
      return data || {};
    }
    if (M === 'PUT' || M === 'POST') {
      const { data: existing } = await client.from('site_settings').select('id').limit(1).single();
      if (existing?.id) {
        const { data } = await client.from('site_settings').update({
          seo_title: body.seoTitle || body.seo_title,
          seo_description: body.seoDescription || body.seo_description,
          seo_keywords: body.seoKeywords || body.seo_keywords || [],
          robots: body.robots,
          announcements_enabled: body.announcementsEnabled ?? body.announcements_enabled,
          review_verification_enabled: body.reviewVerificationEnabled ?? body.review_verification_enabled,
          public_base_url: body.publicBaseUrl || body.public_base_url || '',
        }).eq('id', existing.id).select().single();
        return data || {};
      }
      return {};
    }
  }

  if (path === '/public/settings/seo') {
    const { data } = await client.from('site_settings').select('*').limit(1).maybeSingle();
    return {
      seoTitle: data?.seo_title || 'CrossFire Wiki',
      seoDescription: data?.seo_description || '',
      seoKeywords: data?.seo_keywords || [],
      robots: data?.robots || 'index, follow',
      ogImageUrl: data?.seo_og_image_url || '',
    };
  }

  if (path === '/public/settings/announcements') {
    const { data } = await client.from('site_settings').select('announcements_enabled').limit(1).maybeSingle();
    return { enabled: data?.announcements_enabled ?? true };
  }

  // ── Announcements (stored as posts with category=__ANNOUNCEMENT__) ─────────
  if (path === '/announcements/global') {
    if (M === 'GET') {
      const { data } = await client.from('posts').select('*')
        .eq('category', ANN_CATEGORY).contains('tags', ['global']).eq('featured', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!data) return null;
      return postToAnn(data);
    }
    if (M === 'POST') {
      const row = { ...annToPost(body, 'global'), updated_at: new Date().toISOString() };
      // Upsert: delete old global then insert
      await client.from('posts').delete().eq('category', ANN_CATEGORY).contains('tags', ['global']);
      const { data, error } = await client.from('posts').insert([row]).select().single();
      if (error) throw new Error(error.message);
      return postToAnn(data);
    }
  }

  if (path === '/admin/announcements/global') {
    const { data } = await client.from('posts').select('*')
      .eq('category', ANN_CATEGORY).contains('tags', ['global'])
      .order('created_at', { ascending: false });
    return (data || []).map(postToAnn);
  }

  const globalAnnMatch = path.match(/^\/announcements\/global\/(.+)$/);
  if (globalAnnMatch) {
    const id = globalAnnMatch[1];
    if (M === 'PATCH') {
      const row = annToPost(body, 'global');
      const { data, error } = await client.from('posts').update(row).eq('id', id).select().single();
      if (error) throw new Error(error.message);
      return postToAnn(data);
    }
    if (M === 'DELETE') {
      await client.from('posts').delete().eq('id', id);
      return { success: true };
    }
  }

  const sellerAnnMatch = path.match(/^\/announcements\/seller\/(.+)$/);
  if (sellerAnnMatch) {
    const slug = decodeURIComponent(sellerAnnMatch[1]);
    if (M === 'GET') {
      const { data } = await client.from('posts').select('*')
        .eq('category', ANN_CATEGORY).contains('tags', [`seller:${slug}`]).eq('featured', true)
        .order('created_at', { ascending: false }).limit(1).single();
      if (!data) return null;
      return postToAnn(data);
    }
    if (M === 'POST' || M === 'PATCH') {
      await client.from('posts').delete().eq('category', ANN_CATEGORY).contains('tags', [`seller:${slug}`]);
      const { data, error } = await client.from('posts').insert([annToPost(body, 'seller', slug)]).select().single();
      if (error) throw new Error(error.message);
      return postToAnn(data);
    }
  }

  if (path === '/admin/announcements/seller') {
    const { data } = await client.from('posts').select('*')
      .eq('category', ANN_CATEGORY)
      .not('tags', 'cs', '{"global"}')
      .order('created_at', { ascending: false });
    return (data || []).map(postToAnn);
  }

  // ── Admin users (stub — use the authenticated server admin flow) ────────
  if (path === '/admin/users' || path === '/admin/admins') {
    return M === 'GET' ? [] : { success: true };
  }

  if (path === '/admin/registration') {
    return { closed: false };
  }
  if (path === '/admin/registration/close' || path === '/admin/registration/open') {
    return { closed: M === 'POST' && path.endsWith('/close') };
  }

  const adminsMatch = path.match(/^\/admins\/(.+)$/);
  if (adminsMatch) return { success: true };

  const adminPermMatch = path.match(/^\/admin-permissions\/(.+)$/);
  if (adminPermMatch) return { success: true };

  // ── Admin user management ──────────────────────────────────────────────────
  if (path === '/admin/users/reset-code') return { success: true };

  // ── Newsletter ─────────────────────────────────────────────────────────────
  if (path === '/newsletter-subscribers') {
    if (M === 'GET') return [];
    return { success: true };
  }
  const nlMatch = path.match(/^\/newsletter-subscribers\/(.+)$/);
  if (nlMatch) return { success: true };

  // ── Analytics (stub) ──────────────────────────────────────────────────────
  if (path.startsWith('/admin/analytics')) return { data: [], total: 0 };

  // ── Scraper (stub) ─────────────────────────────────────────────────────────
  if (path === '/scrape-events') return { scraped: 0, message: 'Scraping not available in Supabase-only mode' };

  // ── Browser-side scraping ──────────────────────────────────────────────────

  // POST /api/scrape/single-url — scrape a page and return structured data
  if (path === '/scrape/single-url' && M === 'POST') {
    const { url } = body || {};
    if (!url || !String(url).startsWith('http')) {
      throw new Error('Valid URL required (must start with http)');
    }
    const result = await scrapePageViaProxy(url);
    const isWiki = url.includes('fandom.com') || url.includes('wiki');
    return {
      title: result.title,
      content: result.content,
      excerpt: result.summary,
      seoDescription: result.summary,
      seoTitle: result.title,
      keywords: [],
      mainImage: result.image,
      image: result.image,
      sourceUrl: url,
      url,
      isWiki,
      contentLength: result.contentLength,
      status: 'success',
    };
  }

  // POST /api/admin/rescrape-item — scrape and update event/news/post in Supabase
  if (path === '/admin/rescrape-item' && M === 'POST') {
    const { type, id, url } = body || {};
    if (!type || !id || !url || !String(url).startsWith('http')) {
      throw new Error('type, id, and valid url are required');
    }
    const scraped = await scrapePageViaProxy(url);
    const contentLength = scraped.contentLength;
    const seo = autoGenerateSEO(scraped.title, scraped.content);

    if (type === 'events') {
      const { error } = await client.from('events').update({
        description: scraped.content || '',
        image_url: scraped.image || '',
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
        source_url: url,
      }).eq('id', id);
      if (error) throw new Error(error.message);
    } else if (type === 'news') {
      const { error } = await client.from('news').update({
        content: scraped.content || '',
        html_content: scraped.content || '',
        image_url: scraped.image || '',
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
        source_url: url,
      }).eq('id', id);
      if (error) throw new Error(error.message);
    } else if (type === 'posts') {
      const { error } = await client.from('posts').update({
        content: scraped.content || '',
        image_url: scraped.image || '',
        seo_title: seo.seo_title,
        seo_description: seo.seo_description,
        seo_keywords: seo.seo_keywords,
        source_url: url,
      }).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      throw new Error('Invalid type. Use events, news, or posts');
    }

    return {
      success: true,
      scraped: {
        title: scraped.title,
        image: scraped.image,
        contentLength,
      },
    };
  }

  // ── Rebuild posts from Fandom Wiki ────────────────────────────────────────

  // POST /api/admin/rebuild-mercenary-posts
  if (path === '/admin/rebuild-mercenary-posts' && M === 'POST') {
    const mercenaries = [
      { name: 'Wolf', wikiSlug: 'Wolf_(CrossFire)' },
      { name: 'Vipers', wikiSlug: 'Vipers' },
      { name: 'Sisterhood', wikiSlug: 'Sisterhood' },
      { name: 'Black Mamba', wikiSlug: 'Black_Mamba_(CrossFire)' },
      { name: 'Desperado', wikiSlug: 'Desperado' },
      { name: 'Ronin', wikiSlug: 'Ronin_(CrossFire)' },
      { name: 'Dean', wikiSlug: 'Dean' },
      { name: 'Saber', wikiSlug: 'Saber_(CrossFire)' },
      { name: 'Brimstone', wikiSlug: 'Brimstone_(CrossFire)' },
      { name: 'Arch Honorary', wikiSlug: 'Arch_Honorary' },
    ];
    // Delete all existing posts
    const { data: existing } = await client.from('posts').select('id').neq('category', '__ANNOUNCEMENT__');
    let deletedCount = 0;
    for (const p of (existing || [])) {
      await client.from('posts').delete().eq('id', p.id);
      deletedCount++;
    }
    let created = 0; let failed = 0;
    for (const merc of mercenaries) {
      try {
        const wikiUrl = `https://crossfire.fandom.com/wiki/${merc.wikiSlug}`;
        const scraped = await scrapePageViaProxy(wikiUrl);
        const seo = autoGenerateSEO(scraped.title || merc.name, scraped.content);
        const slug = `${slugify(scraped.title || merc.name)}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
        const { error } = await client.from('posts').insert([{
          title: scraped.title || merc.name,
          post_slug: slug,
          content: scraped.content || '',
          summary: scraped.summary || '',
          image_url: scraped.image || '',
          category: 'Mercenaries',
          tags: ['mercenary', 'crossfire', merc.name.toLowerCase()],
          author: 'CrossFire Wiki',
          featured: false,
          source_url: wikiUrl,
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          seo_keywords: seo.seo_keywords,
        }]);
        if (error) { console.error(`Failed ${merc.name}:`, error.message); failed++; } else created++;
      } catch (e: any) { console.error(`Scrape failed ${merc.name}:`, e.message); failed++; }
    }
    return { deletedCount, created, failed };
  }

  // POST /api/admin/rebuild-wiki-posts (maps, characters, events from Fandom)
  if (path === '/admin/rebuild-wiki-posts' && M === 'POST') {
    const wikiPages = [
      { name: 'Ghost Mode', wikiSlug: 'Ghost_Mode', category: 'Modes' },
      { name: 'Mutation Mode', wikiSlug: 'Mutation_Mode', category: 'Modes' },
      { name: 'Zombie Mode', wikiSlug: 'Zombie_Mode', category: 'Modes' },
      { name: 'Black Widow', wikiSlug: 'Black_Widow_(map)', category: 'Maps' },
      { name: 'Port', wikiSlug: 'Port_(CrossFire)', category: 'Maps' },
      { name: 'Eagle Eye', wikiSlug: 'Eagle_Eye', category: 'Maps' },
    ];
    const { data: existing } = await client.from('posts').select('id').neq('category', '__ANNOUNCEMENT__');
    let deletedCount = 0;
    for (const p of (existing || [])) {
      await client.from('posts').delete().eq('id', p.id);
      deletedCount++;
    }
    let created = 0; let failed = 0;
    for (const page of wikiPages) {
      try {
        const wikiUrl = `https://crossfire.fandom.com/wiki/${page.wikiSlug}`;
        const scraped = await scrapePageViaProxy(wikiUrl);
        const seo = autoGenerateSEO(scraped.title || page.name, scraped.content);
        const slug = `${slugify(scraped.title || page.name)}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
        const { error } = await client.from('posts').insert([{
          title: scraped.title || page.name,
          post_slug: slug,
          content: scraped.content || '',
          summary: scraped.summary || '',
          image_url: scraped.image || '',
          category: page.category,
          tags: ['crossfire', page.category.toLowerCase(), page.name.toLowerCase()],
          author: 'CrossFire Wiki',
          featured: false,
          source_url: wikiUrl,
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          seo_keywords: seo.seo_keywords,
        }]);
        if (error) { console.error(`Failed ${page.name}:`, error.message); failed++; } else created++;
      } catch (e: any) { console.error(`Scrape failed ${page.name}:`, e.message); failed++; }
    }
    return { deletedCount, created, failed };
  }

  // ── Fandom import ──────────────────────────────────────────────────────────
  if (path === '/admin/fandom-import' || path === '/admin/fandom-import-article') {
    return { success: false, message: 'Fandom import not available in Supabase-only mode' };
  }

  // ── Slug migration ─────────────────────────────────────────────────────────
  if (path === '/admin/migrate-slugs') return { eventsUpdated: 0, postsUpdated: 0, newsUpdated: 0 };
  if (path === '/admin/migrate-seller-images-to-cloudinary') return { success: true };

  // ── Image upload — now handled by uploadToSupabase.ts (Supabase Storage) ──
  // These paths are no longer called via the shim; uploads go directly to
  // Supabase Storage using client/src/lib/uploadToSupabase.ts
  if (path === '/images/upload' || path === '/upload-image') {
    return { error: 'Use uploadToSupabase() from @/lib/uploadToSupabase instead.' };
  }

  // ── Auth (handled separately in AdminLogin.tsx, stub here) ────────────────
  if (path === '/auth/login') {
    throw new Error('Auth handled directly in AdminLogin');
  }

  // Fallback
  console.warn('[supabaseShim] Unhandled route:', method, rawUrl);
  return null;
}
