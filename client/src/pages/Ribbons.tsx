import { useMemo, useState } from "react";
import { Filter, Image as ImageIcon, Search, X, CalendarDays, LockKeyhole, CheckCircle2, History, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/components/LanguageProvider";
import ribbonDataset from "@/data/crossfire_ribbons_dataset_upgraded.json";

// ─── Theme — نفس الصفحة الرئيسية بالظبط ───
const GOLD = "#f5a623";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "rgba(255,255,255,0.07)";

type AnyRecord = Record<string, any>;
type Ribbon = AnyRecord & { ribbon_id?: string | number; name?: string; name_en?: string; name_ar?: string; event_lifecycle?: AnyRecord };

const ribbons = ((ribbonDataset as AnyRecord).items || (ribbonDataset as AnyRecord).ribbons || []) as Ribbon[];

function text(value: any, fallback = "") {
  if (Array.isArray(value)) return value.filter(Boolean).join(" ");
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function list(value: any): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === null || value === undefined || value === "") return [];
  return [String(value)];
}

// كلمة شارة ممنوعة — كله ريبون / ريبونات
function toRibbonWords(s: string): string {
  return s
    .replaceAll("الشارات", "الريبونات")
    .replaceAll("شارات", "ريبونات")
    .replaceAll("الشارة", "الريبون")
    .replaceAll("شارة", "ريبون");
}

// ─── التصنيفات بالعربي ───
const SOURCE_AR: Record<string, string> = {
  "status": "الحالة",
  "ribbons progress": "تقدم الريبونات",
  "years of service": "سنين الخدمة",
  "cream of the crop": "مميزين المجتمع",
  "inventory": "الأسلحة والمخزون",
  "game stats": "إحصائيات اللعب",
  "mode stats": "إحصائيات الأطوار",
  "clan": "الكلان",
  "annual events": "ايفنتات سنوية",
  "special events": "ايفنتات محدودة",
};

const SOURCE_EN: Record<string, string> = {
  "status": "Status",
  "ribbons progress": "Ribbon progress",
  "years of service": "Years of service",
  "cream of the crop": "Community picks",
  "inventory": "Weapons & inventory",
  "game stats": "Game stats",
  "mode stats": "Mode stats",
  "clan": "Clan",
  "annual events": "Annual events",
  "special events": "Limited events",
};

function sourceCategory(ribbon: Ribbon, arabic: boolean): string {
  const raw = text(ribbon.source_category, "").trim();
  const key = raw.toLowerCase();
  if (arabic) return SOURCE_AR[key] || (raw ? toRibbonWords(raw) : "غير محدد");
  return SOURCE_EN[key] || raw || "Not specified";
}

// ─── النوع / الصعوبة بالعربي ───
function difficultyKey(ribbon: Ribbon): string {
  const raw = `${text(ribbon.category, "")} ${text(ribbon.category_label_en, "")} ${text(ribbon.category_label_ar, "")}`.toLowerCase();
  if (raw.includes("easy")) return "easy";
  if (raw.includes("time") || raw.includes("grind") || raw.includes("وقت") || raw.includes("تجميع")) return "grind";
  if (raw.includes("skill") || raw.includes("aim") || raw.includes("مهارة") || raw.includes("تصويب")) return "skill";
  if (raw.includes("zp") || raw.includes("real") || raw.includes("فلوس") || raw.includes("payment")) return "zp";
  if (raw.includes("special") || raw.includes("status") || raw.includes("حالة")) return "status";
  if (raw.includes("event") || raw.includes("limited") || raw.includes("إيفنت") || raw.includes("ايفنت") || raw.includes("محدود")) return "limited";
  if (raw.includes("collection") || raw.includes("purchase") || raw.includes("شراء")) return "collection";
  return "limited";
}

const DIFFICULTY_AR: Record<string, string> = {
  easy: "سهل دلوقتي",
  grind: "محتاج وقت ولعب",
  skill: "محتاج مهارة وتصويب",
  zp: "بفلوس / ZP",
  status: "حالة خاصة",
  limited: "ايفنتات محدودة",
  collection: "تجميع / شراء",
};

