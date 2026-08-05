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

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead title={page.seo_title || title} description={page.seo_description || `Content page for ${title}`} />
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
