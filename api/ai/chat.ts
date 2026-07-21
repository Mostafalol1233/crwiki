import type { VercelRequest, VercelResponse } from "@vercel/node";

// Fetch live website context from Supabase for the AI system prompt
async function fetchWebsiteContext(): Promise<string> {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const ANON_KEY     = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!SUPABASE_URL || !ANON_KEY) return "";
  const h = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
  try {
    const [wRes, rRes, mRes, merRes, evRes] = await Promise.allSettled([
      fetch(`${SUPABASE_URL}/rest/v1/weapons?select=name,category&limit=150&order=name`, { headers: h, signal: AbortSignal.timeout(6000) }),
      fetch(`${SUPABASE_URL}/rest/v1/ranks?select=name,tier,bonus&order=tier`,          { headers: h, signal: AbortSignal.timeout(6000) }),
      fetch(`${SUPABASE_URL}/rest/v1/modes?select=name,type&order=name`,                { headers: h, signal: AbortSignal.timeout(6000) }),
      fetch(`${SUPABASE_URL}/rest/v1/mercenaries?select=name,role&order=order_index`,   { headers: h, signal: AbortSignal.timeout(6000) }),
      fetch(`${SUPABASE_URL}/rest/v1/events?select=title,date&limit=10&order=created_at.desc`, { headers: h, signal: AbortSignal.timeout(6000) }),
    ]);
    let ctx = "";
    if (wRes.status === "fulfilled" && wRes.value.ok) {
      const weapons: any[] = await wRes.value.json().catch(() => []);
      if (weapons?.length) {
        const byCat: Record<string, string[]> = {};
        weapons.forEach((w: any) => { const c = w.category || "Other"; if (!byCat[c]) byCat[c] = []; byCat[c].push(w.name); });
        ctx += "\nWEAPONS:\n";
        Object.entries(byCat).forEach(([c, ns]) => { ctx += `  ${c}: ${ns.slice(0, 20).join(", ")}\n`; });
      }
    }
    if (rRes.status === "fulfilled" && rRes.value.ok) {
      const ranks: any[] = await rRes.value.json().catch(() => []);
      if (ranks?.length) {
        ctx += `\nRANKS (${ranks.length}):\n`;
        ranks.forEach((r: any) => { ctx += `  T${r.tier}: ${r.name}${r.bonus ? ` [${r.bonus}]` : ""}\n`; });
      }
    }
    if (mRes.status === "fulfilled" && mRes.value.ok) {
      const modes: any[] = await mRes.value.json().catch(() => []);
      if (modes?.length) ctx += `\nMODES: ${modes.map((m: any) => m.name).join(", ")}\n`;
    }
    if (merRes.status === "fulfilled" && merRes.value.ok) {
      const mercs: any[] = await merRes.value.json().catch(() => []);
      if (mercs?.length) ctx += `\nMERCS: ${mercs.map((m: any) => `${m.name}${m.role ? `(${m.role})` : ""}`).join(", ")}\n`;
    }
    if (evRes.status === "fulfilled" && evRes.value.ok) {
      const events: any[] = await evRes.value.json().catch(() => []);
      if (events?.length) ctx += `\nEVENTS: ${events.slice(0, 5).map((e: any) => e.title).join(", ")}\n`;
    }
    return ctx;
  } catch { return ""; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: "messages array required" });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI not configured" });

  // Set SSE headers and claim the response immediately
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });
  res.write(": ok\n\n");

  try {
    const websiteData = await fetchWebsiteContext();
    const systemPrompt = {
      role: "system",
      content: `You are CrossFire Wiki Assistant — the official AI for CrossFire Wiki.
You are an expert on the CrossFire online FPS game. Help players with weapons, mercenaries, ranks, modes, maps, strategies, ZP/GP currencies, clans, and events.
Format responses using Markdown when helpful: **bold** for key terms, bullet lists, tables for comparisons. Be friendly, direct, concise.
IMPORTANT: Respond in the SAME LANGUAGE the user writes in. Arabic users get Arabic replies.
${websiteData ? `\n=== LIVE DATA FROM CROSSFIRE WIKI ===\n${websiteData}\n=== END LIVE DATA ===\n` : ""}`,
    };

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://crossfirewiki.com",
        "X-Title": "CrossFire Wiki",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [systemPrompt, ...messages.slice(-6)],
        max_tokens: 480,
        temperature: 0.5,
        stream: true,
      }),
      signal: AbortSignal.timeout(35000),
    });

    if (!upstream.ok) {
      res.write(`data: ${JSON.stringify({ error: "AI upstream error" })}\n\n`);
      return res.end();
    }

    // @ts-ignore — ReadableStream iteration
    let buffer = "";
    for await (const rawChunk of upstream.body as any) {
      const chunk = Buffer.isBuffer(rawChunk) ? rawChunk.toString("utf-8") : String(rawChunk);
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === "[DONE]") { res.write("data: [DONE]\n\n"); continue; }
        try {
          const parsed = JSON.parse(jsonStr) as any;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
        } catch { /* skip malformed */ }
      }
    }
    res.end();
  } catch (err: any) {
    try {
      res.write(`data: ${JSON.stringify({ error: err.message || "AI request failed" })}\n\n`);
      res.end();
    } catch { /* already ended */ }
  }
}
