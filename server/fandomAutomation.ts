import { createHash } from "node:crypto";

import * as cheerio from "cheerio";

export type FandomPageRef = {
  title: string;
  url: string;
};

export type FandomPageResult = {
  title: string;
  sourceUrl: string;
  contentHtml: string;
  text: string;
  imageUrls: string[];
  videoUrls: string[];
  links: string[];
  sections: Array<{ index?: string; line?: string; anchor?: string }>;
};

function unique(values: string[], limit: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

function normalizeUrl(value: unknown, baseUrl: string): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const parsed = new URL(value.trim(), baseUrl);
    if (parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function pageTitleFromUrl(url: string): string {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/wiki\/(.+)$/i);
  if (!match) throw new Error("Fandom URL must use the /wiki/Page_Name format");
  return decodeURIComponent(match[1]).replaceAll("_", " ").trim();
}

function sourceApiUrl(sourceUrl: string, params: Record<string, string>): string {
  const origin = new URL(sourceUrl).origin;
  const apiUrl = new URL("/api.php", origin);
  apiUrl.search = new URLSearchParams({ ...params, format: "json", formatversion: "2", origin: "*" }).toString();
  return apiUrl.toString();
}

async function fetchJson(url: string, timeoutMs = 25000): Promise<any> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CrossFireWikiBot/1.0 (+verified-content-import)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.error) throw new Error(payload?.error?.info || `Fandom API HTTP ${response.status}`);
  return payload;
}

function sanitizeHtml(html: string, baseUrl: string): { html: string; imageUrls: string[]; videoUrls: string[]; links: string[]; text: string } {
  const $ = cheerio.load(`<div id="__fandom_root__">${html}</div>`);
  $("script,style,object,embed,form,button,input,textarea,select,nav,.navbox,.toc,.mw-editsection,.mw-indicators,.portable-infobox .pi-data-source").remove();
  $("*").each((_index, element) => {
    const attributes = (element as { attribs?: Record<string, string> }).attribs || {};
    for (const attribute of Object.keys(attributes)) {
      if (attribute.toLowerCase().startsWith("on")) $(element).removeAttr(attribute);
    }
  });

  const imageUrls: string[] = [];
  $("img").each((_index, element) => {
    const value = $(element).attr("src") || $(element).attr("data-src") || $(element).attr("data-image-url") || "";
    const normalized = normalizeUrl(value, baseUrl);
    if (!normalized) {
      $(element).remove();
      return;
    }
    imageUrls.push(normalized);
    $(element).attr("src", normalized).removeAttr("srcset").removeAttr("data-src").removeAttr("data-image-url");
  });

  const videoUrls: string[] = [];
  $("iframe,video source,a").each((_index, element) => {
    const value = $(element).attr("src") || $(element).attr("href") || "";
    const normalized = normalizeUrl(value, baseUrl);
    if (normalized && /(^|\.)((youtube\.com)|(youtube-nocookie\.com)|(youtu\.be)|(vimeo\.com))$/i.test(new URL(normalized).hostname)) {
      videoUrls.push(normalized);
    }
  });

  const links: string[] = [];
  $("a[href]").each((_index, element) => {
    const normalized = normalizeUrl($(element).attr("href"), baseUrl);
    if (!normalized) {
      $(element).replaceWith($(element).text());
      return;
    }
    links.push(normalized);
    $(element).attr("href", normalized).attr("rel", "nofollow noopener noreferrer").attr("target", "_blank");
  });

  $("iframe").each((_index, element) => {
    const normalized = normalizeUrl($(element).attr("src"), baseUrl);
    const hostname = normalized ? new URL(normalized).hostname.toLowerCase() : "";
    const allowed = hostname === "youtu.be" || hostname.endsWith("youtube.com") || hostname.endsWith("youtube-nocookie.com") || hostname.endsWith("vimeo.com");
    if (!allowed) $(element).remove();
    else $(element).attr("src", normalized).attr("loading", "lazy").attr("referrerpolicy", "strict-origin-when-cross-origin").removeAttr("allow").removeAttr("allowfullscreen");
  });

  const root = $("#__fandom_root__");
  const output = root.html() || "";
  const text = root.text().replace(/\s+/g, " ").trim();
  return {
    html: output.slice(0, 500000),
    text: text.slice(0, 500000),
    imageUrls: unique(imageUrls, 300),
    videoUrls: unique(videoUrls, 100),
    links: unique(links, 500),
  };
}

export async function discoverFandomCategory(rootUrl: string, category: string, limit = 25): Promise<FandomPageRef[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const normalizedCategory = category.replace(/^Category:/i, "").trim();
  if (!normalizedCategory) throw new Error("Fandom category is required");
  const payload = await fetchJson(sourceApiUrl(rootUrl, {
    action: "query",
    list: "categorymembers",
    cmtitle: `Category:${normalizedCategory}`,
    cmnamespace: "0",
    cmlimit: String(safeLimit),
  }));
  const origin = new URL(rootUrl).origin;
  return (Array.isArray(payload?.query?.categorymembers) ? payload.query.categorymembers : [])
    .map((row: any) => {
      const title = typeof row?.title === "string" ? row.title.trim() : "";
      return title ? { title, url: new URL(`/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`, origin).toString() } : null;
    })
    .filter(Boolean) as FandomPageRef[];
}

export async function scrapeFandomPage(sourceUrl: string): Promise<FandomPageResult> {
  const title = pageTitleFromUrl(sourceUrl);
  const payload = await fetchJson(sourceApiUrl(sourceUrl, {
    action: "parse",
    page: title,
    prop: "text|wikitext|images|externallinks|sections|links|displaytitle",
  }));
  const parsed = payload?.parse;
  if (!parsed) throw new Error("Fandom page could not be parsed");
  const sanitized = sanitizeHtml(typeof parsed.text === "string" ? parsed.text : "", sourceUrl);
  const apiLinks = Array.isArray(parsed.links)
    ? parsed.links.map((link: any) => typeof link === "string" ? link : String(link?.title || "")).filter(Boolean).map((link: string) => {
      try { return new URL(`/wiki/${encodeURIComponent(link.replaceAll(" ", "_"))}`, new URL(sourceUrl).origin).toString(); } catch { return ""; }
    })
    : [];
  return {
    title: String(parsed.title || parsed.displaytitle || title).replace(/<[^>]+>/g, "").trim().slice(0, 200),
    sourceUrl,
    contentHtml: sanitized.html,
    text: sanitized.text,
    imageUrls: sanitized.imageUrls,
    videoUrls: sanitized.videoUrls,
    links: unique([...sanitized.links, ...apiLinks], 500),
    sections: Array.isArray(parsed.sections) ? parsed.sections.slice(0, 100).map((section: any) => ({ index: section.index, line: section.line, anchor: section.anchor })) : [],
  };
}

export function buildFandomDraft(page: FandomPageResult) {
  const slugHash = createHash("sha256").update(page.sourceUrl).digest("hex").slice(0, 16);
  const title = page.title || "Fandom wiki page";
  const sourceBlock = `<hr><p><strong>Source:</strong> <a href="${escapeHtml(page.sourceUrl)}" rel="nofollow noopener noreferrer" target="_blank">${escapeHtml(page.sourceUrl)}</a></p>`;
  return {
    slug: `fandom-${slugHash}`,
    title_en: title,
    title_ar: "",
    content_en: `${page.contentHtml}${sourceBlock}`.slice(0, 500000),
    content_ar: "",
    template: "wiki",
    status: "draft",
    show_in_nav: false,
    seo_title: title.slice(0, 160),
    seo_description: page.text.slice(0, 300),
  };
}
