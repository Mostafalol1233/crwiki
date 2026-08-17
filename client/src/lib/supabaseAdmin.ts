/**
 * Browser-safe admin session helpers.
 *
 * Privileged Supabase service-role credentials must never be included in a Vite
 * client bundle: every VITE_* value is readable by anyone visiting the site.
 * All privileged mutations now belong on server-side endpoints that verify the
 * signed admin token before using SUPABASE_SERVICE_KEY.
 */

import { supabase } from "./supabase";

/**
 * Deprecated compatibility alias. Existing admin screens import this symbol,
 * but it now always points to the publishable client and therefore remains
 * subject to Supabase RLS. New privileged work must use a server endpoint.
 */
export const supabaseService: any = supabase;

type AdminTokenPayload = {
  id?: string;
  exp: number;
  role: string;
  username: string;
  permissions: Record<string, boolean>;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function decodeAdminToken(): AdminTokenPayload | null {
  try {
    const raw = localStorage.getItem("adminToken");
    if (!raw) return null;

    // Signed tokens are payload.signature. The signature is verified server-side;
    // the browser only decodes the payload to render the current session state.
    // The legacy fallback is intentionally read-only for a smooth logout/upgrade.
    const payloadPart = raw.includes(".") ? raw.split(".")[0] : raw;
    const payload = JSON.parse(decodeBase64Url(payloadPart)) as Partial<AdminTokenPayload>;
    if (
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now() ||
      typeof payload.role !== "string" ||
      typeof payload.username !== "string" ||
      !payload.permissions ||
      typeof payload.permissions !== "object"
    ) {
      localStorage.removeItem("adminToken");
      return null;
    }

    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return decodeAdminToken() !== null;
}

export async function adminFetch<T = unknown>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("adminToken");
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(endpoint, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Admin request failed (${response.status})`);
  }
  return payload as T;
}

/**
 * adminLogin — password comparison and token signing happen server-side.
 * Neither the plaintext admin password, bcrypt hash, nor service-role key is
 * ever sent to the browser.
 */
export async function adminLogin(params: { username?: string; password: string }): Promise<{
  token: string;
  admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
}> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: params.username, password: params.password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as {
    token: string;
    admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
  };
}
