import { Link as WouterLink } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import { globalContentPages } from "../../../shared/content-hub-data.js";

interface GlobalContentHubProps {
  params?: {
    slug?: string;
  };
}

export default function GlobalContentHub({ params }: GlobalContentHubProps) {
  const page = globalContentPages.find((item) => item.slug === params?.slug);

  if (page) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <SEOHead title={`${page.title} | CrossFire Global Content Hub`} description={page.summary} />
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Global content hub</p>
            <h1 className="mt-3 text-4xl font-semibold">{page.title}</h1>
            <p className="mt-4 max-w-3xl text-slate-300">{page.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {page.stats.map((stat) => (
                <span key={stat} className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-sm text-slate-300">
                  {stat}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              {page.sections.map((section) => (
                <div key={section.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h2 className="text-xl font-semibold text-slate-100">{section.title}</h2>
                  <ul className="mt-4 space-y-2 text-sm text-slate-300">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-slate-100">Related links</h2>
              <div className="mt-4 space-y-3">
                <WouterLink href="/pages" className="block rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/50 hover:text-amber-300">
                  Browse published custom pages
                </WouterLink>
                {page.relatedLinks.map((link) => (
                  <WouterLink key={link.label} href={link.href} className="block rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-400/50 hover:text-amber-300">
                    {link.label}
                  </WouterLink>
                ))}
              </div>
              <WouterLink href="/content-hub" className="mt-6 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">
                ← Back to content hub
              </WouterLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead title="CrossFire Global Content Hub" description="A scalable content hub for expanding the site with more pages, sections and data as the global wiki grows." />
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-400">Global content hub</p>
          <h1 className="mt-3 text-4xl font-semibold">Build more pages without rebuilding the site</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This new hub gives the wiki a flexible structure for adding more sections, richer content and new data-driven pages as the CrossFire global archive grows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <WouterLink href="/pages" className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 transition hover:border-amber-400/60">
            <div className="text-sm uppercase tracking-[0.25em] text-amber-400">Community pages</div>
            <h2 className="mt-3 text-xl font-semibold text-slate-100">Browse all published custom pages</h2>
            <p className="mt-3 text-sm text-slate-300">Discover content created for guides, events, and broader wiki topics.</p>
          </WouterLink>
          {globalContentPages.map((item) => (
            <WouterLink key={item.slug} href={`/content-hub/${item.slug}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-amber-400/50">
              <div className="text-sm uppercase tracking-[0.25em]" style={{ color: item.accent }}>{item.category}</div>
              <h2 className="mt-3 text-xl font-semibold text-slate-100">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-300">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.stats.slice(0, 2).map((stat) => (
                  <span key={stat} className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">
                    {stat}
                  </span>
                ))}
              </div>
            </WouterLink>
          ))}
        </div>
      </div>
    </div>
  );
}
