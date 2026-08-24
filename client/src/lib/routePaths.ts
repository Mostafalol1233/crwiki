/**
 * Route helpers for the localized Wouter router.
 *
 * The Arabic router is mounted with base="/ar", so internal links must stay
 * base-relative. These helpers also clean legacy database values that may
 * contain an /ar prefix or suffix.
 */
export function baseRelativePath(value: unknown, fallback = "/"): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;

  // Keep external URLs untouched; these are not router paths.
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(raw)) return raw;

  let path = raw.replace(/^\/+/, "/");
  path = path.replace(/^(?:\/ar)+(?=\/|$)/i, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function localizedPath(value: unknown, language: "en" | "ar"): string {
  const path = baseRelativePath(value, "/");
  if (language !== "ar") return path;
  return path === "/" ? "/ar" : `/ar${path}`;
}

export function pagePath(value: unknown): string {
  let path = baseRelativePath(value, "");
  path = path.replace(/^\/pages(?=\/|$)/i, "") || "/";
  path = path.replace(/^\/+/, "").replace(/\/ar\/?$/i, "");
  return path ? `/pages/${path}` : "/pages";
}

export function eventPath(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "/events";

  let path = baseRelativePath(raw, "");
  path = path.replace(/^\/events(?=\/|$)/i, "") || "/";
  path = path.replace(/^\/+/, "");
  path = path.replace(/\/ar\/?$/i, "");
  path = path.replace(/^ar\//i, "");
  return path ? `/events/${path}` : "/events";
}
