import type { VercelRequest, VercelResponse } from "@vercel/node";

import { verifyAdminRequest } from "../../server/adminAuth.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (req.method !== "POST") return addCorsHeaders(res).status(405).json({ error: "POST only" });
  if (!verifyAdminRequest(req.headers as Record<string, unknown>)) {
    return addCorsHeaders(res).status(401).json({ error: "Unauthorized" });
  }

  const { action, type, id, url, operation, row, rows } = req.body || {};

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || "";

  // ── action: service-listings ───────────────────────────────────────────────
  if (action === "service-listings") {
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

  // ── action: admin-table ─────────────────────────────────────────────────────
  // Browser admin pages use this authenticated multiplexer for tables whose
  // writes must never depend on the public Supabase client/RLS policies.
  if (action === "admin-table") {
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    const tableByResource: Record<string, string> = { weapons: "weapons", sellers: "sellers" };
    const table = tableByResource[String(type || "")];
    if (!table) return addCorsHeaders(res).status(400).json({ error: "Unsupported admin table" });

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
        params.set("select", "*");
        params.set("order", table === "sellers" ? "rank.asc.nullslast,name.asc" : "name.asc");
        params.set("limit", String(pageSize));
        params.set("offset", String((page - 1) * pageSize));
        if (search) params.set("name", `ilike.*${search.replace(/[*,]/g, " ")}*`);
        const listRes = await fetch(`${baseUrl}?${params.toString()}`, { headers });
        if (!listRes.ok) throw new Error(`Supabase ${table} read failed: ${await listRes.text()}`);
        const contentRange = listRes.headers.get("content-range") || "";
        const totalText = contentRange.includes("/") ? contentRange.split("/").pop() : "";
        const data = await listRes.json();
        return addCorsHeaders(res).status(200).json({ data, count: totalText && totalText !== "*" ? Number(totalText) : data.length });
      }

      if (operation === "create") {
        if (!row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "row required" });
        const createRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(row) });
        if (!createRes.ok) throw new Error(`Supabase ${table} create failed: ${await createRes.text()}`);
        return addCorsHeaders(res).status(200).json({ data: await createRes.json() });
      }

      if (operation === "update") {
        if (!id || !row || typeof row !== "object") return addCorsHeaders(res).status(400).json({ error: "id and row required" });
        const updateRes = await fetch(`${baseUrl}?id=eq.${encodeURIComponent(String(id))}`, { method: "PATCH", headers, body: JSON.stringify(row) });
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
    if (!type || !id || !url || !String(url).startsWith("http"))
      return addCorsHeaders(res).status(400).json({ error: "type, id, and valid url required" });
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    try {
      const scraped = await scrapePage(url);
      const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
      const seoTitle = (scraped.title || "").slice(0, 60);
      const seoDesc  = (scraped.summary || "").slice(0, 160);

      const table = type === "events" ? "events" : type === "news" ? "news" : "posts";
      let updateBody: any = {};
      if (type === "events") {
        updateBody = { description: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
      } else if (type === "news") {
        updateBody = { content: scraped.content, html_content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
      } else {
        updateBody = { content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
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
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      };

      await fetch(`${SUPABASE_URL}/rest/v1/posts?category=neq.__ANNOUNCEMENT__`, { method: "DELETE", headers });

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
      return addCorsHeaders(res).status(200).json({ deletedCount: 0, created, failed });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e.message });
    }
  }

  // ── action: rebuild-wiki-posts ────────────────────────────────────────────
  if (action === "rebuild-wiki-posts") {
    if (!SUPABASE_URL || !SERVICE_KEY)
      return addCorsHeaders(res).status(500).json({ error: "Supabase not configured" });

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
      };

      await fetch(`${SUPABASE_URL}/rest/v1/posts?category=neq.__ANNOUNCEMENT__`, { method: "DELETE", headers });

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
      return addCorsHeaders(res).status(200).json({ deletedCount: 0, created, failed });
    } catch (e: any) {
      return addCorsHeaders(res).status(500).json({ error: e.message });
    }
  }

  return addCorsHeaders(res).status(400).json({ error: "Unknown action. Use: service-listings, rescrape-item, rebuild-mercenary-posts, rebuild-wiki-posts" });
}
