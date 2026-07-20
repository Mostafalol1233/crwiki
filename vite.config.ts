import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { Plugin } from "vite";

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

          if (!nickname || nickname.length < 2 || nickname.length > 32) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid nickname" }));
          }

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

          // Region → endpoints to try in order
          const endpoints = region === "west"
            ? ["https://cfwest.z8games.com/rest/userprofile.json", "https://crossfire.z8games.com/rest/userprofile.json"]
            : ["https://crossfire.z8games.com/rest/userprofile.json"];
          const regionLabel = region === "west" ? "CrossFire West" : "CrossFire NA";

          let data: any = null;
          for (const base of endpoints) {
            try {
              const response = await fetch(`${base}?usn=${encodeURIComponent(nickname)}`, {
                signal: AbortSignal.timeout(10000),
                headers: CF_HEADERS,
              } as any);
              const ct = response.headers.get("content-type") || "";
              if (!ct.includes("json")) continue; // not JSON — try next endpoint
              const json = await response.json() as any;
              if (json.p_o_ErrID === -702 || json.p_o_ErrDesc === "Character not found") break; // definitive not-found
              data = json;
              break;
            } catch { /* timeout or network error — try next */ }
          }

          if (!data) {
            res.writeHead(404, { "Content-Type": "application/json" });
            const msg = region === "west"
              ? `Player "${nickname}" not found. CrossFire West was discontinued — if you played CF West, stats may no longer be available. Try switching to CrossFire NA.`
              : `Player "${nickname}" not found on ${regionLabel}. Check spelling — nicknames are case-sensitive.`;
            return res.end(JSON.stringify({ error: msg, notFound: true }));
          }

          const kills = data.TotalKills ?? data.total_kills ?? data.Kills ?? null;
          const deaths = data.TotalDeaths ?? data.total_deaths ?? data.Deaths ?? null;
          const wins = data.TotalWins ?? data.total_wins ?? data.Wins ?? null;
          const losses = data.TotalLosses ?? data.total_losses ?? data.Losses ?? null;
          const exp = data.TotalExp ?? data.UserExp ?? data.exp ?? null;

          const profile = {
            nickname: data.UserNickname || data.usn || nickname,
            region: regionLabel,
            exp,
            rank: data.RankName || data.rank_name || data.Rank || null,
            rankTier: data.RankNo || data.rank_no || data.RankTier || null,
            rankImage: data.RankImg || data.rank_img || null,
            kills,
            deaths,
            wins,
            losses,
            kdRatio: kills !== null && deaths !== null && deaths > 0 ? (kills / deaths).toFixed(2) : null,
            winRate: wins !== null && losses !== null && (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : null,
            playtime: data.PlayTime || data.play_time || null,
            level: data.UserLevel || data.level || null,
            clan: data.ClanName || data.clan_name || null,
            raw: data,
          };

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, profile }));
        } catch (err: any) {
          const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
          res.writeHead(isTimeout ? 504 : 500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: isTimeout ? "CF servers timed out, try again shortly." : "Failed to fetch player data." }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    cfRegisterPlugin(),
    cfPlayerLookupPlugin(),
    cfScrapePlugin(),
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
