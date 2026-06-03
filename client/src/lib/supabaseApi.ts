import { supabase } from './supabase';

// ─── Weapons ────────────────────────────────────────────────────────────────
export async function getWeapons(opts: {
  q?: string;
  letter?: string;
  category?: string;
  sort?: string;
  order?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { q, letter, category, sort = 'name', order = 'asc', page = 1, pageSize = 50 } = opts;
  let query = supabase.from('weapons').select('*', { count: 'exact' });

  if (q) query = query.ilike('name', `%${q}%`);
  if (letter) query = query.ilike('name', `${letter}%`);
  if (category) query = query.eq('category', category);

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);
  query = query.order(sort === 'name' ? 'name' : 'created_at', { ascending: order === 'asc' });

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data || []).map(normalizeWeapon), total: count || 0, page, pageSize };
}

export async function getWeaponById(id: string) {
  const { data, error } = await supabase.from('weapons').select('*').eq('id', id).single();
  if (error) throw error;
  return normalizeWeapon(data);
}

function normalizeWeapon(w: any) {
  return {
    id: String(w.id || ''),
    name: String(w.name || ''),
    image: String(w.image_url || w.image || ''),
    imageUrl: String(w.image_url || w.image || ''),
    backgroundUrl: String(w.background_url || ''),
    category: String(w.category || 'Uncategorized'),
    description: String(w.description || ''),
    stats: w.stats || {},
  };
}

// ─── Modes ───────────────────────────────────────────────────────────────────
export async function getModes() {
  const { data, error } = await supabase.from('modes').select('*').order('name');
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: String(m.id),
    name: String(m.name),
    image: String(m.image_url || ''),
    description: String(m.description || ''),
    type: String(m.type || ''),
    category: String(m.category || 'Standard'),
  }));
}

// ─── Maps ────────────────────────────────────────────────────────────────────
export async function getMaps() {
  const { data, error } = await supabase.from('maps').select('*').order('name');
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: String(m.id),
    name: String(m.name),
    image: String(m.image_url || ''),
    imageUrl: String(m.image_url || ''),
    description: String(m.description || ''),
    mode: String(m.mode || ''),
    category: String(m.category || 'Official'),
  }));
}

// ─── Ranks ───────────────────────────────────────────────────────────────────
export async function getRanks() {
  const { data, error } = await supabase.from('ranks').select('*').order('tier', { ascending: true });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: String(r.id),
    name: String(r.name),
    imageUrl: String(r.image_url || ''),
    image: String(r.image_url || ''),
    tier: r.tier || 0,
    expRequired: r.exp_required || 0,
    description: String(r.description || ''),
    requirements: String(r.requirements || ''),
    bonus: String(r.bonus || ''),
  }));
}

// ─── Mercenaries ─────────────────────────────────────────────────────────────
export async function getMercenaries() {
  const { data, error } = await supabase.from('mercenaries').select('*').order('order_index', { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: String(m.id),
    name: String(m.name),
    image: String(m.image_url || ''),
    role: String(m.role || ''),
    voiceLines: m.sounds || [],
    order: m.order_index || 0,
  }));
}

// ─── Posts ───────────────────────────────────────────────────────────────────
export async function getPosts(opts: { limit?: number; offset?: number; category?: string } = {}) {
  const { limit = 20, offset = 0, category } = opts;
  let query = supabase.from('posts').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data || []).map(normalizePost), total: count || 0 };
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase.from('posts').select('*').eq('post_slug', slug).single();
  if (error) throw error;
  return normalizePost(data);
}

export async function getPostById(id: string) {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error) throw error;
  return normalizePost(data);
}

function normalizePost(p: any) {
  return {
    id: String(p.id || ''),
    title: String(p.title || ''),
    post_slug: String(p.post_slug || ''),
    content: String(p.content || ''),
    summary: String(p.summary || ''),
    image: String(p.image_url || ''),
    imageUrl: String(p.image_url || ''),
    category: String(p.category || ''),
    tags: p.tags || [],
    author: String(p.author || ''),
    views: p.views || 0,
    readingTime: p.reading_time || 1,
    featured: p.featured || false,
    previewOnHome: p.preview_on_home !== false,
    createdAt: p.created_at,
    language: p.language || 'en',
    seoTitle: p.seo_title || '',
    seoDescription: p.seo_description || '',
  };
}

// ─── News ────────────────────────────────────────────────────────────────────
export async function getNews(opts: { limit?: number; offset?: number; category?: string } = {}) {
  const { limit = 20, offset = 0, category } = opts;
  let query = supabase.from('news').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data || []).map(normalizeNews), total: count || 0 };
}

export async function getNewsBySlug(slug: string) {
  const { data, error } = await supabase.from('news').select('*').eq('news_slug', slug).single();
  if (error) throw error;
  return normalizeNews(data);
}

