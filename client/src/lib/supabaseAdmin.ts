/*
 * Browser-safe admin session helpers.
 *
 * Privileged Supabase service-role credentials must never be included in a Vite
 * client bundle. The compatibility client below sends admin CRUD through the
 * server-side endpoint, which verifies the signed admin token before using the
 * service role.
 */

import { supabase } from "./supabase";

type AdminTokenPayload = {
  id?: string;
  exp: number;
  role: string;
  username: string;
  permissions: Record<string, boolean>;
};

type QueryFilter = { field: string; operator: string; value: unknown };

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

export function decodeAdminToken(): AdminTokenPayload | null {
  try {
    const raw = localStorage.getItem("adminToken");
    if (!raw) return null;

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

  const response = await fetch(endpoint, { ...init, headers, credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Admin request failed (${response.status})`);
  return payload as T;
}

class AdminTableQuery {
  private readonly resource: string;
  private operation: "list" | "create" | "upsert" | "update" | "delete" = "list";
  private payload: Record<string, unknown> | Record<string, unknown>[] | undefined;
  private recordId: string | undefined;
  private filters: QueryFilter[] = [];
  private selectFields = "*";
  private orderSpec = "";
  private pageSize = 100;
  private offsetValue = 0;
  private singleResult = false;
  private onConflict = "";

  constructor(resource: string) {
    this.resource = resource;
  }

  select(fields = "*") {
    if (typeof fields === "string" && /^[a-zA-Z0-9_*, ]+$/.test(fields)) this.selectFields = fields;
    return this;
  }

  eq(field: string, value: unknown) { return this.filter(field, "eq", value); }
  neq(field: string, value: unknown) { return this.filter(field, "neq", value); }
  ilike(field: string, value: unknown) { return this.filter(field, "ilike", value); }
  in(field: string, value: unknown[]) { return this.filter(field, "in", value); }
  contains(field: string, value: unknown) { return this.filter(field, "cs", value); }
  order(field: string, options: { ascending?: boolean } = {}) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) this.orderSpec = `${field}.${options.ascending === false ? "desc" : "asc"}`;
    return this;
  }
  limit(value: number) {
    if (Number.isFinite(value)) this.pageSize = Math.min(100, Math.max(1, Math.floor(value)));
    return this;
  }
  range(from: number, to: number) {
    if (Number.isFinite(from) && Number.isFinite(to)) {
      this.offsetValue = Math.max(0, Math.floor(from));
      this.pageSize = Math.min(100, Math.max(1, Math.floor(to - from + 1)));
    }
    return this;
  }
  insert(value: Record<string, unknown> | Record<string, unknown>[]) {
    this.operation = "create";
    this.payload = value;
    return this;
  }
  upsert(value: Record<string, unknown> | Record<string, unknown>[], options: { onConflict?: string } = {}) {
    this.operation = "upsert";
    this.payload = value;
    this.onConflict = typeof options.onConflict === "string" ? options.onConflict : "";
    return this;
  }
  update(value: Record<string, unknown>) {
    this.operation = "update";
    this.payload = value;
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  single() { this.singleResult = true; return this; }
  maybeSingle() { this.singleResult = true; return this; }

  private filter(field: string, operator: string, value: unknown) {
    if (this.operation === "update" || this.operation === "delete") {
      if (field === "id") this.recordId = String(value);
      else this.filters.push({ field, operator, value });
    } else {
      this.filters.push({ field, operator, value });
    }
    return this;
  }

  private async execute(): Promise<{ data: any; error: { message: string } | null; count?: number }> {
    try {
      const response = await adminFetch<any>("/api/admin/rebuild", {
        method: "POST",
        body: JSON.stringify({
          action: "admin-table",
          type: this.resource,
          operation: this.operation,
          ...(this.recordId ? { id: this.recordId } : {}),
          ...(this.operation === "create" || this.operation === "upsert" || this.operation === "update" ? { row: this.payload || {} } : {}),
          ...(this.operation === "list" ? {
            page: 1,
            pageSize: this.pageSize,
            offset: this.offsetValue,
            select: this.selectFields,
            order: this.orderSpec,
            filters: this.filters,
          } : {}),
          ...(this.operation === "upsert" && this.onConflict ? { onConflict: this.onConflict } : {}),
        }),
      });
      const rows = Array.isArray(response?.data) ? response.data : response?.data == null ? [] : [response.data];
      const data = this.singleResult ? (rows[0] ?? null) : (this.operation === "list" || this.operation === "create" || this.operation === "upsert" || this.operation === "update" ? rows : response?.data);
      return { data, count: response?.count ?? rows.length, error: null };
    } catch (error: any) {
      return { data: this.singleResult ? null : [], count: 0, error: { message: error?.message || "Admin request failed" } };
    }
  }

  then<TResult1 = { data: any; error: { message: string } | null; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: { message: string } | null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * Deprecated name retained for compatibility. It is not a service-role client:
 * every query is sent to the authenticated server boundary.
 */
export const supabaseService: any = {
  from: (resource: string) => new AdminTableQuery(resource),
  storage: supabase.storage,
};

export async function adminLogin(params: { username?: string; password: string }): Promise<{
  token: string;
  admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
}> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: params.username, password: params.password }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as {
    token: string;
    admin: { roles: string[]; role: string; username: string; permissions: Record<string, boolean> };
  };
}
