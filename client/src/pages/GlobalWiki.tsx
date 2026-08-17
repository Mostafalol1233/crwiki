import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/components/LanguageProvider";
import { getRegionBreadcrumbs, getRegionBySlug, getRegionLanding, getWeaponBreadcrumbs, getWeaponBySlug, REGIONS } from "../../../shared/crossfire-regions.js";
import {
  REGIONAL_CHARACTER_RECORDS,
  REGIONAL_EDITION_RECORDS,
  REGIONAL_EVENT_RECORDS,
  REGIONAL_LEAGUE_RECORDS,
  REGIONAL_MAP_RECORDS,
  REGIONAL_MODE_RECORDS,
  REGIONAL_POSTS,
  REGIONAL_REVIEWS,
  REGIONAL_WEAPON_RECORDS,
} from "../../../shared/regional-expansion-data.js";

interface GlobalWikiProps {
  params?: {
    region?: string;
    slug?: string;
  };
}

const editionBySlug = (slug: string) => REGIONAL_EDITION_RECORDS.find((edition) => edition.slug === slug);
const featuredCharacterRecords = REGIONAL_CHARACTER_RECORDS.slice(0, 4);
const featuredMapRecords = REGIONAL_MAP_RECORDS.filter((map) => map.imageUrl).slice(0, 4);
const languageText = (language: string, english: string, arabic: string) => language === "ar" ? arabic : english;

