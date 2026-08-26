import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabaseShim } from "./supabaseShim";
import { supabase } from "./supabase";

function requiresAdminToken(url: string): boolean {
  return url.startsWith("/api/admin/") || url.startsWith("/api/scrape/") || url === "/api/send-email" || url.startsWith("/api/send-email?");
}

async function getAuthHeaders(preferAdmin = false): Promise<Record<string, string>> {
  if (preferAdmin) {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) return { Authorization: `Bearer ${adminToken}` };
  }
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) return { Authorization: `Bearer ${data.session.access_token}` };
  } catch {
    // Public requests remain usable when Supabase is not configured.
  }
  if (!preferAdmin) {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) return { Authorization: `Bearer ${adminToken}` };
  }
  const userToken = localStorage.getItem("userToken");
  return userToken ? { Authorization: `Bearer ${userToken}` } : {};
}

const SERVER_API_PREFIXES = [
  "/api/admin/", "/api/scrape/", "/api/auth/", "/api/ai/", "/api/images/",
  "/api/player/", "/api/send-email", "/api/sitemap", "/api/prerender",
];

function isServerApi(url: string) {
  return SERVER_API_PREFIXES.some(prefix => url === prefix || url.startsWith(prefix));
}

function normalizeSiteSettings(row: any): any {
  const source = row || {};
  return {
    ...source,
    reviewVerificationEnabled: source.reviewVerificationEnabled ?? source.review_verification_enabled ?? false,
    reviewVerificationVideoUrl: source.reviewVerificationVideoUrl ?? source.review_verification_video_url ?? "",
    reviewVerificationPrompt: source.reviewVerificationPrompt ?? source.review_verification_prompt ?? "",
    reviewVerificationPassphrase: "",
    reviewVerificationTimecode: source.reviewVerificationTimecode ?? source.review_verification_timecode ?? "",
    reviewVerificationYouTubeChannelUrl: source.reviewVerificationYouTubeChannelUrl ?? source.review_verification_you_tube_channel_url ?? "",
    announcementsEnabled: source.announcementsEnabled ?? source.announcements_enabled ?? true,
    seoTitle: source.seoTitle ?? source.seo_title ?? "CrossFire Wiki",
    seoDescription: source.seoDescription ?? source.seo_description ?? "",
    seoKeywords: source.seoKeywords ?? source.seo_keywords ?? [],
    seoOgImageUrl: source.seoOgImageUrl ?? source.seo_og_image_url ?? "",
    heroImage: source.heroImage ?? source.hero_image ?? "",
    featuredWeapons: source.featuredWeapons ?? source.featured_weapons ?? [],
    featuredEventId: source.featuredEventId ?? source.featured_event_id ?? "",
    secondaryEventIds: source.secondaryEventIds ?? source.secondary_event_ids ?? [],
    publicBaseUrl: source.publicBaseUrl ?? source.public_base_url ?? "",
  };
}

const SITE_SETTINGS_FIELD_MAP: Record<string, string> = {
  reviewVerificationEnabled: "review_verification_enabled",
  reviewVerificationVideoUrl: "review_verification_video_url",
  reviewVerificationPrompt: "review_verification_prompt",
  reviewVerificationPassphrase: "review_verification_passphrase",
  reviewVerificationTimecode: "review_verification_timecode",
  reviewVerificationYouTubeChannelUrl: "review_verification_you_tube_channel_url",
  announcementsEnabled: "announcements_enabled",
  seoTitle: "seo_title",
  seoDescription: "seo_description",
  seoKeywords: "seo_keywords",
  seoOgImageUrl: "seo_og_image_url",
  heroImage: "hero_image",
  backgroundImageUrl: "hero_image",
  seoOgImage: "seo_og_image_url",
  featuredWeapons: "featured_weapons",
  featuredEventId: "featured_event_id",
  secondaryEventIds: "secondary_event_ids",
  publicBaseUrl: "public_base_url",
};

async function adminSiteSettingsRequest(method: string, data?: any): Promise<any> {
  const list = await fetchJson("/api/admin/rebuild", "POST", {
    action: "admin-table", type: "site_settings", operation: "list", page: 1, pageSize: 1, select: "*",
  });
  const current = Array.isArray(list?.data) ? list.data[0] : null;
  if (method === "GET") return normalizeSiteSettings(current);
  if (!current?.id) throw new Error("Site settings row not found");
  const row: Record<string, unknown> = {};
  const currentColumns = new Set(Object.keys(current));
  for (const [key, value] of Object.entries(data || {})) {
    const column = SITE_SETTINGS_FIELD_MAP[key] || key;
    if (column === "review_verification_passphrase") {
      if (typeof value !== "string" || !value.trim()) continue;
      row[column] = value;
      continue;
    }
    if (!currentColumns.has(column)) continue;
    row[column] = value;
  }
  const updated = await fetchJson("/api/admin/rebuild", "POST", {
    action: "admin-table", type: "site_settings", operation: "update", id: current.id, row,
  });
  return normalizeSiteSettings({ ...current, ...(Array.isArray(updated?.data) ? updated.data[0] : updated?.data || row) });
}

async function fetchJson(url: string, method: string, data?: unknown): Promise<any> {
  const headers: Record<string, string> = {
    ...(await getAuthHeaders(requiresAdminToken(url))),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  const text = await res.text();
  let payload: any;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!res.ok) throw new Error(`${res.status}: ${payload?.error || payload || res.statusText}`);
  return payload;
}

/** Use the real server for deployed functions; use the shim only for virtual DB routes. */
export async function apiRequest(
  url: string,
  method: string,
  data?: unknown,
): Promise<any> {
  if (url === "/api/settings/site" || url === "/api/admin/settings/site" || url === "/api/public/settings/site") {
    return adminSiteSettingsRequest(method, data);
  }
  if (url === "/api/public/settings/seo" && method === "GET") {
    const settings = await adminSiteSettingsRequest("GET");
    return { publicBaseUrl: settings.publicBaseUrl, seoTitle: settings.seoTitle, seoDescription: settings.seoDescription, seoKeywords: settings.seoKeywords, seoOgImage: settings.seoOgImageUrl, backgroundImageUrl: settings.heroImage, robots: settings.robots || "index, follow" };
  }
  if (isServerApi(url)) return fetchJson(url, method, data);
  if (url.startsWith('/api/') || (url.startsWith('/') && !url.startsWith('//'))) {
    try { return await supabaseShim(url, method, data); }
    catch (err: any) { throw new Error(err?.message || String(err)); }
  }
  return fetchJson(url, method, data);
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: { on401: UnauthorizedBehavior }): QueryFunction<T> {
  return async ({ queryKey }) => {
    const key = queryKey[0] as string;

    if (key && isServerApi(key)) {
      try { return (await fetchJson(key, 'GET')) as T; }
      catch (err: any) {
        if (options.on401 === "returnNull" && String(err?.message || "").startsWith("401:")) return null as unknown as T;
        throw err;
      }
    }
    if (key && key.startsWith('/api/')) {
      try { return (await supabaseShim(key, 'GET')) as T; }
      catch (err: any) {
        if (options.on401 === "returnNull") return null as unknown as T;
        throw err;
      }
    }

    const headers = await getAuthHeaders(false);
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
