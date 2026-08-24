import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash } from "node:crypto";
import { REGIONS, WEAPONS } from "../shared/crossfire-regions.js";
import { verifyAdminRequest } from "../server/adminAuth.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const ANON_KEY     = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const BASE         = "https://crossfire.wiki";

const h = () => ({ apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" });
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
const serviceHeaders = () => ({ apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" });

function requestBearer(req: VercelRequest): string {
  const value = req.headers.authorization;
  return typeof value === "string" ? value.replace(/^Bearer\s+/i, "").trim() : "";
}

async function authenticatedUserId(req: VercelRequest): Promise<string | null> {
  const token = requestBearer(req);
  if (!SUPABASE_URL || !ANON_KEY || !token) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    const user = await response.json();
    return typeof user?.id === "string" ? user.id : null;
  } catch {
    return null;
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

async function competitionRequest(req: VercelRequest): Promise<{ status: number; body: any }> {
  if (!SUPABASE_URL || !SERVICE_KEY) return { status: 500, body: { error: "Competition service is not configured" } };
  const admin = verifyAdminRequest(req.headers as Record<string, unknown>);
  const previewAllowed = process.env.VERCEL_ENV !== "production" && admin?.role === "super_admin";
  const userId = await authenticatedUserId(req);
  if (!userId && !previewAllowed) return { status: 401, body: { error: "Sign-in is required" } };
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const action = typeof body.action === "string" ? body.action : "";
  const headers = serviceHeaders();
  const base = `${SUPABASE_URL}/rest/v1`;

  if (action === "start") {
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";
    if (phone.length < 5 || phone.length > 40) return { status: 400, body: { error: "A valid phone number is required" } };
    if (body.consent !== true) return { status: 400, body: { error: "Contact consent is required" } };

    const configParams = new URLSearchParams({ id: "eq.default", select: "id,invite_required,active,preview_only,preview_owner_username", limit: "1" });
    if (!previewAllowed) configParams.set("active", "eq.true");
    const configResponse = await fetch(`${base}/competition_config?${configParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    if (!configResponse.ok) return { status: 502, body: { error: "Could not read competition settings" } };
    const configRows = await configResponse.json();
    const config = Array.isArray(configRows) ? configRows[0] : null;
    const ownerPreview = previewAllowed && config?.preview_only === true && config?.preview_owner_username === "super_admin";
    if (!config || (!config.active && !ownerPreview)) return { status: 409, body: { error: "Competition is not active" } };

    let inviteCodeId: string | null = null;
    if (config.invite_required !== false) {
      if (!inviteCode) return { status: 400, body: { error: "Invitation code is required" } };
      const params = new URLSearchParams({ select: "id,max_uses,uses_count,expires_at", code_hash: `eq.${sha256(inviteCode)}`, active: "eq.true", limit: "1" });
      const codeResponse = await fetch(`${base}/competition_invite_codes?${params.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
      if (!codeResponse.ok) return { status: 502, body: { error: "Could not validate invitation code" } };
      const codes = await codeResponse.json();
      const code = Array.isArray(codes) ? codes[0] : null;
      const expired = code?.expires_at && new Date(code.expires_at).getTime() <= Date.now();
      const exhausted = code?.max_uses != null && Number(code.uses_count || 0) >= Number(code.max_uses);
      if (!code || expired || exhausted) return { status: 400, body: { error: "Invitation code is invalid or unavailable" } };
      inviteCodeId = code.id;
    }

    const attemptResponse = await fetch(`${base}/competition_attempts`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId || admin?.id || null, invite_code_id: inviteCodeId, phone, consent_contact: true, status: "in_progress" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!attemptResponse.ok) return { status: 502, body: { error: "Could not create competition attempt" } };
    const attemptRows = await attemptResponse.json();
    const attempt = Array.isArray(attemptRows) ? attemptRows[0] : null;
    if (inviteCodeId) {
      const currentParams = new URLSearchParams({ select: "uses_count", id: `eq.${inviteCodeId}`, limit: "1" });
      const currentResponse = await fetch(`${base}/competition_invite_codes?${currentParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
      const currentRows = currentResponse.ok ? await currentResponse.json() : [];
      const currentCount = Number(currentRows?.[0]?.uses_count || 0);
      await fetch(`${base}/competition_invite_codes?id=eq.${encodeURIComponent(inviteCodeId)}`, { method: "PATCH", headers, body: JSON.stringify({ uses_count: currentCount + 1 }), signal: AbortSignal.timeout(9000) });
    }
    const questionsResponse = await fetch(`${base}/competition_questions?select=id,kind,question_en,question_ar,options,points,audio_url,image_url,weapon_id,sort_order&status=eq.published&order=sort_order.asc`, { headers, signal: AbortSignal.timeout(9000) });
    const questions = questionsResponse.ok ? await questionsResponse.json() : [];
    return { status: 200, body: { attempt: { id: attempt?.id }, questions: Array.isArray(questions) ? questions : [] } };
  }

  if (action === "submit_proof") {
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const proofType = typeof body.proofType === "string" ? body.proofType : "other";
    const fileUrl = typeof body.fileUrl === "string" ? body.fileUrl.trim() : "";
    const fileName = typeof body.fileName === "string" ? body.fileName.trim().slice(0, 180) : null;
    if (!attemptId || !/^https:\/\//i.test(fileUrl) || fileUrl.length > 2000) return { status: 400, body: { error: "A valid HTTPS proof link is required" } };
    if (!["subscription", "purchase_receipt", "other"].includes(proofType)) return { status: 400, body: { error: "Unsupported proof type" } };
    const attemptParams = new URLSearchParams({ select: "id,status", id: `eq.${attemptId}`, limit: "1" });
    if (!previewAllowed) attemptParams.set("user_id", `eq.${userId}`);
    const attemptResponse = await fetch(`${base}/competition_attempts?${attemptParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    const attempts = attemptResponse.ok ? await attemptResponse.json() : [];
    const attempt = Array.isArray(attempts) ? attempts[0] : null;
    if (!attempt || !["submitted", "reviewed"].includes(attempt.status)) return { status: 400, body: { error: "Submit the quiz before sending proof" } };
    const proofResponse = await fetch(`${base}/competition_proofs`, {
      method: "POST", headers,
      body: JSON.stringify({ attempt_id: attemptId, proof_type: proofType, file_url: fileUrl, file_name: fileName, mime_type: "text/uri-list", status: "pending" }),
      signal: AbortSignal.timeout(9000),
    });
    if (!proofResponse.ok) return { status: 502, body: { error: "Could not submit proof" } };
    const rows = await proofResponse.json();
    return { status: 200, body: { proof: Array.isArray(rows) ? rows[0] : null, status: "pending" } };
  }

  if (action === "submit") {
    const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    if (!attemptId) return { status: 400, body: { error: "Attempt id is required" } };
    const attemptParams = new URLSearchParams({ select: "id,status", id: `eq.${attemptId}`, limit: "1" });
    if (!previewAllowed) attemptParams.set("user_id", `eq.${userId}`);
    const attemptResponse = await fetch(`${base}/competition_attempts?${attemptParams.toString()}`, { headers, signal: AbortSignal.timeout(9000) });
    if (!attemptResponse.ok) return { status: 502, body: { error: "Could not read competition attempt" } };
    const attempts = await attemptResponse.json();
    const attempt = Array.isArray(attempts) ? attempts[0] : null;
    if (!attempt || attempt.status !== "in_progress") return { status: 400, body: { error: "This competition attempt is no longer active" } };
    const questionResponse = await fetch(`${base}/competition_questions?select=id,correct_option,points,kind&status=eq.published`, { headers, signal: AbortSignal.timeout(9000) });
    const questions = questionResponse.ok ? await questionResponse.json() : [];
    let objectiveScore = 0;
    for (const question of Array.isArray(questions) ? questions : []) {
      const submitted = typeof answers[question.id] === "string" ? answers[question.id] : "";
      if (question.correct_option && submitted && submitted === question.correct_option) objectiveScore += Number(question.points || 0);
    }
    const updateParams = new URLSearchParams({ id: `eq.${attemptId}` });
    if (!previewAllowed) updateParams.set("user_id", `eq.${userId}`);
    const updateResponse = await fetch(`${base}/competition_attempts?${updateParams.toString()}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ answers, objective_score: objectiveScore, final_score: objectiveScore, status: "submitted", submitted_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(9000),
    });
    if (!updateResponse.ok) return { status: 502, body: { error: "Could not submit competition attempt" } };
    return { status: 200, body: { objectiveScore, status: "submitted" } };
  }

  return { status: 400, body: { error: "Unknown competition action" } };
}

async function q(table: string, select: string, order: string, limit = 2000): Promise<any[]> {
  if (!SUPABASE_URL || !ANON_KEY) return [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`,
      { headers: h(), signal: AbortSignal.timeout(9000) }
    );
    if (!r.ok) return [];
    return r.json();
  } catch { return []; }
}

async function readCompetitionContent(previewAllowed = false): Promise<{ config: any | null; prizes: any[]; questions: any[]; leaderboard: any[] }> {
  if (!SUPABASE_URL || !ANON_KEY) return { config: null, prizes: [], questions: [], leaderboard: [] };
  const readHeaders = previewAllowed && SERVICE_KEY ? serviceHeaders() : h();
  const request = async (table: string, select: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams({ select, ...extra });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`, { headers: readHeaders, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };
  try {
    const [configs, prizes, questions] = await Promise.all([
      request('competition_config', 'id,title_en,title_ar,intro_en,intro_ar,rules_en,rules_ar,active,preview_only,preview_owner_username,invite_required,leaderboard_published', previewAllowed ? { id: 'eq.default', limit: '1' } : { id: 'eq.default', active: 'eq.true', limit: '1' }),
      request('competition_prizes', 'id,category,title_en,title_ar,description_en,description_ar,availability_note_en,availability_note_ar,sort_order', { published: 'eq.true', order: 'sort_order.asc' }),
      request('competition_questions', 'id,kind,question_en,question_ar,options,points,audio_url,image_url,weapon_id,sort_order', { status: 'eq.published', order: 'sort_order.asc' }),
    ]);
    const config = configs[0] || null;
    let leaderboard: any[] = [];
    if (config?.leaderboard_published && SERVICE_KEY && !previewAllowed) {
      const leaderboardParams = new URLSearchParams({ select: "final_score,submitted_at,status", status: "in.(submitted,reviewed)", final_score: "not.is.null", order: "final_score.desc,submitted_at.asc", limit: "20" });
      const leaderboardResponse = await fetch(`${SUPABASE_URL}/rest/v1/competition_attempts?${leaderboardParams.toString()}`, { headers: serviceHeaders(), signal: AbortSignal.timeout(9000) });
      const leaderboardRows = leaderboardResponse.ok ? await leaderboardResponse.json() : [];
      leaderboard = Array.isArray(leaderboardRows) ? leaderboardRows : [];
    }
    const previewOrActive = previewAllowed || config?.active === true;
    return { config, prizes: previewOrActive ? prizes : [], questions: previewOrActive ? questions : [], leaderboard };
  } catch {
    return { config: null, prizes: [], questions: [], leaderboard: [] };
  }
}

async function readContentRows(
  type: 'weapons' | 'posts',
  opts: { limit?: number; offset?: number; category?: string; q?: string; letter?: string; sort?: string; order?: string } = {}
): Promise<{ rows: any[]; total: number }> {
  if (type === 'weapons') {
    const limit = Math.min(50, Math.max(1, Number(opts.limit) || 50));
    const offset = Math.max(0, Number(opts.offset) || 0);
    const safeSort = opts.sort === 'date' ? 'created_at' : 'name';
    const safeOrder = opts.order === 'desc' ? 'desc' : 'asc';
    const baseParams = {
      order: `${safeSort}.${safeOrder}`,
      limit: String(limit),
      offset: String(offset),
    };

    async function fetchWeaponProjection(select: string) {
      const params = new URLSearchParams({ select, ...baseParams });
      if (opts.category) params.set('category', `eq.${opts.category}`);
      if (opts.q) params.set('name', `ilike.*${String(opts.q).replace(/[,*()]/g, '')}*`);
      if (opts.letter) params.set('name', `ilike.${String(opts.letter).slice(0, 1)}*`);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/weapons?${params.toString()}`, {
        headers: { ...h(), Prefer: 'count=exact' },
        signal: AbortSignal.timeout(9000),
      });
      if (!response.ok) return null;
      const rows = await response.json();
      const range = response.headers.get('content-range') || '';
      const parsedTotal = Number.parseInt(range.split('/')[1] || '', 10);
      return {
        rows: Array.isArray(rows) ? rows : [],
        total: Number.isFinite(parsedTotal) ? parsedTotal : (Array.isArray(rows) ? rows.length : 0),
      };
    }

    if (SUPABASE_URL && ANON_KEY) {
      try {
        // Keep the catalogue compatible with older Supabase schemas: try the
        // richer projection first, then fall back to the stable public fields.
        const enriched = await fetchWeaponProjection(
          'id,name,category,description,stats,image_url,background_url,created_at,acquisition_type,acquisition_method,acquisition_verified,acquisition,shop_type,currency,source_url',
        );
        if (enriched) return enriched;

        const stable = await fetchWeaponProjection(
          'id,name,category,description,stats,image_url,created_at',
        );
        if (stable) return stable;
      } catch {
        // Use an empty response rather than accidentally loading the full table.
      }
    }

    return { rows: [], total: 0 };
  }

  if (!SUPABASE_URL || !ANON_KEY) return { rows: [], total: 0 };
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 24));
  const offset = Math.max(0, Number(opts.offset) || 0);
  const params = new URLSearchParams({
    select: 'id,title,title_ar,post_slug,summary,summary_ar,content,content_ar,image_url,category,tags,author,views,reading_time,featured,language,seo_title,seo_description,og_image,canonical_url,full_layout,template,wiki_tabs,external_links,source_url,gallery,created_at,updated_at',
    order: 'created_at.desc',
    limit: String(limit),
    offset: String(offset),
  });
  if (opts.category) params.set('category', `eq.${opts.category}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?${params.toString()}`, {
      headers: { ...h(), Prefer: 'count=exact' },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return { rows: [], total: 0 };
    const rows = await response.json();
    const contentRange = response.headers.get('content-range') || '';
    const totalText = contentRange.split('/')[1] || '';
    const total = Number.parseInt(totalText, 10);
    return { rows: Array.isArray(rows) ? rows : [], total: Number.isFinite(total) ? total : rows.length };
  } catch {
    return { rows: [], total: 0 };
  }
}

function xe(s: string) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function isoDate(s?: string) {
  if (!s) return "";
  try { return new Date(s).toISOString().split("T")[0]; } catch { return ""; }
}

function dateAtOrBefore(value: unknown, maxDate: string) {
  const date = isoDate(value == null ? "" : String(value));
  return date && date <= maxDate ? date : "";
}

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
  images?: { url: string; title?: string; caption?: string }[];
  videos?: { thumbnail: string; title: string; description?: string; contentLoc?: string; playerLoc?: string; publicationDate?: string }[];
}

function entry({ loc, lastmod, changefreq, priority, images, videos }: UrlEntry) {
  let xml = `  <url>\n    <loc>${xe(loc)}</loc>\n`;
  if (lastmod)    xml += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) xml += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority)   xml += `    <priority>${priority}</priority>\n`;
  for (const img of (images || [])) {
    xml += `    <image:image>\n`;
    xml += `      <image:loc>${xe(img.url)}</image:loc>\n`;
    if (img.title)   xml += `      <image:title>${xe(img.title)}</image:title>\n`;
    if (img.caption) xml += `      <image:caption>${xe(img.caption)}</image:caption>\n`;
    xml += `    </image:image>\n`;
  }
  for (const video of (videos || [])) {
    xml += `    <video:video>\n`;
    xml += `      <video:thumbnail_loc>${xe(video.thumbnail)}</video:thumbnail_loc>\n`;
    xml += `      <video:title>${xe(video.title)}</video:title>\n`;
    if (video.description) xml += `      <video:description>${xe(video.description)}</video:description>\n`;
    if (video.contentLoc) xml += `      <video:content_loc>${xe(video.contentLoc)}</video:content_loc>\n`;
    if (video.playerLoc) xml += `      <video:player_loc>${xe(video.playerLoc)}</video:player_loc>\n`;
    if (video.publicationDate) xml += `      <video:publication_date>${xe(video.publicationDate)}</video:publication_date>\n`;
    xml += `    </video:video>\n`;
  }
  xml += `  </url>\n`;
  return xml;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  if (req.method === 'POST' && rawType === 'competition') {
    const result = await competitionRequest(req);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(result.status).json(result.body);
  }

  if (req.method === 'GET' && rawType === 'competition') {
    const previewAdmin = verifyAdminRequest(req.headers as Record<string, unknown>);
    const previewAllowed = process.env.VERCEL_ENV !== "production" && previewAdmin?.role === "super_admin";
    const payload = await readCompetitionContent(previewAllowed);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json(payload);
  }

  if (req.method === 'GET' && typeof rawType === 'string' && (rawType === 'weapons' || rawType === 'posts')) {
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
    const rawCategory = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    const rawQuery = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const rawLetter = Array.isArray(req.query.letter) ? req.query.letter[0] : req.query.letter;
    const rawSort = Array.isArray(req.query.sort) ? req.query.sort[0] : req.query.sort;
    const rawOrder = Array.isArray(req.query.order) ? req.query.order[0] : req.query.order;
    const { rows, total } = await readContentRows(rawType as 'weapons' | 'posts', {
      limit: Number(rawLimit),
      offset: Number(rawOffset),
      category: typeof rawCategory === 'string' ? rawCategory : undefined,
      q: typeof rawQuery === 'string' ? rawQuery : undefined,
      letter: typeof rawLetter === 'string' ? rawLetter : undefined,
      sort: typeof rawSort === 'string' ? rawSort : undefined,
      order: typeof rawOrder === 'string' ? rawOrder : undefined,
    });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(rawType === 'weapons' ? { weapons: rows || [], total } : { posts: rows || [], total });
  }

  const today = new Date().toISOString().split("T")[0];

  const [events, news, posts, tutorials, customPages, weapons, mercs, modes, competitionConfig] = await Promise.all([
    q("events",       "id,title,event_name_slug,image_url,date,updated_at,seo_description,source_url", "date.desc"),
    q("news",         "id,title,news_slug,image_url,created_at,updated_at,seo_description,source_url", "created_at.desc"),
    q("posts",        "id,title,post_slug,image_url,created_at,updated_at,seo_description,source_url", "created_at.desc"),
    q("tutorials",    "id,title,slug,image_url,created_at,seo_title,seo_description,youtube_url,youtube_id,video_url", "created_at.desc"),
    q("custom_pages", "id,slug,title_en,title_ar,seo_title,seo_description,updated_at,status", "updated_at.desc"),
    q("weapons",      "id,name,image_url",                                                   "name", 10000),
    q("mercenaries",  "id,name,image_url",                                                   "order_index", 10000),
    q("modes",        "id,name,image_url",                                                   "name", 10000),
    q("competition_config", "id,active,updated_at", "updated_at.desc", 1),
  ]);

  // Use the newest real content timestamp for shared/static URLs. This avoids
  // publishing a stale fixed date while still falling back safely when the DB
  // is unavailable or contains malformed timestamps.
  const contentDates = [...events, ...news, ...posts, ...tutorials, ...customPages]
    .flatMap((row: any) => [row.updated_at, row.created_at, row.date])
    .map((value) => dateAtOrBefore(value, today))
    .filter(Boolean)
    .sort()
    .reverse();
  const latestContentDate = contentDates[0] || today;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
  xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
  xml += `        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n\n`;

  // ── Static pages ──────────────────────────────────────────────────────
  const statics: UrlEntry[] = [
    { loc: `${BASE}/`,           priority: "1.0", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/global-wiki`,priority: "0.98",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/events`,     priority: "0.95",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/weapons`,    priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/modes`,      priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/ranks`,      priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/mercenaries`,priority: "0.9", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/maps`,       priority: "0.8", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/news`,       priority: "0.85",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/posts`,      priority: "0.75",changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/tutorials`,  priority: "0.8", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/videos`,      priority: "0.8", changefreq: "daily",   lastmod: latestContentDate },
    { loc: `${BASE}/pages`,       priority: "0.7", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/content-hub`, priority: "0.8", changefreq: "weekly",  lastmod: latestContentDate },
    { loc: `${BASE}/faq`,         priority: "0.6", changefreq: "monthly", lastmod: latestContentDate },
    ...(competitionConfig[0]?.active === true ? [{ loc: `${BASE}/competition`, priority: "0.65", changefreq: "weekly", lastmod: dateAtOrBefore(competitionConfig[0].updated_at, today) || latestContentDate }] : []),
    { loc: `${BASE}/grave-games`, priority: "0.5", changefreq: "monthly", lastmod: latestContentDate },
    { loc: `${BASE}/category/news`,   priority: "0.7", changefreq: "daily"   },
    { loc: `${BASE}/category/events`, priority: "0.7", changefreq: "daily"   },
    { loc: `${BASE}/category/guides`, priority: "0.7", changefreq: "weekly"  },
    { loc: `${BASE}/download`,   priority: "0.7", changefreq: "weekly"  },
    { loc: `${BASE}/sellers`,    priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/services`,   priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/reviews`,    priority: "0.6", changefreq: "weekly"  },
    { loc: `${BASE}/forum`,      priority: "0.6", changefreq: "daily"   },
    { loc: `${BASE}/about`,      priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/contact`,    priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/support`,    priority: "0.5", changefreq: "monthly" },
    { loc: `${BASE}/privacy`,    priority: "0.3", changefreq: "monthly" },
    { loc: `${BASE}/terms`,      priority: "0.3", changefreq: "monthly" },
  ];
  for (const s of statics) xml += entry(s);
  xml += "\n";

  xml += "  <!-- Regional wiki landing pages -->\n";
  for (const region of REGIONS) {
    xml += entry({ loc: `${BASE}/${region.slug}`, priority: "0.9", changefreq: "weekly", lastmod: latestContentDate });
    for (const weapon of WEAPONS) {
      xml += entry({ loc: `${BASE}/${region.slug}/weapons/${weapon.slug}`, priority: "0.8", changefreq: "weekly", lastmod: latestContentDate });
    }
  }
  xml += "\n";

  // ── Events ────────────────────────────────────────────────────────────
  xml += "  <!-- Events -->\n";
  for (const ev of events) {
    const slug = ev.event_name_slug || ev.id;
    if (!slug) continue;
    const img = ev.image_url;
    xml += entry({
      loc:        `${BASE}/events/${slug}`,
      lastmod:    dateAtOrBefore(ev.updated_at || ev.date, today) || today,
      changefreq: "weekly",
      priority:   "0.85",
      images:     img ? [{ url: img, title: ev.title, caption: `CrossFire event: ${ev.title}` }] : [],
    });
  }
  xml += "\n";

  // ── News ──────────────────────────────────────────────────────────────
  xml += "  <!-- News -->\n";
  for (const n of news) {
    const slug = n.news_slug || n.id;
    if (!slug) continue;
    const img = n.image_url;
    xml += entry({
      loc:        `${BASE}/news/${slug}`,
      lastmod:    dateAtOrBefore(n.updated_at || n.created_at, today) || today,
      changefreq: "weekly",
      priority:   "0.75",
      images:     img ? [{ url: img, title: n.title, caption: `CrossFire news: ${n.title}` }] : [],
    });
  }
  xml += "\n";

  // ── Posts ─────────────────────────────────────────────────────────────
  xml += "  <!-- Posts -->\n";
  for (const p of posts) {
    const slug = p.post_slug || p.id;
    if (!slug) continue;
    const img = p.image_url;
    xml += entry({
      loc:        `${BASE}/posts/${slug}`,
      lastmod:    dateAtOrBefore(p.updated_at || p.created_at, today) || today,
      changefreq: "weekly",
      priority:   "0.65",
      images:     img ? [{ url: img, title: p.title }] : [],
    });
  }
  xml += "\n";

  // ── Tutorials ─────────────────────────────────────────────────────────
  xml += "  <!-- Tutorials -->\n";
  for (const t of tutorials) {
    const slug = t.slug || t.id;
    if (!slug) continue;
    const img = t.image_url;
    xml += entry({
      loc:        `${BASE}/tutorials/${slug}`,
      lastmod:    dateAtOrBefore(t.updated_at || t.created_at, today) || today,
      changefreq: "monthly",
      priority:   "0.65",
      images:     img ? [{ url: img, title: t.title }] : [],
      videos: t.youtube_id || t.youtube_url || t.video_url ? [{
        thumbnail: img || `https://img.youtube.com/vi/${t.youtube_id}/hqdefault.jpg`,
        title: t.title || "CrossFire tutorial",
        description: t.seo_description || `CrossFire tutorial: ${t.title}`,
        playerLoc: t.youtube_id ? `https://www.youtube.com/embed/${t.youtube_id}` : undefined,
        contentLoc: t.video_url || undefined,
        publicationDate: dateAtOrBefore(t.created_at, today) ? new Date(t.created_at).toISOString() : undefined,
      }] : [],
    });
  }
  xml += "\n";

  // ── Custom pages ───────────────────────────────────────────────────────
  xml += "  <!-- Published custom pages -->\n";
  for (const page of customPages) {
    if (page.status && page.status !== "published") continue;
    const slug = page.slug || page.id;
    if (!slug) continue;
    xml += entry({
      loc: `${BASE}/pages/${slug}`,
      lastmod: dateAtOrBefore(page.updated_at, today) || today,
      changefreq: "weekly",
      priority: "0.65",
    });
  }
  xml += "\n";

  // ── Weapons (image sitemap) ───────────────────────────────────────────
  xml += "  <!-- Weapons -->\n";
  for (const w of weapons) {
    if (!w.name) continue;
    const slug = w.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const img = w.image_url;
    xml += entry({
      loc:        `${BASE}/weapons`,
      images:     img ? [{ url: img, title: `${w.name} — CrossFire Weapon`, caption: `CrossFire weapon: ${w.name}` }] : [],
    });
  }
  xml += "\n";

  // ── Mercenaries (image sitemap) ───────────────────────────────────────
  xml += "  <!-- Mercenaries -->\n";
  for (const m of mercs) {
    if (!m.name) continue;
    const img = m.image_url;
    if (!img) continue;
    xml += entry({
      loc:    `${BASE}/mercenaries`,
      images: [{ url: img, title: `${m.name} — CrossFire Mercenary`, caption: `CrossFire mercenary: ${m.name}` }],
    });
  }

  xml += "\n</urlset>";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=1800");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(200).send(xml);
}