const DIFFICULTY_EN: Record<string, string> = {
  easy: "Easy now",
  grind: "Needs time & play",
  skill: "Needs skill & aim",
  zp: "ZP / real money",
  status: "Special status",
  limited: "Limited events",
  collection: "Collection / buy",
};

function difficultyLabel(ribbon: Ribbon, arabic: boolean): string {
  const k = difficultyKey(ribbon);
  return arabic ? DIFFICULTY_AR[k] : DIFFICULTY_EN[k];
}

// ─── الحالة المبسطة: 4 حالات بس ───
type AvailState = "active" | "limited" | "ended" | "pass";

function availabilityState(ribbon: Ribbon): AvailState {
  const life = ribbon.event_lifecycle || {};
  const blob = `${text(life.ribbon_availability)} ${text(life.event_status)} ${text(life.recurrence_pattern)} ${text((ribbon as AnyRecord).category)}`.toLowerCase();
  if (blob.includes("permanently_ended") || blob.includes("discontinued") || blob.includes("one_time") || blob.includes("not_expected")) return "ended";
  if (blob.includes("subscri") || blob.includes("premium") || blob.includes("premium") || text((ribbon as AnyRecord).paid_requirement) === "explicit_zp_or_payment" && blob.includes("pass")) return "pass";
  if (blob.includes("window_closed") || blob.includes("event") || blob.includes("recurr") || blob.includes("annual") || blob.includes("seasonal") || blob.includes("rotating") || blob.includes("specific") || blob.includes("limited")) return "limited";
  if (blob.includes("condition_based") || blob.includes("not_an_event")) return "active";
  // غير الايفنتات = شغال، والايفنتات = محدودة
  const isEvent = (life as AnyRecord).is_event === true;
  return isEvent ? "limited" : "active";
}

const AVAIL_AR: Record<AvailState, string> = {
  active: "شغال دلوقتي",
  limited: "ايفنتات محدودة",
  ended: "انتهى ومش راجع",
  pass: "محتاج اشتراك",
};

const AVAIL_EN: Record<AvailState, string> = {
  active: "Available now",
  limited: "Limited events",
  ended: "Ended",
  pass: "Pass / status",
};

function availabilityLabel(ribbon: Ribbon, arabic: boolean): string {
  return arabic ? AVAIL_AR[availabilityState(ribbon)] : AVAIL_EN[availabilityState(ribbon)];
}

function availabilityTone(ribbon: Ribbon): "neutral" | "good" | "warning" | "danger" {
  const s = availabilityState(ribbon);
  if (s === "ended") return "danger";
  if (s === "limited" || s === "pass") return "warning";
  return "good";
}

// ─── ايفنتات الأسلحة الأسبوعية ───
const WEEKLY_WEAPON: Array<{ match: string[]; weapon: string; weaponEn: string }> = [
  { match: ["smg"], weapon: "أسلحة SMG", weaponEn: "SMG weapons" },
  { match: ["rifle"], weapon: "أسلحة Rifle", weaponEn: "Rifle weapons" },
  { match: ["machine gun", "mg week"], weapon: "رشاشات MG", weaponEn: "MG weapons" },
  { match: ["knife"], weapon: "السكاكين", weaponEn: "Knives" },
  { match: ["sniper"], weapon: "القناصات", weaponEn: "Snipers" },
  { match: ["pistol", "handgun"], weapon: "المسدسات", weaponEn: "Pistols" },
  { match: ["shotgun"], weapon: "الشوتجن", weaponEn: "Shotguns" },
  { match: ["zombie"], weapon: "طور الزومبي", weaponEn: "Zombie mode" },
  { match: ["mutation"], weapon: "طور الـ Mutation", weaponEn: "Mutation mode" },
  { match: ["shadow"], weapon: "طور الـ Shadow", weaponEn: "Shadow mode" },
  { match: ["parkour"], weapon: "طور الباركور", weaponEn: "Parkour mode" },
];

