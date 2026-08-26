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
    };
    const resource = String(type || "");
    const table = tableByResource[resource];
    if (!table) return addCorsHeaders(res).status(400).json({ error: "Unsupported admin table" });

    const canManage = admin.role === "super_admin" || admin.permissions?.[`${resource}:manage`] === true || admin.permissions?.[`${resource}:write`] === true;
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
        params.set(
          "select",
          table === "admin_users"
            ? "id,username,email,role,permissions,created_at"
              : table === "competition_invite_codes"
                ? "id,label,max_uses,uses_count,expires_at,active,created_at,created_by"
                : table === "competition_attempts"
                  ? "id,user_id,invite_code_id,phone,consent_contact,objective_score,essay_score,proof_bonus,final_score,status,answers,submitted_at,reviewed_at,created_at"
                  : table === "competition_proofs"
                    ? "id,attempt_id,proof_type,file_url,file_name,file_size,mime_type,status,bonus_points,reviewer_note,created_at,reviewed_at"
                    : "*",
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
        };
        params.set("order", orderByTable[table] || "name.asc");
        params.set("limit", String(pageSize));
        params.set("offset", String((page - 1) * pageSize));
        if (search && (table === "weapons" || table === "sellers" || table === "highlights")) {
          const field = table === "highlights" ? "title" : "name";
          params.set(field, `ilike.*${search.replace(/[*,]/g, " ")}*`);
        }
        const listRes = await fetch(`${baseUrl}?${params.toString()}`, { headers });
        if (!listRes.ok) throw new Error(`Supabase ${table} read failed: ${await listRes.text()}`);
        const contentRange = listRes.headers.get("content-range") || "";
        const totalText = contentRange.includes("/") ? contentRange.split("/").pop() : "";
        const data = await listRes.json();
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

      if (operation === "create") {
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
        if (table === "competition_invite_codes") {
          const code = typeof safeRow.code === "string" ? safeRow.code.trim() : "";
          if (code.length < 4) return addCorsHeaders(res).status(400).json({ error: "Invitation code must be at least 4 characters" });
          issuedCode = code;
          delete safeRow.code;
          delete safeRow.code_hash;
          safeRow.code_hash = (await import("node:crypto")).createHash("sha256").update(code).digest("hex");
          safeRow.uses_count = 0;
        }
        const createRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(safeRow) });
        if (!createRes.ok) throw new Error(`Supabase ${table} create failed: ${await createRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await createRes.json(), ...(issuedCode ? { issuedCode } : {}) });
      }

      if (operation === "update") {
        if (!id || !row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "id and row required" });
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
