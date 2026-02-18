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
  const base = envBase || (typeof window !== "undefined" ? window.location.origin : "https://crossfire.wiki");
  const canonicalUrl = canonicalPath ? `${base.replace(/\/$/, "")}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}` : base;

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
