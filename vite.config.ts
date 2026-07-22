import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { Plugin } from "vite";
import { createRequire } from "module";
// Pre-import undici at module level to avoid async gap inside SSE handler
const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const undFetch: any = _require("undici").fetch;

// Register endpoint — creates user with email already confirmed (no confirmation step)
function cfRegisterPlugin(): Plugin {
  return {
    name: "cf-register",
    configureServer(server) {
      server.middlewares.use("/api/auth/register", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Method not allowed" }));
        }
        try {
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve) => {
            req.on("data", (c: Buffer) => chunks.push(c));
            req.on("end", resolve);
          });
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const { email, password, username, phone, avatar } = body;

          if (!email || !password || !username) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Email, password and username are required" }));
          }

          const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

          if (!SUPABASE_URL || !SERVICE_KEY) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Server misconfigured" }));
          }

          const { fetch: undiciFetch } = await import("undici");

          // Create user via Supabase Admin API with email already confirmed
          const createRes = await undiciFetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SERVICE_KEY,
              "Authorization": `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              user_metadata: { username, phone: phone || "", avatar: avatar || "" },
            }),
          } as any);

          const createData = await createRes.json() as any;

          if (!createRes.ok) {
            const msg = createData?.msg || createData?.message || createData?.error_description || "Registration failed";
            res.writeHead(createRes.status === 422 ? 409 : 400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: msg }));
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, user: { id: createData.id, email: createData.email } }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Registration failed" }));
        }
      });
    },
  };
}

// ── AI Assistant endpoint — proxies OpenRouter from server side ───────────────
// Cache for website knowledge (fetched from Supabase, refreshed every 30 min)
let _aiContextCache: { text: string; ts: number } | null = null;
const AI_CONTEXT_TTL = 30 * 60 * 1000;

let _aiContextRefreshing = false;

async function _refreshContextInBackground() {
  if (_aiContextRefreshing) return;
  _aiContextRefreshing = true;
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!SUPABASE_URL || !ANON_KEY) { _aiContextRefreshing = false; return; }
  try {
    const { fetch: undFetch } = await import("undici") as any;
    const h = { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` };
    const [wRes, rRes, mRes, merRes, evRes] = await Promise.allSettled([
      (undFetch as any)(`${SUPABASE_URL}/rest/v1/weapons?select=name,category&limit=150&order=name`, { headers: h, signal: AbortSignal.timeout(8000) }),
      (undFetch as any)(`${SUPABASE_URL}/rest/v1/ranks?select=name,tier,bonus&order=tier`, { headers: h, signal: AbortSignal.timeout(8000) }),
      (undFetch as any)(`${SUPABASE_URL}/rest/v1/modes?select=name,type&order=name`, { headers: h, signal: AbortSignal.timeout(8000) }),
      (undFetch as any)(`${SUPABASE_URL}/rest/v1/mercenaries?select=name,role&order=order_index`, { headers: h, signal: AbortSignal.timeout(8000) }),
      (undFetch as any)(`${SUPABASE_URL}/rest/v1/events?select=title,date&limit=10&order=created_at.desc`, { headers: h, signal: AbortSignal.timeout(8000) }),
    ]);
    let ctx = "";
    if (wRes.status === "fulfilled") {
      const weapons = await (wRes.value as any).json().catch(() => []) as any[];
      if (weapons?.length) {
        const byCat: Record<string, string[]> = {};
        weapons.forEach((w: any) => { const c = w.category || "Other"; if (!byCat[c]) byCat[c] = []; byCat[c].push(w.name); });
        ctx += `\nWEAPONS:\n`;
        Object.entries(byCat).forEach(([c, ns]) => { ctx += `  ${c}: ${ns.slice(0, 20).join(", ")}\n`; });
      }
    }
    if (rRes.status === "fulfilled") {
      const ranks = await (rRes.value as any).json().catch(() => []) as any[];
      if (ranks?.length) {
        ctx += `\nRANKS (${ranks.length}):\n`;
        ranks.forEach((r: any) => { ctx += `  T${r.tier}: ${r.name}${r.bonus ? ` [${r.bonus}]` : ""}\n`; });
      }
    }
    if (mRes.status === "fulfilled") {
      const modes = await (mRes.value as any).json().catch(() => []) as any[];
      if (modes?.length) ctx += `\nMODES: ${modes.map((m: any) => m.name).join(", ")}\n`;
    }
    if (merRes.status === "fulfilled") {
      const mercs = await (merRes.value as any).json().catch(() => []) as any[];
      if (mercs?.length) ctx += `\nMERCS: ${mercs.map((m: any) => `${m.name}${m.role ? `(${m.role})` : ""}`).join(", ")}\n`;
    }
    if (evRes.status === "fulfilled") {
      const events = await (evRes.value as any).json().catch(() => []) as any[];
      if (events?.length) ctx += `\nEVENTS: ${events.slice(0, 5).map((e: any) => e.title).join(", ")}\n`;
    }
    _aiContextCache = { text: ctx, ts: Date.now() };
  } catch { /* silently skip */ }
  finally { _aiContextRefreshing = false; }
}

// Pre-warm on startup (non-blocking)
setTimeout(_refreshContextInBackground, 3000);

async function fetchWebsiteContext(): Promise<string> {
  if (_aiContextCache && Date.now() - _aiContextCache.ts < AI_CONTEXT_TTL) {
    return _aiContextCache.text; // return cached immediately
  }
  // Trigger background refresh; return stale or empty so we don't block the request
  _refreshContextInBackground();
  return _aiContextCache?.text ?? "";
}

