import type { VercelRequest, VercelResponse } from "@vercel/node";

import { verifyAdminRequest } from "../../server/adminAuth.js";

const CORS = new Map([
  ["Access-Control-Allow-Origin", "*"],
  ["Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS"],
  ["Access-Control-Allow-Headers", "Content-Type, Authorization"],
]);

function addCorsHeaders(res: VercelResponse) {
  for (const [key, value] of CORS) res.setHeader(key, value);
  return res;
}

function supabaseConfig() {
  return {
    url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_KEY || "",
  };
}

function restHeaders(key: string, prefer?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function eventId(req: VercelRequest, body: any): string {
  const queryId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  return String(body?.id || queryId || "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(res).status(204).end();
  if (!verifyAdminRequest(req.headers as Record<string, unknown>)) {
    return addCorsHeaders(res).status(401).json({ error: "Unauthorized" });
  }

  const { url, key } = supabaseConfig();
  if (!url || !key) return addCorsHeaders(res).status(500).json({ error: "Supabase server configuration is incomplete" });

  try {
    if (req.method === "GET") {
      const upstream = await fetch(`${url}/rest/v1/events?select=*&order=created_at.desc`, {
        headers: restHeaders(key),
      });
      const payload = await upstream.json().catch(() => []);
      if (!upstream.ok) return addCorsHeaders(res).status(upstream.status).json({ error: "Supabase events query failed", details: payload });
      return addCorsHeaders(res).status(200).json({ data: payload, error: null });
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${url}/rest/v1/events`, {
        method: "POST",
        headers: restHeaders(key, "return=representation"),
        body: JSON.stringify(req.body || {}),
      });
      const payload = await upstream.json().catch(() => null);
      if (!upstream.ok) return addCorsHeaders(res).status(upstream.status).json({ error: "Supabase event insert failed", details: payload });
      return addCorsHeaders(res).status(200).json({ data: Array.isArray(payload) ? payload[0] || null : payload, error: null });
    }

    const id = eventId(req, req.body || {});
    if (!id) return addCorsHeaders(res).status(400).json({ error: "Event id is required" });

    if (req.method === "PATCH") {
      const values = req.body?.values && typeof req.body.values === "object" ? req.body.values : {};
      const upstream = await fetch(`${url}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: restHeaders(key, "return=representation"),
        body: JSON.stringify(values),
      });
      const payload = await upstream.json().catch(() => null);
      if (!upstream.ok) return addCorsHeaders(res).status(upstream.status).json({ error: "Supabase event update failed", details: payload });
      return addCorsHeaders(res).status(200).json({ data: Array.isArray(payload) ? payload[0] || null : payload, error: null });
    }

    if (req.method === "DELETE") {
      const upstream = await fetch(`${url}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: restHeaders(key, "return=minimal"),
      });
      if (!upstream.ok) return addCorsHeaders(res).status(upstream.status).json({ error: "Supabase event delete failed", details: await upstream.text() });
      return addCorsHeaders(res).status(200).json({ data: null, error: null });
    }

    return addCorsHeaders(res).status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    return addCorsHeaders(res).status(500).json({ error: error?.message || "Events request failed" });
  }
}
