import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
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
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
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
}: SEOHeadProps) {
  const [location] = useLocation();
  const envBase = (import.meta as any).env?.VITE_PUBLIC_BASE_URL || '';
  const [siteSeo, setSiteSeo] = useState<{ publicBaseUrl?: string; seoTitle?: string; seoDescription?: string; seoKeywords?: string[]; seoOgImage?: string; robots?: string } | null>(null);
  const currentOrigin = (siteSeo?.publicBaseUrl || envBase || (typeof window !== "undefined" ? window.location.origin : "https://crossfire.wiki")).replace(/\/$/, "");
  const canonicalOrigin = "https://crossfire.wiki";
  const baseUrl = (typeof window !== "undefined" && /crossfire\.wiki/i.test(window.location.hostname))
    ? canonicalOrigin
    : currentOrigin;
  const currentUrl = baseUrl + location;
  const finalCanonical = (canonicalUrl || currentUrl).replace("http://www.crossfire.wiki", canonicalOrigin).replace("http://crossfire.wiki", canonicalOrigin).replace("https://www.crossfire.wiki", canonicalOrigin);
  const finalOgUrl = ogUrl || currentUrl;
  const normalizeTitle = (s?: string) => {
    if (!s) return s;
    return s.replace(/\s*-\s*/g, " | ").replace(/\s*—\s*/g, " | ");
  };
  const defaultTitle = "CrossFire Wiki | Weapons | Modes | Guides | Community";
  const defaultDescription = "CrossFire Wiki: weapons, modes, tutorials, ranks, events, and community resources. Master CrossFire with up-to-date guides, maps and competitive intel.";
  const finalTitle = normalizeTitle(title) || normalizeTitle(siteSeo?.seoTitle) || defaultTitle;
  const finalDescription = description || siteSeo?.seoDescription || defaultDescription;
  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDescription = ogDescription || finalDescription;
  const defaultSeoLogo = `${baseUrl}/logo-new.png`;
  const resolveAbsolute = (img?: string) => {
    const src = img || '';
    if (!src) return defaultSeoLogo;
    try {
      const u = new URL(src, baseUrl);
      const abs = u.protocol.startsWith('http') ? u.toString() : `${baseUrl}${src.startsWith('/') ? src : `/${src}`}`;
      return abs;
    } catch {
      return defaultSeoLogo;
    }
  };
  const finalOgImage = resolveAbsolute(ogImage || siteSeo?.seoOgImage);
  const finalTwitterImage = resolveAbsolute(twitterImage || finalOgImage);
  const robotsValue = noindex ? "noindex, follow" : robots || siteSeo?.robots || "index, follow";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/public/settings/seo');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSiteSeo(data);
      } catch {
        // gracefully ignore when backend is unavailable
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!onlySchema) {
      document.title = finalTitle;
    }

    if (!onlySchema) {
      const existingMeta = document.querySelectorAll('meta[data-seo="true"]');
      existingMeta.forEach((meta) => meta.remove());
      const existingCanonical = document.querySelector('link[rel="canonical"][data-seo="true"]');
      if (existingCanonical) existingCanonical.remove();
    }

    // Remove existing schema
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
    if (existingSchema) existingSchema.remove();

    // Create and append meta tags
    const baseKeywords = [
      "CrossFire",
      "Crossfire",
      "CF",
      "Cross Fire",
      "CrossFire Wiki",
      "كروس فاير ويكي",
      "شرح كروس فاير",
      "ايفنتات كروس فاير",
      "خرائط كروس فاير",
      "أسلحة كروس فاير",
      "Z8Games",
      "FPS",
      "Shooter",
    ];

    const uniqueKeywords = Array.from(new Set([...(keywords || []), ...baseKeywords]));

    const imgType = finalOgImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const altText = ogImageAlt || finalOgTitle;
    const metaTags = !onlySchema
      ? [
          { name: "description", content: finalDescription },
          { name: "keywords", content: uniqueKeywords.join(", ") },
          { name: "robots", content: robotsValue },
          { property: "og:site_name", content: "CrossFire Wiki" },
          { property: "og:locale", content: "en_US" },
          { property: "og:locale:alternate", content: "ar_AR" },
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
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:site", content: "@crossfirewiki" },
          { name: "twitter:title", content: finalOgTitle },
          { name: "twitter:description", content: finalOgDescription },
          { name: "twitter:image", content: finalTwitterImage },
          { name: "twitter:image:alt", content: altText },
        ]
      : [];

    metaTags.forEach((tag) => {
      const meta = document.createElement("meta");
      if (tag.name) {
        meta.setAttribute("name", tag.name);
      }
      if (tag.property) {
        meta.setAttribute("property", tag.property);
      }
      meta.setAttribute("content", tag.content);
      meta.setAttribute("data-seo", "true");
      document.head.appendChild(meta);
    });

    if (!onlySchema) {
      const canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      canonical.setAttribute("href", finalCanonical);
      canonical.setAttribute("data-seo", "true");
      document.head.appendChild(canonical);
    }

    // Add Schema.org JSON-LD
    if (schemaType && schemaData) {
      const schema = {
        "@context": "https://schema.org",
        "@type": schemaType,
        ...schemaData,
      };

      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute("data-seo", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (!onlySchema) {
        const metaToRemove = document.querySelectorAll('meta[data-seo="true"]');
        metaToRemove.forEach((meta) => meta.remove());
        const canonicalToRemove = document.querySelector('link[rel="canonical"][data-seo="true"]');
        if (canonicalToRemove) canonicalToRemove.remove();
      }
      const schemaToRemove = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
      if (schemaToRemove) schemaToRemove.remove();
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
  ]);

  return null;
}