function weeklyWeapon(ribbon: Ribbon): { weapon: string; weaponEn: string } | null {
  const name = `${text(ribbon.name_en || ribbon.name)}`.toLowerCase();
  if (!name.includes("week")) return null;
  for (const row of WEEKLY_WEAPON) {
    if (row.match.some((m) => name.includes(m))) return { weapon: row.weapon, weaponEn: row.weaponEn };
  }
  return { weapon: "السلاح بتاع الأسبوع ده", weaponEn: "that week's weapon" };
}

function isWeeklyEvent(ribbon: Ribbon): boolean {
  return weeklyWeapon(ribbon) !== null;
}

// ─── الشرح بالعامية ───
function arabicDescription(ribbon: Ribbon): string {
  const weekly = weeklyWeapon(ribbon);
  const eventName = text(ribbon.name_en || ribbon.name, "الايفنت");
  if (weekly) {
    return `الريبون ده من ايفنتات الأسلحة الأسبوعية بتاعت ${eventName}. أول ما الايفنت بينزل في وقته بيطلب منك تعمل شوية مهام بـ ${weekly.weapon} جوه اللعبة. الايفنت بيقعد أسبوع واحد بس وبيخلص، فتابع الموقع هنا أول بأول عشان تعرف لحظة ما ينزل وتلحق تخلص مهامه قبل ما يقفل.`;
  }
  const raw = text(ribbon.description_ar || ribbon.description_en || ribbon.description, "");
  if (!raw) return "لسه بنجهز شرح مفصل للريبون ده بالعامية.";
  return toRibbonWords(raw);
}

function englishDescription(ribbon: Ribbon): string {
  const weekly = weeklyWeapon(ribbon);
  const eventName = text(ribbon.name_en || ribbon.name, "this event");
  if (weekly) {
    return `${eventName} is a weekly weapon event ribbon. When the event goes live for its week, you complete missions with ${weekly.weaponEn}. It lasts one week only, so follow this site to catch it the moment it drops.`;
  }
  return text(ribbon.description_en || ribbon.description, "No description is available for this ribbon yet.");
}

function arabicSteps(ribbon: Ribbon): string[] {
  const weekly = weeklyWeapon(ribbon);
  const eventName = text(ribbon.name_en || ribbon.name, "الايفنت");
  if (weekly) {
    return [
      `تابع الموقع هنا أول بأول — أول ما ايفنت ${eventName} ينزل هتلاقيه في صفحة الايفنتات.`,
      `ادخل اللعبة في وقت الايفنت والعب بـ ${weekly.weapon} وخلص المهام اليومية كلها بتاعت الأسبوع.`,
      `متستناش لآخر يوم — خلص مهامك بدري عشان لو يوم فاتك الريبون ممكن يضيع عليك.`,
      `بعد ما تخلص كل المهام افتح صفحة الريبونات في البروفايل بتاعك واتأكد إن الريبون اتسجل عندك.`,
    ];
  }
  const rows = list((ribbon as AnyRecord).how_to_get_ar);
  if (rows.length) return rows.map(toRibbonWords);
  const en = list((ribbon as AnyRecord).how_to_get_en);
  if (en.length) return en.map(toRibbonWords);
  // خطوات عامة حسب النوع
  const k = difficultyKey(ribbon);
  if (k === "easy") return ["اعمل الشرط المكتوب فوق — بيخلص بسرعة ومش محتاج وقت.", "افتح صفحة الريبونات في البروفايل بتاعك واتأكد إن الريبون اتسجل."];
  if (k === "grind") return ["الريبون ده محتاج وقت ولعب — العب كتير وجمع العدد المطلوب واحدة واحدة.", "افتح صفحة الريبونات في البروفايل بتاعك وتابع تقدمك لحد ما يتسجل."];
  if (k === "skill") return ["الريبون ده محتاج مهارة وتصويب — ركز على الهيدشوت وحافظ على الـ K/D بتاعك.", "لما توصل للرقم المطلوب افتح صفحة الريبونات واتأكد إنه اتسجل."];
  if (k === "zp") return ["الريبون ده بفلوس — هتحتاج تشتري ZP أو الآيتم المطلوب من المتجر.", "بعد الشراء افتح صفحة الريبونات واتأكد إن الريبون اتسجل."];
  if (availabilityState(ribbon) === "limited") return ["الريبون ده من الايفنتات المحدودة — بيظهر في وقته بس.", "تابع الموقع هنا عشان تعرف أول ما الايفنت ينزل وخلص مهامه قبل ما يقفل."];
  if (availabilityState(ribbon) === "ended") return ["الريبون ده انتهى ومش راجع — كان بيتاخد في وقته بس.", "لو مش عندك من زمان مش هتعرف تجيبه دلوقتي."];
  return ["اعمل الشرط المكتوب فوق لحد ما يخلص.", "افتح صفحة الريبونات في البروفايل بتاعك واتأكد إن الريبون اتسجل."];
}