function normalizeNews(n: any) {
  return {
    id: String(n.id || ''),
    title: String(n.title || ''),
    news_slug: String(n.news_slug || ''),
    titleAr: String(n.title_ar || ''),
    dateRange: String(n.date_range || ''),
    image: String(n.image_url || ''),
    imageUrl: String(n.image_url || ''),
    category: String(n.category || ''),
    content: String(n.content || ''),
    contentAr: String(n.content_ar || ''),
    htmlContent: String(n.html_content || ''),
    author: String(n.author || ''),
    featured: n.featured || false,
    previewOnHome: n.preview_on_home !== false,
    createdAt: n.created_at,
    type: 'news' as const,
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────
export async function getEvents(opts: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = opts;
  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { items: (data || []).map(normalizeEvent), total: count || 0 };
}

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabase.from('events').select('*').eq('event_name_slug', slug).single();
  if (error) throw error;
  return normalizeEvent(data);
}

function normalizeEvent(e: any) {
  return {
    id: String(e.id || ''),
    title: String(e.title || ''),
    event_name_slug: String(e.event_name_slug || ''),
    titleAr: String(e.title_ar || ''),
    description: String(e.description || ''),
    descriptionAr: String(e.description_ar || ''),
    date: String(e.date || ''),
    location: String(e.location || ''),
    type: String(e.type || ''),
    image: String(e.image_url || ''),
    imageUrl: String(e.image_url || ''),
    createdAt: e.created_at,
    featured: e.featured || false,
  };
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
export async function getFaqCategories() {
  const { data, error } = await supabase
    .from('faq_categories')
    .select('*, faq_articles(*)')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map((cat: any) => ({
    id: cat.slug,
    name: cat.name,
    nameAr: cat.name_ar || '',
    articles: (cat.faq_articles || []).map((a: any) => ({
      id: String(a.id),
      title: a.title,
      titleAr: a.title_ar || '',
      body: a.body,
      bodyAr: a.body_ar || '',
    })),
  }));
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

// ─── Sellers ─────────────────────────────────────────────────────────────────
export async function getSellers() {
  const { data, error } = await supabase.from('sellers').select('*').order('rank', { ascending: true });
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: String(s.id),
    name: String(s.name),
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
  }));
}

export async function getSellerReviews(sellerId: string) {
  const { data, error } = await supabase
    .from('seller_reviews')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSellerReview(review: {
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  userPhone?: string;
  verificationAnswer?: string;
}) {
  const { data, error } = await supabase.from('seller_reviews').insert([{
    seller_id: review.sellerId,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
    user_phone: review.userPhone,
    verified_code: review.verificationAnswer,
    helpful_votes: 0,
    status: 'pending',
  }]).select().single();
  if (error) throw error;
  return data;
}

// ─── Tutorials ───────────────────────────────────────────────────────────────
export async function getTutorials(category?: string) {
  let query = supabase.from('tutorials').select('*').order('order_index', { ascending: true });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: String(t.id),
    title: t.title,
    description: t.description || '',
    youtubeUrl: t.youtube_url,
    youtubeId: t.youtube_id,
    category: t.category || 'tutorial',
    order: t.order_index || 0,
  }));
}

// ─── Site Settings ────────────────────────────────────────────────────────────
export async function getSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
  if (error) {
    return {
      reviewVerificationEnabled: false,
      announcementsEnabled: true,
      seoTitle: 'CrossFire Wiki',
      seoDescription: 'Comprehensive CrossFire gaming wiki',
      seoKeywords: [],
      featuredWeapons: [] as string[],
      featuredEventId: '',
      secondaryEventIds: [] as string[],
      heroImage: '',
      robots: 'index, follow',
    };
  }
  return data;
}

export async function updateSiteSettings(patch: Record<string, any>) {
  const { data: existing } = await supabase.from('site_settings').select('id').limit(1).single();
  if (existing?.id) {
    const { data, error } = await supabase.from('site_settings').update(patch).eq('id', existing.id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase.from('site_settings').insert(patch).select().single();
    if (error) throw error;
    return data;
  }
}

// ─── Auth (Supabase Auth) ─────────────────────────────────────────────────────
export async function signUp(email: string, password: string, metadata?: { username?: string; phone?: string; avatar?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata || {} },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Tickets ─────────────────────────────────────────────────────────────────
export async function createTicket(ticket: {
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  category: string;
  priority?: string;
}) {
  const { data, error } = await supabase.from('tickets').insert([{
    title: ticket.title,
    description: ticket.description,
    user_name: ticket.userName,
    user_email: ticket.userEmail,
    category: ticket.category,
    priority: ticket.priority || 'normal',
    status: 'open',
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function getTicketsByEmail(email: string) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTicketReplies(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_replies')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(comment: {
  postId: string;
  postType: string;
  content: string;
  authorName: string;
}) {
  const { data, error } = await supabase.from('comments').insert([{
    post_id: comment.postId,
    post_type: comment.postType,
    content: comment.content,
    author_name: comment.authorName,
  }]).select().single();
  if (error) throw error;
  return data;
}
