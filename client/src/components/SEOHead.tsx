import { useEffect } from "react";
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
}: SEOHeadProps) {
  const [location] = useLocation();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const currentUrl = baseUrl + location;
  const finalCanonical = canonicalUrl || currentUrl;
  const finalOgUrl = ogUrl || currentUrl;
  const finalTitle = title || "Bimora Gaming Blog - CrossFire News, Guides & Updates";
  const finalDescription = description || "Explore CrossFire gaming news, character guides, and community updates. Your source for all things CrossFire.";
  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDescription = ogDescription || finalDescription;
  const finalOgImage = ogImage || `${baseUrl}/og-default.jpg`;
  const finalTwitterImage = twitterImage || finalOgImage;
  const robotsValue = noindex ? "noindex, follow" : robots || "index, follow";

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Remove existing meta tags
    const existingMeta = document.querySelectorAll('meta[data-seo="true"]');
    existingMeta.forEach((meta) => meta.remove());

    // Remove existing canonical
    const existingCanonical = document.querySelector('link[rel="canonical"][data-seo="true"]');
    if (existingCanonical) existingCanonical.remove();

    // Remove existing schema
    const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo="true"]');
    if (existingSchema) existingSchema.remove();

    // Create and append meta tags
    const metaTags = [
      { name: "description", content: finalDescription },
      { name: "keywords", content: keywords?.join(", ") || "" },
      { name: "robots", content: robotsValue },
      { property: "og:title", content: finalOgTitle },
      { property: "og:description", content: finalOgDescription },
      { property: "og:image", content: finalOgImage },
      { property: "og:type", content: ogType },
      { property: "og:url", content: finalOgUrl },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: finalOgTitle },
      { name: "twitter:description", content: finalOgDescription },
      { name: "twitter:image", content: finalTwitterImage },
    ];

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

    // Add canonical link
    const canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", finalCanonical);
    canonical.setAttribute("data-seo", "true");
    document.head.appendChild(canonical);

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
      const metaToRemove = document.querySelectorAll('meta[data-seo="true"]');
      metaToRemove.forEach((meta) => meta.remove());
      const canonicalToRemove = document.querySelector('link[rel="canonical"][data-seo="true"]');
      if (canonicalToRemove) canonicalToRemove.remove();
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
  ]);

  return null;
}

