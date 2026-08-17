import React from "react";
import { SEOHead } from "./SEOHead";

interface PageSEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  image?: string;
  schemaType?: string;
  schemaData?: Record<string, any>;
  noindex?: boolean;
}

/**
 * PageSEO
 * Lightweight wrapper around `SEOHead` to provide sane defaults per-page.
 */
export function PageSEO({
  title,
  description,
  keywords = [],
  canonicalPath,
  image,
  schemaType,
  schemaData,
  noindex = false,
}: PageSEOProps) {
  const envBase = (import.meta as any).env?.VITE_PUBLIC_BASE_URL || '';
  const base = envBase || "https://crossfire.wiki";
  const normalizedPath = canonicalPath
    ? `${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`
    : "/";
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isArabicRoute = pathname === "/ar" || pathname.startsWith("/ar/");
  const localizedPath = isArabicRoute && normalizedPath !== "/ar" && !normalizedPath.startsWith("/ar/")
    ? `/ar${normalizedPath === "/" ? "" : normalizedPath}`
    : normalizedPath;
  const canonicalUrl = `${base.replace(/\/$/, "")}${localizedPath}`;

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={keywords}
      canonicalUrl={canonicalUrl}
      ogImage={image}
      twitterImage={image}
      ogTitle={title}
      ogDescription={description}
      ogType={schemaType ? "article" : "website"}
      ogUrl={canonicalUrl}
      schemaType={schemaType}
      schemaData={schemaData}
      noindex={noindex}
    />
  );
}

export default PageSEO;