export default function GlobalWiki({ params }: GlobalWikiProps) {
  const { language } = useLanguage();
  const regionSlug = params?.region?.toLowerCase();
  const weaponSlug = params?.slug?.toLowerCase();
  const isArabic = language === "ar";
  const pathFor = (path: string) => isArabic ? (path === "/" ? "/ar" : `/ar${path}`) : path;
  const copy = (english: string, arabic: string) => languageText(language, english, arabic);
  const listFor = (english: string[], arabic: string[]) => isArabic ? arabic : english;
  const statLabel = (label: string) => {
    const labels: Record<string, [string, string]> = {
      damage: ["Damage", "الضرر"], lightness: ["Lightness", "الخفة"], accuracy: ["Accuracy", "الدقة"], speed: ["Speed", "السرعة"], reload: ["Reload", "إعادة التعبئة"], penetration: ["Penetration", "الاختراق"], magazine: ["Magazine", "المخزن"], range: ["Range", "المدى"],
    };
    const value = labels[label];
    return value ? copy(value[0], value[1]) : label;
  };
  const categoryLabel = (category: string) => {
    const labels: Record<string, [string, string]> = {
      "Assault Rifle": ["Assault Rifle", "بندقية هجومية"], "Submachine Gun": ["Submachine Gun", "مدفع رشاش"], "Sniper Rifle": ["Sniper Rifle", "بندقية قنص"], Pistol: ["Pistol", "مسدس"], Melee: ["Melee", "قتال قريب"],
    };
    const value = labels[category];
    return value ? copy(value[0], value[1]) : category;
  };

  if (regionSlug && weaponSlug) {
    const region = getRegionBySlug(regionSlug);
    const weapon = getWeaponBySlug(weaponSlug);

    if (!region || !weapon) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
          <SEOHead title={copy("CrossFire region page unavailable", "صفحة المنطقة غير متاحة")} description={copy("The requested section is not available yet.", "القسم المطلوب غير متاح حالياً.")} />
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">{copy("Global wiki", "الويكي العالمي")}</p>
            <h1 className="mt-4 text-3xl font-semibold">{copy("This region or weapon page is still being prepared.", "ما زالت صفحة هذه المنطقة أو هذا السلاح قيد الإعداد.")}</h1>
            <p className="mt-4 text-slate-300">{copy("The page will be published after its source record has been checked.", "سيتم نشر الصفحة بعد مراجعة سجل المصدر الخاص بها.")}</p>
          </div>
        </div>
      );
    }

    const regionMeta = weapon.regions ? (weapon.regions as Record<string, { available?: boolean; damage?: number | string; notes?: string }>)[region.slug] : undefined;
    const breadcrumbs = getWeaponBreadcrumbs(regionSlug, weaponSlug);

    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <SEOHead title={`${region.name} ${weapon.name} | CrossFire Global Wiki`} description={copy(`Region-specific coverage for ${weapon.name} in ${region.name}.`, `تغطية إقليمية لسلاح ${weapon.name} في ${region.name}.`)} breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">{region.shortName}</p>
            <h1 className="mt-3 text-4xl font-semibold">{weapon.name}</h1>
            <p className="mt-4 max-w-2xl text-slate-300">{weapon.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">{copy("Region facts", "معلومات المنطقة")}</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li><strong>{copy("Base", "المصدر الأساسي")}:</strong> {region.base}</li>
                <li><strong>{copy("Focus", "النطاق")}:</strong> {region.focus}</li>
                <li><strong>{copy("Status", "الحالة")}:</strong> {region.status}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold">{copy("Local coverage", "التغطية المحلية")}</h2>
              <p className="mt-3 text-sm text-slate-300">{regionMeta?.notes || copy("Coverage for this region is being expanded from first-party sources.", "يتم توسيع تغطية هذه المنطقة بالاعتماد على المصادر الرسمية.")}</p>
              <div className="mt-4 text-sm text-slate-300">
                <strong>{copy("Availability", "التوفر")}:</strong> {regionMeta?.available ? copy("Recorded for this region", "مسجل لهذه المنطقة") : copy("Pending verification", "بانتظار التحقق")}
              </div>
              {typeof regionMeta?.damage === "number" ? (
                <div className="mt-2 text-sm text-slate-300"><strong>{copy("Damage", "الضرر")}:</strong> {regionMeta.damage}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (regionSlug) {
    const landing = getRegionLanding(regionSlug);

    if (!landing) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
          <SEOHead title={copy("Region not found", "المنطقة غير موجودة")} description={copy("The requested CrossFire region is not available in the global wiki yet.", "المنطقة المطلوبة غير متاحة في الويكي العالمي بعد.")} />
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <h1 className="text-3xl font-semibold">{copy("Unknown region", "منطقة غير معروفة")}</h1>
            <p className="mt-4 text-slate-300">{copy("Use the global archive to browse regions with verified source coverage.", "استخدم الأرشيف العالمي لتصفح المناطق التي تمتلك تغطية موثقة بالمصادر.")}</p>
          </div>
        </div>
      );
    }

    const breadcrumbs = getRegionBreadcrumbs(regionSlug);
    const regionalWeapons = REGIONAL_WEAPON_RECORDS.filter((weapon) => weapon.region === regionSlug);
    const regionalEvents = REGIONAL_EVENT_RECORDS.filter((event) => event.region === regionSlug);
    const regionalCharacters = REGIONAL_CHARACTER_RECORDS.filter((character) => editionBySlug(character.edition)?.region === regionSlug);
    const regionalMaps = REGIONAL_MAP_RECORDS.filter((map) => editionBySlug(map.edition)?.region === regionSlug);
    const regionalLeagues = REGIONAL_LEAGUE_RECORDS.filter((league) => league.region === regionSlug);

    return (
      <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
        <SEOHead title={`${landing.region.name} | CrossFire Global Wiki`} description={copy(`A source-backed regional overview for ${landing.region.name}.`, `نظرة إقليمية موثقة بالمصادر عن ${landing.region.name}.`)} breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="rounded-3xl border border-amber-400/30 bg-slate-900/70 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">{copy("Global wiki", "الويكي العالمي")}</p>
            <h1 className="mt-3 text-4xl font-semibold">{landing.region.name}</h1>
            <p className="mt-4 max-w-3xl text-slate-300">{copy("This regional page separates official edition records from community comparisons. Claims are published with a source URL and verification date.", "تفصل هذه الصفحة الإقليمية بين سجلات الإصدارات الرسمية والمقارنات المجتمعية. يتم نشر الادعاءات مع رابط المصدر وتاريخ التحقق.")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {landing.featuredWeapons.map((weapon) => (
              <div key={weapon.slug} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-xl font-semibold">{weapon.name}</h2>
                <p className="mt-3 text-sm text-slate-300">{weapon.description}</p>
                <a href={pathFor(`/${landing.region.slug}/weapons/${weapon.slug}`)} className="mt-4 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">
                  {copy("Open legacy region page", "فتح صفحة المنطقة الحالية")}
                </a>
              </div>
            ))}
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Verified records", "سجلات موثقة")}</p>
                <h2 className="mt-2 text-2xl font-semibold">{copy("Regional weapons", "أسلحة المنطقة")}</h2>
              </div>
              <p className="text-sm text-slate-400">{copy(`${regionalWeapons.length} records in this first import`, `${regionalWeapons.length} سجلات في هذا الاستيراد الأول`)}</p>
            </div>
            {regionalWeapons.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {regionalWeapons.map((weapon) => (
                  <article key={weapon.slug} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                    <div className="flex h-40 items-center justify-center bg-slate-900 p-4">
                      {weapon.imageUrl ? <img src={weapon.imageUrl} alt={weapon.name} className="h-full w-full object-contain" loading="lazy" /> : <span className="text-sm text-slate-500">{copy("Official image not imported", "لم يتم استيراد الصورة الرسمية")}</span>}
                    </div>
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{categoryLabel(weapon.category)}</p>
                      <h3 className="mt-2 text-lg font-semibold">{weapon.name}</h3>
                      {weapon.englishName ? <p className="mt-1 text-xs text-slate-500">{weapon.englishName}</p> : null}
                      <p className="mt-3 text-sm leading-6 text-slate-300">{copy(weapon.notesEn, weapon.notesAr)}</p>
                      {weapon.stats ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {Object.entries(weapon.stats).map(([label, value]) => (
                            <span key={label} className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300">
                              <span className="text-slate-500">{statLabel(label)}</span>: {String(value)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <a href={weapon.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">{copy("View official source", "عرض المصدر الرسمي")}</a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">{copy("No weapon record has been imported for this region yet. The page does not fill gaps with guesses.", "لم يتم استيراد سجل أسلحة لهذه المنطقة بعد. لا تملأ الصفحة الفجوات بتخمينات.")}</p>
            )}
          </section>

          {regionalEvents.length ? (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Events", "الفعاليات")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Regional events and announcements", "الفعاليات والإعلانات الإقليمية")}</h2>
              <div className="mt-6 space-y-4">
                {regionalEvents.map((event) => (
                  <article key={event.slug} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{event.kind}</p>
                        <h3 className="mt-2 text-xl font-semibold">{copy(event.titleEn, event.titleAr)}</h3>
                      </div>
                      <span className="text-sm text-slate-400">{event.startDate}{event.endDate ? ` — ${event.endDate}` : ""}</span>
                    </div>
                    <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{copy(event.summaryEn, event.summaryAr)}</p>
                    <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">{copy("View official event record", "عرض سجل الفعالية الرسمي")}</a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {regionalCharacters.length ? (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Characters", "الشخصيات")}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{copy("Official Vietnam Legends roster", "قائمة شخصيات Legends الرسمية في فيتنام")}</h2>
                </div>
                <p className="text-sm text-slate-400">{regionalCharacters.length} {copy("source records", "سجلات مصدر")}</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {regionalCharacters.map((character) => (
                  <article key={character.slug} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
                    <div className="h-48 bg-slate-900">
                      <img src={character.imageUrl} alt={copy(character.nameEn, character.nameAr)} className="h-full w-full object-contain" loading="lazy" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{copy(character.nameEn, character.nameAr)}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{copy(character.notesEn, character.notesAr)}</p>
                      <a href={character.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">{copy("Official profile", "الملف الرسمي")}</a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {regionalLeagues.length ? (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Competition structure", "هيكل المنافسات")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Regional league records", "سجلات الدوريات الإقليمية")}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regionalLeagues.map((league) => (
                  <article key={league.slug} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                    <h3 className="text-lg font-semibold">{copy(league.nameEn, league.nameAr)}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{copy(league.summaryEn, league.summaryAr)}</p>
                    <a href={league.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">{copy("View CFS source", "عرض مصدر CFS")}</a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Modes", "الأنماط")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Verified mode records", "سجلات الأنماط الموثقة")}</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {REGIONAL_MODE_RECORDS.filter((mode) => editionBySlug(mode.edition)?.region === regionSlug).map((mode) => (
                  <span key={mode.slug} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">{copy(mode.nameEn, mode.nameAr)}</span>
                ))}
              </div>
            </section>
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Maps", "الخرائط")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Verified map records", "سجلات الخرائط الموثقة")}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {regionalMaps.map((map) => (
                  <a key={map.slug} href={map.sourceUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:border-amber-400/50">
                    {map.imageUrl ? <img src={map.imageUrl} alt={copy(map.nameEn, map.nameAr)} className="h-28 w-full object-cover" loading="lazy" /> : null}
                    <div className="p-3">
                      <p className="text-sm font-medium text-slate-200">{copy(map.nameEn, map.nameAr)}</p>
                      {map.descriptionEn ? <p className="mt-2 text-xs leading-5 text-slate-400">{copy(map.descriptionEn, map.descriptionAr)}</p> : null}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <SEOHead title={copy("CrossFire Global Wiki", "ويكي CrossFire العالمي")} description={copy("A source-backed CrossFire archive covering regional editions, weapons, maps, modes, events, and comparisons.", "أرشيف موثق بالمصادر عن CrossFire يغطي الإصدارات الإقليمية والأسلحة والخرائط والأنماط والفعاليات والمقارنات.")} />
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-amber-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-8 md:p-10">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-400">{copy("Global archive", "الأرشيف العالمي")}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{copy("CrossFire Global Wiki", "ويكي CrossFire العالمي")}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">{copy("A growing reference that keeps China PC, West PC, Vietnam mobile, Brazil esports, and Southeast Asia competition records distinct. Every new regional record carries a first-party source and a verification date.", "مرجع متنامٍ يحافظ على فصل بيانات الصين للحاسوب والغرب للحاسوب وفيتنام للهاتف والرياضات الإلكترونية في البرازيل وجنوب شرق آسيا. يحمل كل سجل إقليمي جديد مصدراً رسمياً وتاريخاً للتحقق.")}</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-amber-400/30 bg-slate-950/50 px-4 py-2">{copy("First-party sources", "مصادر رسمية")}</span>
              <span className="rounded-full border border-amber-400/30 bg-slate-950/50 px-4 py-2">{copy("English and Arabic", "الإنجليزية والعربية")}</span>
              <span className="rounded-full border border-amber-400/30 bg-slate-950/50 px-4 py-2">{copy("No invented stats", "دون إحصاءات مخترعة")}</span>
            </div>
          </div>
        </header>

        <section>
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Editions and evidence", "الإصدارات والأدلة")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Regional records now in the archive", "السجلات الإقليمية الموجودة في الأرشيف")}</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">{copy("The source boundary matters: a weapon in one client is not automatically a weapon in another.", "حدود المصدر مهمة: السلاح الموجود في عميل واحد لا يصبح تلقائياً موجوداً في عميل آخر.")}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {REGIONAL_EDITION_RECORDS.map((edition) => (
              <article key={edition.slug} className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-amber-400/50">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-amber-400">{edition.platform}</span>
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">{edition.status}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{edition.name}</h3>
                <p className="mt-2 text-sm text-slate-400">{edition.publisher}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{copy(edition.summaryEn, edition.summaryAr)}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-400">
                  {listFor(edition.factsEn, edition.factsAr).map((fact: string) => <p key={fact}>{fact}</p>)}
                </div>
                <a href={edition.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">{copy("Open source", "فتح المصدر")}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Regional comparison", "مقارنة إقليمية")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("What is covered, and where", "ما الذي تمت تغطيته وأين؟")}</h2>
            </div>
            <a href={pathFor("/content-hub")} className="text-sm font-medium text-amber-400 underline underline-offset-4">{copy("Open content hub", "فتح مركز المحتوى")}</a>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pr-5">{copy("Edition", "الإصدار")}</th>
                  <th className="pb-3 pr-5">{copy("Platform", "المنصة")}</th>
                  <th className="pb-3 pr-5">{copy("Publisher", "الناشر")}</th>
                  <th className="pb-3 pr-5">{copy("Records", "السجلات")}</th>
                  <th className="pb-3">{copy("Evidence", "الدليل")}</th>
                </tr>
              </thead>
              <tbody>
                {REGIONAL_EDITION_RECORDS.map((edition) => {
                  const weaponCount = REGIONAL_WEAPON_RECORDS.filter((item) => item.edition === edition.slug).length;
                  const modeCount = REGIONAL_MODE_RECORDS.filter((item) => item.edition === edition.slug).length;
                  const mapCount = REGIONAL_MAP_RECORDS.filter((item) => item.edition === edition.slug).length;
                  const eventCount = REGIONAL_EVENT_RECORDS.filter((item) => item.region === edition.region).length;
                  return (
                    <tr key={edition.slug} className="border-b border-slate-800/70">
                      <td className="py-4 pr-5 font-medium text-slate-100">{edition.name}</td>
                      <td className="py-4 pr-5 text-slate-300">{edition.platform}</td>
                      <td className="py-4 pr-5 text-slate-300">{edition.publisher}</td>
                      <td className="py-4 pr-5 text-slate-300">{weaponCount} {copy("weapons", "أسلحة")}, {modeCount} {copy("modes", "أنماط")}, {mapCount} {copy("maps", "خرائط")}, {eventCount} {copy("events", "فعاليات")}</td>
                      <td className="py-4 text-slate-300"><a href={edition.sourceUrl} target="_blank" rel="noreferrer" className="text-amber-400 underline underline-offset-4">{edition.sourceLabel}</a><span className="mt-1 block text-xs text-slate-500">{copy("Checked", "تم التحقق")}: {edition.checkedAt}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Research posts", "منشورات البحث")}</p>
            <h2 className="mt-2 text-2xl font-semibold">{copy("Regional notes with source boundaries", "ملاحظات إقليمية مع حدود المصدر")}</h2>
            <div className="mt-6 space-y-4">
              {REGIONAL_POSTS.map((post) => (
                <article key={post.slug} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>{post.category}</span><span>{post.date}</span></div>
                  <h3 className="mt-3 text-lg font-semibold">{copy(post.titleEn, post.titleAr)}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{copy(post.excerptEn, post.excerptAr)}</p>
                  <div className="mt-4 flex flex-wrap gap-3">{post.sourceUrls.map((url: string) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-amber-400 underline underline-offset-4">{copy("Source", "المصدر")}</a>)}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Editorial review", "المراجعة التحريرية")}</p>
            <h2 className="mt-2 text-2xl font-semibold">{copy("How to read regional differences", "كيف نقرأ الفروق الإقليمية؟")}</h2>
            {REGIONAL_REVIEWS.map((review) => (
              <article key={review.slug} className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{review.category} | {review.date}</p>
                <h3 className="mt-3 text-xl font-semibold">{copy(review.titleEn, review.titleAr)}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">{copy(review.verdictEn, review.verdictAr)}</p>
                <div className="mt-5 flex flex-wrap gap-3">{review.sourceUrls.map((url: string) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-amber-400 underline underline-offset-4">{copy("Official source", "مصدر رسمي")}</a>)}</div>
              </article>
            ))}
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Recent official records", "أحدث السجلات الرسمية")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Regional events and visual references", "الفعاليات الإقليمية والمراجع المرئية")}</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">{copy("The cards below are discovery links into the regional pages; each image remains hosted by its official publisher.", "البطاقات التالية روابط استكشاف للصفحات الإقليمية، وتبقى كل صورة مستضافة لدى ناشرها الرسمي.")}</p>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              {REGIONAL_EVENT_RECORDS.map((event) => (
                <article key={event.slug} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{event.kind}</p>
                      <h3 className="mt-2 text-lg font-semibold">{copy(event.titleEn, event.titleAr)}</h3>
                    </div>
                    <span className="text-xs text-slate-500">{event.startDate}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{copy(event.summaryEn, event.summaryAr)}</p>
                  <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-medium text-amber-400 underline underline-offset-4">{copy("Official event source", "مصدر الفعالية الرسمي")}</a>
                </article>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[...featuredCharacterRecords, ...featuredMapRecords].map((record) => (
                <a key={record.slug} href={record.sourceUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 transition hover:border-amber-400/50">
                  {record.imageUrl ? <img src={record.imageUrl} alt={copy(record.nameEn, record.nameAr)} className="h-32 w-full object-cover" loading="lazy" /> : null}
                  <div className="p-3"><p className="text-sm font-medium text-slate-200">{copy(record.nameEn, record.nameAr)}</p><p className="mt-1 text-xs text-slate-500">{copy("Official visual reference", "مرجع مرئي رسمي")}</p></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">{copy("Region directory", "دليل المناطق")}</p>
              <h2 className="mt-2 text-2xl font-semibold">{copy("Browse the existing regional routes", "تصفح مسارات المناطق الحالية")}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{copy("Some regions are still marked for research. They remain visible for navigation, but the archive does not present unverified details as confirmed records.", "لا تزال بعض المناطق معلّمة بأنها تحتاج إلى بحث. تبقى ظاهرة للتنقل، لكن الأرشيف لا يعرض التفاصيل غير الموثقة كسجلات مؤكدة.")}</p>
            </div>
            <span className="text-sm text-slate-400">{REGIONS.length} {copy("region routes", "مسارات مناطق")}</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {REGIONS.map((region) => (
              <a key={region.slug} href={pathFor(`/${region.slug}`)} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-amber-400/50">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-400">{region.shortName}</div>
                <h3 className="mt-2 font-semibold">{region.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{region.focus}</p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
