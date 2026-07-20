import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;
const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string;

// Service-role client — bypasses RLS for admin writes
// Uses a distinct storageKey so it doesn't conflict with the main anon client
export const supabaseService = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, storageKey: 'sb-admin-auth' },
    })
  : null;

function makeToken(payload: object): string {
  return btoa(JSON.stringify({ ...payload, exp: Date.now() + 86_400_000 * 7 }));
}

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

export async function adminLogin(params: { username?: string; password: string }): Promise<{
  token: string;
  admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
}> {
  const { username, password } = params;

  // ── Super-admin: password-only login ───────────────────────────────────────
  if (!username) {
    if (SUPER_ADMIN_PASSWORD && password === SUPER_ADMIN_PASSWORD) {
      const token = makeToken({ role: 'super_admin', username: 'super_admin', permissions: {} });
      return { token, admin: { roles: ['super_admin'], role: 'super_admin', username: 'super_admin', permissions: {} } };
    }
    // Also check admin_users table for super_admin role
    const client = supabaseService!;
    const { data: rows } = await client
      .from('admin_users')
      .select('*')
      .eq('role', 'super_admin')
      .limit(10);
    if (rows && rows.length > 0) {
      const { default: bcrypt } = await import('bcryptjs');
      for (const row of rows) {
        const valid = await bcrypt.compare(password, row.password_hash);
        if (valid) {
          const token = makeToken({ id: row.id, role: row.role, username: row.username, permissions: row.permissions || {} });
          return { token, admin: { roles: [row.role], role: row.role, username: row.username, permissions: row.permissions || {} } };
        }
      }
    }
    throw new Error('Invalid password');
  }

  // ── Regular admin: username + password ────────────────────────────────────
  const client = supabaseService!;
  const { data, error } = await client
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !data) throw new Error('Invalid credentials');

  const { default: bcrypt } = await import('bcryptjs');
  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const token = makeToken({
    id: data.id,
    role: data.role,
    username: data.username,
    permissions: data.permissions || {},
  });

  return {
    token,
    admin: {
      roles: [data.role],
      role: data.role,
      username: data.username,
      permissions: data.permissions || {},
    },
  };
}
