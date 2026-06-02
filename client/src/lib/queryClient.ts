import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabaseShim } from "./supabaseShim";

function getAuthHeaders(): Record<string, string> {
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("userToken");
  const headers: Record<string, string> = {};
  if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
  else if (userToken) headers["Authorization"] = `Bearer ${userToken}`;
  return headers;
}

/** Route /api/* through Supabase shim; everything else is a plain fetch */
export async function apiRequest(
  url: string,
  method: string,
  data?: unknown,
): Promise<any> {
  // All /api/ calls go through the Supabase shim (no backend needed)
  const apiPath = url.startsWith('/api/') ? url : url.startsWith('http') ? null : null;

  if (url.startsWith('/api/') || (url.startsWith('/') && !url.startsWith('//'))) {
    try {
      return await supabaseShim(url, method, data);
    } catch (err: any) {
      throw new Error(err?.message || String(err));
    }
  }

  // External URLs — plain fetch
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const key = queryKey[0] as string;

    // Route /api/ keys through shim
    if (key && key.startsWith('/api/')) {
      try {
        return (await supabaseShim(key, 'GET')) as T;
      } catch (err: any) {
        if (options.on401 === "returnNull") return null as unknown as T;
        throw err;
      }
    }

    // Plain fetch for other keys
    const headers = getAuthHeaders();
    const res = await fetch(key, { credentials: "include", headers });

    if (options.on401 === "returnNull" && res.status === 401) return null as unknown as T;
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    const text = await res.text();
    try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
