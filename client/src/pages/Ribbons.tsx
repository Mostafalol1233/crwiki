import { useMemo, useState } from "react";
import { ExternalLink, Filter, Image as ImageIcon, Search, X, CalendarDays, LockKeyhole, CheckCircle2, History, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/components/LanguageProvider";
import ribbonDataset from "@/data/crossfire_ribbons_dataset_upgraded.json";

type AnyRecord = Record<string, any>;
type Ribbon = AnyRecord & { ribbon_id?: string | number; name?: string; name_en?: string; name_ar?: string; event_lifecycle?: AnyRecord };

const ribbons = ((ribbonDataset as AnyRecord).items || (ribbonDataset as AnyRecord).ribbons || []) as Ribbon[];
function text(value: any, fallback = "") {
  if (Array.isArray(value)) return value.filter(Boolean).join(" ");
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function list(value: any) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

function label(value: any, arabic: boolean) {
  const raw = text(value, arabic ? "غير محدد" : "Not specified");
  return raw.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function lifecycle(ribbon: Ribbon) { return ribbon.event_lifecycle || {}; }
function releases(ribbon: Ribbon): AnyRecord[] {
  const raw = lifecycle(ribbon).release_history?.known_releases;
  return Array.isArray(raw) ? raw.filter((item) => item && typeof item === "object") as AnyRecord[] : [];
}
function hasReleaseHistory(ribbon: Ribbon) { return releases(ribbon).length > 0; }
function hasExactDate(ribbon: Ribbon) {
  const status = String(lifecycle(ribbon).date_status || "").toLowerCase();
  if (status.includes("exact")) return true;
  return releases(ribbon).some((row) => String(row.date_precision || row.precision || "").toLowerCase().includes("exact") || Boolean(row.start_date && row.end_date));
}
function derivedDifficulty(ribbon: Ribbon) {
  return ribbon.category_label_en || ribbon.category || "Uncategorized";
}
function availability(ribbon: Ribbon) { return lifecycle(ribbon).ribbon_availability || "not_documented"; }
function eventStatus(ribbon: Ribbon) { return lifecycle(ribbon).event_status || "not_documented"; }
function recurrence(ribbon: Ribbon) { return lifecycle(ribbon).recurrence_pattern || "not_documented"; }
function isRecurring(ribbon: Ribbon) {
  const value = String(recurrence(ribbon)).toLowerCase();
  return value.includes("recurr") || value.includes("annual") || value.includes("seasonal") || value.includes("rotating");
}
function isHistoricalUnavailable(ribbon: Ribbon) {
  const a = String(availability(ribbon)).toLowerCase();
  const e = String(eventStatus(ribbon)).toLowerCase();
  const r = String(recurrence(ribbon)).toLowerCase();
  return a.includes("permanently_ended") || a.includes("window_closed") || e.includes("discontinued") || e.includes("one_time") || r.includes("not_expected");
}
function availabilityLabel(ribbon: Ribbon, arabic: boolean) {
  const a = String(availability(ribbon)).toLowerCase();
  const e = String(eventStatus(ribbon)).toLowerCase();
  const r = String(recurrence(ribbon)).toLowerCase();
  if (a.includes("permanently_ended") || e.includes("discontinued")) return arabic ? "منتهية نهائيًا" : "Permanently ended";
  if (e.includes("one_time") || r.includes("not_expected")) return arabic ? "فعالية تاريخية لمرة واحدة" : "One-time historical event";
  if (a.includes("window_closed")) return arabic ? "نافذتها انتهت" : "Ribbon window closed";
  if (a.includes("subscription") || r.includes("premium")) return arabic ? "تتطلب اشتراكًا أو حالة خاصة" : "Pass or status required";
  if (e.includes("recurring") || isRecurring(ribbon)) return arabic ? "فعالية موسمية أو متكررة" : "Seasonal or recurring event";
  if (a.includes("condition_based")) return arabic ? "متاحة حسب الشرط" : "Condition-based availability";
  if (a.includes("specific")) return arabic ? "متاحة في نافذة محددة" : "Specific event window";
  return arabic ? "التوفر غير موثق" : "Availability not documented";
}
function availabilityTone(ribbon: Ribbon): "neutral" | "good" | "warning" | "danger" {
  if (isHistoricalUnavailable(ribbon)) return "danger";
  if (isRecurring(ribbon) || String(availability(ribbon)).includes("subscription")) return "warning";
  if (String(availability(ribbon)).includes("condition_based")) return "good";
  return "neutral";
}
function searchBlob(ribbon: Ribbon) { return JSON.stringify(ribbon).toLowerCase(); }

function RibbonImage({ ribbon, large = false }: { ribbon: Ribbon; large?: boolean }) {
  const src = String(ribbon.image_url || "");
  const [failed, setFailed] = useState(!src);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#080c12] ${large ? "h-56 sm:h-64" : "h-36"}`}>
      {!failed ? (
        <img src={src} alt={`${ribbon.name_en || ribbon.name || "Ribbon"} ribbon`} loading="lazy" decoding="async" className="h-full w-full object-contain p-4" onError={() => setFailed(true)} />
      ) : <div className="flex flex-col items-center gap-2 text-slate-600"><ImageIcon aria-hidden="true" className="h-10 w-10" /><span className="text-xs">Image unavailable</span></div>}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#080c12] to-transparent" />
    </div>
  );
}

function Metric({ label: metricLabel, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return <div className="border border-white/10 bg-white/[0.035] px-4 py-3"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.13em] text-slate-500"><Icon className="h-4 w-4 text-amber-400" />{metricLabel}</div><div className="mt-2 text-2xl font-black text-white">{value.toLocaleString()}</div></div>;
}

function StateBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const tones = { neutral: "border-white/10 bg-white/[0.05] text-slate-300", good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", warning: "border-amber-400/30 bg-amber-400/10 text-amber-200", danger: "border-red-400/30 bg-red-400/10 text-red-200" };
  return <span className={`inline-flex items-center border px-2 py-1 text-[11px] font-bold leading-none ${tones[tone]}`}>{children}</span>;
}

function RibbonCard({ ribbon, arabic, onOpen }: { ribbon: Ribbon; arabic: boolean; onOpen: () => void }) {
  const name = ribbon.name_en || ribbon.name || "Unnamed ribbon";
  const description = arabic ? ribbon.description_ar : ribbon.description_en;
  return <article className="group overflow-hidden border border-white/10 bg-[#101722] transition hover:border-amber-400/45 hover:bg-[#131c28]">
    <RibbonImage ribbon={ribbon} />
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">{label(ribbon.source_category, arabic)}</p><h2 className="mt-1 text-lg font-black text-white">{name}</h2>{ribbon.name_ar && <p className="mt-1 text-sm text-slate-400" dir="rtl">{ribbon.name_ar}</p>}</div><StateBadge tone={availabilityTone(ribbon)}>{availabilityLabel(ribbon, arabic)}</StateBadge></div>
      <div className="flex flex-wrap gap-1.5"><StateBadge>{label(derivedDifficulty(ribbon), arabic)}</StateBadge>{ribbon.paid_requirement && ribbon.paid_requirement !== "none" && <StateBadge tone="warning">{arabic ? "تتطلب شراء أو حالة" : "Paid / status"}</StateBadge>}</div>
      <p className="line-clamp-3 min-h-[4.3rem] text-sm leading-7 text-slate-300">{text(description, arabic ? "المعلومات العربية غير متاحة لهذا السجل." : "No English description is available for this record.")}</p>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-500"><span title={arabic ? "إحصاء ملكيات مسجل في المصدر، وليس حالة حسابك" : "A source-recorded ownership statistic, not your account status"}>{arabic ? "عدد الملكيات المسجل" : "Recorded ownership"}: {text(ribbon.ownership_count_display || ribbon.ownership_count, "—")}</span><Button variant="outline" size="sm" className="border-amber-400/40 bg-transparent text-amber-300 hover:bg-amber-400/10 hover:text-amber-200" onClick={onOpen}>{arabic ? "التفاصيل" : "Details"}</Button></div>
    </div>
  </article>;
}

function FieldList({ values, ordered = false }: { values: any; ordered?: boolean }) {
  const rows = list(values);
  if (!rows.length) return <p className="text-sm text-slate-500">Not documented.</p>;
  const Tag = ordered ? "ol" : "ul";
  return <Tag className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 ps-5 text-sm leading-7 text-slate-300`}>{rows.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</Tag>;
}

function DetailSection({ title, children, arabic = false }: { title: string; children: React.ReactNode; arabic?: boolean }) {
  return <section className="border-t border-white/10 pt-5" dir={arabic ? "rtl" : "ltr"}><h3 className="mb-3 text-sm font-black uppercase tracking-[0.15em] text-amber-300">{title}</h3>{children}</section>;
}

function RibbonDetails({ ribbon, arabic }: { ribbon: Ribbon; arabic: boolean }) {
  const life = lifecycle(ribbon);
  const history = life.release_history?.known_releases || [];
  const name = ribbon.name_en || ribbon.name || "Unnamed ribbon";
  const sourceLinks = Array.from(new Set([ribbon.source_url, ribbon.ribbon_link, ...(ribbon.research_sources || [])].filter(Boolean))) as string[];
  return <div className="space-y-6 text-white">
    <div className="grid gap-5 md:grid-cols-[220px_1fr]"><RibbonImage ribbon={ribbon} large /><div className="space-y-3"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-400">{label(ribbon.source_category, arabic)}</p><h2 className="mt-2 text-3xl font-black">{name}</h2>{ribbon.name_ar && <p className="mt-2 text-base text-slate-300" dir="rtl">{ribbon.name_ar}</p>}</div><div className="flex flex-wrap gap-2"><StateBadge tone={availabilityTone(ribbon)}>{availabilityLabel(ribbon, arabic)}</StateBadge><StateBadge>{label(ribbon.exactness, arabic)}</StateBadge><StateBadge>{text(ribbon.ownership_count_display || ribbon.ownership_count, "—")} recorded ownership</StateBadge></div><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Ribbon ID</dt><dd className="mt-1 font-bold text-white">{text(ribbon.ribbon_id, "—")}</dd></div><div><dt className="text-slate-500">Difficulty</dt><dd className="mt-1 font-bold text-white">{label(derivedDifficulty(ribbon), arabic)}</dd></div></dl></div></div>

    <DetailSection title="English explanation"><div className="space-y-4"><p className="leading-7 text-slate-300">{text(ribbon.description_en || ribbon.description, "English information unavailable.")}</p><div><h4 className="mb-2 text-sm font-bold text-white">How to get it</h4><FieldList values={ribbon.how_to_get_en} ordered /></div><div><h4 className="mb-2 text-sm font-bold text-white">Difficulty note</h4><p className="text-sm leading-7 text-slate-300">{text(ribbon.difficulty_note_en, "Not documented.")}</p></div><div><h4 className="mb-2 text-sm font-bold text-white">Source limitations</h4><FieldList values={ribbon.source_limitations_en} /></div></div></DetailSection>
    <DetailSection title="الشرح بالعربية" arabic><div className="space-y-4"><p className="leading-8 text-slate-300">{text(ribbon.description_ar, "المعلومات العربية غير متاحة لهذا السجل.")}</p><div><h4 className="mb-2 text-sm font-bold text-white">طريقة الحصول</h4><FieldList values={ribbon.how_to_get_ar} ordered /></div><div><h4 className="mb-2 text-sm font-bold text-white">ملاحظة الصعوبة</h4><p className="text-sm leading-8 text-slate-300">{text(ribbon.difficulty_note_ar, "المعلومة غير موثقة.")}</p></div><div><h4 className="mb-2 text-sm font-bold text-white">حدود المصدر</h4><FieldList values={ribbon.source_limitations_ar} /></div></div></DetailSection>

    <DetailSection title="Requirements"><div className="space-y-4"><div><h4 className="mb-2 text-sm font-bold text-white">Paid requirement</h4><p className="text-sm leading-7 text-slate-300">{label(ribbon.paid_requirement, arabic)}</p></div>{(ribbon.required_items || []).length > 0 && <div><h4 className="mb-2 text-sm font-bold text-white">Required items</h4><div className="grid gap-3 sm:grid-cols-2">{ribbon.required_items.map((item: AnyRecord, index: number) => <div key={index} className="border border-white/10 bg-white/[0.03] p-3"><p className="font-bold text-white">{text(item.item_name_en, "Unnamed item")}</p><p className="mt-1 text-sm text-slate-400" dir="rtl">{text(item.item_name_ar, "اسم الآيتم غير متاح بالعربية")}</p><p className="mt-2 text-sm leading-6 text-slate-300">{text(item.item_note_en || item.availability_note_en, "No additional item note is documented.")}</p><p className="mt-2 text-sm leading-6 text-slate-400" dir="rtl">{text(item.item_note_ar || item.availability_note_ar, "لا توجد ملاحظة إضافية موثقة عن الآيتم.")}</p>{item.image_url && <img src={item.image_url} alt={text(item.item_name_en, "Required item")} loading="lazy" className="mt-3 h-24 w-full object-contain" />}</div>)}</div></div>}{(ribbon.historical_reward_items || []).length > 0 && <div><h4 className="mb-2 text-sm font-bold text-white">Historical reward items</h4><FieldList values={(ribbon.historical_reward_items || []).map((item: AnyRecord) => item.item_name_en || item.name_en || JSON.stringify(item))} /></div>}{ribbon.item_requirement_note_en && <div><h4 className="mb-2 text-sm font-bold text-white">Item requirement note</h4><p className="text-sm leading-7 text-slate-300">{ribbon.item_requirement_note_en}</p><p className="mt-2 text-sm leading-7 text-slate-400" dir="rtl">{text(ribbon.item_requirement_note_ar, "لا توجد ملاحظة عربية إضافية.")}</p></div>}</div></DetailSection>

    {Object.keys(life).length > 0 && <DetailSection title="Event lifecycle"><div className="grid gap-3 sm:grid-cols-2">{[["Exact ribbon availability", life.ribbon_availability], ["Event family status", life.event_status], ["Recurrence pattern", life.recurrence_pattern], ["First known date", life.first_known_date], ["First official date found", life.first_official_date_found], ["Latest official date range", life.latest_official_date_range], ["Usual return window", life.usual_return_window], ["Next expected window", life.next_expected_window], ["Confidence", life.confidence], ["Date status", life.date_status], ["First-ever release proven", life.first_ever_date_proven === true ? "Yes" : life.first_ever_date_proven === false ? "No" : undefined]].map(([k, v]) => <div key={String(k)} className="border border-white/10 bg-white/[0.03] p-3"><dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt><dd className="mt-1 text-sm leading-6 text-slate-200">{text(v, "Not documented.")}</dd></div>)}</div>{life.evidence_basis && <div className="mt-4"><h4 className="mb-2 text-sm font-bold text-white">Evidence basis</h4><FieldList values={life.evidence_basis} /></div>}</DetailSection>}

    {history.length > 0 && <DetailSection title="Release history"><div className="overflow-x-auto border border-white/10"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-white/[0.05] text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Period</th><th className="p-3">Precision</th><th className="p-3">Confidence</th><th className="p-3">Official source</th><th className="p-3">Notes</th></tr></thead><tbody className="divide-y divide-white/10">{history.map((row: AnyRecord, index: number) => <tr key={index} className="align-top"><td className="p-3 text-slate-200">{text(row.start_date || row.first_date, "—")} → {text(row.end_date || row.last_date, "—")}<br />{row.year ? `Year: ${row.year}` : ""}</td><td className="p-3 text-slate-300">{text(row.date_precision || row.precision, "—")}</td><td className="p-3 text-slate-300">{text(row.confidence, "—")}</td><td className="p-3">{row.source_url ? <a href={row.source_url} target="_blank" rel="noreferrer" className="text-amber-300 hover:underline">{text(row.source_title, "Official source")} <ExternalLink className="inline h-3 w-3" /></a> : "—"}</td><td className="p-3 text-slate-300">{text(row.notes, "—")}</td></tr>)}</tbody></table></div>{life.release_history.complete_lifetime_history_proven === false && <p className="mt-3 border-l-2 border-amber-400/60 pl-3 text-sm leading-6 text-amber-100">A missing release record means that no supported date was found in the current archive search. It does not prove that the event happened only once or never returned.</p>}</DetailSection>}

    <DetailSection title="Research basis"><div className="space-y-3"><p className="text-sm leading-7 text-slate-300">{text(ribbon.research_basis_en, "No English research basis is documented.")}</p><p className="text-sm leading-7 text-slate-400" dir="rtl">{text(ribbon.research_basis_ar, "لا توجد قاعدة بحث عربية موثقة.")}</p>{ribbon.research?.research_quality && <StateBadge>{ribbon.research.research_quality}</StateBadge>}</div></DetailSection>

    <DetailSection title="Official sources"><div className="space-y-2">{sourceLinks.length ? sourceLinks.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 break-all text-sm text-amber-300 hover:underline"><ExternalLink className="h-4 w-4 shrink-0" />{url}</a>) : <p className="text-sm text-slate-500">No official source URL is documented.</p>}</div></DetailSection>
  </div>;
}

export default function Ribbons() {
  const { language } = useLanguage();
  const arabic = language === "ar";
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedRecurrence, setSelectedRecurrence] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [paidOnly, setPaidOnly] = useState(false);
  const [knownHistory, setKnownHistory] = useState("all");
  const [exactDates, setExactDates] = useState("all");
  const [sort, setSort] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRibbon, setSelectedRibbon] = useState<Ribbon | null>(null);

  const categories = useMemo(() => Array.from(new Set(ribbons.map((r) => text(r.source_category)).filter(Boolean))).sort(), []);
  const availabilityOptions = useMemo(() => Array.from(new Set(ribbons.map(availability))).sort(), []);
  const eventOptions = useMemo(() => Array.from(new Set(ribbons.map(eventStatus))).sort(), []);
  const recurrenceOptions = useMemo(() => Array.from(new Set(ribbons.map(recurrence))).sort(), []);
  const difficultyOptions = useMemo(() => Array.from(new Set(ribbons.map(derivedDifficulty))).sort(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = ribbons.filter((ribbon) => {
      if (needle && !searchBlob(ribbon).includes(needle)) return false;
      if (selectedCategory !== "all" && text(ribbon.source_category) !== selectedCategory) return false;
      if (selectedAvailability !== "all" && availability(ribbon) !== selectedAvailability) return false;
      if (selectedEvent !== "all" && eventStatus(ribbon) !== selectedEvent) return false;
      if (selectedRecurrence !== "all" && recurrence(ribbon) !== selectedRecurrence) return false;
      if (selectedDifficulty !== "all" && derivedDifficulty(ribbon) !== selectedDifficulty) return false;
      if (paidOnly && (!ribbon.paid_requirement || ribbon.paid_requirement === "none")) return false;
      if (knownHistory === "yes" && !hasReleaseHistory(ribbon)) return false;
      if (knownHistory === "no" && hasReleaseHistory(ribbon)) return false;
      if (exactDates === "yes" && !hasExactDate(ribbon)) return false;
      if (exactDates === "no" && hasExactDate(ribbon)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "category") return derivedDifficulty(a).localeCompare(derivedDifficulty(b));
      if (sort === "ownership") return (b.ownership_count_number || 0) - (a.ownership_count_number || 0);
      if (sort === "availability") return availabilityLabel(a, false).localeCompare(availabilityLabel(b, false));
      if (sort === "history") return Number(hasReleaseHistory(b)) - Number(hasReleaseHistory(a));
      if (sort === "date") return text(lifecycle(b).first_known_date).localeCompare(text(lifecycle(a).first_known_date));
      if (sort === "oldest") return text(lifecycle(a).first_known_date).localeCompare(text(lifecycle(b).first_known_date));
      if (sort === "event") return eventStatus(a).localeCompare(eventStatus(b));
      return text(a.name_en || a.name).localeCompare(text(b.name_en || b.name));
    });
  }, [query, selectedCategory, selectedAvailability, selectedEvent, selectedRecurrence, selectedDifficulty, paidOnly, knownHistory, exactDates, sort]);

  const recurring = ribbons.filter(isRecurring).length;
  const historical = ribbons.filter(isHistoricalUnavailable).length;
  const documented = ribbons.filter(hasReleaseHistory).length;
  const resetFilters = () => { setQuery(""); setSelectedCategory("all"); setSelectedAvailability("all"); setSelectedEvent("all"); setSelectedRecurrence("all"); setSelectedDifficulty("all"); setPaidOnly(false); setKnownHistory("all"); setExactDates("all"); setSort("name"); };

  return <>
    <SEOHead title="CrossFire Ribbons | CrossFire Wiki" description="Browse all documented CrossFire ribbons with requirements, availability, event lifecycle, release history, official sources, and English and Arabic explanations." canonicalUrl={`https://crossfire.wiki${arabic ? "/ar/ribbons" : "/ribbons"}`} keywords={["CrossFire ribbons", "CrossFire ribbon requirements", "CrossFire Wiki ribbons"]} schemaType="CollectionPage" />
    <main dir={arabic ? "rtl" : "ltr"} className="min-h-screen bg-[#080c12] px-4 py-8 text-slate-100 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="border-b border-amber-400/25 pb-7"><div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400"><Link href="/" className="hover:text-amber-300">CrossFire Wiki</Link><span className="text-slate-700">/</span><span className="text-slate-500">Ribbons</span></div><div className="mt-5 max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">CrossFire progression archive</p><h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">Ribbons</h1><p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">A structured reference for CrossFire ribbons, their recorded requirements, ownership counts, availability, and documented event history.</p><p className="mt-3 max-w-3xl text-base leading-8 text-slate-400" dir="rtl">مرجع منظم لشارات CrossFire، يوضح شروط الحصول عليها، حالة توفرها داخل اللعبة، وتاريخ الفعاليات الموثق بدون خلطها بحالة امتلاك الحساب.</p></div></div>
        <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Total ribbons" value={ribbons.length} icon={History} /><Metric label="Condition-based" value={ribbons.filter((r) => String(availability(r)).includes("condition_based")).length} icon={CheckCircle2} /><Metric label="Historical / ended" value={historical} icon={LockKeyhole} /><Metric label="Recurring families" value={recurring} icon={CalendarDays} /><Metric label="Release history" value={documented} icon={History} /></div>

        <section className="border border-white/10 bg-[#101722] p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names, descriptions, IDs, requirements, sources, dates…" className="h-11 w-full border border-white/10 bg-[#080c12] px-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/60" /></div><Button variant="outline" className="h-11 border-white/10 bg-transparent text-slate-200 hover:bg-white/5" onClick={() => setShowFilters((v) => !v)}><SlidersHorizontal className="me-2 h-4 w-4" />{showFilters ? "Hide filters" : "Filters"}</Button><select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 border border-white/10 bg-[#080c12] px-3 text-sm text-slate-200 outline-none"><option value="name">Alphabetical</option><option value="category">Category</option><option value="ownership">Ownership count</option><option value="availability">Availability</option><option value="date">Newest known date</option><option value="oldest">Oldest known date</option><option value="event">Event status</option><option value="history">Documented history</option></select></div>
          {showFilters && <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4"><FilterSelect label="Source category" value={selectedCategory} onChange={setSelectedCategory} options={categories} /><FilterSelect label="Availability window" value={selectedAvailability} onChange={setSelectedAvailability} options={availabilityOptions} /><FilterSelect label="Event status" value={selectedEvent} onChange={setSelectedEvent} options={eventOptions} /><FilterSelect label="Recurrence" value={selectedRecurrence} onChange={setSelectedRecurrence} options={recurrenceOptions} /><FilterSelect label="Difficulty / category" value={selectedDifficulty} onChange={setSelectedDifficulty} options={difficultyOptions} /><FilterSelect label="Release history" value={knownHistory} onChange={setKnownHistory} options={["yes", "no"]} /><FilterSelect label="Exact official dates" value={exactDates} onChange={setExactDates} options={["yes", "no"]} /><label className="flex items-center gap-3 border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-300"><input type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} className="accent-amber-400" />Paid or status requirement</label><Button variant="outline" className="border-amber-400/30 bg-transparent text-amber-300 hover:bg-amber-400/10" onClick={resetFilters}><X className="me-2 h-4 w-4" />Clear filters</Button></div>}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-400">Showing <span className="font-bold text-white">{filtered.length.toLocaleString()}</span> of {ribbons.length.toLocaleString()} ribbons</p><p className="text-xs text-slate-500">Names remain in English in every view. Missing fields are shown as undocumented.</p></div>
        {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((ribbon) => <RibbonCard key={String(ribbon.ribbon_id || ribbon.name_en || ribbon.name)} ribbon={ribbon} arabic={arabic} onOpen={() => setSelectedRibbon(ribbon)} />)}</div> : <div className="border border-dashed border-white/15 bg-[#101722] px-6 py-16 text-center"><Filter className="mx-auto h-8 w-8 text-slate-600" /><h2 className="mt-4 text-xl font-bold text-white">No ribbons match these filters</h2><p className="mt-2 text-sm text-slate-400">Clear one or more filters or search terms to see the full catalog.</p><Button variant="outline" className="mt-5 border-amber-400/30 bg-transparent text-amber-300" onClick={resetFilters}>Reset search</Button></div>}
      </div>
    </main>
    <Dialog open={Boolean(selectedRibbon)} onOpenChange={(open) => !open && setSelectedRibbon(null)}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto border-white/10 bg-[#0b111a] text-white"><DialogHeader><DialogTitle className="sr-only">{selectedRibbon?.name_en || selectedRibbon?.name || "Ribbon details"}</DialogTitle></DialogHeader>{selectedRibbon && <RibbonDetails ribbon={selectedRibbon} arabic={arabic} />}</DialogContent></Dialog>
  </>;
}

function FilterSelect({ label: selectLabel, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="space-y-1 text-xs font-bold text-slate-500"><span>{selectLabel}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full border border-white/10 bg-[#080c12] px-2 text-sm font-normal text-slate-200 outline-none focus:border-amber-400/60"><option value="all">All</option>{options.map((option) => <option key={option} value={option}>{label(option, false)}</option>)}</select></label>;
}
