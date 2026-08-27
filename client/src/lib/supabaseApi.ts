import { supabase, isSupabaseConfigured } from './supabase';
import { uploadToSupabase } from './uploadToSupabase';
import { apiRequest } from './queryClient';
import { adminFetch } from './supabaseAdmin';
import { getDefaultServiceListings, normalizeServiceListing } from '../../../shared/services-directory.js';
type WeaponDescriptionRecord = import('../../../shared/weapon-descriptions').WeaponDescriptionRecord;

let weaponDescriptionModulePromise: Promise<typeof import('../../../shared/weapon-descriptions')> | null = null;
function loadWeaponDescriptionModule() {
  if (!weaponDescriptionModulePromise) {
    weaponDescriptionModulePromise = import('../../../shared/weapon-descriptions');
  }
  return weaponDescriptionModulePromise;
}

async function normalizeWeaponAsync(weapon: any) {
  try {
    const { getWeaponDescription } = await loadWeaponDescriptionModule();
    return normalizeWeapon(weapon, getWeaponDescription(String(weapon?.name || '')));
  } catch {
    return normalizeWeapon(weapon);
  }
}

const TABLE_MISSING_RE = /(does not exist|relation .* does not exist|42P01|not found)/i;

function isMissingTableError(error: any) {
  const msg = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.trim();
  return TABLE_MISSING_RE.test(msg) || error?.code === '42P01';
}

const PUBLIC_QUERY_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = PUBLIC_QUERY_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("The request timed out. Please retry.")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function runSafeQuery<T>(fallback: T, executor: () => Promise<any>): Promise<{ data: T; count?: number }> {
  if (!isSupabaseConfigured) {
    return { data: fallback, count: Array.isArray(fallback) ? fallback.length : undefined };
  }

  try {
    const result = await executor();
    if (result?.error && isMissingTableError(result.error)) {
      return { data: fallback };
    }
    if (result?.error) {
      throw result.error;
    }
    return { data: result?.data ?? fallback, count: result?.count ?? undefined };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { data: fallback };
    }
    throw error;
  }
}

// Do not fabricate wiki records when a live data source is unavailable. Public
// pages should show an honest empty/error state and let operators fix the source.
const fallbackWeapons: any[] = [];
const fallbackMaps: any[] = [];
const fallbackModes: any[] = [];
const fallbackRanks: any[] = [];
const fallbackMercenaries: any[] = [];
const fallbackPosts: any[] = [];
const fallbackNews: any[] = [];
const fallbackEvents: any[] = [];

const fallbackSiteSettings = {
  siteTitle: 'CrossFire Wiki',
  siteDescription: 'Comprehensive CrossFire gaming wiki',
  seoTitle: 'CrossFire Wiki',
  seoDescription: 'Comprehensive CrossFire gaming wiki',
  seoKeywords: ['CrossFire', 'CF', 'Wiki'],
  seoOgImageUrl: '',
  heroImage: '',
  robots: 'index, follow',
  featuredWeapons: [],
  featuredEventId: '',
  secondaryEventIds: [],
  publicBaseUrl: '',
};

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
  const effectivePageSize = Math.min(50, Math.max(1, pageSize));
  const offset = Math.max(0, (page - 1) * effectivePageSize);
  try {
    const params = new URLSearchParams({
      type: 'weapons',
      limit: String(effectivePageSize),
      offset: String(offset),
      sort: sort === 'date' ? 'date' : 'name',
      order: order === 'desc' ? 'desc' : 'asc',
    });
    if (q) params.set('q', q);
    if (letter) params.set('letter', letter);
    if (category) params.set('category', category);
    const response = await withTimeout(fetch(`/api/content?${params.toString()}`));
    if (response.ok) {
      const json = await response.json();
      const rawWeapons = Array.isArray(json.weapons) ? json.weapons : [];
      // Older deployments ignored limit, offset, and search parameters. Cap and
      // filter defensively so a stale API can never freeze the catalogue.
      const apiReturnedMoreThanOnePage = rawWeapons.length > effectivePageSize;
      const filteredWeapons = apiReturnedMoreThanOnePage
        ? rawWeapons.filter((w: any) => {
            const name = String(w.name || '').toLocaleLowerCase();
            const wantedQuery = String(q || '').trim().toLocaleLowerCase();
            const wantedLetter = String(letter || '').trim().toLocaleLowerCase();
            const wantedCategory = String(category || '').trim().toLocaleLowerCase();
            return (!wantedQuery || name.includes(wantedQuery))
              && (!wantedLetter || name.startsWith(wantedLetter))
              && (!wantedCategory || String(w.category || '').trim().toLocaleLowerCase() === wantedCategory);
          })
        : rawWeapons;
      const weapons = apiReturnedMoreThanOnePage
        ? filteredWeapons.slice(offset, offset + effectivePageSize)
        : filteredWeapons;
      return {
        items: await Promise.all(weapons.map(async (w: any) => normalizeWeaponAsync({
          id: w.id,
          name: w.name,
          image_url: w.image_url || w.image || '',
          background_url: w.background_url || '',
          category: w.category || 'Uncategorized',
          description: w.description || '',
          stats: w.stats || {},
          acquisition_type: w.acquisition_type || w.acquisitionType || '',
          acquisition_method: w.acquisition_method || w.acquisitionMethod || '',
          acquisition_verified: w.acquisition_verified ?? w.acquisitionVerified ?? false,
          acquisition: w.acquisition || '',
          shop_type: w.shop_type || w.shopType || '',
          currency: w.currency || '',
          source_url: w.source_url || w.sourceUrl || '',
          created_at: w.created_at || '',
        }))),
        total: apiReturnedMoreThanOnePage
          ? filteredWeapons.length
          : (Number.isFinite(Number(json.total)) ? Number(json.total) : weapons.length),
        page,
        pageSize: effectivePageSize,
      };
    }
  } catch {
    // fall back to Supabase below
  }

  try {
    const result = await runSafeQuery(fallbackWeapons, async () => {
      let query = supabase.from('weapons').select('id,name,image_url,background_url,category,description,stats,acquisition_type,acquisition_method,source_url,created_at', { count: 'exact' });

      if (q) query = query.ilike('name', `%${q}%`);
      if (letter) query = query.ilike('name', `${letter}%`);
      if (category) query = query.eq('category', category);

      query = query.range(offset, offset + effectivePageSize - 1);
      query = query.order(sort === 'name' ? 'name' : 'created_at', { ascending: order === 'asc' });

      return await withTimeout(query);
    });
    const data = Array.isArray(result.data) ? result.data : [];
    return { items: await Promise.all(data.map(normalizeWeaponAsync)), total: result.count || data.length || 0, page, pageSize: effectivePageSize };
  } catch {
    const start = offset;
    const items = fallbackWeapons
      .filter((weapon: any) => !q || String(weapon.name).toLowerCase().includes(q.toLowerCase()))
      .filter((weapon: any) => !letter || String(weapon.name).toLowerCase().startsWith(letter.toLowerCase()))
      .filter((weapon: any) => !category || weapon.category === category)
      .slice(start, start + effectivePageSize)
      .map((weapon) => normalizeWeapon(weapon));
    return { items, total: fallbackWeapons.length, page, pageSize: effectivePageSize };
  }
}

