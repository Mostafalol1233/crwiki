import { useEffect, useState } from "react";
import { Link as WouterLink } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/lib/supabase";

interface CustomPageSummary {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  seo_description: string;
  created_at: string;
}

export default function CustomPagesList() {
  const [pages, setPages] = useState<CustomPageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("custom_pages")
        .select("id, slug, title_en, title_ar, seo_description, created_at")
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

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead title="Published custom pages | CrossFire Wiki" description="Browse the published custom pages created for the CrossFire wiki and content hub." />
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Community pages</p>
          <h1 className="mt-3 text-4xl font-semibold">Browse published custom pages</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This section highlights additional editorial content that can be added to the wiki without hardcoding every page.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-slate-300">
            Loading published pages…
          </div>
        ) : pages.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-slate-300">
            No published custom pages yet. Create one from the admin panel to make it appear here.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => (
              <WouterLink key={page.id} href={`/pages/${page.slug}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-amber-400/50">
                <div className="text-sm uppercase tracking-[0.25em] text-amber-400">Published page</div>
                <h2 className="mt-3 text-xl font-semibold text-slate-100">{page.title_en || page.title_ar || page.slug}</h2>
                <p className="mt-3 text-sm text-slate-300">{page.seo_description || "Expanded CrossFire wiki content created from the admin tools."}</p>
                <div className="mt-5 text-xs uppercase tracking-[0.25em] text-slate-500">/{page.slug}</div>
              </WouterLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
