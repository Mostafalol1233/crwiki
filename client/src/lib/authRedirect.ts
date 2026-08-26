import { normalizeArabicLocalePath } from "./routePaths";

const AUTH_RETURN_KEY = "cf-auth-return-path-v1";

function normalizeInternalPath(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;

  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const pathname = normalizeArabicLocalePath(url.pathname || "/");

    // Never redirect an auth flow back into another auth page or an admin route.
    if (/^\/(?:login|register|reset-password)(?:\/|$)/i.test(pathname)) return null;
    if (/^\/admin(?:\/|$)/i.test(pathname)) return null;

    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getCurrentAuthReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  return normalizeInternalPath(`${window.location.pathname}${window.location.search}${window.location.hash}`);
}

export function rememberAuthReturnPath(path?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const safePath = normalizeInternalPath(path || getCurrentAuthReturnPath());
  if (!safePath) return null;
  try {
    window.sessionStorage.setItem(AUTH_RETURN_KEY, safePath);
  } catch {
    // Storage can be unavailable in private browsing; the query parameter remains enough.
  }
  return safePath;
}

export function getAuthReturnPath(search = typeof window === "undefined" ? "" : window.location.search): string {
  if (typeof window === "undefined") return "/profile";

  const queryPath = new URLSearchParams(search).get("redirect");
  const storedPath = (() => {
    try { return window.sessionStorage.getItem(AUTH_RETURN_KEY); } catch { return null; }
  })();
  return normalizeInternalPath(queryPath) || normalizeInternalPath(storedPath) || "/profile";
}

export function clearAuthReturnPath() {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(AUTH_RETURN_KEY); } catch { /* ignore */ }
}

export function buildAuthPath(route: "login" | "register", returnPath?: string | null): string {
  const safePath = normalizeInternalPath(returnPath || getCurrentAuthReturnPath());
  if (!safePath) return `/${route}`;
  try { window.sessionStorage.setItem(AUTH_RETURN_KEY, safePath); } catch { /* query parameter remains available */ }
  return `/${route}?redirect=${encodeURIComponent(safePath)}`;
}
