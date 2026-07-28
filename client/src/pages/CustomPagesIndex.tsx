import { useEffect, useState } from "react";
import { Link as WouterLink } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/components/LanguageProvider";

interface CustomPageSummary {
  slug: string;
  title_en: string;
  title_ar: string;
  seo_description: string;
  template: string;
}

export default function CustomPagesIndex() {
  const { language } = useLanguage();
  const [pages, setPages] = useState<CustomPageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_pages")
        .select("slug, title_en, title_ar, seo_description, template")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!active) return;
      if (!error && Array.isArray(data)) {
        setPages(data as CustomPageSummary[]);
      } else {
        setPages([]);
      }
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const title = language === "ar" ? "الصفحات المخصصة" : "Custom Pages";
  const subtitle = language === "ar"
    ? "استكشف الصفحات المنشأة يدويًا أو المستخرجة التي توسع ويكي كروس فاير." 
    : "Browse manually created and scraped pages that expand the CrossFire wiki.";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead title={title} description="Browse published custom pages that expand the CrossFire wiki beyond the core content structure." />
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Published content</p>
          <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
          <p className="mt-4 max-w-3xl text-slate-300">{subtitle}</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-slate-300">
            Loading published pages…
          </div>
        ) : pages.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-slate-300">
            No published custom pages yet. Create one from the admin panel to start expanding the site.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => {
              const displayTitle = language === "ar" ? (page.title_ar || page.title_en) : (page.title_en || page.title_ar);
              const description = page.seo_description || "Expanded CrossFire content page";
              return (
                <WouterLink key={page.slug} href={`/pages/${page.slug}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-amber-400/50">
                  <div className="text-sm uppercase tracking-[0.25em] text-amber-400">{page.template || "custom"}</div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-100">{displayTitle}</h2>
                  <p className="mt-3 text-sm text-slate-300">{description}</p>
                  <div className="mt-4 inline-flex text-sm font-medium text-amber-300">Open page →</div>
                </WouterLink>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