function englishSteps(ribbon: Ribbon): string[] {
  const rows = list((ribbon as AnyRecord).how_to_get_en);
  if (rows.length) return rows;
  return ["Complete the requirement above.", "Open the Ribbons page on your profile and confirm it is recorded."];
}

function arabicTip(ribbon: Ribbon): string {
  if (isWeeklyEvent(ribbon)) return "نصيحة: ايفنتات الأسلحة الأسبوعية بتخلص بسرعة — أول يومين أهم يومين، خلص فيهم أكبر جزء من المهام.";
  const raw = text((ribbon as AnyRecord).difficulty_note_ar, "");
  if (raw) return toRibbonWords(raw);
  const k = difficultyKey(ribbon);
  if (k === "easy") return "يخلص بسرعة ومش محتاج مجهود.";
  if (k === "grind") return "محتاج وقت ولعب — قسمه على كذا يوم بدل ما تزنق نفسك.";
  if (k === "skill") return "محتاج مهارة وتصويب — العب على الهادي وحافظ على مستواك.";
  if (k === "zp") return "محتاج فلوس — اتأكد إنك تشتري من مكان مضمون.";
  if (availabilityState(ribbon) === "ended") return "انتهى ومش راجع — متضيعش وقتك تدور عليه.";
  if (availabilityState(ribbon) === "limited") return "ايفنت محدود — تابع الموقع عشان تلحقه أول ما ينزل.";
  return "اعمله على مهلك وتابع تقدمك من البروفايل.";
}

function searchBlob(ribbon: Ribbon) { return JSON.stringify(ribbon).toLowerCase(); }

function RibbonImage({ ribbon, arabic = true }: { ribbon: Ribbon; arabic?: boolean }) {
  const src = String(ribbon.image_url || "");
  const [failed, setFailed] = useState(!src);
  return (
    <div className="relative flex h-36 items-center justify-center overflow-hidden" style={{ background: "#050505" }}>
      {!failed ? (
        <img src={src} alt={`${ribbon.name_en || ribbon.name || "Ribbon"} ribbon`} loading="lazy" decoding="async" className="h-full w-full object-contain p-4" onError={() => setFailed(true)} />
      ) : <div className="flex flex-col items-center gap-2 text-slate-600"><ImageIcon aria-hidden="true" className="h-10 w-10" /><span className="text-xs">{arabic ? "الصورة مش متاحة" : "Image unavailable"}</span></div>}
    </div>
  );
}