export async function getWeaponById(id: string) {
  const result = await runSafeQuery(fallbackWeapons, async () => {
    return await supabase.from('weapons').select('id,name,image_url,background_url,category,description,stats,acquisition_type,acquisition_method,source_url,created_at').eq('id', id).single();
  });
  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  return normalizeWeaponAsync(data || fallbackWeapons[0]);
}

function normalizeWeapon(w: any = {}, providedEnrichment?: WeaponDescriptionRecord) {
  const name = String(w.name || '');
  const enrichment = providedEnrichment;
  const sourceDescription = String(w.description || '');
  const stats = w.stats && typeof w.stats === 'object' ? w.stats : {};
  const adminDescriptionEn = String(stats.description_en || stats.descriptionEn || '').trim();
  const adminDescriptionAr = String(stats.description_ar || stats.descriptionAr || '').trim();
  const adminAvailabilityEn = String(stats.availability_en || stats.availabilityEn || '').trim();
  const adminAvailabilityAr = String(stats.availability_ar || stats.availabilityAr || '').trim();
  const adminAcquisitionKind = String(stats.acquisition_kind || stats.acquisitionKind || '').trim();
  const adminAcquisitionLabelEn = String(stats.acquisition_label_en || stats.acquisitionLabelEn || '').trim();
  const adminAcquisitionLabelAr = String(stats.acquisition_label_ar || stats.acquisitionLabelAr || '').trim();
  const adminAcquisitionDetailsEn = String(stats.acquisition_details_en || stats.acquisitionDetailsEn || '').trim();
  const adminAcquisitionDetailsAr = String(stats.acquisition_details_ar || stats.acquisitionDetailsAr || '').trim();
  const isGenericDescription = /^CrossFire weapon\s*[-:]/i.test(sourceDescription) || /^Weapon\s*[-:]/i.test(sourceDescription);
  const rawAcquisitionVerified = Boolean(stats.acquisition_verified ?? stats.acquisitionVerified ?? w.acquisition_verified ?? w.acquisitionVerified ?? false);
  const rawSourceUrl = String(w.source_url || w.sourceUrl || '');
  const rawCategory = String(w.category || '').trim();
  const isGenericCategory = !rawCategory || /^(imported|uncategorized|standard)$/i.test(rawCategory);
  const resolvedCategory = isGenericCategory ? String(enrichment?.category || rawCategory || 'Uncategorized') : rawCategory;

  return {
    id: String(w.id || ''),
    name,
    image: String(w.image_url || w.image || ''),
    imageUrl: String(w.image_url || w.image || ''),
    backgroundUrl: String(w.background_url || ''),
    category: resolvedCategory,
    description: adminDescriptionEn || String(enrichment?.descriptionEn || (!isGenericDescription ? sourceDescription : '')),
    descriptionAr: adminDescriptionAr || String(enrichment?.descriptionAr || ''),
    descriptionStatus: adminDescriptionAr || adminDescriptionEn ? 'reference-described' : (enrichment?.descriptionStatus || 'unverified'),
    availabilityEn: adminAvailabilityEn || String(enrichment?.availabilityEn || ''),
    availabilityAr: adminAvailabilityAr || String(enrichment?.availabilityAr || ''),
    acquisitionKind: adminAcquisitionKind || enrichment?.acquisitionKind || 'unverified',
    acquisitionLabelEn: adminAcquisitionLabelEn || enrichment?.acquisitionLabelEn || 'Unverified',
    acquisitionLabelAr: adminAcquisitionLabelAr || enrichment?.acquisitionLabelAr || 'غير متحقق منه',
    acquisitionDetailsEn: adminAcquisitionDetailsEn || String(enrichment?.acquisitionDetailsEn || 'No verified acquisition method is recorded.'),
    acquisitionDetailsAr: adminAcquisitionDetailsAr || String(enrichment?.acquisitionDetailsAr || 'لا توجد طريقة اقتناء موثقة في السجل الحالي.'),
    acquisitionSources: enrichment?.acquisitionSources || [],
    acquisitionVerified: Boolean(enrichment?.acquisitionVerified || rawAcquisitionVerified),
    sourceUrl: rawSourceUrl || enrichment?.sourceUrl || '',
    officialCatalogueUrl: enrichment?.officialCatalogueUrl || 'https://crossfire.z8games.com/weapons.html',
    sourceKind: enrichment?.sourceKind || 'unverified',
    matchMode: enrichment?.matchMode || 'not-found',
    stats,
    acquisitionType: String(w.acquisition_type || w.acquisitionType || ''),
    acquisitionMethod: String(w.acquisition_method || w.acquisitionMethod || ''),
    acquisition: String(w.acquisition || ''),
    shopType: String(w.shop_type || w.shopType || ''),
    currency: String(w.currency || ''),
    createdAt: w.created_at || w.createdAt || undefined,
  };
}