function cfAiPlugin(): Plugin {
  return {
    name: "cf-ai",
    configureServer(server) {
      async function readBody(req: any): Promise<any> {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", resolve);
          req.on("error", reject);
        });
        try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { return {}; }
      }

      function json(res: any, status: number, data: any) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }

      // SSE streaming fix: connect does NOT await async middleware — any `await`
      // after the middleware function returns causes the connect finalhandler to close
      // the response. The solution: use a SYNCHRONOUS middleware that immediately writes
      // SSE headers (setting headersSent=true, so connect stops), then fires the async
      // streaming work as a detached promise (background task).
      server.middlewares.use("/api/ai/chat", (req: any, res: any) => {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "POST only" }));
          return;
        }

        // Claim the response synchronously before connect can touch it
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no",
        });
        const sock = res.socket || res.connection;
        if (sock?.setNoDelay) sock.setNoDelay(true);
        if (sock?.setTimeout) sock.setTimeout(0);
        res.write(": ok\n\n"); // initial SSE keepalive

        // All async work runs in the background; response is already "owned"
        (async () => {
          try {
            const body = await readBody(req);
            const { messages } = body;
            if (!Array.isArray(messages) || messages.length === 0) {
              res.write(`data: ${JSON.stringify({ error: "messages array required" })}\n\n`);
              return res.end();
            }
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
              res.write(`data: ${JSON.stringify({ error: "AI not configured" })}\n\n`);
              return res.end();
            }

            const websiteData = await fetchWebsiteContext();
            console.log("[AI-IIFE] context fetched, calling OpenRouter, res.writableEnded:", res.writableEnded);

            const systemPrompt = {
              role: "system",
              content: `You are CrossFire Wiki Assistant — the official AI for CrossFire Wiki, a comprehensive CrossFire game information website.
You are an expert on the CrossFire online FPS game. Help players with:
- Weapons, stats, categories, and loadout recommendations
- All mercenary characters and their abilities
- All ranks from lowest to highest and how to progress
- Game modes, maps, and strategies
- ZP/GP currencies, Black Market, and in-game items
- Clans, tournaments, and events
- Account issues and technical support
- Community forum questions

Format responses using Markdown when helpful: **bold** for key terms, bullet lists for multiple items, tables for comparisons (use | col | col | headers), and code blocks for item names. Be friendly, direct, and helpful. Keep answers concise. When you don't know something specific, say so honestly.
IMPORTANT: Respond in the SAME LANGUAGE the user writes in. Arabic users get Arabic replies (Egyptian/Levantine dialect). English users get English replies.
${websiteData ? `\n=== LIVE DATA FROM THE CROSSFIRE WIKI ===\nThis is the actual current data from our website database:\n${websiteData}\n=== END LIVE DATA ===\n\nUse the live data above to give accurate answers about specific weapons, ranks, mercenaries, modes, and events.` : ""}`
            };

            const upstream = await (undFetch as any)("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://crossfirewiki.com",
                "X-Title": "CrossFire Wiki"
              },
              body: JSON.stringify({
                model: "openai/gpt-oss-20b:free",
                messages: [systemPrompt, ...messages.slice(-6)],
                // 2048 gives the model enough room to finish reasoning (~300-600 tokens)
                // and still produce a full response. 480 was too small once this model
                // became reasoning-first and reasoning tokens count against max_tokens.
                max_tokens: 2048,
                temperature: 0.5,
                stream: true,
              }),
              signal: AbortSignal.timeout(35000),
            });

            if (!upstream.ok) {
              const errText = await upstream.text().catch(() => "");
              res.write(`data: ${JSON.stringify({ error: "AI upstream error" })}\n\n`);
              return res.end();
            }

            let buffer = "";

            function processSSELine(line: string) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) return;
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr === "[DONE]") { res.write("data: [DONE]\n\n"); return; }
              try {
                const parsed = JSON.parse(jsonStr) as any;
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
              } catch { /* skip malformed */ }
            }

            for await (const rawChunk of upstream.body as any) {
              const chunk = Buffer.isBuffer(rawChunk) ? rawChunk.toString("utf-8")
                : (rawChunk instanceof Uint8Array) ? Buffer.from(rawChunk).toString("utf-8")
                : String(rawChunk);
              buffer += chunk;
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";
              for (const line of lines) processSSELine(line);
            }
            if (buffer.trim()) processSSELine(buffer);
            res.end();
          } catch (err: any) {
            console.error("[AI] error:", err?.message, err?.stack?.slice(0, 200));
            try {
              res.write(`data: ${JSON.stringify({ error: err.message || "AI request failed" })}\n\n`);
              res.end();
            } catch { /* already ended */ }
          }
        })();
        // Intentionally NOT returning the promise — keeps middleware synchronous
        // so connect sees headersSent=true and leaves this response alone.
      });
    },
  };
}

