import type { VercelRequest, VercelResponse } from "@vercel/node";

import { verifyAdminRequest } from "../../server/adminAuth.js";

const ALLOWED_ORIGINS = [
  "https://crossfire.wiki",
  "https://www.crossfire.wiki",
  "http://localhost:5000",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean),
];

function resolveOrigin(req: VercelRequest): string {
  const origin = Array.isArray(req.headers.origin) ? req.headers.origin[0] : req.headers.origin;
  if (typeof origin === "string" && ALLOWED_ORIGINS.includes(origin)) return origin;
  return "https://crossfire.wiki";
}

function addCorsHeaders(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", resolveOrigin(req));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

function resourceTable(req: VercelRequest): "events" | "announcements" {
  const resource = Array.isArray(req.query.resource) ? req.query.resource[0] : req.query.resource;
  return resource === "announcements" ? "announcements" : "events";
}

function recordId(req: VercelRequest, body: any): string {
  const queryId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  return String(body?.id || queryId || "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return addCorsHeaders(req, res).status(204).end();
  const admin = verifyAdminRequest(req.headers as Record<string, unknown>);
  if (!admin) {
    return addCorsHeaders(req, res).status(401).json({ error: "Unauthorized" });
  }
  const permitted =
    admin.role === "super_admin" ||
    admin.permissions?.["events:manage"] === true ||
    admin.permissions?.["content:manage"] === true;
  if (!permitted) {
    return addCorsHeaders(req, res).status(403).json({ error: "Missing events management permission" });
  }

  const { url, key } = supabaseConfig();
  if (!url || !key) return addCorsHeaders(req, res).status(500).json({ error: "Supabase server configuration is incomplete" });

  try {
    const table = resourceTable(req);
    if (req.method === "GET") {
      const upstream = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.desc`, {
        headers: restHeaders(key),
      });
      const payload = await upstream.json().catch(() => []);
      if (!upstream.ok) return addCorsHeaders(req, res).status(upstream.status).json({ error: `Supabase ${table} query failed`, details: payload });
      return addCorsHeaders(req, res).status(200).json({ data: payload, error: null });
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${url}/rest/v1/${table}`, {
        method: "POST",
        headers: restHeaders(key, "return=representation"),
        body: JSON.stringify(req.body || {}),
      });
      const payload = await upstream.json().catch(() => null);
      if (!upstream.ok) return addCorsHeaders(req, res).status(upstream.status).json({ error: `Supabase ${table} insert failed`, details: payload });
      return addCorsHeaders(req, res).status(200).json({ data: Array.isArray(payload) ? payload[0] || null : payload, error: null });
    }

    const id = recordId(req, req.body || {});
    if (!id) return addCorsHeaders(req, res).status(400).json({ error: `${table === "events" ? "Event" : "Announcement"} id is required` });

    if (req.method === "PATCH") {
      const values = req.body?.values && typeof req.body.values === "object" ? req.body.values : {};
      const upstream = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: restHeaders(key, "return=representation"),
        body: JSON.stringify(values),
      });
      const payload = await upstream.json().catch(() => null);
      if (!upstream.ok) return addCorsHeaders(req, res).status(upstream.status).json({ error: `Supabase ${table} update failed`, details: payload });
      return addCorsHeaders(req, res).status(200).json({ data: Array.isArray(payload) ? payload[0] || null : payload, error: null });
    }

    if (req.method === "DELETE") {
      const upstream = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: restHeaders(key, "return=minimal"),
      });
      if (!upstream.ok) return addCorsHeaders(req, res).status(upstream.status).json({ error: `Supabase ${table} delete failed`, details: await upstream.text() });
      return addCorsHeaders(req, res).status(200).json({ data: null, error: null });
    }

    return addCorsHeaders(req, res).status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    return addCorsHeaders(req, res).status(500).json({ error: error?.message || "Events request failed" });
  }
}
