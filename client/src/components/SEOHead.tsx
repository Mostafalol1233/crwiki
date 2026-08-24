import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  twitterImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  schemaType?: string;
  schemaData?: Record<string, any>;
  robots?: string;
  noindex?: boolean;
  onlySchema?: boolean;
  /** article:published_time ISO string */
  articlePublishedTime?: string;
  /** article:modified_time ISO string */
  articleModifiedTime?: string;
  /** article:author name */
  articleAuthor?: string;
  /** article:section e.g. "Events" */
  articleSection?: string;
  /** article:tag array */
  articleTags?: string[];
  /** hreflang alternates e.g. [{ lang: "ar", url: "https://crossfire.wiki/ar/..." }] */
  hreflangAlternates?: { lang: string; url: string }[];
  /** breadcrumb trail for BreadcrumbList schema */
  breadcrumbs?: BreadcrumbItem[];
  /** additional JSON-LD schemas to inject alongside the primary one */
  extraSchemas?: Array<{ "@type": string; [key: string]: any }>;
  /** publisher info for NewsArticle / BlogPosting */
  publisher?: { name: string; logoUrl: string };
}

export function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  twitterImage,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogUrl,
  schemaType,
  schemaData,
  robots,
  noindex = false,
  onlySchema = false,
  ogImageAlt,
  ogImageWidth = 1200,
  ogImageHeight = 630,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags,
  hreflangAlternates,
  breadcrumbs,
  extraSchemas,
  publisher,
}: SEOHeadProps) {
  const [location] = useLocation();
  const envBase = (import.meta as any).env?.VITE_PUBLIC_BASE_URL || '';
  const [siteSeo, setSiteSeo] = useState<{
    publicBaseUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    seoOgImage?: string;
    robots?: string;
  } | null>(null);

  const currentOrigin = (siteSeo?.publicBaseUrl || envBase || "https://crossfire.wiki").replace(/\/$/, "");
  const canonicalOrigin = "https://crossfire.wiki";
  const baseUrl =
    typeof window !== "undefined" && /crossfire\.wiki/i.test(window.location.hostname)
      ? canonicalOrigin
      : currentOrigin;
  const currentUrl = baseUrl + location;

  const normalizeUrl = (u: string) =>
    u.replace("http://www.crossfire.wiki", canonicalOrigin)
      .replace("http://crossfire.wiki", canonicalOrigin)
      .replace("https://www.crossfire.wiki", canonicalOrigin);

  const finalCanonical = normalizeUrl(canonicalUrl || currentUrl);
  const finalOgUrl = normalizeUrl(ogUrl || finalCanonical);
  const isArabicPage = location === "/ar" || location.startsWith("/ar/");

  const normalizeTitle = (s?: string) =>
    s ? s.replace(/\s*-\s*/g, " | ").replace(/\s*—\s*/g, " | ") : s;

  const defaultTitle = "CrossFire Wiki | Weapons, Maps, Ranks, Events & Guides";
  const defaultDescription =
    "An independent CrossFire reference covering weapons, characters, modes, ranks, maps, events, tutorials, and community guides in English and Arabic.";

  const finalTitle = normalizeTitle(title) || normalizeTitle(siteSeo?.seoTitle) || defaultTitle;
  const finalDescription = description || siteSeo?.seoDescription || defaultDescription;
  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDescription = ogDescription || finalDescription;

  const defaultSeoLogo = `${baseUrl}/logo-new.png`;
  const resolveAbsolute = (img?: string) => {
    const src = img || '';
    if (!src) return defaultSeoLogo;
    // Already absolute (http/https or //cdn)
    if (/^https?:\/\//i.test(src) || src.startsWith('//')) return src;
    try {
      const u = new URL(src, baseUrl);
      return u.protocol.startsWith('http') ? u.toString() : `${baseUrl}${src.startsWith('/') ? src : `/${src}`}`;
    } catch {
      return defaultSeoLogo;
    }
  };

  const finalOgImage = resolveAbsolute(ogImage || siteSeo?.seoOgImage);
  const finalTwitterImage = resolveAbsolute(twitterImage || finalOgImage);
  const robotsValue = noindex ? "noindex, follow" : robots || siteSeo?.robots || "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getSiteSettings } = await import("@/lib/supabaseApi");
        const data = await getSiteSettings();
        if (!cancelled && data) setSiteSeo(data);
      } catch {
        // gracefully ignore when Supabase is unavailable
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────────────────
    if (!onlySchema) {
      document.title = finalTitle;
    }

    // ── Clean up previous dynamic tags ────────────────────────────────────────
    if (!onlySchema) {
      document.querySelectorAll('meta[data-seo="true"]').forEach((m) => m.remove());
      document.querySelector('link[rel="canonical"][data-seo="true"]')?.remove();
      document.querySelectorAll('link[rel="alternate"][data-seo="true"]').forEach((l) => l.remove());
    }
    document.querySelectorAll('script[type="application/ld+json"][data-seo="true"]').forEach((s) => s.remove());

    // ── Base keywords ──────────────────────────────────────────────────────────
    const baseKeywords = [
      "CrossFire", "Crossfire", "CF", "Cross Fire",
      "CrossFire Wiki", "كروس فاير ويكي", "شرح كروس فاير",
      "ايفنتات كروس فاير", "خرائط كروس فاير", "أسلحة كروس فاير",
      "Z8Games", "FPS", "Shooter",
    ];
    const uniqueKeywords = Array.from(new Set([...(keywords || []), ...baseKeywords]));

    const imgType = finalOgImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const altText = ogImageAlt || finalOgTitle;

    // ── Meta tags ──────────────────────────────────────────────────────────────
    const metaTags: Array<{ name?: string; property?: string; content: string; httpEquiv?: string }> = !onlySchema
      ? [
          // Core
          { name: "description", content: finalDescription },
          { name: "keywords", content: uniqueKeywords.join(", ") },
          { name: "robots", content: robotsValue },
          { name: "googlebot", content: robotsValue },
          { name: "bingbot", content: robotsValue },
          // Open Graph
          { property: "og:site_name", content: "CrossFire Wiki" },
          { property: "og:locale", content: isArabicPage ? "ar_AR" : "en_US" },
          { property: "og:locale:alternate", content: isArabicPage ? "en_US" : "ar_AR" },
          { property: "og:title", content: finalOgTitle },
          { property: "og:description", content: finalOgDescription },
          { property: "og:image", content: finalOgImage },
          { property: "og:image:secure_url", content: finalOgImage },
          { property: "og:image:type", content: imgType },
          { property: "og:image:width", content: String(ogImageWidth) },
          { property: "og:image:height", content: String(ogImageHeight) },
          { property: "og:image:alt", content: altText },
          { property: "og:type", content: ogType },
          { property: "og:url", content: finalOgUrl },
          // Twitter / X
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:site", content: "@crossfirewiki" },
          { name: "twitter:creator", content: "@crossfirewiki" },
          { name: "twitter:title", content: finalOgTitle },
          { name: "twitter:description", content: finalOgDescription },
          { name: "twitter:image", content: finalTwitterImage },
          { name: "twitter:image:alt", content: altText },
          // WhatsApp / Telegram rich previews
          { property: "og:image:secure_url", content: finalOgImage },
        ]
      : [];

    // Article-specific OG tags
    if (!onlySchema && ogType === "article") {
      if (articlePublishedTime) metaTags.push({ property: "article:published_time", content: articlePublishedTime });
      if (articleModifiedTime)  metaTags.push({ property: "article:modified_time",  content: articleModifiedTime });
      if (articleAuthor)        metaTags.push({ property: "article:author",          content: articleAuthor });
      if (articleSection)       metaTags.push({ property: "article:section",         content: articleSection });
      (articleTags || []).forEach((tag) => metaTags.push({ property: "article:tag", content: tag }));
    }

    metaTags.forEach((tag) => {
      const meta = document.createElement("meta");
      if (tag.name)      meta.setAttribute("name",     tag.name);
      if (tag.property)  meta.setAttribute("property", tag.property);
      if (tag.httpEquiv) meta.setAttribute("http-equiv", tag.httpEquiv);
      meta.setAttribute("content", tag.content);
      meta.setAttribute("data-seo", "true");
      document.head.appendChild(meta);
    });

    // ── Canonical ─────────────────────────────────────────────────────────────
    if (!onlySchema) {
      const canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", finalCanonical);
      canonical.setAttribute("data-seo", "true");
      document.head.appendChild(canonical);

      // hreflang alternates
      const alternates: Array<{ lang: string; url: string }> = [
        { lang: "x-default", url: finalCanonical },
        ...(hreflangAlternates || []),
      ];
      alternates.forEach(({ lang, url }) => {
        const link = document.createElement("link");
        link.setAttribute("rel", "alternate");
        link.setAttribute("hreflang", lang);
        link.setAttribute("href", url);
        link.setAttribute("data-seo", "true");
        document.head.appendChild(link);
      });
    }

    // ── JSON-LD schemas ───────────────────────────────────────────────────────
    const injectSchema = (obj: Record<string, any>) => {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo", "true");
      script.textContent = JSON.stringify(obj);
      document.head.appendChild(script);
    };

    // Primary schema
    if (schemaType && schemaData) {
      const primarySchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": schemaType,
        ...schemaData,
      };

      // Inject publisher into NewsArticle / BlogPosting automatically
      if (["NewsArticle", "BlogPosting", "Article"].includes(schemaType)) {
        const pub = publisher || { name: "CrossFire Wiki", logoUrl: `${baseUrl}/logo-new.png` };
        if (!primarySchema.publisher) {
          primarySchema.publisher = {
            "@type": "Organization",
            name: pub.name,
            logo: {
              "@type": "ImageObject",
              url: pub.logoUrl,
              width: 512,
              height: 512,
            },
          };
        }
        if (!primarySchema.mainEntityOfPage) {
          primarySchema.mainEntityOfPage = {
            "@type": "WebPage",
            "@id": finalCanonical,
          };
        }
      }

      injectSchema(primarySchema);
    }

    // BreadcrumbList schema
    if (breadcrumbs && breadcrumbs.length > 0) {
      injectSchema({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
        })),
      });
    }

    // Extra schemas
    (extraSchemas || []).forEach((schema) => {
      injectSchema({ "@context": "https://schema.org", ...schema });
    });

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      if (!onlySchema) {
        document.querySelectorAll('meta[data-seo="true"]').forEach((m) => m.remove());
        document.querySelector('link[rel="canonical"][data-seo="true"]')?.remove();
        document.querySelectorAll('link[rel="alternate"][data-seo="true"]').forEach((l) => l.remove());
      }
      document.querySelectorAll('script[type="application/ld+json"][data-seo="true"]').forEach((s) => s.remove());
    };
  }, [
    finalTitle,
    finalDescription,
    keywords,
    finalCanonical,
    finalOgImage,
    finalTwitterImage,
    finalOgTitle,
    finalOgDescription,
    ogType,
    finalOgUrl,
    schemaType,
    schemaData,
    robotsValue,
    onlySchema,
    articlePublishedTime,
    articleModifiedTime,
    articleAuthor,
    articleSection,
    JSON.stringify(articleTags),
    JSON.stringify(hreflangAlternates),
    JSON.stringify(breadcrumbs),
    JSON.stringify(extraSchemas),
    JSON.stringify(publisher),
  ]);

  return null;
}
