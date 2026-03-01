import { QueryClient, QueryFunction } from "@tanstack/react-query";

const rawBase = import.meta.env.VITE_API_URL as string | undefined;
let baseUrl = rawBase && rawBase.includes("://") ? rawBase : '';
if (!baseUrl) {
  // Use relative paths so the host (Vercel) proxies over HTTPS
  baseUrl = '';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("userToken");
  const csrf = localStorage.getItem("csrfToken") || '';
  const headers: Record<string, string> = {};

  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  } else if (userToken) {
    headers["Authorization"] = `Bearer ${userToken}`;
  }
  if (csrf) {
    headers["X-CSRF-Token"] = csrf;
  }

  return headers;
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  const headers = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON response: ${text.slice(0, 100)}...`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = getAuthHeaders();

    const fullUrl = baseUrl ? `${baseUrl}${queryKey.join("/")}` : queryKey.join("/");

    const res = await fetch(fullUrl, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Failed to parse JSON response from ${fullUrl}: ${text.slice(0, 100)}...`);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
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
