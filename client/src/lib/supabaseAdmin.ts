import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SERVICE_KEY  = (import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SERVICE_ROLE || '').trim();

// Service-role client — used only inside the admin panel for CRUD operations.
// The service key is bundled client-side; for a future hardening step, proxy
// all admin writes through a server-side API so this key is never exposed.
export const supabaseService = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, storageKey: 'sb-admin-auth' },
    })
  : null;

export function decodeAdminToken(): { role: string; username: string; permissions: Record<string, boolean> } | null {
  try {
    const raw = localStorage.getItem('adminToken');
    if (!raw) return null;
    const p = JSON.parse(atob(raw));
    if (p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return decodeAdminToken() !== null;
}

/**
 * adminLogin — all password comparison happens server-side via /api/admin/login.
 * Neither the plaintext admin password nor the bcrypt hash is ever sent to the
 * browser, and the service-role key is not used for authentication here.
 */
export async function adminLogin(params: { username?: string; password: string }): Promise<{
  token: string;
  admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
}> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: params.username, password: params.password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data as {
    token: string;
    admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
  };
}