// ── Server-side admin auth — password never compared in browser ───────────────
function cfAdminAuthPlugin(): Plugin {
  return {
    name: "cf-admin-auth",
    configureServer(server) {
      async function readBody(req: any): Promise<any> {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", resolve);
          req.on("error", reject);
        });
        try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { return {}; }
      }
      function sendJson(res: any, status: number, data: any) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }
      function makeToken(payload: object): string {
        return Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86_400_000 * 7 })).toString("base64");
      }

      server.middlewares.use("/api/admin/login", async (req: any, res: any) => {
        if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
        try {
          const { username, password } = await readBody(req);
          if (!password) return sendJson(res, 400, { error: "Password required" });

          const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || "";
          const SUPABASE_URL   = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
          const SERVICE_KEY    = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";

          // ── Super-admin: password-only ──────────────────────────────────
          if (!username) {
            if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
              const token = makeToken({ role: "super_admin", username: "super_admin", permissions: {} });
              return sendJson(res, 200, {
                token,
                admin: { roles: ["super_admin"], role: "super_admin", username: "super_admin", permissions: {} },
              });
            }
            // Check admin_users table for super_admin rows (bcrypt)
            if (SUPABASE_URL && SERVICE_KEY) {
              const { fetch: uf } = await import("undici") as any;
              const r = await (uf as any)(
                `${SUPABASE_URL}/rest/v1/admin_users?role=eq.super_admin&limit=10`,
                { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, signal: AbortSignal.timeout(8000) }
              );
              if (r.ok) {
                const rows: any[] = await r.json();
                const bcrypt = await import("bcryptjs");
                for (const row of rows) {
                  if (await bcrypt.compare(password, row.password_hash || "")) {
                    const token = makeToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
                    return sendJson(res, 200, {
                      token,
                      admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} },
                    });
                  }
                }
              }
            }
            return sendJson(res, 401, { error: "Invalid password" });
          }

          // ── Regular admin: username + bcrypt password ────────────────────
          if (!SUPABASE_URL || !SERVICE_KEY) return sendJson(res, 500, { error: "Server misconfigured" });
          const { fetch: uf } = await import("undici") as any;
          const r = await (uf as any)(
            `${SUPABASE_URL}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}&limit=1`,
            { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }, signal: AbortSignal.timeout(8000) }
          );
          if (!r.ok) return sendJson(res, 401, { error: "Invalid credentials" });
          const rows: any[] = await r.json();
          if (!rows.length) return sendJson(res, 401, { error: "Invalid credentials" });
          const row = rows[0];
          const bcrypt = await import("bcryptjs");
          if (!await bcrypt.compare(password, row.password_hash || "")) return sendJson(res, 401, { error: "Invalid credentials" });

          const token = makeToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
          return sendJson(res, 200, {
            token,
            admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} },
          });
        } catch (err: any) {
          return sendJson(res, 500, { error: err.message || "Login failed" });
        }
      });
    },
  };
}

