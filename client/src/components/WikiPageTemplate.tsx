import { useMemo } from "react";
import { ArrowLeft, BookOpen, Clock3, ExternalLink, List, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

interface WikiPageTemplateProps {
  title: string;
  content: string;
  slug: string;
  isAr: boolean;
  seoDescription?: string;
  publishedAt?: string;
  updatedAt?: string;
  sourceUrl?: string;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

function formatDate(value: string | undefined, isAr: boolean) {
  if (!value) return isAr ? "غير محدد" : "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return isAr ? "غير محدد" : "Not specified";
  return new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function WikiPageTemplate({
  title,
  content,
  slug,
  isAr,
  seoDescription,
  publishedAt,
  updatedAt,
  sourceUrl,
}: WikiPageTemplateProps) {
  const { html, headings } = useMemo(() => {
    const safe = sanitizeRichHtml(content || "");
    if (typeof DOMParser === "undefined") return { html: safe, headings: [] as HeadingItem[] };

    const document = new DOMParser().parseFromString(safe, "text/html");
    const found: HeadingItem[] = [];
    document.querySelectorAll("h2, h3").forEach((node, index) => {
      const id = `wiki-section-${index + 1}`;
      node.id = id;
      found.push({ id, text: node.textContent?.trim() || `${isAr ? "قسم" : "Section"} ${index + 1}`, level: Number(node.tagName.substring(1)) });
    });
    return { html: document.body.innerHTML, headings: found };
  }, [content, isAr]);

  const copy = isAr
    ? {
        back: "العودة إلى صفحات الويكي",
        eyebrow: "موسوعة CrossFire World",
        reference: "صفحة مرجعية",
        published: "تاريخ النشر",
        updated: "آخر تحديث",
        language: "اللغة",
        arabic: "العربية",
        english: "الإنجليزية",
        contents: "محتويات الصفحة",
        overview: "مرجع منظم ومحدّث لعالم CrossFire.",
        source: "المصدر الأصلي",
        sourceNote: "يمكن الرجوع إلى المصدر الخارجي للمزيد من التفاصيل.",
      }
    : {
        back: "Back to Wiki Pages",
        eyebrow: "CrossFire World Encyclopedia",
        reference: "Reference page",
        published: "Published",
        updated: "Last updated",
        language: "Language",
        arabic: "Arabic",
        english: "English",
        contents: "On this page",
        overview: "A structured and maintainable reference for the CrossFire universe.",
        source: "Original source",
        sourceNote: "Visit the external source for additional details.",
      };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(212,160,23,0.12),transparent_38%),#09090b] px-4 py-10 text-slate-100 sm:px-6 lg:py-16" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/pages">
            <a className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:border-amber-400/60 hover:text-amber-300">
              <ArrowLeft className="h-3.5 w-3.5" />
              {copy.back}
            </a>
          </Link>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/80">
            <Sparkles className="h-3.5 w-3.5" />
            {copy.eyebrow}
          </div>
        </div>

        <header className="relative overflow-hidden rounded-2xl border border-amber-300/25 bg-slate-900/80 px-6 py-8 shadow-2xl shadow-black/30 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-amber-300 via-amber-500 to-cyan-400" />
          <div className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
          <p className="relative text-xs font-black uppercase tracking-[0.28em] text-amber-300">{copy.reference}</p>
          <h1 className="relative mt-4 max-w-5xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="relative mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{seoDescription || copy.overview}</p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <main className="order-2 min-w-0 rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl shadow-black/20 sm:p-8 lg:order-1 lg:p-10">
            <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-white/10 pb-5 text-xs font-semibold text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-amber-200">
                <BookOpen className="h-3.5 w-3.5" />
                {copy.reference}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {copy.published}: {formatDate(publishedAt || updatedAt, isAr)}
              </span>
            </div>
            <div
              className="wiki-page-body prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-10 prose-h2:border-b prose-h2:border-amber-300/20 prose-h2:pb-3 prose-h2:text-2xl prose-h2:text-amber-100 prose-h3:mt-8 prose-h3:text-xl prose-p:text-[1.05rem] prose-p:leading-8 prose-li:leading-8 prose-a:text-amber-300 prose-a:no-underline hover:prose-a:underline prose-img:mx-auto prose-img:max-h-[680px] prose-img:rounded-lg prose-img:border prose-img:border-white/10 prose-img:object-contain prose-blockquote:border-amber-400 prose-blockquote:bg-amber-400/5 prose-blockquote:py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </main>

          <aside className="order-1 space-y-5 lg:order-2 lg:sticky lg:top-24">
            <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20">
              <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-amber-200">
                <List className="h-4 w-4" />
                {copy.contents}
              </div>
              {headings.length > 0 ? (
                <nav className="space-y-2">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block rounded px-2 py-1.5 text-sm leading-6 text-slate-300 transition hover:bg-amber-300/10 hover:text-amber-200 ${heading.level === 3 ? (isAr ? "me-4" : "ms-4") : ""}`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="text-sm leading-6 text-slate-500">{copy.overview}</p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-sm text-slate-300 shadow-xl shadow-black/20">
              <dl className="space-y-4">
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{copy.language}</dt>
                  <dd className="mt-1 font-semibold text-white">{isAr ? copy.arabic : copy.english}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{copy.published}</dt>
                  <dd className="mt-1 font-semibold text-white">{formatDate(publishedAt || updatedAt, isAr)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{isAr ? "المعرّف" : "Slug"}</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-400">/{slug}</dd>
                </div>
              </dl>
            </section>

            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5 text-sm text-cyan-100 transition hover:border-cyan-300/50"
              >
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                <span><strong className="block">{copy.source}</strong><span className="mt-1 block text-cyan-100/70">{copy.sourceNote}</span></span>
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