// ─── Modes ───────────────────────────────────────────────────────────────────
export async function getModes() {
  const result = await runSafeQuery(fallbackModes, async () => {
    return await supabase.from('modes').select('id,name,image_url,description,type,category').order('name');
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return data.map((m: any) => ({
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
  const result = await runSafeQuery(fallbackMaps, async () => {
    return await supabase.from('maps').select('id,name,image_url,description,mode,category').order('name');
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return data.map((m: any) => ({
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
  const result = await runSafeQuery(fallbackRanks, async () => {
    return await supabase.from('ranks').select('id,name,image_url,tier,exp_required,description,requirements,bonus').order('tier', { ascending: true });
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return data.map((r: any) => ({
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
  const result = await runSafeQuery(fallbackMercenaries, async () => {
    return await supabase.from('mercenaries').select('id,name,image_url,role,sounds,order_index').order('order_index', { ascending: true });
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return data.map((m: any) => ({
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
  const requestedLimit = Number.isFinite(Number(opts.limit)) ? Number(opts.limit) : 20;
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const offset = Math.max(0, Number.isFinite(Number(opts.offset)) ? Number(opts.offset) : 0);
  const { category } = opts;
  try {
const params = new URLSearchParams({
        type: 'posts',
        limit: String(limit),
        offset: String(offset),
    });
    if (category) params.set('category', category);
    const response = await fetch(`/api/content?${params.toString()}`);
    if (response.ok) {
      const json = await response.json();
      const posts = Array.isArray(json.posts) ? json.posts : [];
      return {
        items: posts.map((p: any) => normalizePost({
          id: p.id,
          title: p.title,
          title_ar: p.title_ar,
          post_slug: p.post_slug || p.slug,
          content: p.content || p.excerpt || '',
          content_ar: p.content_ar,
          summary: p.summary || p.excerpt || '',
          summary_ar: p.summary_ar,
          image_url: p.image_url || '',
          category: p.category || 'community',
          tags: p.tags || [],
          author: p.author || 'CrossFire Wiki',
          views: p.views || 0,
          reading_time: p.reading_time,
          featured: p.featured,
          language: p.language,
          seo_title: p.seo_title,
          seo_description: p.seo_description,
          og_image: p.og_image,
          canonical_url: p.canonical_url,
          full_layout: p.full_layout ?? p.fullLayout,
          template: p.template,
          wiki_tabs: p.wiki_tabs ?? p.wikiTabs,
          external_links: p.external_links ?? p.externalLinks,
          source_url: p.source_url ?? p.sourceUrl,
          gallery: p.gallery,
          created_at: p.created_at || p.date,
          updated_at: p.updated_at,
        })),
        total: Number.isFinite(Number(json.total)) ? Number(json.total) : posts.length,
      };
    }
  } catch {
    // fall back to Supabase below
  }

  const result = await runSafeQuery(fallbackPosts, async () => {
    let query = supabase.from('posts').select('id,title,title_ar,post_slug,content,content_ar,summary,image_url,category,tags,author,views,reading_time,featured,preview_on_home,language,seo_title,seo_description,og_image,canonical_url,gallery,created_at,updated_at', { count: 'exact' }).order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    query = query.range(offset, offset + limit - 1);
    return await query;
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return { items: data.map(normalizePost), total: result.count || data.length || 0 };
}

export async function getPostBySlug(slug: string) {
  const result = await runSafeQuery(fallbackPosts, async () => {
    return await supabase.from('posts').select('id,title,title_ar,post_slug,content,content_ar,summary,image_url,category,tags,author,views,reading_time,featured,preview_on_home,language,seo_title,seo_description,og_image,canonical_url,gallery,created_at,updated_at').eq('post_slug', slug).single();
  });
  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  return normalizePost(data || fallbackPosts[0]);
}

export async function getPostById(id: string) {
  const result = await runSafeQuery(fallbackPosts, async () => {
    return await supabase.from('posts').select('id,title,title_ar,post_slug,content,content_ar,summary,image_url,category,tags,author,views,reading_time,featured,preview_on_home,language,seo_title,seo_description,og_image,canonical_url,gallery,created_at,updated_at').eq('id', id).single();
  });
  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  return normalizePost(data || fallbackPosts[0]);
}

function normalizePost(p: any = {}) {
  let gallery: { url: string; description?: string }[] = [];
  if (Array.isArray(p.gallery)) {
    gallery = p.gallery.filter((g: any) => g && typeof g.url === 'string' && g.url.trim());
  } else if (typeof p.gallery === 'string') {
    try { gallery = JSON.parse(p.gallery) || []; } catch { gallery = []; }
  }
  const parseArray = (value: unknown) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const wordCount = (value: unknown) => String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gi, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
  const contentWordCount = Math.max(wordCount(p.content), wordCount(p.content_ar || p.contentAr));
  const computedReadingTime = Math.max(1, Math.ceil(contentWordCount / 200));
  const suppliedReadingTime = Number(p.reading_time ?? p.readingTime);
  const readingTime = Number.isFinite(suppliedReadingTime) && suppliedReadingTime > 1
    ? suppliedReadingTime
    : computedReadingTime;
  const createdAt = p.created_at || p.createdAt || p.date || p.published_at || null;
  const updatedAt = p.updated_at || p.updatedAt || createdAt;

  return {
    id: String(p.id || ''),
    title: String(p.title || ''),
    titleAr: String(p.title_ar || p.titleAr || ''),
    post_slug: String(p.post_slug || p.slug || ''),
    content: String(p.content || ''),
    contentAr: String(p.content_ar || p.contentAr || ''),
    summary: String(p.summary || ''),
    summaryAr: String(p.summary_ar || p.summaryAr || ''),
    image: String(p.image_url || ''),
    imageUrl: String(p.image_url || ''),
    category: String(p.category || ''),
    tags: p.tags || [],
    author: String(p.author || ''),
    views: p.views || 0,
    readingTime,
    featured: p.featured || false,
    previewOnHome: p.preview_on_home !== false,
    createdAt,
    updatedAt,
    language: p.language || 'en',
    seoTitle: p.seo_title || '',
    seoDescription: p.seo_description || '',
    ogImage: p.og_image || '',
    canonicalUrl: p.canonical_url || '',
    fullLayout: Boolean(p.full_layout ?? p.fullLayout ?? p.template === 'wiki'),
    template: String(p.template || (p.full_layout || p.fullLayout ? 'wiki' : 'standard')),
    wikiTabs: parseArray(p.wiki_tabs ?? p.wikiTabs),
    externalLinks: parseArray(p.external_links ?? p.externalLinks),
    sourceUrl: String(p.source_url || p.sourceUrl || ''),
    gallery,
  };
}

// ─── News ────────────────────────────────────────────────────────────────────
export async function getNews(opts: { limit?: number; offset?: number; category?: string } = {}) {
  const requestedLimit = Number.isFinite(Number(opts.limit)) ? Number(opts.limit) : 20;
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const offset = Math.max(0, Number.isFinite(Number(opts.offset)) ? Number(opts.offset) : 0);
  const { category } = opts;
  const result = await runSafeQuery(fallbackNews, async () => {
    let query = supabase.from('news').select('id,title,title_ar,news_slug,date_range,image_url,category,content,content_ar,html_content,author,featured,preview_on_home,created_at', { count: 'exact' }).order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    query = query.range(offset, offset + limit - 1);
    return await query;
  });
  const data = Array.isArray(result.data) ? result.data : [];
  return { items: data.map(normalizeNews), total: result.count || data.length || 0 };
}

export async function getNewsBySlug(slug: string) {
  const result = await runSafeQuery(fallbackNews, async () => {
    return await supabase.from('news').select('id,title,title_ar,news_slug,date_range,image_url,category,content,content_ar,html_content,author,featured,preview_on_home,created_at').eq('news_slug', slug).single();
  });
  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  return normalizeNews(data || fallbackNews[0]);
}

export async function getNewsById(id: string) {
  const result = await runSafeQuery<any>(null, async () => {
    return await supabase.from('news').select('id,title,title_ar,news_slug,date_range,image_url,category,content,content_ar,html_content,author,featured,preview_on_home,created_at').eq('id', id).maybeSingle();
  });
  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  return data ? normalizeNews(data) : null;
}

function normalizeNews(n: any = {}) {
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
  const requestedLimit = Number.isFinite(Number(opts.limit)) ? Number(opts.limit) : 20;
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const offset = Math.max(0, Number.isFinite(Number(opts.offset)) ? Number(opts.offset) : 0);
  try {
    const params = new URLSearchParams({ type: 'events', limit: String(limit), offset: String(offset) });
    const response = await withTimeout(fetch(`/api/content?${params.toString()}`, { headers: { Accept: 'application/json' } }));
    if (response.ok) {
      const payload = await response.json();
      const rows = Array.isArray(payload.events) ? payload.events : [];
      return { items: rows.map(normalizeEvent), total: Number(payload.total) || rows.length };
    }
  } catch {
    // Fall back to the direct public query for local/older deployments.
  }
  try {
    const result = await runSafeQuery(fallbackEvents, async () => {
      return await withTimeout(
        supabase
          .from('events')
          .select('id,title,event_name_slug,title_ar,description,description_ar,date,start_date,end_date,location,type,image_url,gallery,tags,featured,seo_title,seo_description,canonical_url,source_url,created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
      );
    });
    const data = Array.isArray(result.data) ? result.data : [];
    return { items: data.map(normalizeEvent), total: result.count || data.length || 0 };
  } catch {
    const items = fallbackEvents.slice(offset, offset + limit).map(normalizeEvent);
    return { items, total: fallbackEvents.length };
  }
}

export async function getEventById(id: string) {
  try {
    const params = new URLSearchParams({ type: 'events', id, limit: '1' });
    const response = await withTimeout(fetch(`/api/content?${params.toString()}`, { headers: { Accept: 'application/json' } }));
    if (response.ok) {
      const payload = await response.json();
      const row = Array.isArray(payload.events) ? payload.events[0] : null;
      if (row) return normalizeEvent(row);
    }
  } catch {
    // Fall back to the direct public query for local/older deployments.
  }
  try {
    const result = await runSafeQuery<any>(null, async () => {
      return await supabase.from('events').select('id,title,event_name_slug,title_ar,description,description_ar,date,start_date,end_date,location,type,image_url,gallery,tags,featured,seo_title,seo_description,canonical_url,source_url,created_at').eq('id', id).maybeSingle();
    });
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    return data ? normalizeEvent(data) : null;
  } catch {
    return null;
  }
}

export async function getEventBySlug(slug: string) {
  try {
    const params = new URLSearchParams({ type: 'events', slug, limit: '1' });
    const response = await withTimeout(fetch(`/api/content?${params.toString()}`, { headers: { Accept: 'application/json' } }));
    if (response.ok) {
      const payload = await response.json();
      const row = Array.isArray(payload.events) ? payload.events[0] : null;
      if (row) return normalizeEvent(row);
    }
  } catch {
    // Fall back to the direct public query for local/older deployments.
  }
  try {
    const result = await runSafeQuery(fallbackEvents, async () => {
      return await supabase.from('events').select('id,title,event_name_slug,title_ar,description,description_ar,date,start_date,end_date,location,type,image_url,gallery,tags,featured,seo_title,seo_description,canonical_url,source_url,created_at').eq('event_name_slug', slug).single();
    });
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    if (data) return normalizeEvent(data);
  } catch {
    // fall through to fallback below
  }

  try {
    const { data: ci } = await supabase.from('events').select('id,title,event_name_slug,title_ar,description,description_ar,date,start_date,end_date,location,type,image_url,gallery,tags,featured,seo_title,seo_description,canonical_url,source_url,created_at').ilike('event_name_slug', slug).limit(1);
    if (ci?.[0]) return normalizeEvent(ci[0]);
  } catch {
    // ignore and use fallback
  }

  try {
    const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data: rows } = await supabase.from('events').select('id,title,event_name_slug,title_ar,description,description_ar,date,start_date,end_date,location,type,image_url,gallery,tags,featured,seo_title,seo_description,canonical_url,source_url,created_at').ilike('title', `%${slug.replace(/[-_]/g, ' ')}%`).limit(1);
    const match = (rows || []).find((e: any) => {
      const stored = toSlug(e.event_name_slug || '');
      const fromTitle = toSlug(e.title || '');
      const needle = toSlug(slug);
      return stored === needle || fromTitle === needle;
    });
    if (match) return normalizeEvent(match);
  } catch {
    // ignore and use fallback
  }

  return normalizeEvent(fallbackEvents[0]);
}

function normalizeEvent(e: any = {}) {
  // Parse gallery – stored as JSONB array [{url, description}]
  let gallery: { url: string; description?: string }[] = [];
  if (Array.isArray(e.gallery)) {
    gallery = e.gallery.filter((g: any) => g && typeof g.url === 'string' && g.url.trim());
  } else if (typeof e.gallery === 'string') {
    try { gallery = JSON.parse(e.gallery) || []; } catch { gallery = []; }
  }

  return {
    id: String(e.id || ''),
    title: String(e.title || ''),
    event_name_slug: String(e.event_name_slug || ''),
    titleAr: String(e.title_ar || ''),
    description: String(e.description || ''),
    descriptionAr: String(e.description_ar || ''),
    date: String(e.date || ''),
    // ISO datetime fields for accurate countdown timer
    start_date: String(e.start_date || ''),
    end_date: String(e.end_date || ''),
    location: String(e.location || ''),
    type: String(e.type || ''),
    image: String(e.image_url || ''),
    imageUrl: String(e.image_url || ''),
    // OG image = the event banner image
    ogImage: String(e.image_url || ''),
    // SEO fields
    seoTitle: String(e.seo_title || ''),
    seoDescription: String(e.seo_description || ''),
    canonicalUrl: String(e.canonical_url || ''),
    createdAt: e.created_at,
    featured: e.featured || false,
    gallery,
    tags: Array.isArray(e.tags) ? e.tags : [],
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

function normalizePrices(value: any): { item: string; price: string | number }[] {
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
        const colonIdx = entry.lastIndexOf(':');
        if (colonIdx === -1) return { item: entry.trim(), price: '' };
        return { item: entry.slice(0, colonIdx).trim(), price: entry.slice(colonIdx + 1).trim() };
      }
      // Handle both {item, price} and {amount, price} DB formats
      const item = String(entry?.item || entry?.amount || '').trim();
      const rawPrice = entry?.price ?? entry?.cost ?? '';
      const price = typeof rawPrice === 'number' ? rawPrice : String(rawPrice).trim();
      return { item, price };
    })
    .filter((entry) => entry.item);
}

// ─── Weapon Categories ────────────────────────────────────────────────────────
export async function getWeaponCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('weapons')
    .select('category')
    .not('category', 'is', null)
    .limit(500);
  if (error) throw error;
  const cats = new Set<string>();
  (data || []).forEach((w: any) => {
    const category = String(w.category || '').trim();
    if (category && !/^(imported|uncategorized|standard)$/i.test(category)) cats.add(category);
  });
  return Array.from(cats).sort();
}

// ─── Sellers ─────────────────────────────────────────────────────────────────
export async function getSellers() {
  const { data, error } = await supabase.from('sellers').select('id,name,seller_name_slug,description,images,prices,email,phone,whatsapp,discord,website,facebook,twitter,instagram,youtube,tiktok,telegram,logo_url,featured,promotion_text,average_rating,total_reviews,rank').order('rank', { ascending: true });
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
    logo_url: s.logo_url || '',
    featured: s.featured || false,
    promotionText: s.promotion_text || '',
    averageRating: s.average_rating || 0,
    totalReviews: s.total_reviews || 0,
    rank: s.rank || 9999,
  }));
}

export async function getServiceListings() {
  const fallback = getDefaultServiceListings();
  const result = await runSafeQuery(fallback, () => withTimeout(
    supabase.from('service_listings').select('*').eq('published', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
  ));
  return (result.data || []).map((row: any) => normalizeServiceListing(row));
}

export async function getSellerReviews(sellerId: string) {
  const baseQuery = () => supabase
    .from('seller_reviews')
    .select('id,seller_id,user_name,rating,comment,approved,created_at')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  let result = await baseQuery();
  if (result.error) {
    result = await supabase
      .from('seller_reviews')
      .select('id,seller_id,user_name,rating,comment,status,created_at')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
  }
  if (result.error) throw result.error;
  return (result.data || [])
    .filter((review: any) => review.approved === undefined
      ? ['approved', 'published'].includes(String(review.status || '').toLowerCase())
      : review.approved === true)
    .map((review: any) => ({
      id: String(review.id),
      sellerId: String(review.seller_id),
      userName: String(review.user_name || 'Anonymous player'),
      rating: Math.max(1, Math.min(5, Number(review.rating) || 1)),
      comment: typeof review.comment === 'string' ? review.comment : '',
      helpfulVotes: Number(review.helpful_votes) || 0,
      status: review.status || (review.approved ? 'approved' : 'pending'),
      createdAt: review.created_at ? new Date(review.created_at) : new Date(0),
    }));
}

export async function addSellerReview(review: {
  sellerId: string;
  userName: string;
  rating: number;
  comment: string;
  userPhone?: string;
  verificationAnswer?: string;
}) {
  return apiRequest('/api/sitemap?type=community', 'POST', {
    action: 'review:create',
    sellerId: review.sellerId,
    rating: review.rating,
    comment: review.comment,
    ...(review.verificationAnswer ? { verificationAnswer: review.verificationAnswer } : {}),
  });
}

// ─── Tutorials ───────────────────────────────────────────────────────────────
export async function getTutorials(category?: string) {
  let query = supabase.from('tutorials').select('id,title,title_ar,description,description_ar,youtube_url,youtube_id,category,order_index').order('order_index', { ascending: true });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: String(t.id),
    title: t.title || '',
    titleAr: t.title_ar || '',
    description: t.description || '',
    descriptionAr: t.description_ar || '',
    youtubeUrl: t.youtube_url,
    youtubeId: t.youtube_id,
    category: t.category || 'tutorial',
    order: t.order_index || 0,
  }));
}

// ─── Portal Images ────────────────────────────────────────────────────────────
// Reads portal_img_* columns from the single-row site_settings table.
// Uses select('*') so missing columns never cause a 400 error.
export async function getPortalImages(): Promise<Record<string, string>> {
  try {
    const settings = await getSiteSettings();
    const map: Record<string, string> = {};
    for (const key of ['portal_img_weapons', 'portal_img_maps', 'portal_img_mercenaries', 'portal_img_modes', 'portal_img_ranks', 'portal_img_events']) {
      const value = settings[key as keyof typeof settings];
      if (typeof value === 'string' && value) map[key] = value;
    }
    return map;
  } catch {
    return {};
  }
}

// ─── Site Settings ────────────────────────────────────────────────────────────
// Map camelCase app keys → snake_case DB column names
const SETTINGS_FIELD_MAP: Record<string, string> = {
  reviewVerificationEnabled:          'review_verification_enabled',
  reviewVerificationVideoUrl:         'review_verification_video_url',
  reviewVerificationPrompt:           'review_verification_prompt',
  reviewVerificationPassphrase:       'review_verification_passphrase',
  reviewVerificationTimecode:         'review_verification_timecode',
  reviewVerificationYouTubeChannelUrl:'review_verification_you_tube_channel_url',
  announcementsEnabled:               'announcements_enabled',
  seoTitle:                           'seo_title',
  seoDescription:                     'seo_description',
  seoKeywords:                        'seo_keywords',
  seoOgImageUrl:                      'seo_og_image_url',
  heroImage:                          'hero_image',
  robots:                             'robots',
  featuredWeapons:                    'featured_weapons',
  featuredEventId:                    'featured_event_id',
  secondaryEventIds:                  'secondary_event_ids',
  publicBaseUrl:                      'public_base_url',
};

export function normalizeSiteSettings(data: any) {
  if (!data) return {
    reviewVerificationEnabled: false,
    reviewVerificationVideoUrl: '',
    reviewVerificationPrompt: '',
    reviewVerificationPassphrase: '',
    reviewVerificationTimecode: '',
    reviewVerificationYouTubeChannelUrl: '',
    announcementsEnabled: true,
    seoTitle: 'CrossFire Wiki',
    seoDescription: 'Comprehensive CrossFire gaming wiki',
    seoKeywords: [] as string[],
    seoOgImageUrl: '',
    heroImage: '',
    robots: 'index, follow',
    featuredWeapons: [] as string[],
    featuredEventId: '',
    secondaryEventIds: [] as string[],
    publicBaseUrl: '',
    portal_img_weapons: '',
    portal_img_maps: '',
    portal_img_mercenaries: '',
    portal_img_modes: '',
    portal_img_ranks: '',
    portal_img_events: '',
  };
  return {
    id: data.id,
    reviewVerificationEnabled:          data.review_verification_enabled          ?? false,
    reviewVerificationVideoUrl:         data.review_verification_video_url         || '',
    reviewVerificationPrompt:           data.review_verification_prompt            || '',
    reviewVerificationPassphrase:       data.review_verification_passphrase        || '',
    reviewVerificationTimecode:         data.review_verification_timecode          || '',
    reviewVerificationYouTubeChannelUrl:data.review_verification_you_tube_channel_url || '',
    announcementsEnabled:               data.announcements_enabled                 ?? true,
    seoTitle:                           data.seo_title                             || 'CrossFire Wiki',
    seoDescription:                     data.seo_description                       || 'Comprehensive CrossFire gaming wiki',
    seoKeywords:                        data.seo_keywords                          || [],
    seoOgImageUrl:                      data.seo_og_image_url                      || '',
    heroImage:                          data.hero_image || data.seo_og_image_url   || '',
    robots:                             data.robots                                || 'index, follow',
    featuredWeapons:                    data.featured_weapons                      || [],
    featuredEventId:                    data.featured_event_id                     || '',
    secondaryEventIds:                  data.secondary_event_ids                   || [],
    publicBaseUrl:                      data.public_base_url                       || '',
    portal_img_weapons:                 data.portal_img_weapons                    || '',
    portal_img_maps:                    data.portal_img_maps                       || '',
    portal_img_mercenaries:             data.portal_img_mercenaries                || '',
    portal_img_modes:                   data.portal_img_modes                      || '',
    portal_img_ranks:                   data.portal_img_ranks                      || '',
    portal_img_events:                  data.portal_img_events                     || '',
  };
}

const PUBLIC_SITE_SETTINGS_FIELDS = [
  'id',
  'review_verification_enabled',
  'review_verification_video_url',
  'review_verification_prompt',
  'review_verification_timecode',
  'review_verification_you_tube_channel_url',
  'announcements_enabled',
  'seo_title',
  'seo_description',
  'seo_keywords',
  'seo_og_image_url',
  'hero_image',
  'robots',
  'featured_weapons',
  'featured_event_id',
  'secondary_event_ids',
  'public_base_url',
  'portal_img_weapons',
  'portal_img_maps',
  'portal_img_mercenaries',
  'portal_img_modes',
  'portal_img_ranks',
  'portal_img_events',
].join(',');

export async function getSiteSettings() {
  const result = await runSafeQuery(fallbackSiteSettings, async () => {
    const primary = await supabase.from('site_settings').select(PUBLIC_SITE_SETTINGS_FIELDS).limit(1).maybeSingle();
    if (!primary.error) return primary;
    return await supabase.from('site_settings').select('id,review_verification_enabled,announcements_enabled,seo_title,seo_description,seo_keywords,seo_og_image_url,robots,featured_weapons,public_base_url,created_at,updated_at').limit(1).maybeSingle();
  });
  return normalizeSiteSettings(result.data ?? null);
}

export async function updateSiteSettings(patch: Record<string, any>) {
  const result = await adminFetch<{ data?: any[] }>("/api/admin/rebuild", {
    method: "POST",
    body: JSON.stringify({ action: "admin-table", type: "site_settings", operation: "list", page: 1, pageSize: 1, select: "*" }),
  });
  const existing = Array.isArray(result?.data) ? result.data[0] : null;
  if (!existing?.id) throw new Error('Site settings row not found');

  const dbPatch: Record<string, any> = {};
  const columns = new Set(Object.keys(existing));
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'id' || key === 'updated_at' || key === 'created_at') continue;
    const dbKey = SETTINGS_FIELD_MAP[key] ?? key;
    if (dbKey === 'review_verification_passphrase') {
      if (typeof value === 'string' && value.trim()) dbPatch[dbKey] = value;
      continue;
    }
    if (columns.has(dbKey)) dbPatch[dbKey] = value;
  }
  const updated = await adminFetch<{ data?: any[] }>("/api/admin/rebuild", {
    method: "POST",
    body: JSON.stringify({ action: "admin-table", type: "site_settings", operation: "update", id: existing.id, row: dbPatch }),
  });
  const data = Array.isArray(updated?.data) ? updated.data[0] : updated?.data || { ...existing, ...dbPatch };
  return normalizeSiteSettings(data);
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
export async function uploadImageToSupabase(
  file: File,
  _bucket = 'uploads',
  folder = 'images'
): Promise<string> {
  return uploadToSupabase(file, folder);
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

export async function signInWithGoogle(returnPath = "/profile") {
  const safeReturnPath = returnPath.startsWith("/") && !returnPath.startsWith("//")
    ? returnPath
    : "/profile";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${safeReturnPath}`,
    },
  });
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
  return apiRequest('/api/sitemap?type=community', 'POST', {
    action: 'ticket:create',
    title: ticket.title,
    description: ticket.description,
    userName: ticket.userName,
    userEmail: ticket.userEmail,
    category: ticket.category,
    priority: ticket.priority || 'normal',
  });
}

export async function getMyTickets() {
  const data = await apiRequest('/api/sitemap?type=community', 'POST', { action: 'ticket:list' });
  return (Array.isArray(data) ? data : []).map((t: any) => ({
    id: String(t.id),
    title: t.title || '',
    description: t.description || '',
    userName: t.user_name || '',
    userEmail: t.user_email || '',
    status: t.status || 'open',
    priority: t.priority || 'normal',
    category: t.category || '',
    createdAt: t.created_at || '',
    updatedAt: t.updated_at || t.created_at || '',
  }));
}

function normalizeReply(r: any) {
  return {
    id: String(r.id),
    ticketId: r.ticket_id || '',
    authorName: r.author_name || r.sender_id || 'User',
    content: r.content || r.message || '',
    isAdmin: r.is_admin || r.is_internal || false,
    createdAt: r.created_at || '',
  };
}

export async function getTicketReplies(ticketId: string) {
  const data = await apiRequest('/api/sitemap?type=community', 'POST', { action: 'ticket:replies', ticketId });
  return (Array.isArray(data) ? data : []).map(normalizeReply);
}

export async function addTicketReply(ticketId: string, content: string, _authorName: string) {
  return apiRequest('/api/sitemap?type=community', 'POST', { action: 'ticket:reply', ticketId, content });
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
  return apiRequest('/api/sitemap?type=community', 'POST', {
    action: 'comment:create',
    postId: comment.postId,
    postType: comment.postType,
    content: comment.content,
  });
}

// ─── Likes (universal) ────────────────────────────────────────────────────────
function getUserIdentifier(): string {
  let id = localStorage.getItem("cf_user_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cf_user_id", id);
  }
  return id;
}

export async function getLikeCount(targetId: string, targetType: string): Promise<number> {
  const { count } = await supabase
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("target_id", targetId)
    .eq("target_type", targetType);
  return count ?? 0;
}

export async function hasUserLiked(targetId: string, targetType: string): Promise<boolean> {
  try {
    const result = await apiRequest('/api/sitemap?type=community', 'POST', { action: 'like:status', targetId, targetType });
    return Boolean(result?.liked);
  } catch {
    return false;
  }
}

export async function toggleLike(targetId: string, targetType: string): Promise<{ liked: boolean; count: number }> {
  return apiRequest('/api/sitemap?type=community', 'POST', { action: 'like:toggle', targetId, targetType });
}

// ─── Video Likes ──────────────────────────────────────────────────────────────
export async function getVideoLikeCount(videoId: string): Promise<number> {
  const { count } = await supabase
    .from("video_likes")
    .select("id", { count: "exact", head: true })
    .eq("video_id", videoId);
  return count ?? 0;
}

export async function toggleVideoLike(videoId: string): Promise<{ liked: boolean; count: number }> {
  return apiRequest('/api/sitemap?type=community', 'POST', { action: 'video-like:toggle', videoId });
}

// ─── Forum ───────────────────────────────────────────────────────────────────

export async function getForumCategories() {
  const { data, error } = await supabase
    .from('forum_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: String(c.id),
    name: String(c.name),
    nameAr: String(c.name_ar || ''),
    slug: String(c.slug),
    description: String(c.description || ''),
    descriptionAr: String(c.description_ar || ''),
    icon: String(c.icon || 'comment'),
    color: String(c.color || '#f5a623'),
    threadCount: c.thread_count || 0,
    postCount: c.post_count || 0,
  }));
}

export async function getForumThreads(categoryId: string, opts: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = opts;
  const { data, error, count } = await supabase
    .from('forum_threads')
    .select('*', { count: 'exact' })
    .eq('category_id', categoryId)
    .order('is_pinned', { ascending: false })
    .order('last_reply_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return { items: (data || []).map(normalizeThread), total: count || 0 };
}

export async function getForumThread(id: string) {
  const { data, error } = await supabase
    .from('forum_threads')
    .select('*, forum_categories(name, name_ar, slug)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return normalizeThread(data);
}

export async function createForumThread(thread: {
  categoryId: string;
  title: string;
  body: string;
  authorName: string;
  authorAvatar?: string;
  authorId?: string;
}) {
  const data = await apiRequest('/api/sitemap?type=community', 'POST', {
    action: 'forum:thread:create',
    categoryId: thread.categoryId,
    title: thread.title,
    body: thread.body,
  });
  return normalizeThread(data);
}

export async function getForumPosts(threadId: string) {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: String(p.id),
    threadId: String(p.thread_id),
    body: String(p.body || ''),
    authorId: String(p.author_id || ''),
    authorName: String(p.author_name || 'Anonymous'),
    authorAvatar: String(p.author_avatar || ''),
    isOp: p.is_op || false,
    createdAt: p.created_at,
  }));
}

export async function createForumPost(post: {
  threadId: string;
  body: string;
  authorName: string;
  authorAvatar?: string;
  authorId?: string;
  isOp?: boolean;
}) {
  return apiRequest('/api/sitemap?type=community', 'POST', {
    action: 'forum:post:create',
    threadId: post.threadId,
    body: post.body,
  });
}

export async function incrementThreadViews(threadId: string) {
  try {
    await apiRequest('/api/sitemap?type=community', 'POST', { action: 'forum:views', threadId });
  } catch {
    // View counting is non-critical and must not block reading a topic.
  }
}

function normalizeThread(t: any) {
  return {
    id: String(t.id),
    categoryId: String(t.category_id || ''),
    categoryName: String(t.forum_categories?.name || ''),
    categoryNameAr: String(t.forum_categories?.name_ar || ''),
    categorySlug: String(t.forum_categories?.slug || ''),
    title: String(t.title || ''),
    body: String(t.body || ''),
    authorId: String(t.author_id || ''),
    authorName: String(t.author_name || 'Anonymous'),
    authorAvatar: String(t.author_avatar || ''),
    isPinned: t.is_pinned || false,
    isLocked: t.is_locked || false,
    viewCount: t.view_count || 0,
    replyCount: t.reply_count || 0,
    lastReplyAt: t.last_reply_at,
    createdAt: t.created_at,
  };
}

// ─── Comment Likes ────────────────────────────────────────────────────────────
export async function toggleCommentLike(commentId: string): Promise<{ liked: boolean; count: number }> {
  return apiRequest('/api/sitemap?type=community', 'POST', { action: 'comment-like:toggle', commentId });
}
