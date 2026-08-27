import type { VercelRequest, VercelResponse } from "@vercel/node";

import { verifyAdminRequest } from "../../server/adminAuth.js";
import { assertApprovedSourceUrl } from "../../server/urlSafety.js";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "POST, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) {
    res.setHeader(key, value);
  }
  return res;
}


async function scrapePage(url: string) {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WikiBot/1.0)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);
  const html = await r.text();
  const cheerio = await import("cheerio");
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[|\-–].*$/, "").trim() || "";
  const image =
    $('meta[property="og:image"]').attr("content") ||
    $(".mw-content-text img, article img").first().attr("src") || "";
  $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection").remove();
  const contentEl = $(".mw-parser-output, article, main, #content, .content").first();
  const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
  const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return { title, content, summary: plain.slice(0, 300), image };
}

function hasAnyPermission(admin: NonNullable<ReturnType<typeof verifyAdminRequest>>, permissions: string[]) {
  return admin.role === "super_admin" || permissions.some(permission => admin.permissions?.[permission] === true);
}

const ANNOUNCEMENT_POST_CATEGORY = "__ANNOUNCEMENT__";

function announcementFromRow(row: Record<string, any>, scope: "global" | "seller") {
  const isPost = scope === "seller";
  return {
    id: String(row.id || ""),
    contentHtml: isPost ? String(row.content || "") : String(row.content_en || ""),
    contentHtmlEn: isPost ? String(row.content || "") : String(row.content_en || ""),
    contentHtmlAr: isPost ? String(row.summary || "") : String(row.content_ar || ""),
    imageUrl: isPost ? String(row.image_url || "") : "",
    linkUrl: isPost ? String(row.og_image || "") : "",
    active: isPost ? row.featured !== false : row.active !== false,
    dismissible: isPost ? row.preview_on_home !== false : row.dismissible !== false,
    direction: isPost ? String(row.source_url || "auto") : "auto",
    sellerSlug: isPost ? String((Array.isArray(row.tags) ? row.tags : []).find((tag: unknown) => String(tag).startsWith("seller:")) || "").replace(/^seller:/, "") : "",
    updatedAt: row.updated_at || row.created_at || null,
  };
}

function announcementPostRow(body: Record<string, any>, sellerSlug: string) {
  const safeSlug = sellerSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80);
  return {
    title: `__seller_announcement__:${safeSlug}`,
    post_slug: `__seller-announcement__-${safeSlug}`,
    content: String(body.contentHtmlEn || body.contentHtml || "").slice(0, 20000),
    summary: String(body.contentHtmlAr || "").slice(0, 20000),
    category: ANNOUNCEMENT_POST_CATEGORY,
    tags: [`seller:${safeSlug}`],
    author: "admin",
    featured: body.active !== false,
    image_url: String(body.imageUrl || "").slice(0, 2000),
    og_image: String(body.linkUrl || "").slice(0, 2000),
    source_url: ["auto", "ltr", "rtl"].includes(String(body.direction)) ? String(body.direction) : "auto",
    preview_on_home: body.dismissible !== false,
    language: "en",
  };
}

