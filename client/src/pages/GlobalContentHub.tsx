import { useState } from "react";
import { Link as WouterLink } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Crosshair, Globe2, Map, Search, Shield, Sparkles, Swords, Target, Trophy, Users, Zap } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/components/LanguageProvider";
import { globalContentPages } from "../../../shared/content-hub-data.js";

interface GlobalContentHubProps {
  params?: { slug?: string };
}

const pageIcons = [Swords, Globe2, Map, Shield, CalendarDays, Users];
const pageNumbers = ["01", "02", "03", "04", "05", "06"];

function SafeImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(245,166,35,0.24),transparent_40%),#0b1018] ${className}`} aria-label={alt}>
        <Crosshair className="h-12 w-12 text-amber-400/40" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`h-full w-full object-contain ${className}`} />;
}

function AccentLine({ accent }: { accent: string }) {
  return <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, transparent 72%)` }} />;
}

function StatPill({ value, accent }: { value: string; accent: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-300">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
      {value}
    </span>
  );
}

export default function GlobalContentHub({ params }: GlobalContentHubProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const requestedSlug = String(params?.slug || "").trim().toLowerCase();
  const slugAliases: Record<string, string> = {
    "game-modes": "mode-and-map-collections",
  };
  const canonicalSlug = slugAliases[requestedSlug] || requestedSlug;
  const page = globalContentPages.find((item) => item.slug === canonicalSlug);
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const ForwardIcon = isArabic ? ArrowLeft : ArrowRight;

  if (page) {
    const title = isArabic ? page.titleAr : page.title;
    const category = isArabic ? page.categoryAr : page.category;
    const summary = isArabic ? page.summaryAr : page.summary;
    const stats = isArabic ? page.statsAr : page.stats;

    return (
      <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-hidden bg-[#080c12] text-slate-100">
        <SEOHead title={`${title} | CrossFire Wiki`} description={summary} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.13),transparent_60%)]" />
        <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <WouterLink href="/content-hub" className="transition hover:text-amber-300">{isArabic ? "مركز المحتوى" : "Content hub"}</WouterLink>
            <span className="text-slate-700">/</span>
            <span className="text-amber-400">{category}</span>
          </div>

          <section className="relative overflow-hidden rounded-[2rem] border border-amber-400/20 bg-[#101722] shadow-2xl shadow-black/30">
            <AccentLine accent={page.accent} />
            <div className="grid min-h-[390px] lg:grid-cols-[1.05fr_0.95fr]">
              <div className="order-2 flex flex-col justify-center p-7 sm:p-10 lg:order-1 lg:p-14">
                <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em]" style={{ color: page.accent }}>
                  <span className="h-px w-8" style={{ backgroundColor: page.accent }} />
                  {category}
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">{title}</h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{summary}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {stats.map((stat) => <StatPill key={stat} value={stat} accent={page.accent} />)}
                </div>
              </div>
              <div className="order-1 min-h-[260px] border-b border-white/10 bg-[#0c131d] p-5 lg:order-2 lg:min-h-0 lg:border-b-0 lg:border-s">
                <div className="relative h-full min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1119]">
                  <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 40%, ${page.accent}35, transparent 62%)` }} />
                  <SafeImage src={page.image} alt={page.imageAlt} className="relative z-10 p-4 sm:p-8" />
                  <div className="absolute bottom-4 left-4 z-20 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 backdrop-blur">CrossFire archive</div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              {page.sections.map((section, index) => {
                const sectionItems = isArabic ? section.itemsAr : section.items;
                return (
                  <section key={section.title} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 sm:p-8">
                    <AccentLine accent={page.accent} />
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm font-black" style={{ color: page.accent }}>{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-extrabold text-white sm:text-2xl">{isArabic ? section.titleAr : section.title}</h2>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          {sectionItems.map((item) => (
                            <div key={item} className="rounded-xl border border-white/[0.07] bg-[#0c121a] p-4 text-sm leading-6 text-slate-300">
                              <CheckCircle2 className="mb-3 h-4 w-4" style={{ color: page.accent }} />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>

            <aside className="h-fit rounded-2xl border border-amber-400/20 bg-gradient-to-b from-amber-400/[0.11] to-white/[0.025] p-6 sm:p-7 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 text-amber-400"><BookOpen className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.2em]">{isArabic ? "تابع الاستكشاف" : "Keep exploring"}</span></div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{isArabic ? "كل قسم هنا يقودك إلى صفحة أخرى في الأرشيف حتى لا ينتهي بحثك عند بطاقة واحدة." : "Every section connects to another part of the archive, so your research does not stop at a single card."}</p>
              <div className="mt-5 space-y-3">
                <WouterLink href="/pages" className="group flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50 hover:text-amber-300"><span>{isArabic ? "الصفحات المنشورة" : "Published pages"}</span><ForwardIcon className="h-4 w-4 transition group-hover:translate-x-1" /></WouterLink>
                {page.relatedLinks.map((link) => (
                  <WouterLink key={link.href} href={link.href} className="group flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50 hover:text-amber-300"><span>{isArabic ? link.labelAr : link.label}</span><ForwardIcon className="h-4 w-4 transition group-hover:translate-x-1" /></WouterLink>
                ))}
              </div>
              <WouterLink href="/content-hub" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-amber-400 transition hover:text-amber-300"><BackIcon className="h-4 w-4" />{isArabic ? "العودة إلى المركز" : "Back to content hub"}</WouterLink>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  if (requestedSlug && !page) {
    return (
      <div dir={isArabic ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center bg-[#080c12] px-6 text-slate-100">
        <SEOHead title={isArabic ? "الصفحة غير موجودة | CrossFire Wiki" : "Page not found | CrossFire Wiki"} description={isArabic ? "هذا القسم غير موجود في مركز المحتوى." : "This content-hub section does not exist."} />
        <main className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#101722] p-8 text-center shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-400">404</p>
          <h1 className="mt-3 text-3xl font-black text-white">{isArabic ? "القسم غير موجود" : "Section not found"}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">{isArabic ? "تحقق من الرابط أو عُد إلى مركز المحتوى لاختيار قسم منشور." : "Check the link or return to the content hub to choose a published section."}</p>
          <WouterLink href="/content-hub" className="mt-6 inline-flex rounded-full bg-amber-500 px-5 py-3 text-sm font-black text-slate-950">{isArabic ? "العودة إلى المركز" : "Back to content hub"}</WouterLink>
        </main>
      </div>
    );
  }

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="min-h-screen overflow-hidden bg-[#080c12] text-slate-100">
      <SEOHead title={isArabic ? "مركز محتوى CrossFire | الويكي" : "CrossFire Content Hub | Wiki"} description={isArabic ? "بوابة عملية لاكتشاف أدلة الأسلحة والخرائط والمودات والرتب والأحداث في CrossFire." : "A visual guide to CrossFire weapons, maps, modes, ranks, events and community knowledge."} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.15),transparent_63%)]" />
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-400/25 bg-[#101722] shadow-2xl shadow-black/40">
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(8,12,18,0.97)_0%,rgba(8,12,18,0.85)_46%,rgba(8,12,18,0.34)_100%)]" />
          <div className="relative grid min-h-[500px] lg:grid-cols-[1fr_0.9fr]">
            <div className="order-2 flex flex-col justify-center p-7 sm:p-10 lg:order-1 lg:p-14">
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.28em] text-amber-400"><Sparkles className="h-4 w-4" />{isArabic ? "أرشيف CrossFire" : "CrossFire archive"}</div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">{isArabic ? "اكتشف اللعبة من الداخل" : "Explore the game beyond the match"}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{isArabic ? "مركز واحد يجمع الأدلة والمقارنات والخرائط والمودات والأحداث ومعرفة المجتمع في تجربة تشبه الويكي الحقيقي، لا مجرد قائمة روابط." : "One place for guides, comparisons, maps, modes, events and player knowledge — organised like a real wiki, not a list of empty links."}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <WouterLink href="/global-wiki" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-400"><Globe2 className="h-4 w-4" />{isArabic ? "ابدأ من الويكي العالمي" : "Start with global wiki"}</WouterLink>
                <WouterLink href="/news" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white transition hover:border-amber-400/50 hover:text-amber-300"><CalendarDays className="h-4 w-4" />{isArabic ? "آخر الأخبار" : "Latest updates"}</WouterLink>
              </div>
              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-5">
                {[{ icon: BookOpen, value: String(globalContentPages.length).padStart(2, "0"), label: isArabic ? "أقسام معرفة" : "knowledge sections" }, { icon: Target, value: String(globalContentPages.reduce((total, item) => total + item.sections.length, 0)), label: isArabic ? "فصول تحريرية" : "editorial chapters" }, { icon: Zap, value: String(globalContentPages.reduce((total, item) => total + item.relatedLinks.length, 0)), label: isArabic ? "روابط داخلية" : "internal links" }].map(({ icon: Icon, value, label }) => <div key={label}><Icon className="h-4 w-4 text-amber-400" /><div className="mt-2 text-lg font-black text-white">{value}</div><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div></div>)}
              </div>
            </div>
            <div className="order-1 min-h-[260px] bg-[#0b1119] lg:order-2 lg:min-h-0">
              <div className="relative h-full min-h-[300px]">
                <SafeImage src="/feature-crossfire.jpg" alt="CrossFire character archive" className="p-3 sm:p-8 lg:p-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101722] via-transparent to-transparent lg:bg-gradient-to-l lg:from-[#101722] lg:via-transparent lg:to-transparent" />
                <div className="absolute bottom-5 right-5 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 backdrop-blur">{isArabic ? "مركز المعرفة" : "Knowledge centre"}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.25em] text-amber-400">{isArabic ? "اختر مسارك" : "Choose your path"}</p><h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{isArabic ? "أقسام تستحق القراءة" : "Sections worth opening"}</h2></div>
            <p className="max-w-md text-sm leading-6 text-slate-400">{isArabic ? "كل بطاقة تبدأ بسؤال واضح وتنتهي بروابط تساعدك على مواصلة البحث." : "Every card starts with a clear question and ends with links that keep your research moving."}</p>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {globalContentPages.map((item, index) => {
              const Icon = pageIcons[index % pageIcons.length];
              const title = isArabic ? item.titleAr : item.title;
              const category = isArabic ? item.categoryAr : item.category;
              const summary = isArabic ? item.summaryAr : item.summary;
              const stats = isArabic ? item.statsAr : item.stats;
              return (
                <WouterLink key={item.slug} href={`/content-hub/${item.slug}`} className="group block h-full">
                  <article className="relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] transition duration-200 hover:-translate-y-1 hover:border-amber-400/40 hover:bg-white/[0.055] hover:shadow-2xl hover:shadow-black/30">
                    <AccentLine accent={item.accent} />
                    <div className="relative h-44 overflow-hidden border-b border-white/[0.08] bg-[#0b1119]">
                      <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 40%, ${item.accent}45, transparent 60%)` }} />
                      <SafeImage src={item.image} alt={item.imageAlt} className="p-3 transition duration-500 group-hover:scale-105" />
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white backdrop-blur"><Icon className="h-3.5 w-3.5" style={{ color: item.accent }} />{pageNumbers[index]}</div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: item.accent }}>{category}</div>
                      <h3 className="mt-2 text-xl font-black text-white transition group-hover:text-amber-300">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{summary}</p>
                      <div className="mt-5 flex flex-wrap gap-2">{stats.slice(0, 2).map((stat) => <StatPill key={stat} value={stat} accent={item.accent} />)}</div>
                      <div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-400">{isArabic ? "فتح القسم" : "Open section"}<ForwardIcon className="h-4 w-4 transition group-hover:translate-x-1" /></div>
                    </div>
                  </article>
                </WouterLink>
              );
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#101722] p-6 sm:p-8">
            <div className="flex items-center gap-3 text-amber-400"><Search className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.2em]">{isArabic ? "طريقة الاستخدام" : "How to use it"}</span></div>
            <div className="mt-6 space-y-5">{[
              ["01", isArabic ? "اختر الموضوع" : "Choose a topic", isArabic ? "ابدأ بالسلاح أو الخريطة أو المود أو الحدث الذي تريد فهمه." : "Start with the weapon, map, mode or event you want to understand."],
              ["02", isArabic ? "اقرأ السياق" : "Read the context", isArabic ? "تعرف على الهدف والاختلافات والمعلومات التي تحتاجها قبل التفاصيل." : "Learn the objective, differences and context before diving into details."],
              ["03", isArabic ? "واصل البحث" : "Keep exploring", isArabic ? "استخدم الروابط الداخلية لتصل إلى الصفحات المرتبطة بدلاً من التوقف عند ملخص." : "Use internal links to move through related pages instead of stopping at a summary."]
            ].map(([number, title, text]) => <div key={number} className="flex gap-4"><span className="text-sm font-black text-amber-400">{number}</span><div><h3 className="font-bold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div></div>)}</div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/15 via-[#101722] to-[#101722] p-6 sm:p-8">
            <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div className="max-w-xl"><div className="flex items-center gap-3 text-amber-400"><Trophy className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.2em]">{isArabic ? "ويكي يعيش مع اللعبة" : "A wiki that keeps moving"}</span></div><h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">{isArabic ? "المعلومة الجيدة تقودك إلى المعلومة التالية." : "Good wiki content should lead you to the next useful answer."}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{isArabic ? "استكشف الويكي العالمي، راجع آخر الأخبار، أو ساعد في تحسين صفحة تحتاج إلى تفاصيل أكثر." : "Explore the global wiki, check the latest updates or help improve a page that needs more detail."}</p></div>
              <div className="flex shrink-0 flex-wrap gap-3"><WouterLink href="/global-wiki" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-400">{isArabic ? "الويكي العالمي" : "Global wiki"}<ForwardIcon className="h-4 w-4" /></WouterLink><WouterLink href="/pages" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:border-amber-400/50">{isArabic ? "صفحات المجتمع" : "Community pages"}</WouterLink></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
