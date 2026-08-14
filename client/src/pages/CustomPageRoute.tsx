import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageProvider";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

interface CustomPageRecord {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  seo_title: string;
  seo_description: string;
  created_at?: string;
  updated_at?: string;
  og_image?: string;
  template: string;
  status: string;
  show_in_nav: boolean;
}

interface CustomPageRouteProps {
  params?: {
    slug?: string;
  };
}

export default function CustomPageRoute({ params }: CustomPageRouteProps) {
  const slug = params?.slug?.toLowerCase() || "";
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [page, setPage] = useState<CustomPageRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!slug) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!active) return;
      if (!error && data) {
        setPage(data as CustomPageRecord);
      } else {
        setPage(null);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const isAr = language === "ar";
  const title = useMemo(() => (isAr ? page?.title_ar || page?.title_en : page?.title_en || page?.title_ar) || "Custom page", [isAr, page]);
  const content = useMemo(() => (isAr ? page?.content_ar || page?.content_en : page?.content_en || page?.content_ar) || "", [isAr, page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Loading page</p>
          <h1 className="mt-3 text-3xl font-semibold">Please wait…</h1>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <SEOHead title="Page not found" description="The requested custom page is not available yet." />
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Custom page</p>
          <h1 className="mt-3 text-3xl font-semibold">This page is not available yet.</h1>
          <p className="mt-4 text-slate-300">Create it from the admin area to publish content and expand the wiki.</p>
          <button className="mt-6 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950" onClick={() => setLocation("/admin")}>Go to admin</button>
        </div>
      </div>
    );
  }

  const safeHtml = sanitizeRichHtml(content);
  const canonicalOrigin = "https://crossfire.wiki";
  const canonicalUrl = `${canonicalOrigin}/pages/${page.slug}`;
  const seoTitle = page.seo_title || `${title} | CrossFire Wiki`;
  const seoDescription = page.seo_description || `Detailed CrossFire Wiki reference page about ${title}.`;
  const plainText = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const publishedIso = (page as any).created_at ? new Date((page as any).created_at).toISOString() : undefined;
  const modifiedIso = (page as any).updated_at ? new Date((page as any).updated_at).toISOString() : publishedIso;

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={["CrossFire Wiki", title, "CrossFire guide", "Z8Games"]}
        canonicalUrl={canonicalUrl}
        ogImage={(page as any).og_image || undefined}
        ogImageAlt={`${title} — CrossFire Wiki`}
        ogType="article"
        ogUrl={canonicalUrl}
        articlePublishedTime={publishedIso}
        articleModifiedTime={modifiedIso}
        articleAuthor="CrossFire Wiki"
        articleSection="Wiki Pages"
        articleTags={[title, "CrossFire Wiki", "Z8Games"]}
        hreflangAlternates={[
          { lang: "en", url: canonicalUrl },
          { lang: "ar", url: `${canonicalUrl}?lang=ar` },
        ]}
        breadcrumbs={[
          { name: "Home", url: `${canonicalOrigin}/` },
          { name: "Wiki Pages", url: `${canonicalOrigin}/pages` },
          { name: title, url: canonicalUrl },
        ]}
        schemaType="Article"
        schemaData={{
          "@id": `${canonicalUrl}#article`,
          headline: title,
          description: seoDescription.substring(0, 500),
          url: canonicalUrl,
          image: (page as any).og_image || `${canonicalOrigin}/logo-new.png`,
          author: { "@type": "Organization", name: "CrossFire Wiki", url: canonicalOrigin },
          datePublished: publishedIso,
          dateModified: modifiedIso,
          wordCount: plainText.split(/\s+/).filter(Boolean).length,
          inLanguage: isAr ? "ar" : "en",
          isPartOf: { "@type": "WebSite", name: "CrossFire Wiki", url: canonicalOrigin },
        }}
      />
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Custom page</p>
          <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
          <p className="mt-4 max-w-3xl text-slate-300">{page.seo_description || "Expanded CrossFire content page created from the admin CMS."}</p>
        </div>

        <div className={`rounded-3xl border border-slate-800 bg-slate-900/60 p-8 ${page.template === "minimal" ? "max-w-3xl" : ""}`}>
          <div className="prose prose-invert max-w-none rich-html-content" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        </div>
      </div>
    </div>
  );
}