async function deleteNonAnnouncementPosts(baseUrl: string, headers: Record<string, string>) {
  const response = await fetch(`${baseUrl}/rest/v1/posts?category=neq.__ANNOUNCEMENT__`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal,count=exact" },
  });
  if (!response.ok) throw new Error(`Supabase posts cleanup failed: ${await response.text()}`);
  const range = response.headers.get("content-range") || "";
  const total = range.includes("/") ? Number(range.split("/").pop()) : 0;
  return Number.isFinite(total) ? total : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "POST only" });
  const admin = verifyAdminRequest(req.headers as Record<string, unknown>);
  if (!admin) {
    return addCorsHeaders(res).status(401).json({ error: "Unauthorized" });
  }

  const { action, type, id, url, operation, row, rows } = req.body || {};
  const isSuperAdmin = admin.role === "super_admin";
  const canManageContent = hasAnyPermission(admin, ["content:manage", "posts:manage", "news:manage", "events:manage"]);

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || "";

  // ── action: service-listings ───────────────────────────────────────────────
  if (action === "service-listings") {
    if (!hasAnyPermission(admin, ["services:manage", "service-listings:manage", "sellers:manage"])) {
      return addCorsHeaders(res).status(403).json({ error: "Missing services management permission" });
    }
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "return=representation",
    };
    const baseUrl = `${SUPABASE_URL}/rest/v1/service_listings`;

    try {
      if (operation === "list") {
        const listRes = await fetch(`${baseUrl}?select=*&order=sort_order.asc,created_at.desc`, { headers });
        if (!listRes.ok) throw new Error(`Supabase service-listings read failed: ${await listRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await listRes.json() });
      }

      if (operation === "create") {
        if (!row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "row required" });
        const createRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(row) });
        if (!createRes.ok) throw new Error(`Supabase service-listing create failed: ${await createRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await createRes.json() });
      }

      if (operation === "bulk-import") {
        if (!Array.isArray(rows) || rows.length === 0) return addCorsHeaders(res).status(400).json({ error: "rows required" });
        const importRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(rows) });
        if (!importRes.ok) throw new Error(`Supabase service-listings import failed: ${await importRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await importRes.json() });
      }

      if (operation === "update") {
        if (!id || !row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "id and row required" });
        const updateRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers, body: JSON.stringify(row) });
        if (!updateRes.ok) throw new Error(`Supabase service-listing update failed: ${await updateRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await updateRes.json() });
      }

      if (operation === "delete") {
        if (!id) return addCorsHeaders(res).status(400).json({ error: "id required" });
        const deleteRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers });
        if (!deleteRes.ok) throw new Error(`Supabase service-listing delete failed: ${await deleteRes.text()}`);
        return addCorsHeaders(res).status(200).json({ success: true });
      }

      return addCorsHeaders(res).status(400).json({ error: "Unknown service-listings operation" });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e.message || "Service-listings operation failed" });
    }
  }

  // ── action: bulk-events ──────────────────────────────────────────────────────
    if (action === "bulk-events") {
    if (!hasAnyPermission(admin, ["events:manage", "content:manage"])) {
      return addCorsHeaders(res).status(403).json({ error: "Missing events management permission" });
    }
    const sourceEvents = Array.isArray(req.body?.events) ? req.body.events : [];
    if (sourceEvents.length === 0 || sourceEvents.length > 50) {
      return addCorsHeaders(res).status(400).json({ error: "Provide between 1 and 50 events" });
    }
    if (req.body?.confirmation !== "PUBLISH_SCRAPED_EVENTS") {
      return addCorsHeaders(res).status(400).json({ error: "Explicit publish confirmation is required" });
    }
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal",
    };
    const eventsBase = `${SUPABASE_URL}/rest/v1/events`;
    const newsBase = `${SUPABASE_URL}/rest/v1/news`;
    const createAsNews = req.body?.createAsNews === true;
    let created = 0;
    let newsCreated = 0;
    let skipped = 0;
    const failed: Array<{ title: string; error: string }> = [];
    const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || `event-${Date.now()}`;

    for (const source of sourceEvents) {
      const title = typeof source?.title === "string" ? source.title.trim() : "";
      const description = typeof source?.content === "string" ? source.content : (typeof source?.description === "string" ? source.description : "");
      const sourceUrl = source?.url || source?.sourceUrl;
      if (!title || !description || !sourceUrl) {
        failed.push({ title: title || "Untitled event", error: "Title, content, and source URL are required" });
        continue;
      }
      let approvedUrl: string;
      try { approvedUrl = await assertApprovedSourceUrl(sourceUrl); }
      catch (error) { failed.push({ title, error: error instanceof Error ? error.message : "Invalid source URL" }); continue; }

      try {
        const existsResponse = await fetch(`${eventsBase}?source_url=eq.${encodeURIComponent(approvedUrl)}&select=id&limit=1`, { headers });
        const existingRows = existsResponse.ok ? await existsResponse.json().catch(() => []) : [];
        if (Array.isArray(existingRows) && existingRows.length > 0) {
          skipped += 1;
          continue;
        }
        const row = {
          title,
          event_name_slug: slugify(title),
          description,
          image_url: typeof source.image === "string" ? source.image : "",
          date: typeof source.date === "string" ? source.date : new Date().toISOString(),
          start_date: typeof source.startDate === "string" ? source.startDate : null,
          end_date: typeof source.endDate === "string" ? source.endDate : null,
          source_url: approvedUrl,
          type: "upcoming",
        };
        const eventResponse = await fetch(eventsBase, { method: "POST", headers, body: JSON.stringify(row) });
        if (!eventResponse.ok) throw new Error(`Event create failed: ${await eventResponse.text()}`);
        created += 1;

        if (createAsNews) {
          const newsRow = {
            title,
            news_slug: `${slugify(title)}-${Date.now()}`,
            content: description,
            html_content: description,
            image_url: row.image_url,
            category: "events",
            author: "CrossFire Wiki",
            source_url: approvedUrl,
            featured: false,
            preview_on_home: true,
          };
          const newsResponse = await fetch(newsBase, { method: "POST", headers, body: JSON.stringify(newsRow) });
          if (newsResponse.ok) newsCreated += 1;
          else failed.push({ title, error: `News create failed: ${await newsResponse.text()}` });
        }
      } catch (error) {
        failed.push({ title, error: error instanceof Error ? error.message : "Event create failed" });
      }
    }
    return addCorsHeaders(res).status(failed.length ? 207 : 200).json({ created, newsCreated, skipped, failed });
  }

  // ── action: announcement-admin ───────────────────────────────────────────────
  // Global announcements use the verified announcements table; seller notices
  // retain the existing announcement-post compatibility format, but all writes
  // happen server-side behind the admin token.
  if (action === "announcement-admin") {
    if (!hasAnyPermission(admin, ["announcements:manage", "content:manage", "posts:manage"])) {
      return addCorsHeaders(res).status(403).json({ error: "Missing announcements management permission" });
    }
    if (!SUPABASE_URL || !SERVICE_KEY) return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });
    const scope = req.body?.scope === "seller" ? "seller" : "global";
    const announcementOperation = String(req.body?.operation || "list");
    const sellerSlug = String(req.body?.sellerSlug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80);
    if (scope === "seller" && !sellerSlug) return addCorsHeaders(res).status(400).json({ error: "Seller slug is required" });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "return=representation,count=exact",
    };
    const table = scope === "seller" ? "posts" : "announcements";
    const baseUrl = `${SUPABASE_URL}/rest/v1/${table}`;
    try {
      const listUrl = scope === "seller"
        ? `${baseUrl}?category=eq.${encodeURIComponent(ANNOUNCEMENT_POST_CATEGORY)}&tags=cs.${encodeURIComponent(`{seller:${sellerSlug}}`)}&order=created_at.desc&limit=100`
        : `${baseUrl}?target=eq.global&order=created_at.desc&limit=100`;
      if (announcementOperation === "list") {
        const listRes = await fetch(listUrl, { headers });
        if (!listRes.ok) throw new Error(`Supabase ${table} announcement read failed: ${await listRes.text()}`);
        const rows = await listRes.json();
        return addCorsHeaders(res).status(200).json({ data: Array.isArray(rows) ? rows.map((row: Record<string, any>) => announcementFromRow(row, scope)) : [] });
      }
      const announcementId = typeof req.body?.id === "string" ? req.body.id.trim() : "";
      if (announcementOperation === "delete") {
        if (!announcementId) return addCorsHeaders(res).status(400).json({ error: "Announcement id is required" });
        const sellerTagsFilter = encodeURIComponent(`{seller:${sellerSlug}}`);
        const deleteUrl = scope === "seller"
          ? `${baseUrl}?id=eq.${encodeURIComponent(announcementId)}&category=eq.${encodeURIComponent(ANNOUNCEMENT_POST_CATEGORY)}&tags=cs.${sellerTagsFilter}`
          : `${baseUrl}?id=eq.${encodeURIComponent(announcementId)}&target=eq.global`;
        const deleteRes = await fetch(deleteUrl, { method: "DELETE", headers });
        if (!deleteRes.ok) throw new Error(`Supabase ${table} announcement delete failed: ${await deleteRes.text()}`);
        return addCorsHeaders(res).status(200).json({ success: true });
      }
      if (announcementOperation !== "create") return addCorsHeaders(res).status(400).json({ error: "Unsupported announcement operation" });
      const body = req.body?.row && typeof req.body.row === "object" ? req.body.row : req.body;
      const contentEn = String(body.contentHtmlEn || body.contentHtml || "").trim().slice(0, 20000);
      const contentAr = String(body.contentHtmlAr || "").trim().slice(0, 20000);
      if (!contentEn && !contentAr) return addCorsHeaders(res).status(400).json({ error: "Announcement content is required" });
      if (scope === "seller") {
        const oldRowsRes = await fetch(listUrl, { headers });
        if (!oldRowsRes.ok) throw new Error(`Supabase seller announcement lookup failed: ${await oldRowsRes.text()}`);
        const oldRows = await oldRowsRes.json();
        for (const oldRow of Array.isArray(oldRows) ? oldRows.slice(0, 20) : []) {
          if (!oldRow?.id) continue;
          const deleteRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(String(oldRow.id))}&category=eq.${encodeURIComponent(ANNOUNCEMENT_POST_CATEGORY)}&tags=cs.${encodeURIComponent(`{seller:${sellerSlug}}`)}`, { method: "DELETE", headers });
          if (!deleteRes.ok) throw new Error(`Supabase seller announcement replace failed: ${await deleteRes.text()}`);
        }
        const createRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(announcementPostRow({ ...body, contentHtmlEn: contentEn, contentHtmlAr: contentAr }, sellerSlug)) });
        if (!createRes.ok) throw new Error(`Supabase seller announcement create failed: ${await createRes.text()}`);
        const created = (await createRes.json())?.[0];
        return addCorsHeaders(res).status(200).json({ data: announcementFromRow(created || {}, scope) });
      }
      const globalRow = {
        title_en: String(body.titleEn || "Global announcement").trim().slice(0, 160),
        title_ar: String(body.titleAr || "").trim().slice(0, 160),
        content_en: contentEn,
        content_ar: contentAr,
        type: "info",
        target: "global",
        display: "banner",
        active: body.active !== false,
        dismissible: body.dismissible !== false,
      };
      const createRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(globalRow) });
      if (!createRes.ok) throw new Error(`Supabase global announcement create failed: ${await createRes.text()}`);
      const created = (await createRes.json())?.[0];
      return addCorsHeaders(res).status(200).json({ data: announcementFromRow(created || {}, scope) });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e?.message || "Announcement operation failed" });
    }
  }

  // ── action: admin-table ─────────────────────────────────────────────────────
  // Browser admin pages use this authenticated multiplexer for tables whose
  // writes must never depend on the public Supabase client/RLS policies.
  if (action === "admin-table") {
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    const tableByResource: Record<string, string> = {
      weapons: "weapons",
      sellers: "sellers",
      highlights: "site_highlights",
      posts: "posts",
      news: "news",
      events: "events",
      modes: "modes",
      ranks: "ranks",
      mercenaries: "mercenaries",
      tutorials: "tutorials",
      admin_users: "admin_users",
      competition_config: "competition_config",
      competition_invite_codes: "competition_invite_codes",
      competition_questions: "competition_questions",
      competition_attempts: "competition_attempts",
      competition_proofs: "competition_proofs",
      competition_prizes: "competition_prizes",
      tickets: "tickets",
      ticket_messages: "ticket_messages",
      comments: "comments",
      seller_reviews: "seller_reviews",
      maps: "maps",
      site_settings: "site_settings",
      custom_pages: "custom_pages",
      faq_categories: "faq_categories",
      faq_articles: "faq_articles",
    };
    const resource = String(type || "");
    const table = tableByResource[resource];
    if (!table) return addCorsHeaders(res).status(400).json({ error: "Unsupported admin table" });

    const permissionAliases: Record<string, string> = {
      ticket_messages: "tickets",
      seller_reviews: "sellers",
      maps: "content",
      custom_pages: "content",
      faq_categories: "content",
      faq_articles: "content",
      site_settings: "settings",
    };
    const permissionResource = permissionAliases[resource] || resource;
    const canManage = admin.role === "super_admin"
      || admin.permissions?.[`${permissionResource}:manage`] === true
      || admin.permissions?.[`${permissionResource}:write`] === true
      || (resource === "comments" && admin.permissions?.["content:manage"] === true);
    if (resource === "admin_users" && admin.role !== "super_admin") {
      return addCorsHeaders(res).status(403).json({ error: "Only a super administrator can manage administrators" });
    }
    if (resource !== "admin_users" && !canManage && admin.role !== "super_admin") {
      return addCorsHeaders(res).status(403).json({ error: `Missing ${resource} management permission` });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "return=representation,count=exact",
    };
    const baseUrl = `${SUPABASE_URL}/rest/v1/${table}`;

    try {
      if (operation === "list") {
        const page = Math.max(1, Number(req.body?.page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 50));
        const search = String(req.body?.search || "").trim();
        const params = new URLSearchParams();
        const requestedSelect = typeof req.body?.select === "string" && /^[a-zA-Z0-9_*, ]+$/.test(req.body.select)
          ? req.body.select
          : "";
        params.set(
          "select",
          requestedSelect || (
            table === "admin_users"
              ? "id,username,email,role,permissions,created_at"
              : table === "tickets"
                ? "id,title,description,user_name,user_email,category,priority,status,created_at,updated_at"
                : table === "ticket_messages"
                  ? "id,ticket_id,message,is_internal,sender_id,created_at"
                  : table === "competition_invite_codes"
                    ? "id,label,max_uses,uses_count,expires_at,active,created_at,created_by"
                    : table === "competition_attempts"
                      ? "id,user_id,invite_code_id,phone,consent_contact,objective_score,essay_score,proof_bonus,final_score,status,answers,submitted_at,reviewed_at,created_at"
                      : table === "competition_proofs"
                        ? "id,attempt_id,proof_type,file_url,file_name,file_size,mime_type,status,bonus_points,reviewer_note,created_at,reviewed_at"
                        : "*"
          ),
        );
        const orderByTable: Record<string, string> = {
          sellers: "rank.asc.nullslast,name.asc",
          site_highlights: "sort_order.asc,created_at.asc",
          admin_users: "created_at.desc",
          competition_questions: "sort_order.asc,created_at.asc",
          competition_prizes: "sort_order.asc,created_at.asc",
          competition_invite_codes: "created_at.desc",
          competition_attempts: "created_at.desc",
          competition_proofs: "created_at.desc",
          competition_config: "id.asc",
          posts: "created_at.desc",
          news: "created_at.desc",
          events: "date.desc.nullslast,created_at.desc",
          modes: "name.asc",
          ranks: "tier.asc",
          mercenaries: "order_index.asc.nullslast,name.asc",
          tutorials: "order_index.asc.nullslast,created_at.desc",
          tickets: "created_at.desc",
          ticket_messages: "created_at.asc",
          comments: "created_at.desc",
          seller_reviews: "created_at.desc",
          maps: "name.asc",
          site_settings: "id.asc",
          custom_pages: "created_at.desc",
          faq_categories: "sort_order.asc,created_at.asc",
          faq_articles: "sort_order.asc,created_at.asc",
        };
        const requestedOrder = typeof req.body?.order === "string" && req.body.order.trim() && /^[a-zA-Z0-9_., ]+$/.test(req.body.order)
          ? req.body.order
          : orderByTable[table] || "name.asc";
        params.set("order", requestedOrder);
        const requestedOffset = Number(req.body?.offset);
        params.set("limit", String(pageSize));
        params.set("offset", String(Number.isFinite(requestedOffset) && requestedOffset >= 0 ? Math.floor(requestedOffset) : (page - 1) * pageSize));
        if (table === "ticket_messages" && typeof req.body?.ticketId === "string" && req.body.ticketId.trim()) {
          params.set("ticket_id", `eq.${encodeURIComponent(req.body.ticketId.trim())}`);
        }
        if (search && (table === "weapons" || table === "sellers" || table === "highlights")) {
          const field = table === "highlights" ? "title" : "name";
          params.set(field, `ilike.*${search.replace(/[*,]/g, " ")}*`);
        }
        if (Array.isArray(req.body?.filters)) {
          for (const filter of req.body.filters.slice(0, 20)) {
            const field = typeof filter?.field === "string" && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(filter.field) ? filter.field : "";
            const operator = typeof filter?.operator === "string" && ["eq", "neq", "ilike", "in", "cs", "gt", "gte", "lt", "lte"].includes(filter.operator) ? filter.operator : "";
            if (!field || !operator) continue;
            const values = Array.isArray(filter.value) ? filter.value.map((value: unknown) => String(value).replace(/[{},\r\n]/g, "").slice(0, 120)).filter(Boolean) : [];
            const rawValue = values.length ? values.join(",") : String(filter.value ?? "").replace(/[\r\n]/g, "");
            const value = operator === "in" && values.length ? `(${rawValue})` : operator === "cs" && values.length ? `{${rawValue}}` : rawValue.slice(0, 500);
            if (value) params.set(field, `${operator}.${value}`);
          }
        }
        if (table === "site_settings") params.set("select", "*");
        const listRes = await fetch(`${baseUrl}?${params.toString()}`, { headers });
        if (!listRes.ok) throw new Error(`Supabase ${table} read failed: ${await listRes.text()}`);
        const contentRange = listRes.headers.get("content-range") || "";
        const totalText = contentRange.includes("/") ? contentRange.split("/").pop() : "";
        const rawData = await listRes.json();
        const data = table === "site_settings" && Array.isArray(rawData)
          ? rawData.map(({ review_verification_passphrase: _passphrase, ...safeSettings }: Record<string, unknown>) => safeSettings)
          : rawData;
        return addCorsHeaders(res).status(200).json({ data, count: totalText && totalText !== "*" ? Number(totalText) : data.length });
      }

      if (operation === "reorder") {
        if (table !== "events" || !Array.isArray(rows) || rows.length > 100) return addCorsHeaders(res).status(400).json({ error: "Valid event order rows are required" });
        let updated = 0;
        for (const item of rows) {
          if (!item || typeof item.id !== "string" || !Number.isFinite(Number(item.order))) continue;
          const updateRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(item.id)}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ sort_order: Number(item.order) }),
          });
          if (!updateRes.ok) throw new Error(`Supabase ${table} reorder failed: ${await updateRes.text()}`);
          updated += 1;
        }
        return addCorsHeaders(res).status(200).json({ success: true, updated });
      }

      if (operation === "create" || operation === "upsert") {
        if (!row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "row required" });
        let safeRow: Record<string, unknown> = { ...(row as Record<string, unknown>) };
        let issuedCode: string | undefined;
        const aliases: Record<string, string> = {
          image: "image_url", imageUrl: "image_url", titleAr: "title_ar", descriptionAr: "description_ar",
          dateRange: "date_range", htmlContent: "html_content", readingTime: "reading_time",
          previewOnHome: "preview_on_home", seoTitle: "seo_title", seoDescription: "seo_description",
          seoKeywords: "seo_keywords", canonicalUrl: "canonical_url", sourceUrl: "source_url",
          youtubeUrl: "youtube_url", youtubeId: "youtube_id", order: "order_index",
          promotionText: "promotion_text", sellerNameSlug: "seller_name_slug",
        };
        for (const [from, to] of Object.entries(aliases)) {
          if (safeRow[to] === undefined && safeRow[from] !== undefined) safeRow[to] = safeRow[from];
          if (from !== to) delete safeRow[from];
        }
        if (table === "admin_users") {
          const password = typeof safeRow.password === "string" ? safeRow.password : "";
          delete safeRow.password;
          delete safeRow.password_hash;
          if (String(safeRow.username || "").trim().length < 3) return addCorsHeaders(res).status(400).json({ error: "Username must be at least 3 characters" });
          if (password.length < 8) return addCorsHeaders(res).status(400).json({ error: "Password must be at least 8 characters" });
          const bcrypt = await import("bcryptjs");
          safeRow.password_hash = await bcrypt.hash(password, 12);
          safeRow.permissions = safeRow.permissions && typeof safeRow.permissions === "object" ? safeRow.permissions : {};
        }
        if (table === "tickets") {
          const allowed = ["title", "description", "category", "priority", "status"];
          safeRow = Object.fromEntries(Object.entries(safeRow).filter(([key]) => allowed.includes(key)));
          if (typeof safeRow.title === "string") safeRow.title = safeRow.title.trim().slice(0, 160);
          if (typeof safeRow.description === "string") safeRow.description = safeRow.description.trim().slice(0, 10000);
          if (safeRow.status !== undefined && !["open", "in-progress", "in_progress", "resolved", "closed"].includes(String(safeRow.status))) return addCorsHeaders(res).status(400).json({ error: "Invalid ticket status" });
          if (safeRow.priority !== undefined && !["low", "normal", "medium", "high", "urgent"].includes(String(safeRow.priority))) return addCorsHeaders(res).status(400).json({ error: "Invalid ticket priority" });
          safeRow.updated_at = new Date().toISOString();
        }
        if (table === "ticket_messages") {
          if (operation === "update" || operation === "delete") return addCorsHeaders(res).status(405).json({ error: "Ticket messages cannot be edited or deleted" });
          const ticketId = typeof safeRow.ticket_id === "string" ? safeRow.ticket_id.trim() : "";
          const message = typeof safeRow.message === "string" ? safeRow.message.trim().slice(0, 10000) : "";
          if (!ticketId || !message) return addCorsHeaders(res).status(400).json({ error: "Ticket id and message are required" });
          safeRow = { ticket_id: ticketId, message, is_internal: safeRow.is_internal === true, sender_id: admin.id || admin.username };
        }
        if (table === "competition_invite_codes") {
          const crypto = await import("node:crypto");
          const requestedCode = typeof safeRow.code === "string" ? safeRow.code.trim() : "";
          const code = requestedCode || `CFW-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
          if (code.length < 4 || code.length > 80) return addCorsHeaders(res).status(400).json({ error: "Invitation code must be between 4 and 80 characters" });
          issuedCode = code;
          delete safeRow.code;
          delete safeRow.code_hash;
          safeRow.code_hash = crypto.createHash("sha256").update(code).digest("hex");
          safeRow.uses_count = 0;
          safeRow.created_by = admin.id || admin.username;
        }
        const writeHeaders = operation === "upsert"
          ? { ...headers, Prefer: "resolution=merge-duplicates,return=representation,count=exact" }
          : headers;
        const writeParams = new URLSearchParams();
        if (operation === "upsert" && typeof req.body?.onConflict === "string" && /^[a-zA-Z0-9_, ]+$/.test(req.body.onConflict)) {
          writeParams.set("on_conflict", req.body.onConflict);
        }
        const writeUrl = writeParams.toString() ? `${baseUrl}?${writeParams.toString()}` : baseUrl;
        const createRes = await fetch(writeUrl, { method: "POST", headers: writeHeaders, body: JSON.stringify(safeRow) });
        if (!createRes.ok) throw new Error(`Supabase ${table} create failed: ${await createRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await createRes.json(), ...(issuedCode ? { issuedCode } : {}) });
      }

      if (operation === "update") {
        if (!id || !row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "id and row required" });
        if (table === "ticket_messages") return addCorsHeaders(res).status(405).json({ error: "Ticket messages cannot be edited" });
        let safeRow: Record<string, unknown> = { ...(row as Record<string, unknown>) };
        const aliases: Record<string, string> = {
          image: "image_url", imageUrl: "image_url", titleAr: "title_ar", descriptionAr: "description_ar",
          dateRange: "date_range", htmlContent: "html_content", readingTime: "reading_time",
          previewOnHome: "preview_on_home", seoTitle: "seo_title", seoDescription: "seo_description",
          seoKeywords: "seo_keywords", canonicalUrl: "canonical_url", sourceUrl: "source_url",
          youtubeUrl: "youtube_url", youtubeId: "youtube_id", order: "order_index",
          promotionText: "promotion_text", sellerNameSlug: "seller_name_slug",
        };
        for (const [from, to] of Object.entries(aliases)) {
          if (safeRow[to] === undefined && safeRow[from] !== undefined) safeRow[to] = safeRow[from];
          if (from !== to) delete safeRow[from];
        }
        if (table === "admin_users") {
          delete safeRow.password_hash;
          if (typeof safeRow.password === "string") {
            const password = safeRow.password;
            delete safeRow.password;
            if (password.length < 8) return addCorsHeaders(res).status(400).json({ error: "Password must be at least 8 characters" });
            const bcrypt = await import("bcryptjs");
            safeRow.password_hash = await bcrypt.hash(password, 12);
          }
        }
        if (table === "tickets") {
          const allowed = ["title", "description", "category", "priority", "status"];
          safeRow = Object.fromEntries(Object.entries(safeRow).filter(([key]) => allowed.includes(key)));
          if (typeof safeRow.title === "string") safeRow.title = safeRow.title.trim().slice(0, 160);
          if (typeof safeRow.description === "string") safeRow.description = safeRow.description.trim().slice(0, 10000);
          if (safeRow.status !== undefined && !["open", "in-progress", "in_progress", "resolved", "closed"].includes(String(safeRow.status))) return addCorsHeaders(res).status(400).json({ error: "Invalid ticket status" });
          if (safeRow.priority !== undefined && !["low", "normal", "medium", "high", "urgent"].includes(String(safeRow.priority))) return addCorsHeaders(res).status(400).json({ error: "Invalid ticket priority" });
          safeRow.updated_at = new Date().toISOString();
        }
        if (table === "seller_reviews") {
          const allowed = ["approved", "status", "comment", "helpful_votes"];
          safeRow = Object.fromEntries(Object.entries(safeRow).filter(([key]) => allowed.includes(key)));
          if (safeRow.approved !== undefined && typeof safeRow.approved !== "boolean") return addCorsHeaders(res).status(400).json({ error: "Invalid review approval value" });
          if (safeRow.status !== undefined && !["pending", "approved", "published", "rejected", "hidden"].includes(String(safeRow.status))) return addCorsHeaders(res).status(400).json({ error: "Invalid review status" });
          if (safeRow.comment !== undefined) {
            if (typeof safeRow.comment !== "string") return addCorsHeaders(res).status(400).json({ error: "Invalid review comment" });
            safeRow.comment = safeRow.comment.trim().slice(0, 5000);
          }
          if (safeRow.helpful_votes !== undefined && (!Number.isInteger(Number(safeRow.helpful_votes)) || Number(safeRow.helpful_votes) < 0)) return addCorsHeaders(res).status(400).json({ error: "Invalid helpful vote count" });
        }
        if (table === "site_settings") {
          const allowed = ["seo_title", "seo_description", "seo_keywords", "seo_og_image_url", "hero_image", "robots", "announcements_enabled", "review_verification_enabled", "review_verification_video_url", "review_verification_prompt", "review_verification_passphrase", "review_verification_timecode", "review_verification_you_tube_channel_url", "featured_weapons", "featured_event_id", "secondary_event_ids", "public_base_url", "portal_img_weapons", "portal_img_maps", "portal_img_mercenaries", "portal_img_modes", "portal_img_ranks", "portal_img_events"];
          safeRow = Object.fromEntries(Object.entries(safeRow).filter(([key]) => allowed.includes(key)));
          if (safeRow.seo_title !== undefined && typeof safeRow.seo_title !== "string") return addCorsHeaders(res).status(400).json({ error: "Invalid SEO title" });
          if (safeRow.seo_description !== undefined && typeof safeRow.seo_description !== "string") return addCorsHeaders(res).status(400).json({ error: "Invalid SEO description" });
          if (safeRow.review_verification_passphrase !== undefined && typeof safeRow.review_verification_passphrase !== "string") return addCorsHeaders(res).status(400).json({ error: "Invalid review verification value" });
          safeRow.updated_at = new Date().toISOString();
        }
        if (table === "comments") {
          const allowed = ["content", "is_hidden", "moderation_status"];
          safeRow = Object.fromEntries(Object.entries(safeRow).filter(([key]) => allowed.includes(key)));
          if (safeRow.content !== undefined) {
            if (typeof safeRow.content !== "string" || safeRow.content.trim().length < 2) return addCorsHeaders(res).status(400).json({ error: "Invalid comment content" });
            safeRow.content = safeRow.content.trim().slice(0, 5000);
          }
          if (safeRow.is_hidden !== undefined && typeof safeRow.is_hidden !== "boolean") return addCorsHeaders(res).status(400).json({ error: "Invalid comment visibility" });
          if (safeRow.moderation_status !== undefined && !["pending", "approved", "rejected", "hidden"].includes(String(safeRow.moderation_status))) return addCorsHeaders(res).status(400).json({ error: "Invalid comment moderation status" });
        }
        const updateRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(String(id))}`, { method: "PATCH", headers, body: JSON.stringify(safeRow) });
        if (!updateRes.ok) throw new Error(`Supabase ${table} update failed: ${await updateRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await updateRes.json() });
      }

      if (operation === "delete") {
        if (!id) return addCorsHeaders(res).status(400).json({ error: "id required" });
        const deleteRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(String(id))}`, { method: "DELETE", headers });
        if (!deleteRes.ok) throw new Error(`Supabase ${table} delete failed: ${await deleteRes.text()}`);
        return addCorsHeaders(res).status(200).json({ success: true });
      }

      return addCorsHeaders(res).status(400).json({ error: "Unknown admin-table operation" });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e?.message || `Supabase ${table} operation failed` });
    }
  }

  // ── action: legacy-content ─────────────────────────────────────────────────
  if (action === "legacy-content") {
    if (!canManageContent) return addCorsHeaders(res).status(403).json({ error: "Missing content management permission" });
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });
    if (!Array.isArray(rows) || rows.length === 0)
      return addCorsHeaders(res).status(400).json({ error: "rows required" });

    const tableByType: Record<string, string> = { posts: "posts", news: "news", events: "events" };
    const headers = {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "return=minimal",
    };
    const counts = { updated: 0, failed: 0 };
    const failures: Array<{ type: string; id: string; error: string }> = [];

    for (const item of rows) {
      const itemType = typeof item?.type === "string" ? item.type : "";
      const itemId = typeof item?.id === "string" ? item.id : "";
      const draft = item?.draft && typeof item.draft === "object" ? item.draft : null;
      const table = tableByType[itemType];
      if (!table || !itemId || !draft) {
        counts.failed += 1;
        failures.push({ type: itemType, id: itemId, error: "type, id, and draft are required" });
        continue;
      }

      const common = {
        title: typeof draft.title_en === "string" ? draft.title_en : undefined,
        title_ar: typeof draft.title_ar === "string" ? draft.title_ar : undefined,
        seo_title: typeof draft.seo_title_en === "string" ? draft.seo_title_en : undefined,
        seo_description: typeof draft.seo_description_en === "string" ? draft.seo_description_en : undefined,
        updated_at: new Date().toISOString(),
      };
      const updateBody = itemType === "events"
        ? {
            ...common,
            description: typeof draft.content_en === "string" ? draft.content_en : undefined,
            description_ar: typeof draft.content_ar === "string" ? draft.content_ar : undefined,
          }
        : itemType === "news"
          ? {
              ...common,
              content: typeof draft.content_en === "string" ? draft.content_en : undefined,
              content_ar: typeof draft.content_ar === "string" ? draft.content_ar : undefined,
              html_content: typeof draft.content_en === "string" ? draft.content_en : undefined,
            }
          : {
              ...common,
              summary: typeof draft.summary_en === "string" ? draft.summary_en : undefined,
              content: typeof draft.content_en === "string" ? draft.content_en : undefined,
              content_ar: typeof draft.content_ar === "string" ? draft.content_ar : undefined,
              focus_keyword: typeof draft.focus_keyword_en === "string" ? draft.focus_keyword_en : undefined,
              reading_time: Number.isInteger(draft.reading_time) ? draft.reading_time : undefined,
            };

      const cleanBody = Object.fromEntries(Object.entries(updateBody).filter(([, value]) => value !== undefined));
      try {
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(itemId)}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(cleanBody),
        });
        if (!updateResponse.ok) {
          throw new Error(await updateResponse.text());
        }
        counts.updated += 1;
      } catch (error: any) {
        counts.failed += 1;
        failures.push({ type: itemType, id: itemId, error: error?.message || "update failed" });
      }
    }

    return addCorsHeaders(res).status(counts.failed ? 207 : 200).json({ ...counts, failures });
  }

  // ── action: rescrape-item ─────────────────────────────────────────────────
  if (action === "rescrape-item") {
    const permissionByType: Record<string, string[]> = {
      posts: ["posts:manage", "content:manage"],
      news: ["news:manage", "content:manage"],
      events: ["events:manage", "content:manage"],
    };
    if (!type || !id || !url || !permissionByType[String(type)] || !hasAnyPermission(admin, permissionByType[String(type)])) {
      return addCorsHeaders(res).status(403).json({ error: "Missing permission for this content type" });
    }
    let approvedUrl: string;
    try { approvedUrl = await assertApprovedSourceUrl(url); }
    catch (error) { return addCorsHeaders(res).status(400).json({ error: error instanceof Error ? error.message : "Invalid source URL" }); }
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    try {
      const scraped = await scrapePage(approvedUrl);
      const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
      const seoTitle = (scraped.title || "").slice(0, 60);
      const seoDesc  = (scraped.summary || "").slice(0, 160);

      const table = type === "events" ? "events" : type === "news" ? "news" : "posts";
      let updateBody: any = {};
      if (type === "events") {
        updateBody = { description: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: approvedUrl };
      } else if (type === "news") {
        updateBody = { content: scraped.content, html_content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: approvedUrl };
      } else {
        updateBody = { content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: approvedUrl };
      }

      const headers = { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Prefer": "return=minimal" };
      const upRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH", headers, body: JSON.stringify(updateBody),
      });
      if (!upRes.ok) throw new Error(`Supabase update failed: ${await upRes.text()}`);

      return addCorsHeaders(res).status(200).json({
        success: true,
        scraped: { title: scraped.title, image: scraped.image, contentLength: plain.length },
      });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e.message || "Rescrape failed" });
    }
  }

  // Legacy destructive rebuilds are intentionally disabled. They deleted unrelated
  // public posts and used fixed content instead of verified source records.
  if (action === "rebuild-mercenary-posts" || action === "rebuild-wiki-posts") {
    return addCorsHeaders(res).status(410).json({ error: "Legacy destructive rebuild is disabled; use verified source drafts instead" });
  }

  // ── action: rebuild-mercenary-posts ───────────────────────────────────────
  if (action === "rebuild-mercenary-posts") {
    if (!isSuperAdmin && !hasAnyPermission(admin, ["content:rebuild", "posts:rebuild"])) {
      return addCorsHeaders(res).status(403).json({ error: "Only an authorized content manager can rebuild posts" });
    }
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      };

      if (req.body?.confirmation !== "REBUILD_MERCENARY_POSTS") {
        return addCorsHeaders(res).status(400).json({ error: "Explicit rebuild confirmation is required" });
      }
      const deletedCount = await deleteNonAnnouncementPosts(SUPABASE_URL, headers);

      const mercenaries = [
        { name: "Wolf",          wikiSlug: "Wolf_(CrossFire)" },
        { name: "Vipers",        wikiSlug: "Vipers" },
        { name: "Sisterhood",    wikiSlug: "Sisterhood" },
        { name: "Black Mamba",   wikiSlug: "Black_Mamba_(CrossFire)" },
        { name: "Desperado",     wikiSlug: "Desperado" },
        { name: "Ronin",         wikiSlug: "Ronin_(CrossFire)" },
        { name: "Dean",          wikiSlug: "Dean" },
        { name: "Saber",         wikiSlug: "Saber_(CrossFire)" },
        { name: "Brimstone",     wikiSlug: "Brimstone_(CrossFire)" },
        { name: "Arch Honorary", wikiSlug: "Arch_Honorary" },
      ];

      let created = 0, failed = 0;
      for (const merc of mercenaries) {
        try {
          const wikiUrl = `https://crossfire.fandom.com/wiki/${merc.wikiSlug}`;
          const scraped = await scrapePage(wikiUrl);
          const plain   = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
          const slug    = `${merc.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
          const row = {
            title: scraped.title || merc.name, post_slug: slug,
            content: scraped.content, summary: scraped.summary, image_url: scraped.image,
            category: "Mercenaries",
            tags: ["mercenary", "crossfire", merc.name.toLowerCase()],
            author: "CrossFire Wiki", featured: false, source_url: wikiUrl,
            seo_title: (scraped.title || merc.name).slice(0, 60),
            seo_description: plain.slice(0, 160),
            seo_keywords: ["mercenary", "crossfire", merc.name.toLowerCase()],
          };
          const insRes = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: "POST",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify(row),
          });
          if (insRes.ok) created++; else failed++;
        } catch { failed++; }
      }
      return addCorsHeaders(res).status(200).json({ deletedCount, created, failed });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e.message });
    }
  }

  // ── action: rebuild-wiki-posts ────────────────────────────────────────────
  if (action === "rebuild-wiki-posts") {
    if (!isSuperAdmin && !hasAnyPermission(admin, ["content:rebuild", "posts:rebuild"])) {
      return addCorsHeaders(res).status(403).json({ error: "Only an authorized content manager can rebuild posts" });
    }
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      };

      if (req.body?.confirmation !== "REBUILD_WIKI_POSTS") {
        return addCorsHeaders(res).status(400).json({ error: "Explicit rebuild confirmation is required" });
      }
      const deletedCount = await deleteNonAnnouncementPosts(SUPABASE_URL, headers);

      const wikiPages = [
        { name: "Ghost Mode",     wikiSlug: "Ghost_Mode",          category: "Modes" },
        { name: "Mutation Mode",  wikiSlug: "Mutation_Mode",        category: "Modes" },
        { name: "Zombie Mode",    wikiSlug: "Zombie_Mode",          category: "Modes" },
        { name: "Black Widow Map",wikiSlug: "Black_Widow_(map)",    category: "Maps"  },
        { name: "Port Map",       wikiSlug: "Port_(CrossFire)",      category: "Maps"  },
        { name: "Eagle Eye Map",  wikiSlug: "Eagle_Eye",            category: "Maps"  },
      ];

      let created = 0, failed = 0;
      for (const page of wikiPages) {
        try {
          const wikiUrl = `https://crossfire.fandom.com/wiki/${page.wikiSlug}`;
          const scraped = await scrapePage(wikiUrl);
          const plain   = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
          const slug    = `${page.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
          const row = {
            title: scraped.title || page.name, post_slug: slug,
            content: scraped.content, summary: scraped.summary, image_url: scraped.image,
            category: page.category,
            tags: ["crossfire", page.category.toLowerCase(), page.name.toLowerCase()],
            author: "CrossFire Wiki", featured: false, source_url: wikiUrl,
            seo_title: (scraped.title || page.name).slice(0, 60),
            seo_description: plain.slice(0, 160),
            seo_keywords: ["crossfire", page.category.toLowerCase(), page.name.toLowerCase()],
          };
          const insRes = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: "POST",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify(row),
          });
          if (insRes.ok) created++; else failed++;
        } catch { failed++; }
      }
      return addCorsHeaders(res).status(200).json({ deletedCount, created, failed });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e.message });
    }
  }

  return addCorsHeaders(res).status(400).json({ error: "Unknown action. Use: service-listings, rescrape-item, rebuild-mercenary-posts, rebuild-wiki-posts" });
}