function Metric({ label: metricLabel, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return <div className="px-4 py-3" style={{ border: `1px solid ${BORDER}`, background: CARD }}><div className="flex items-center gap-2 text-xs uppercase tracking-[0.13em] text-slate-500"><Icon className="h-4 w-4" style={{ color: GOLD }} />{metricLabel}</div><div className="mt-2 text-2xl font-black text-white">{value.toLocaleString()}</div></div>;
}

function StateBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const tones = { neutral: "border-white/10 bg-white/[0.05] text-slate-300", good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", warning: "border-amber-400/30 bg-amber-400/10 text-amber-200", danger: "border-red-400/30 bg-red-400/10 text-red-200" };
  return <span className={`inline-flex items-center border px-2 py-1 text-[11px] font-bold leading-none ${tones[tone]}`}>{children}</span>;
}

function RibbonCard({ ribbon, arabic, onOpen }: { ribbon: Ribbon; arabic: boolean; onOpen: () => void }) {
  const name = text(ribbon.name_en || ribbon.name, arabic ? "ريبون من غير اسم" : "Unnamed ribbon");
  const description = arabic ? arabicDescription(ribbon) : englishDescription(ribbon);
  const needsBuy = (ribbon as AnyRecord).paid_requirement && (ribbon as AnyRecord).paid_requirement !== "none";
  return <article className="group overflow-hidden transition" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
    <RibbonImage ribbon={ribbon} arabic={arabic} />
    <div className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: GOLD }}>{sourceCategory(ribbon, arabic)}</p>
          <h2 className="mt-1 text-lg font-black text-white">{name}</h2>
          {ribbon.name_ar && <p className="mt-1 text-sm text-slate-400" dir="rtl">{toRibbonWords(text(ribbon.name_ar))}</p>}
        </div>
        <StateBadge tone={availabilityTone(ribbon)}>{availabilityLabel(ribbon, arabic)}</StateBadge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StateBadge>{difficultyLabel(ribbon, arabic)}</StateBadge>
        {needsBuy && <StateBadge tone="warning">{arabic ? "محتاج فلوس / شراء" : "Needs buy"}</StateBadge>}
      </div>
      <p className="line-clamp-3 min-h-[4.3rem] text-sm leading-7 text-slate-300" dir={arabic ? "rtl" : "ltr"}>{description}</p>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-500">
        <span>{arabic ? `واخده ${text(ribbon.ownership_count_display || ribbon.ownership_count, "—")} واحد` : `${text(ribbon.ownership_count_display || ribbon.ownership_count, "—")} owners`}</span>
        <Button variant="outline" size="sm" className="border-amber-400/40 bg-transparent text-amber-300 hover:bg-amber-400/10 hover:text-amber-200" onClick={onOpen}>{arabic ? "التفاصيل" : "Details"}</Button>
      </div>
    </div>
  </article>;
}