// ── Server-side scraping middleware — runs in Node.js, no CORS issues ─────────
function cfScrapePlugin(): Plugin {
  return {
    name: "cf-scrape",
    configureServer(server) {
      // Helper: read JSON body from request
      async function readBody(req: any): Promise<any> {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", resolve);
          req.on("error", reject);
        });
        try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { return {}; }
      }

      // Helper: fetch a URL server-side (no CORS), parse with cheerio
      async function scrapePage(url: string): Promise<{ title: string; content: string; summary: string; image: string }> {
        const { fetch: undFetch } = await import("undici");
        const res = await (undFetch as any)(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WikiBot/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
        const html = await res.text();
        const cheerio = await import("cheerio");
        const $ = cheerio.load(html);

        // Extract title
        const title =
          $("h1.page-header__title").first().text().trim() ||
          $("h1").first().text().trim() ||
          $("title").text().replace(/\s*[|\-–].*$/, "").trim() ||
          $('meta[property="og:title"]').attr("content") || "";

        // Extract main image
        const image =
          $('meta[property="og:image"]').attr("content") ||
          $(".mw-content-text img").first().attr("src") ||
          $("article img").first().attr("src") || "";

        // Remove noise
        $("nav,script,style,header,footer,.navbox,.toc,.mw-indicators,.mw-editsection,#mw-navigation,#mw-head,#mw-panel,.sidebar,aside,.advertisement").remove();

        // Main content
        const contentEl = $(".mw-parser-output, article, main, #content, .content").first();
        const content = contentEl.length ? contentEl.html() || "" : $("body").html() || "";
        const plain = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const summary = plain.slice(0, 300);

        return { title, content, summary, image };
      }

      // Helper: send JSON
      function json(res: any, status: number, data: any) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }

      // POST /api/scrape/forum-list — fetches CrossFire announcements via RSS feed
      // RSS gives all 21 items with full HTML content (including banner images) in one request
      server.middlewares.use("/api/scrape/forum-list", async (req: any, res: any) => {
        if (req.method !== "POST") return json(res, 405, { error: "POST only" });
        try {
          const { fetch: undFetch } = await import("undici");
          const RSS_URL = "https://forum.z8games.com/categories/crossfire-announcements/feed.rss";
          const r = await (undFetch as any)(RSS_URL, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "application/rss+xml, application/xml, text/xml, */*",
            },
            signal: AbortSignal.timeout(20000),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status} fetching RSS feed`);
          const xml = await r.text();

          // Parse RSS items — extract: title, link, pubDate, creator, description HTML
          // getTag uses simple string splitting to avoid regex escaping issues with CDATA brackets
          const getTag = (block: string, tag: string): string => {
            const open = `<${tag}`;
            const close = `</${tag}>`;
            const start = block.indexOf(open);
            if (start === -1) return "";
            const gtIdx = block.indexOf(">", start);
            if (gtIdx === -1) return "";
            const end = block.indexOf(close, gtIdx);
            if (end === -1) return "";
            let val = block.slice(gtIdx + 1, end).trim();
            // Strip CDATA wrapper
            if (val.startsWith("<![CDATA[")) val = val.slice(9);
            if (val.endsWith("]]>")) val = val.slice(0, -3);
            return val.trim();
          };

          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          const posts: any[] = [];
          let m: RegExpExecArray | null;
          while ((m = itemRegex.exec(xml)) !== null) {
            const block = m[1];
            const title   = getTag(block, "title");
            const link    = getTag(block, "link");
            const pubDate = getTag(block, "pubDate");
            const creator = getTag(block, "dc:creator");
            const desc    = getTag(block, "description");

            // Extract first image src from the description HTML
            const imgMatch = desc.match(/src="([^"]+)"/);
            const image = imgMatch ? imgMatch[1] : "";

            // Parse date to ISO
            let dateISO = "";
            try { dateISO = new Date(pubDate).toISOString(); } catch { dateISO = ""; }

            if (title && link) {
              posts.push({ title, url: link, date: pubDate || "", dateISO, image, author: creator });
            }
          }
          json(res, 200, { posts });
        } catch (e: any) {
          json(res, 500, { error: e.message || "Forum RSS fetch failed" });
        }
      });

      // POST /api/scrape/forum-thread — fetches a single CrossFire forum discussion thread.
      // Each CF announcement = one event: uses og:title + og:image + first .Message HTML.
      server.middlewares.use("/api/scrape/forum-thread", async (req: any, res: any) => {
        if (req.method !== "POST") return json(res, 405, { error: "POST only" });
        try {
          const { url } = await readBody(req);
          if (!url || !String(url).startsWith("http")) return json(res, 400, { error: "Valid URL required" });

          const { fetch: undFetch } = await import("undici");
          const r = await (undFetch as any)(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
              "Accept": "text/html,*/*",
              "Accept-Language": "en-US,en;q=0.9",
            },
            signal: AbortSignal.timeout(25000),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const html = await r.text();
          const cheerio = await import("cheerio");
          const $ = cheerio.load(html);

          // ── Reliable meta fields ─────────────────────────────────────────────
          const threadTitle =
            $('meta[property="og:title"]').attr("content") ||
            $("h1").first().text().trim() ||
            $("title").text().replace(/\s*[|–\-].*$/, "").trim() || "Untitled Event";

          const threadImage =
            $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") || "";

          // posted date — <time> in the first post row
          const threadDate =
            $(".ItemDiscussion time, #Item_0 time, .DateCreated time").first().attr("datetime") ||
            $("time").first().attr("datetime") || "";

          // ── First post body (the OP) ─────────────────────────────────────────
          // Vanilla Forum: first .Message div = OP body; subsequent = replies
          const allMessages = $(".Message");
          const opBody = allMessages.first();
          const descriptionHtml = opBody.html() || "";
          const descriptionText = opBody.text().replace(/\s+/g, " ").trim().slice(0, 500);

          // ── Parse start / end date from title  ──────────────────────────────
          // e.g. "Football Frenzy: June 11 - July 19"  →  start=June 11, end=July 19
          const dateRe = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?/gi;
          const dateParts = threadTitle.match(dateRe) || [];
          const startDateStr = dateParts[0] || (threadDate ? threadDate.slice(0, 10) : "");
          const endDateStr   = dateParts[1] || dateParts[0] || "";

          // Convert "June 11" → ISO date (use current year)
          const toISO = (s: string) => {
            if (!s) return "";
            try {
              const d = new Date(`${s} ${new Date().getFullYear()}`);
              return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
            } catch { return ""; }
          };

          const event = {
            title: threadTitle,
            image: threadImage,
            date: startDateStr,
            startDate: toISO(startDateStr),
            endDate: toISO(endDateStr),
            description: descriptionHtml,
            descriptionText,
            sourceUrl: url,
            selected: true,
          };

          json(res, 200, {
            threadTitle,
            threadDate,
            threadImage,
            threadUrl: url,
            events: [event],
          });
        } catch (e: any) {
          json(res, 500, { error: e.message || "Thread scrape failed" });
        }
      });

      // POST /api/scrape/single-url
      server.middlewares.use("/api/scrape/single-url", async (req: any, res: any) => {
        if (req.method !== "POST") return json(res, 405, { error: "POST only" });
        try {
          const { url } = await readBody(req);
          if (!url || !String(url).startsWith("http")) return json(res, 400, { error: "Valid URL required" });
          const scraped = await scrapePage(url);
          const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
          json(res, 200, {
            title: scraped.title,
            content: scraped.content,
            excerpt: scraped.summary,
            seoDescription: scraped.summary,
            seoTitle: scraped.title,
            keywords: [],
            mainImage: scraped.image,
            image: scraped.image,
            sourceUrl: url,
            url,
            isWiki: url.includes("fandom.com") || url.includes("wiki"),
            contentLength: plain.length,
            status: "success",
          });
        } catch (e: any) {
          json(res, 500, { error: e.message || "Scrape failed" });
        }
      });

      // POST /api/admin/rescrape-item
      server.middlewares.use("/api/admin/rescrape-item", async (req: any, res: any) => {
        if (req.method !== "POST") return json(res, 405, { error: "POST only" });
        try {
          const { type, id, url } = await readBody(req);
          if (!type || !id || !url || !String(url).startsWith("http")) return json(res, 400, { error: "type, id, and valid url required" });

          const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
          const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
          if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 500, { error: "Supabase not configured" });

          const scraped = await scrapePage(url);
          const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
          const seoTitle = (scraped.title || "").slice(0, 60);
          const seoDesc = (scraped.summary || "").slice(0, 160);

          const { fetch: undFetch } = await import("undici");
          let table = type === "events" ? "events" : type === "news" ? "news" : "posts";
          let updateBody: any = {};
          if (type === "events") {
            updateBody = { description: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
          } else if (type === "news") {
            updateBody = { content: scraped.content, html_content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
          } else {
            updateBody = { content: scraped.content, image_url: scraped.image, seo_title: seoTitle, seo_description: seoDesc, source_url: url };
          }

          const upRes = await (undFetch as any)(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}`, "Prefer": "return=minimal" },
            body: JSON.stringify(updateBody),
          });
          if (!upRes.ok) {
            const txt = await upRes.text();
            throw new Error(`Supabase update failed: ${txt}`);
          }
          json(res, 200, { success: true, scraped: { title: scraped.title, image: scraped.image, contentLength: plain.length } });
        } catch (e: any) {
          json(res, 500, { error: e.message || "Rescrape failed" });
        }
      });

      // POST /api/admin/rebuild-mercenary-posts
      server.middlewares.use("/api/admin/rebuild-mercenary-posts", async (req: any, res: any) => {
        if (req.method !== "POST") return json(res, 405, { error: "POST only" });
        try {
          const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
          const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
          if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 500, { error: "Supabase not configured" });
          const { fetch: undFetch } = await import("undici");
          const headers = { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` };

          // Delete all non-announcement posts
          await (undFetch as any)(`${SUPABASE_URL}/rest/v1/posts?category=neq.__ANNOUNCEMENT__`, { method: "DELETE", headers });
          const deletedCount = 0; // approximate

          const mercenaries = [
            { name: "Wolf", wikiSlug: "Wolf_(CrossFire)" }, { name: "Vipers", wikiSlug: "Vipers" },
            { name: "Sisterhood", wikiSlug: "Sisterhood" }, { name: "Black Mamba", wikiSlug: "Black_Mamba_(CrossFire)" },
            { name: "Desperado", wikiSlug: "Desperado" }, { name: "Ronin", wikiSlug: "Ronin_(CrossFire)" },
            { name: "Dean", wikiSlug: "Dean" }, { name: "Saber", wikiSlug: "Saber_(CrossFire)" },
            { name: "Brimstone", wikiSlug: "Brimstone_(CrossFire)" }, { name: "Arch Honorary", wikiSlug: "Arch_Honorary" },
          ];
          let created = 0, failed = 0;
          for (const merc of mercenaries) {
            try {
              const wikiUrl = `https://crossfire.fandom.com/wiki/${merc.wikiSlug}`;
              const scraped = await scrapePage(wikiUrl);
              const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
              const slug = `${merc.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
              const row = {
                title: scraped.title || merc.name, post_slug: slug,
                content: scraped.content, summary: scraped.summary,
                image_url: scraped.image, category: "Mercenaries",
                tags: ["mercenary", "crossfire", merc.name.toLowerCase()],
                author: "CrossFire Wiki", featured: false, source_url: wikiUrl,
                seo_title: (scraped.title || merc.name).slice(0, 60),
                seo_description: plain.slice(0, 160),
                seo_keywords: ["mercenary", "crossfire", merc.name.toLowerCase()],
              };
              const insRes = await (undFetch as any)(`${SUPABASE_URL}/rest/v1/posts`, {
                method: "POST", headers: { ...headers, "Prefer": "return=minimal" }, body: JSON.stringify(row),
              });
              if (insRes.ok) created++; else { const t = await insRes.text(); console.error(`Failed ${merc.name}:`, t); failed++; }
            } catch (e: any) { console.error(`Scrape failed ${merc.name}:`, e.message); failed++; }
          }
          json(res, 200, { deletedCount, created, failed });
        } catch (e: any) { json(res, 500, { error: e.message }); }
      });

      // POST /api/admin/rebuild-wiki-posts
      server.middlewares.use("/api/admin/rebuild-wiki-posts", async (req: any, res: any) => {
        if (req.method !== "POST") return json(res, 405, { error: "POST only" });
        try {
          const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
          const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || "";
          if (!SUPABASE_URL || !SERVICE_KEY) return json(res, 500, { error: "Supabase not configured" });
          const { fetch: undFetch } = await import("undici");
          const headers = { "Content-Type": "application/json", "apikey": SERVICE_KEY, "Authorization": `Bearer ${SERVICE_KEY}` };

          await (undFetch as any)(`${SUPABASE_URL}/rest/v1/posts?category=neq.__ANNOUNCEMENT__`, { method: "DELETE", headers });
          const wikiPages = [
            { name: "Ghost Mode", wikiSlug: "Ghost_Mode", category: "Modes" },
            { name: "Mutation Mode", wikiSlug: "Mutation_Mode", category: "Modes" },
            { name: "Zombie Mode", wikiSlug: "Zombie_Mode", category: "Modes" },
            { name: "Black Widow Map", wikiSlug: "Black_Widow_(map)", category: "Maps" },
            { name: "Port Map", wikiSlug: "Port_(CrossFire)", category: "Maps" },
            { name: "Eagle Eye Map", wikiSlug: "Eagle_Eye", category: "Maps" },
          ];
          let created = 0, failed = 0;
          for (const page of wikiPages) {
            try {
              const wikiUrl = `https://crossfire.fandom.com/wiki/${page.wikiSlug}`;
              const scraped = await scrapePage(wikiUrl);
              const plain = scraped.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
              const slug = `${page.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
              const row = {
                title: scraped.title || page.name, post_slug: slug,
                content: scraped.content, summary: scraped.summary,
                image_url: scraped.image, category: page.category,
                tags: ["crossfire", page.category.toLowerCase(), page.name.toLowerCase()],
                author: "CrossFire Wiki", featured: false, source_url: wikiUrl,
                seo_title: (scraped.title || page.name).slice(0, 60),
                seo_description: plain.slice(0, 160),
                seo_keywords: ["crossfire", page.category.toLowerCase(), page.name.toLowerCase()],
              };
              const insRes = await (undFetch as any)(`${SUPABASE_URL}/rest/v1/posts`, {
                method: "POST", headers: { ...headers, "Prefer": "return=minimal" }, body: JSON.stringify(row),
              });
              if (insRes.ok) created++; else { const t = await insRes.text(); console.error(`Failed ${page.name}:`, t); failed++; }
            } catch (e: any) { console.error(`Scrape failed ${page.name}:`, e.message); failed++; }
          }
          json(res, 200, { deletedCount: 0, created, failed });
        } catch (e: any) { json(res, 500, { error: e.message }); }
      });
    },
  };
}

// CF player lookup dev middleware — bypasses Akamai using undici (HTTP/2)
// Supports region=na (default) and region=west (tries cfwest.z8games.com first)
function cfPlayerLookupPlugin(): Plugin {
  return {
    name: "cf-player-lookup",
    configureServer(server) {
      server.middlewares.use("/api/player/lookup", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const nickname = (url.searchParams.get("nickname") || "").trim();
          const region = (url.searchParams.get("region") || "na").toLowerCase();
          const regionLabel = region === "west" ? "CrossFire West" : "CrossFire NA";

          // Also accept a raw profile URL or numeric player ID
          const rawProfileUrl = (url.searchParams.get("profileUrl") || "").trim();
          const rawProfileId = (url.searchParams.get("profileId") || "").trim();
          // Extract numeric ID from profile URL like https://crossfire.z8games.com/profile/26992814
          const profileIdFromUrl = rawProfileUrl.match(/\/profile\/(\d+)/)?.[1] || "";
          const profileId = (rawProfileId || profileIdFromUrl).trim();

          const { fetch } = await import("undici");
          const CF_HEADERS = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://crossfire.z8games.com/myprofile.html",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
          };

          const restBases = region === "west"
            ? ["https://cfwest.z8games.com/rest", "https://crossfire.z8games.com/rest"]
            : ["https://crossfire.z8games.com/rest"];

          let data: any = null;

          // ── Shared helpers ─────────────────────────────────────────────────

          /** Parse a CF profile page markdown (+ optional raw HTML) into a profile object. */
          const parseCFMarkdown = (md: string, html: string = "") => {
            // Nickname: "# [Nick](url)" heading, og:title, or plain "# Nick"
            let nick = md.match(/^#\s+\[([^\]]{2,32})\]/m)?.[1]?.trim() || null;
            if (!nick && html) {
              const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1]
                           || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1];
              const pgTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
              const raw = ogTitle || pgTitle || "";
              const cleaned = raw.replace(/\s*[-–|]\s*(crossfire|z8games)[^$]*/i, "")
                                 .replace(/'s\s+profile$/i, "").trim();
              if (cleaned && cleaned.length >= 2 && cleaned.length <= 32) nick = cleaned;
            }
            if (!nick) nick = md.match(/^#\s+([^\[\n]{2,32})/m)?.[1]?.trim() || null;
            if (!nick) return null;

            const rankTierMatch = md.match(/\/rank_(\d{1,3})\.(?:jpg|png|webp)/i);
            const rankTier      = rankTierMatch ? parseInt(rankTierMatch[1], 10) : null;

            // EXP: prefer progress-bar "current/total (pct%)" over headline
            const progressBarMatch = md.match(/(\d{4,})\s*\/\s*(\d{4,})\s*\([\d.]+%\)/);
            const expRaw = progressBarMatch
              ? progressBarMatch[1]
              : (md.match(/\/rank_\d+\.[^)]+\)[^\S\n]*[^\n]*?(\d[\d,]{3,})\s*EXP/i)?.[1]?.replace(/,/g, "")
                ?? md.match(/(\d[\d,]{3,})\s*EXP/i)?.[1]?.replace(/,/g, "") ?? null);
            const exp = expRaw ? parseInt(expRaw, 10) : null;

            const rankLine = md.match(/##\s+!\[[^\]]*\]\([^)]*\/rank_\d+\.[^)]+\)[^\S\n]*([^\n]+)/)?.[1]?.trim() || "";
            const rankName = rankLine.replace(/[\d,]+\s*EXP.*/i, "").replace(/\d+$/, "").trim() || null;

            const clanHeadings = [...md.matchAll(/^##\s+(?:!\[[^\]]*\]\([^)]+\)){2,}([^\n!\[]+)/gm)];
            const clan = clanHeadings[0]?.[1]?.trim() || null;

            const statNum = (label: string) => {
              const m = md.match(new RegExp(`#####?\\s+${label}\\s*\\n+###?\\s+([\\d,]+)`, "i"))
                     || md.match(new RegExp(`\\*\\*${label}\\*\\*[:\\s]+([\\d,]+)`, "i"))
                     || md.match(new RegExp(`${label}[:\\s]+([\\d,]+)`, "i"));
              return m ? parseInt(m[1].replace(/,/g, ""), 10) : null;
            };
            const inlineNum = (label: string) => {
              const m = md.match(new RegExp(`${label}\\s*\\n+([\\d.]+)`, "i"));
              return m ? parseFloat(m[1]) : null;
            };

            const kills      = statNum("Kills");
            const deaths     = statNum("Deaths");
            const wins       = statNum("Wins");
            const losses     = statNum("Losses");
            const kdRatio    = inlineNum("Kill-Death Ratio");
            const winRatePct = md.match(/Winner\s*Rate\s*\n+([\d.]+)\s*%/i)?.[1]
                            || md.match(/Win\s*Rate[:\s]+([\d.]+)\s*%/i)?.[1] || null;
            const hsRate     = md.match(/Headshot\s*Rate[\s\S]{0,200}?([\d.]+)\s*%/i)?.[1] || null;
            const vipLevel   = parseInt(md.match(/\bVIP\s*(?:Level\s*)?(\d+)/i)?.[1] || "0", 10) || null;
            const vipDays    = parseInt(md.match(/VIP[^\n]*?(\d+)\s*day/i)?.[1]       || "0", 10) || null;
            const clanImgMatch = md.match(/!\[[^\]]*\]\((https?:\/\/[^)]*(?:clan|mark)[^)]*)\)/i);
            const clanImage    = clanImgMatch ? clanImgMatch[1] : null;

            return {
              nickname: nick, region: regionLabel, exp, rank: rankName, rankTier,
              rankImage: rankTier ? `https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_${rankTier}.jpg` : null,
              kills, deaths, wins, losses,
              kdRatio: kdRatio ?? (kills !== null && deaths !== null && deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : null),
              winRate: winRatePct ? parseFloat(winRatePct) : (wins !== null && losses !== null && (wins + losses) > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : null),
              headShotRate: hsRate ? parseFloat(hsRate) : null,
              clan, clanImage, vipDays, vipLevel, playtime: null, level: null,
            };
          };

          /** Scrape a URL with Firecrawl (JS-rendered) and return a parsed profile, or null. */
          const firecrawlScrape = async (targetUrl: string): Promise<any> => {
            const fcKey = process.env.FIRECRAWL_API_KEY || "";
            if (!fcKey) return null;
            try {
              const fcRes = await (fetch as any)("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                signal: AbortSignal.timeout(45000),
                headers: { "Authorization": `Bearer ${fcKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: targetUrl,
                  formats: ["markdown", "html"],
                  waitFor: 6000,
                  onlyMainContent: false,
                }),
              });
              if (!fcRes.ok) return null;
              const fcData = await fcRes.json() as any;
              const md: string   = fcData?.data?.markdown || fcData?.markdown || "";
              const html: string = fcData?.data?.html     || fcData?.html     || "";
              if (md.length < 100) return null;
              return parseCFMarkdown(md, html);
            } catch { return null; }
          };

          /** Try all REST endpoints for a numeric profile ID. */
          const restLookupById = async (pid: string): Promise<any> => {
            const idParams = ["char_no", "user_no", "UserNo", "CharNo", "usn_no", "uid", "user_id", "char_id"];
            for (const base of restBases) {
              for (const param of idParams) {
                try {
                  const r = await (fetch as any)(`${base}/userprofile.json?${param}=${pid}`, {
                    signal: AbortSignal.timeout(4000), headers: CF_HEADERS,
                  });
                  const ct = r.headers.get("content-type") || "";
                  if (!ct.includes("json")) continue;
                  const j = await r.json() as any;
                  if (j.p_o_ErrID === -702) continue;
                  if (j.UserNickname || j.TotalExp != null || j.TotalKills != null) return j;
                } catch { /* try next */ }
              }
            }
            return null;
          };

          // ── Path A: profile URL provided → Firecrawl FIRST ────────────────
          if (rawProfileUrl) {
            const targetUrl = rawProfileUrl.startsWith("http") ? rawProfileUrl : `https://${rawProfileUrl}`;

            // Primary: Firecrawl (handles JS-rendered pages, Akamai-protected content)
            const fcProfile = await firecrawlScrape(targetUrl);
            if (fcProfile) {
              res.writeHead(200, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ success: true, profile: fcProfile }));
            }

            // Secondary: if we extracted a numeric ID from the URL, try REST
            if (profileId && /^\d+$/.test(profileId)) {
              const restData = await restLookupById(profileId);
              if (restData) { data = restData; }
            }

            if (!data) {
              res.writeHead(404, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({
                error: "Could not load profile from that URL. Try entering your in-game nickname directly.",
                notFound: true, suggestNickname: true,
              }));
            }
          }

          // ── Path B: bare numeric profile ID (no URL) ───────────────────────
          else if (profileId && /^\d+$/.test(profileId)) {
            // Step 1: REST APIs (fast)
            data = await restLookupById(profileId);

            // Step 2: Firecrawl fallback (full JS render)
            if (!data) {
              const fcProfile = await firecrawlScrape(`https://crossfire.z8games.com/profile/${profileId}`);
              if (fcProfile) {
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: true, profile: fcProfile }));
              }
              res.writeHead(404, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({
                error: `Profile #${profileId} could not be loaded. Enter your in-game nickname directly instead.`,
                notFound: true, suggestNickname: true, profileId,
              }));
            }
          }

          // ── Path C: nickname lookup ────────────────────────────────────────
          else {
            if (!nickname || nickname.length < 2 || nickname.length > 32) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid nickname — must be 2–32 characters." }));
            }

            for (const base of restBases) {
              try {
                const response = await (fetch as any)(`${base}/userprofile.json?usn=${encodeURIComponent(nickname)}`, {
                  signal: AbortSignal.timeout(10000),
                  headers: CF_HEADERS,
                });
                const ct = response.headers.get("content-type") || "";
                if (!ct.includes("json")) continue;
                const json = await response.json() as any;
                if (json.p_o_ErrID === -702 || json.p_o_ErrDesc === "Character not found") break;
                data = json;
                break;
              } catch { /* timeout — try next */ }
            }

            if (!data) {
              res.writeHead(404, { "Content-Type": "application/json" });
              const msg = region === "west"
                ? `Player "${nickname}" not found. CrossFire West was discontinued — stats may no longer be available. Try switching to CrossFire NA.`
                : `Player "${nickname}" not found on ${regionLabel}. Nicknames are case-sensitive.`;
              return res.end(JSON.stringify({ error: msg, notFound: true }));
            }
          }

          // ── Map raw API response to profile shape ──────────────────────────
          const kills  = data.TotalKills  ?? data.total_kills  ?? data.Kills  ?? null;
          const deaths = data.TotalDeaths ?? data.total_deaths ?? data.Deaths ?? null;
          const wins   = data.TotalWins   ?? data.total_wins   ?? data.Wins   ?? null;
          const losses = data.TotalLosses ?? data.total_losses ?? data.Losses ?? null;
          const exp    = data.TotalExp    ?? data.UserExp      ?? data.exp    ?? null;
          const vipDays = data.VIPDays ?? data.VipDays ?? data.vip_days ?? data.VipRemainDays ?? null;
          const vipLevel = data.VIPLevel ?? data.VipLevel ?? data.vip_level ?? null;

          const profile = {
            nickname:   data.UserNickname || data.usn || nickname,
            region:     regionLabel,
            exp,
            rank:       data.RankName  || data.rank_name  || data.Rank  || null,
            rankTier:   data.RankNo    || data.rank_no    || data.RankTier || null,
            rankImage:  data.RankImg   || data.rank_img   || null,
            kills,
            deaths,
            wins,
            losses,
            kdRatio:  kills !== null && deaths !== null && deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : null,
            winRate:  wins  !== null && losses !== null && (wins + losses) > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : null,
            playtime: data.PlayTime || data.play_time || null,
            level:    data.UserLevel || data.level || null,
            clan:     data.ClanName  || data.clan_name || null,
            vipDays,
            vipLevel,
            raw: data,
          };

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, profile }));
        } catch (err: any) {
          const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
          res.writeHead(isTimeout ? 504 : 500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: isTimeout ? "CF servers timed out — try again shortly." : "Failed to fetch player data." }));
        }
      });
    },
  };
}

