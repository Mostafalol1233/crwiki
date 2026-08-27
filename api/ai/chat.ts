import dotenv from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";
dotenv.config();

const DEFAULT_AI_MODEL = "minimax/minimax-m3:free";
const FALLBACK_AI_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "z-ai/glm-5.2:free",
] as const;

const aiRate = new Map<string, { count: number; startedAt: number }>();
function allowAiRequest(req: VercelRequest): boolean {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || "unknown").split(",")[0].trim().slice(0, 100);
  const now = Date.now();
  const current = aiRate.get(ip);
  if (!current || now - current.startedAt >= 10 * 60 * 1000) {
    aiRate.set(ip, { count: 1, startedAt: now });
    return true;
  }
  if (current.count >= 20) return false;
  current.count += 1;
  return true;
}

function requestOriginAllowed(req: VercelRequest): boolean {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (!origin) return true;
  try {
    return new URL(origin).host === String(req.headers.host || "");
  } catch {
    return false;
  }
}

function getAiModelCandidates(configuredModel?: string) {
  const configured = String(configuredModel || "").trim();
  const safeConfigured = configured.endsWith(":free") ? configured : "";
  return Array.from(new Set([
    safeConfigured || DEFAULT_AI_MODEL,
    ...FALLBACK_AI_MODELS,
  ]));
}

let cachedWebsiteContext = "";
let contextCachedUntil = 0;

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part: any) => {
      if (typeof part === "string") return part;
      return typeof part?.text === "string" ? part.text : "";
    })
    .join("")
    .trim();
}

function stripEmojis(value: string): string {
  return value.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/[ \t]{2,}/g, ' ').trim();
}

function providerMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body);
    const message = parsed?.error?.message || parsed?.error || parsed?.message;
    if (typeof message === "string" && message.trim()) return message.trim().slice(0, 500);
  } catch {
    // Keep the raw short response below when the provider does not return JSON.
  }
  return body.trim().slice(0, 500) || `Provider returned HTTP ${status}`;
}

async function fetchWebsiteContext(): Promise<string> {
  if (Date.now() < contextCachedUntil) return cachedWebsiteContext;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!supabaseUrl || !anonKey) return "";

  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  try {
    const [weapons, ranks, modes, mercenaries, events] = await Promise.allSettled([
      fetch(`${supabaseUrl}/rest/v1/weapons?select=name,category&limit=150&order=name`, { headers, signal: AbortSignal.timeout(5000) }),
      fetch(`${supabaseUrl}/rest/v1/ranks?select=name,tier,bonus&order=tier`, { headers, signal: AbortSignal.timeout(5000) }),
      fetch(`${supabaseUrl}/rest/v1/modes?select=name,type&order=name`, { headers, signal: AbortSignal.timeout(5000) }),
      fetch(`${supabaseUrl}/rest/v1/mercenaries?select=name,role&order=order_index`, { headers, signal: AbortSignal.timeout(5000) }),
      fetch(`${supabaseUrl}/rest/v1/events?select=title,date&limit=10&order=created_at.desc`, { headers, signal: AbortSignal.timeout(5000) }),
    ]);

    let context = "";
    if (weapons.status === "fulfilled" && weapons.value.ok) {
      const rows: any[] = await weapons.value.json().catch(() => []);
      const byCategory: Record<string, string[]> = {};
      rows.forEach((row: any) => {
        const category = row.category || "Other";
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(row.name);
      });
      if (rows.length) {
        context += "\nWEAPONS:\n";
        Object.entries(byCategory).forEach(([category, names]) => {
          context += `  ${category}: ${names.slice(0, 20).join(", ")}\n`;
        });
      }
    }
    if (ranks.status === "fulfilled" && ranks.value.ok) {
      const rows: any[] = await ranks.value.json().catch(() => []);
      if (rows.length) {
        context += `\nRANKS (${rows.length}):\n`;
        rows.forEach((row: any) => {
          context += `  T${row.tier}: ${row.name}${row.bonus ? ` [${row.bonus}]` : ""}\n`;
        });
      }
    }
    if (modes.status === "fulfilled" && modes.value.ok) {
      const rows: any[] = await modes.value.json().catch(() => []);
      if (rows.length) context += `\nMODES: ${rows.map((row: any) => row.name).join(", ")}\n`;
    }
    if (mercenaries.status === "fulfilled" && mercenaries.value.ok) {
      const rows: any[] = await mercenaries.value.json().catch(() => []);
      if (rows.length) context += `\nMERCS: ${rows.map((row: any) => `${row.name}${row.role ? `(${row.role})` : ""}`).join(", ")}\n`;
    }
    if (events.status === "fulfilled" && events.value.ok) {
      const rows: any[] = await events.value.json().catch(() => []);
      if (rows.length) context += `\nEVENTS: ${rows.slice(0, 5).map((row: any) => row.title).join(", ")}\n`;
    }

    cachedWebsiteContext = context;
    contextCachedUntil = Date.now() + 60_000;
    return context;
  } catch {
    return "";
  }
}

