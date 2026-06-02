/**
 * supabaseShim.ts
 * Intercepts all /api/... calls from Admin and routes them to Supabase directly.
 * No backend server needed — everything runs via the Supabase service-role client.
 */
import { supabaseService } from './supabaseAdmin';
import { supabase } from './supabase';

// Use service-role client for writes (bypasses RLS), anon client for reads
const db = () => supabaseService || supabase;

function slugify(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseUrlParams(url: string): { path: string; params: URLSearchParams } {
  const [path, qs = ''] = url.split('?');
  return { path, params: new URLSearchParams(qs) };
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

function normalizeSeller(s: any) {
  return {
    id: String(s.id || ''),
    name: s.name || '',
    seller_name_slug: s.seller_name_slug || '',
    description: s.description || '',
    images: s.images || [],
    prices: s.prices || [],
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
        discord: body.discord || '', website: body.website || '', featured: body.featured || false,
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
        name: body.name, description: body.description, images: body.images, prices: body.prices,
        email: body.email, phone: body.phone, whatsapp: body.whatsapp, discord: body.discord,
        website: body.website, featured: body.featured, promotion_text: body.promotionText, rank: body.rank,
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
    const { data } = await client.from('site_settings').select('*').limit(1).single();
    return {
      seoTitle: data?.seo_title || 'CrossFire Wiki',
      seoDescription: data?.seo_description || '',
      seoKeywords: data?.seo_keywords || [],
      robots: data?.robots || 'index, follow',
      ogImageUrl: data?.seo_og_image_url || '',
    };
  }

  if (path === '/public/settings/announcements') {
    const { data } = await client.from('site_settings').select('announcements_enabled').limit(1).single();
    return { enabled: data?.announcements_enabled ?? true };
  }

  // ── Announcements (stored as posts with category=__ANNOUNCEMENT__) ─────────
  if (path === '/announcements/global') {
    if (M === 'GET') {
      const { data } = await client.from('posts').select('*')
        .eq('category', ANN_CATEGORY).contains('tags', ['global']).eq('featured', true).order('created_at', { ascending: false }).limit(1).single();
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

  // ── Admin users (stub — use VITE_ADMIN_PASSWORD for auth) ─────────────────
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

  // ── Fandom import ──────────────────────────────────────────────────────────
  if (path === '/admin/fandom-import' || path === '/admin/fandom-import-article') {
    return { success: false, message: 'Fandom import not available in Supabase-only mode' };
  }

  // ── Slug migration ─────────────────────────────────────────────────────────
  if (path === '/admin/migrate-slugs') return { eventsUpdated: 0, postsUpdated: 0, newsUpdated: 0 };
  if (path === '/admin/migrate-seller-images-to-cloudinary') return { success: true };

  // ── Image upload ───────────────────────────────────────────────────────────
  if (path === '/images/upload' || path === '/upload-image') {
    // If Cloudinary env available, try to upload
    return { error: 'Image upload requires Cloudinary configuration. Please use a direct URL.' };
  }

  // ── Auth (handled separately in AdminLogin.tsx, stub here) ────────────────
  if (path === '/auth/login') {
    throw new Error('Auth handled directly in AdminLogin');
  }

  // Fallback
  console.warn('[supabaseShim] Unhandled route:', method, rawUrl);
  return null;
}