// ── Grok AI tips middleware ───────────────────────────────────────────────────
function cfGrokTipsPlugin(): Plugin {
  return {
    name: "cf-grok-tips",
    configureServer(server) {
      async function readBody(req: any): Promise<any> {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", resolve);
          req.on("error", reject);
        });
        try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { return {}; }
      }

      server.middlewares.use("/api/grok-tips", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "POST only" }));
        }
        try {
          const body = await readBody(req);
          const { currentRank, targetRank, expNeeded, kdRatio, winRate, clan, vipLevel } = body;

          // ── Rank group detection ────────────────────────────────────────────
          const rank = (currentRank || "").toLowerCase();
          const isLowRank   = /trainee|private|corporal|sergeant/.test(rank);
          const isMidRank   = /lieutenant|captain|major/.test(rank);
          const isHighRank  = /colonel|brigadier|general/.test(rank);
          const isElite     = /marshall|marshal/.test(rank);

          const kd    = typeof kdRatio  === "number" ? kdRatio  : null;
          const wr    = typeof winRate  === "number" ? winRate  : null;
          const inClan = !!clan;
          const hasVip = vipLevel != null;

          // ── Build personalised tip list ──────────────────────────────────────
          const tips: string[] = [];

          // Tip 1 — EXP farming: best mode for rank range
          if (isLowRank) {
            tips.push("Play Team Deathmatch (TDM) continuously — it gives the fastest EXP per minute for newer ranks. Aim for 20+ kills per match to maximise your round bonus.");
          } else if (isMidRank) {
            tips.push("Switch between TDM and Search & Destroy (S&D). S&D awards a large EXP bonus for planting/defusing bombs — even losing rounds still give solid EXP if you participate actively.");
          } else {
            tips.push("Ghost Mode and Mutation Mode give high EXP bonuses and are quicker to finish than TDM at your rank. Queue them back-to-back during double-EXP events for maximum gain.");
          }

          // Tip 2 — Win rate / K/D advice
          if (kd !== null && kd < 1.5) {
            tips.push(`Your K/D is ${kd} — focus on crosshair placement and pre-aiming common angles rather than rushing. Staying alive longer each round directly increases your end-of-match EXP bonus.`);
          } else if (wr !== null && wr < 55) {
            tips.push(`Your win rate is ${wr}% — consider maining a single map until you know every angle cold. Map mastery wins more rounds than raw aim, and win bonuses stack up quickly.`);
          } else {
            tips.push("Maintain your strong performance — coordinate calls with your team in voice or text chat. Objective play (bomb plants, zone holds) awards extra EXP on top of kill bonuses.");
          }

          // Tip 3 — Double EXP / events
          tips.push("Log in every day for the daily EXP mission bonus. CrossFire NA regularly runs weekend double-EXP events — save your hardest grind sessions for those windows to rank up 2× as fast.");

          // Tip 4 — Clan bonus
          if (inClan) {
            tips.push(`Playing as a clan group (you're in [${clan}]) applies a clan EXP bonus multiplier. Party up with 3–4 clan members in premade lobbies — the party bonus stacks with the clan bonus for a significant EXP boost.`);
          } else {
            tips.push("Join a clan — clan membership grants a permanent EXP multiplier on every match. Even a small active clan beats solo queuing for rank-up speed.");
          }

          // Tip 5 — VIP / target rank context
          if (hasVip) {
            tips.push(`Your VIP status gives bonus EXP at end of round — never let it expire during an active grind. Renew before a double-EXP weekend to stack all three multipliers at once.`);
          } else if (isHighRank || isElite) {
            tips.push(`At ${currentRank} the EXP gaps between sub-tiers are large. Use weapon crates and daily missions to supplement game EXP — every extra source counts when you need millions of EXP per tier.`);
          } else {
            tips.push(`Set ${targetRank} as your visible goal in your profile — tracking visible progress keeps motivation high. Use the rank calculator on this site to see exactly how many matches you need.`);
          }

          // Join as newline-separated bullet text
          const tipsText = tips.map((t, i) => `${i + 1}. ${t}`).join("\n");

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ tips: tipsText }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Failed to generate tips" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    cfRegisterPlugin(),
    cfAdminAuthPlugin(),
    cfPlayerLookupPlugin(),
    cfAiPlugin(),
    cfScrapePlugin(),
    cfGrokTipsPlugin(),
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/client"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
          utilities: ['clsx', 'tailwind-merge', 'date-fns'],
          icons: ['lucide-react'],
        },
        // Optimize chunk filenames for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase chunk size warning limit to accommodate larger bundles
    chunkSizeWarningLimit: 1000,
    // Disable source maps for production to reduce bundle size
    sourcemap: false,
    // Minify for better performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Enable CSS minification
    cssMinify: true,
    // Report compressed size
    reportCompressedSize: true,
    // Target modern browsers for better optimization
    target: 'es2020',
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    fs: {
      strict: false,
    },
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    'process.env.PUBLIC_BASE_URL': JSON.stringify(process.env.PUBLIC_BASE_URL),
  },
});