function normalizeMessages(input: unknown): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-6)
    .map((message: any) => ({
      role: message?.role === "assistant" ? "assistant" as const : "user" as const,
      content: typeof message?.content === "string" ? message.content.trim().slice(0, 2000) : "",
    }))
    .filter((message) => message.content.length > 0);
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://crossfire.wiki",
      "X-Title": "CrossFire Wiki",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.45,
      stream: false,
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(`${model}: ${providerMessage(response.status, raw)}`);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${model}: provider returned invalid JSON`);
  }
  const content = textFromContent(parsed?.choices?.[0]?.message?.content || parsed?.choices?.[0]?.text);
  if (!content) throw new Error(`${model}: provider returned an empty answer`);
  return stripEmojis(content);
}

async function generateAnswer(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: { role: "system"; content: string },
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    throw new Error("AI provider is not configured on this deployment");
  }

  const configuredModel = process.env.OPENROUTER_MODEL || process.env.VITE_OPENROUTER_MODEL || "";
  const models = getAiModelCandidates(configuredModel);
  const errors: string[] = [];

  for (const model of models) {
    try {
      return await callOpenRouter(apiKey, model, [systemPrompt, ...messages]);
    } catch (error: any) {
      errors.push(error?.message || `${model} failed`);
    }
  }

  throw new Error(errors.join(" | ").slice(0, 1000) || "All free AI models failed");
}

function sendSse(res: VercelResponse, payload: unknown) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (origin && requestOriginAllowed(req)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(requestOriginAllowed(req) ? 204 : 403).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!requestOriginAllowed(req)) return res.status(403).json({ error: "Origin not allowed" });
  if (!allowAiRequest(req)) return res.status(429).json({ error: "Too many AI requests. Try again later." });

  const messages = normalizeMessages(req.body?.messages);
  const totalLength = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (!messages.length || totalLength > 12000) return res.status(400).json({ error: "A non-empty messages array under 12000 characters is required" });

  try {
    const websiteData = await fetchWebsiteContext();
    const systemPrompt = {
      role: "system" as const,
      content: `You are CrossFire Wiki Assistant — the official AI for CrossFire Wiki.
You are an expert on the CrossFire online FPS game. Help players with weapons, mercenaries, ranks, modes, maps, strategies, ZP/GP currencies, clans, and events.
Use Markdown when helpful: bold key terms, concise bullet lists, and comparison tables. Be friendly, direct, and useful. Do not invent exact live prices, event dates, account rules, or official announcements. When current data is unavailable, say so clearly and give the safest general guidance.
IMPORTANT: Respond in the SAME LANGUAGE the user writes in. Arabic users get clear natural Arabic replies; English users get English replies.
Do not use emojis or decorative symbols unless the user explicitly asks for them.
${websiteData ? `\n=== LIVE DATA FROM CROSSFIRE WIKI ===\n${websiteData}\n=== END LIVE DATA ===\n` : ""}`,
    };

    const answer = await generateAnswer(messages, systemPrompt);
    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...(origin && requestOriginAllowed(req) ? { "Access-Control-Allow-Origin": origin } : {}),
    });
    sendSse(res, { delta: answer });
    sendSse(res, { done: true });
    res.write("data: [DONE]\n\n");
    return res.end();
  } catch (error: any) {
    const message = error?.message || "AI request failed";
    console.error("[ai/chat] provider failure", message.slice(0, 1000));
    return res.status(503).json({
      error: "The AI assistant is temporarily unavailable.",
      code: "AI_PROVIDER_UNAVAILABLE",
      detail: "No compatible free AI provider is currently available. Please try again shortly.",
    });
  }
}