function FieldList({ values, ordered = false, arabic = false }: { values: any; ordered?: boolean; arabic?: boolean }) {
  const rows = list(values);
  if (!rows.length) return <p className="text-sm text-slate-500">{arabic ? "مش متسجلة." : "Not documented."}</p>;
  const Tag = ordered ? "ol" : "ul";
  return <Tag className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 ps-5 text-sm leading-7 text-slate-300`}>{rows.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</Tag>;
}

function DetailSection({ title, children, arabic = false }: { title: string; children: React.ReactNode; arabic?: boolean }) {
  return <section className="border-t border-white/10 pt-5" dir={arabic ? "rtl" : "ltr"}><h3 className="mb-3 text-sm font-black uppercase tracking-[0.15em]" style={{ color: GOLD }}>{title}</h3>{children}</section>;
}

function RibbonDetails({ ribbon, arabic }: { ribbon: Ribbon; arabic: boolean }) {
  const name = text(ribbon.name_en || ribbon.name, arabic ? "ريبون من غير اسم" : "Unnamed ribbon");
  const description = arabic ? arabicDescription(ribbon) : englishDescription(ribbon);
  const steps = arabic ? arabicSteps(ribbon) : englishSteps(ribbon);
  const requiredItems = list((ribbon as AnyRecord).required_items).length ? ((ribbon as AnyRecord).required_items as AnyRecord[]) : [];
  const needsBuy = (ribbon as AnyRecord).paid_requirement && (ribbon as AnyRecord).paid_requirement !== "none";
  return <div className="space-y-6 text-white">
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <div className="overflow-hidden" style={{ border: `1px solid ${BORDER}` }}><RibbonImage ribbon={ribbon} arabic={arabic} /></div>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>{sourceCategory(ribbon, arabic)}</p>
          <h2 className="mt-2 text-3xl font-black">{name}</h2>
          {ribbon.name_ar && <p className="mt-2 text-base text-slate-300" dir="rtl">{toRibbonWords(text(ribbon.name_ar))}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StateBadge tone={availabilityTone(ribbon)}>{availabilityLabel(ribbon, arabic)}</StateBadge>
          <StateBadge>{difficultyLabel(ribbon, arabic)}</StateBadge>
          <StateBadge>{arabic ? `واخده ${text(ribbon.ownership_count_display || ribbon.ownership_count, "—")} واحد` : `${text(ribbon.ownership_count_display || ribbon.ownership_count, "—")} owners`}</StateBadge>
        </div>
      </div>
    </div>

    <DetailSection title={arabic ? "الشرح بالعامية" : "What is this ribbon?"} arabic={arabic}>
      <p className="leading-8 text-slate-300">{description}</p>
    </DetailSection>

    <DetailSection title={arabic ? "ازاي تجيب الريبون ده؟" : "How to get it"} arabic={arabic}>
      <FieldList values={steps} ordered arabic={arabic} />
    </DetailSection>

    {(needsBuy || requiredItems.length > 0) && (
      <DetailSection title={arabic ? "محتاج تشتري حاجة؟" : "Do you need to buy anything?"} arabic={arabic}>
        <div className="space-y-3">
          <p className="text-sm leading-7 text-slate-300">
            {arabic
              ? needsBuy
                ? "أيوه — الريبون ده محتاج فلوس أو شراء من المتجر (ZP أو آيتم معين). اتأكد إنك تشتري من مكان مضمون."
                : "لأ — مش محتاج فلوس، بس محتاج يكون عندك الآيتمات دي:"
              : needsBuy
                ? "Yes — this ribbon needs a purchase (ZP or a specific item). Buy from a trusted place."
                : "No money needed, but you need these items:"}
          </p>
          {requiredItems.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {requiredItems.map((item: AnyRecord, index: number) => (
                <div key={index} className="p-3" style={{ border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.03)" }}>
                  <p className="font-bold text-white">{text(arabic ? (item.item_name_ar || item.item_name_en) : (item.item_name_en || item.item_name_ar), arabic ? "آيتم" : "Item")}</p>
                  {(item.item_note_ar || item.item_note_en || item.availability_note_ar || item.availability_note_en) && (
                    <p className="mt-2 text-sm leading-6 text-slate-300" dir={arabic ? "rtl" : "ltr"}>
                      {arabic ? toRibbonWords(text(item.item_note_ar || item.availability_note_ar || item.item_note_en)) : text(item.item_note_en || item.availability_note_en)}
                    </p>
                  )}
                  {(item.image_url || ribbon.image_url) && <img src={item.image_url || ribbon.image_url} alt={text(arabic ? (item.item_name_ar || item.item_name_en) : (item.item_name_en || item.item_name_ar), "Required item")} loading="lazy" className="mt-3 h-24 w-full object-contain" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </DetailSection>
    )}

    <DetailSection title={arabic ? "نصيحة سريعة" : "Quick tip"} arabic={arabic}>
      <p className="text-sm leading-8 text-slate-300">{arabic ? arabicTip(ribbon) : text((ribbon as AnyRecord).difficulty_note_en, "Play it step by step and track your progress.")}</p>
    </DetailSection>
  </div>;
}

export default function Ribbons() {
  const { language } = useLanguage();
  const arabic = language === "ar";
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  const [sort, setSort] = useState("name");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRibbon, setSelectedRibbon] = useState<Ribbon | null>(null);

  const groups = useMemo(() => Array.from(new Set(ribbons.map((r) => sourceCategory(r, arabic)))).sort(), [arabic]);
  const types = useMemo(() => Array.from(new Set(ribbons.map((r) => difficultyLabel(r, arabic)))).sort(), [arabic]);
  const states = useMemo(() => Array.from(new Set(ribbons.map((r) => availabilityLabel(r, arabic)))).sort(), [arabic]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = ribbons.filter((ribbon) => {
      if (needle && !searchBlob(ribbon).includes(needle)) return false;
      if (selectedGroup !== "all" && sourceCategory(ribbon, arabic) !== selectedGroup) return false;
      if (selectedType !== "all" && difficultyLabel(ribbon, arabic) !== selectedType) return false;
      if (selectedState !== "all" && availabilityLabel(ribbon, arabic) !== selectedState) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "ownership") return (((b as AnyRecord).ownership_count_number || 0) as number) - (((a as AnyRecord).ownership_count_number || 0) as number);
      if (sort === "type") return difficultyLabel(a, arabic).localeCompare(difficultyLabel(b, arabic));
      if (sort === "state") return availabilityLabel(a, false).localeCompare(availabilityLabel(b, false));
      return text(a.name_en || a.name).localeCompare(text(b.name_en || b.name));
    });
  }, [query, selectedGroup, selectedType, selectedState, sort, arabic]);

  const activeCount = ribbons.filter((r) => availabilityState(r) === "active").length;
  const limitedCount = ribbons.filter((r) => availabilityState(r) === "limited").length;
  const endedCount = ribbons.filter((r) => availabilityState(r) === "ended").length;
  const resetFilters = () => { setQuery(""); setSelectedGroup("all"); setSelectedType("all"); setSelectedState("all"); setSort("name"); };

  return <>
    <SEOHead title={arabic ? "ريبونات CrossFire | CrossFire Wiki" : "CrossFire Ribbons | CrossFire Wiki"} description={arabic ? "كل ريبونات CrossFire مشروحة بالعامية: ازاي تجيب كل ريبون، الايفنتات المحدودة، والايفنتات السنوية." : "All CrossFire ribbons with simple requirements and event info."} canonicalUrl={`https://crossfire.wiki${arabic ? "/ar/ribbons" : "/ribbons"}`} keywords={["CrossFire ribbons", "ريبونات كروس فاير", "CrossFire Wiki ribbons"]} schemaType="CollectionPage" />
    <main dir={arabic ? "rtl" : "ltr"} className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8 lg:py-12" style={{ background: BG }}>
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="pb-7" style={{ borderBottom: `1px solid rgba(245,166,35,0.25)` }}>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            <Link href="/" className="hover:text-amber-300">CrossFire Wiki</Link>
            <span className="text-slate-700">/</span>
            <span className="text-slate-500">{arabic ? "الريبونات" : "Ribbons"}</span>
          </div>
          <div className="mt-5 max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{arabic ? "أرشيف تقدم اللعبة" : "CrossFire progression archive"}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{arabic ? "الريبونات" : "Ribbons"}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300" dir={arabic ? "rtl" : "ltr"}>
              {arabic
                ? "كل ريبونات CrossFire مشروحة بالعامية: الريبون ده بتاع إيه وازاي تجيبه خطوة بخطوة — سواء كان سهل دلوقتي، أو محتاج وقت ولعب، أو من الايفنتات المحدودة والايفنتات السنوية."
                : "Every CrossFire ribbon explained simply: what it is and how to get it step by step."}
            </p>
          </div>
        </div>

        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ border: `1px solid ${BORDER}`, background: BORDER }}>
          <Metric label={arabic ? "كل الريبونات" : "Total ribbons"} value={ribbons.length} icon={History} />
          <Metric label={arabic ? "شغال دلوقتي" : "Available now"} value={activeCount} icon={CheckCircle2} />
          <Metric label={arabic ? "ايفنتات محدودة" : "Limited events"} value={limitedCount} icon={CalendarDays} />
          <Metric label={arabic ? "انتهى ومش راجع" : "Ended"} value={endedCount} icon={LockKeyhole} />
        </div>

        <section className="p-4 sm:p-5" style={{ border: `1px solid ${BORDER}`, background: CARD }}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={arabic ? "دوّر على اسم ريبون أو ايفنت…" : "Search ribbon or event names…"}
                className="h-11 w-full border border-white/10 bg-[#050505] px-10 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/60"
              />
            </div>
            <Button variant="outline" className="h-11 border-white/10 bg-transparent text-slate-200 hover:bg-white/5" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="me-2 h-4 w-4" />{showFilters ? (arabic ? "اخفي الفلاتر" : "Hide filters") : (arabic ? "الفلاتر" : "Filters")}
            </Button>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 border border-white/10 bg-[#050505] px-3 text-sm text-slate-200 outline-none">
              <option value="name">{arabic ? "أبجدي" : "Alphabetical"}</option>
              <option value="ownership">{arabic ? "الأكثر معاهم الريبون" : "Most owned"}</option>
              <option value="type">{arabic ? "حسب النوع" : "By type"}</option>
              <option value="state">{arabic ? "حسب الحالة" : "By status"}</option>
            </select>
          </div>
          {showFilters && (
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label={arabic ? "التصنيف" : "Category"} value={selectedGroup} onChange={setSelectedGroup} options={groups} allLabel={arabic ? "الكل" : "All"} />
              <FilterSelect label={arabic ? "النوع" : "Type"} value={selectedType} onChange={setSelectedType} options={types} allLabel={arabic ? "الكل" : "All"} />
              <FilterSelect label={arabic ? "الحالة" : "Status"} value={selectedState} onChange={setSelectedState} options={states} allLabel={arabic ? "الكل" : "All"} />
              <Button variant="outline" className="border-amber-400/30 bg-transparent text-amber-300 hover:bg-amber-400/10" onClick={resetFilters}>
                <X className="me-2 h-4 w-4" />{arabic ? "امسح الفلاتر" : "Clear filters"}
              </Button>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{arabic ? <>باين <span className="font-bold text-white">{filtered.length.toLocaleString()}</span> من {ribbons.length.toLocaleString()} ريبون</> : <>Showing <span className="font-bold text-white">{filtered.length.toLocaleString()}</span> of {ribbons.length.toLocaleString()} ribbons</>}</p>
          <p className="text-xs text-slate-500" dir="rtl">{arabic ? "تابع الموقع أول بأول عشان تلحق الايفنتات المحدودة لحظة ما تنزل." : "Follow the site to catch limited events the moment they drop."}</p>
        </div>

        {filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ribbon) => <RibbonCard key={String(ribbon.ribbon_id || ribbon.name_en || ribbon.name)} ribbon={ribbon} arabic={arabic} onOpen={() => setSelectedRibbon(ribbon)} />)}
          </div>
        ) : (
          <div className="px-6 py-16 text-center" style={{ border: "1px dashed rgba(255,255,255,0.15)", background: CARD }}>
            <Filter className="mx-auto h-8 w-8 text-slate-600" />
            <h2 className="mt-4 text-xl font-bold text-white">{arabic ? "مفيش ريبونات مطابقة" : "No ribbons match these filters"}</h2>
            <p className="mt-2 text-sm text-slate-400">{arabic ? "امسح الفلاتر أو دوّر بكلمة تانية." : "Clear filters or try another search term."}</p>
            <Button variant="outline" className="mt-5 border-amber-400/30 bg-transparent text-amber-300" onClick={resetFilters}>{arabic ? "امسح البحث" : "Reset search"}</Button>
          </div>
        )}
      </div>
    </main>
    <Dialog open={Boolean(selectedRibbon)} onOpenChange={(open) => !open && setSelectedRibbon(null)}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto text-white" style={{ background: "#0a0a0a", border: `1px solid ${BORDER}` }}>
        <DialogHeader><DialogTitle className="sr-only">{selectedRibbon?.name_en || selectedRibbon?.name || "Ribbon details"}</DialogTitle></DialogHeader>
        {selectedRibbon && <RibbonDetails ribbon={selectedRibbon} arabic={arabic} />}
      </DialogContent>
    </Dialog>
  </>;
}

function FilterSelect({ label: selectLabel, value, onChange, options, allLabel }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel: string }) {
  return <label className="space-y-1 text-xs font-bold text-slate-500"><span>{selectLabel}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-full border border-white/10 bg-[#050505] px-2 text-sm font-normal text-slate-200 outline-none focus:border-amber-400/60"><option value="all">{allLabel}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
