import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Image as ImageIcon, Loader2, X, ChevronUp, ExternalLink } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Weapon {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  backgroundUrl?: string;
  category?: string;
  description?: string;
  descriptionAr?: string;
  stats?: Record<string, any>;
  highlightedName?: string;
  createdAt?: string;
  sourceUrl?: string;
  acquisitionType?: string;
  acquisitionMethod?: string;
  acquisitionVerified?: boolean;
}

type AcquisitionKey = "all" | "gp" | "zp" | "mp" | "black-market" | "event" | "unverified";

const ACQUISITION_META: Record<AcquisitionKey, { en: string; ar: string; color: string }> = {
  all: { en: "All items", ar: "كل الأسلحة", color: "#f5a623" },
  gp: { en: "GP Shop", ar: "متجر GP", color: "#72c7ff" },
  zp: { en: "ZP / Cash", ar: "ZP / نقدي", color: "#f7c86b" },
  mp: { en: "Mileage", ar: "متجر الأميال", color: "#c5a7ff" },
  "black-market": { en: "Black Market", ar: "السوق السوداء", color: "#ff7d68" },
  event: { en: "Event / Pass", ar: "فعالية / تذكرة", color: "#75d6a0" },
  unverified: { en: "Unverified", ar: "غير متحقق", color: "#89909c" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "assault rifle": "#e76f51",
  "assault rifles": "#e76f51",
  "sniper rifle": "#61a9e8",
  "sniper rifles": "#61a9e8",
  smg: "#65c58a",
  "submachine gun": "#65c58a",
  shotgun: "#e6b85c",
  shotguns: "#e6b85c",
  "machine gun": "#aa8de5",
  "machine guns": "#aa8de5",
  pistol: "#dd83ae",
  pistols: "#dd83ae",
  melee: "#53c6b3",
};

const CF_FALLBACK_CATEGORIES = [
  "Assault Rifle", "Sniper Rifle", "SMG", "Shotgun", "Machine Gun", "Pistol", "Melee",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const OFFICIAL_CATALOG_HEADER = "/attached_assets/weapons/csp-bg-header2.jpg.jpeg";
const OFFICIAL_CARD_BACKGROUND = "/attached_assets/weapons/cfw-weaponbg-vip.png";
const WEAPON_PLACEHOLDER = "/attached_assets/weapons/placeholder-weapons.png";

// Weapon cards may receive legacy media URLs from imported content. Never allow
// roadmap/poster/collage assets or images from non-weapon content sections to
// render as an individual weapon image.
const REJECTED_WEAPON_MEDIA = /(?:roadmap|road[-_ ]?map|collage|sprite(?:sheet)?|poster|banner|placeholder|(?:^|[\\/_.-])(?:crossfire_images|modes|events?|posts?)(?:[\\/]|$))/i;

function isSafeWeaponMediaSource(value?: string) {
  const source = String(value || "").trim();
  if (!source) return false;
  return !REJECTED_WEAPON_MEDIA.test(source);
}

function normaliseCategory(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function categoryColor(category?: string) {
  return CATEGORY_COLORS[normaliseCategory(category || "")] || "#f5a623";
}

function localWeaponImageCandidates(name: string) {
  const trimmed = name.trim();
  const variants = Array.from(new Set([
    trimmed,
    trimmed.replace(/-/g, "_"),
    trimmed.replace(/\s+/g, "_"),
    trimmed.replace(/[^a-z0-9]+/gi, "_"),
  ].filter(Boolean)));
  return [...variants.map((variant) => `/attached_assets/scraped_weapons/${variant}.png`), WEAPON_PLACEHOLDER];
}

function categoryLabel(category: string | undefined, arabic: boolean) {
  if (!arabic) return category || "Uncategorized";
  const labels: Record<string, string> = {
    "assault rifle": "بندقية هجومية",
    "assault rifles": "بنادق هجومية",
    "sniper rifle": "بندقية قنص",
    "sniper rifles": "بنادق قنص",
    smg: "رشاش خفيف",
    "submachine gun": "رشاش خفيف",
    shotgun: "بندقية خرطوش",
    shotguns: "بنادق خرطوش",
    "machine gun": "رشاش",
    "machine guns": "رشاشات",
    pistol: "مسدس",
    pistols: "مسدسات",
    melee: "أسلحة قتال قريب",
  };
  return labels[normaliseCategory(category || "")] || category || "غير مصنف";
}

function WeaponGlyph({ category, color, size = 24 }: { category?: string; color: string; size?: number }) {
  const kind = normaliseCategory(category || "");
  const common = { fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let body = <><path d="M5 9h12l3 3-3 2H8l-3-2z" {...common} /><path d="M9 14l-2 6h3l3-6" {...common} /><path d="M17 9V6" {...common} /></>;
  if (kind.includes("sniper")) body = <><path d="M3 10h15l3 2-3 2H8l-5-2z" {...common} /><path d="M8 14l-2 6h4l2-6" {...common} /><circle cx="15" cy="7" r="2.5" {...common} /><path d="M15 4v6M12.5 7h5" {...common} /></>;
  else if (kind.includes("shotgun")) body = <><path d="M3 9h13l5 2v3H9l-6-2z" {...common} /><path d="M9 14l-2 6h4l2-6" {...common} /><path d="M16 9V5M19 10V6" {...common} /></>;
  else if (kind.includes("pistol")) body = <><path d="M4 8h15l2 2-2 3H9l-2 7H4l2-7H4z" {...common} /><path d="M15 13l2 7" {...common} /></>;
  else if (kind.includes("melee")) body = <><path d="M5 19L18 6" {...common} /><path d="M14 4l6 6" {...common} /><path d="M10 14l4 4" {...common} /><path d="M4 20l3-1" {...common} /></>;
  else if (kind.includes("machine")) body = <><path d="M3 9h15l3 3-3 2H7l-4-2z" {...common} /><path d="M8 14l-2 6h4l2-6" {...common} /><path d="M16 14v5h4" {...common} /><path d="M12 8V5h3" {...common} /></>;
  else if (kind === "smg" || kind.includes("submachine")) body = <><path d="M4 9h13l4 3-3 2H9l-5-2z" {...common} /><path d="M10 14l-1 6h4l1-6" {...common} /><path d="M14 9V6h4" {...common} /></>;
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" role="img">{body}</svg>;
}

function WeaponImage({ weapon, className, alt }: { weapon: Weapon; className?: string; alt: string }) {
  const sources = useMemo(() => Array.from(new Set([
    weapon.image,
    weapon.imageUrl,
    ...localWeaponImageCandidates(weapon.name),
  ].filter((source) => source === WEAPON_PLACEHOLDER || isSafeWeaponMediaSource(source)))), [weapon.id, weapon.name, weapon.image, weapon.imageUrl]);
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [weapon.id, weapon.image, weapon.imageUrl]);
  const src = sources[Math.min(sourceIndex, sources.length - 1)] || WEAPON_PLACEHOLDER;
  return (
    <div className={`relative flex items-center justify-center ${className || ""}`}>
      <img src={src} alt={alt} className="relative z-10 h-full w-full object-contain" loading="lazy" onError={() => setSourceIndex((current) => Math.min(current + 1, sources.length - 1))} />
      {sourceIndex >= sources.length - 1 && <ImageIcon aria-hidden="true" className="absolute h-10 w-10" style={{ color: "#536274" }} />}
    </div>
  );
}

function getAcquisition(weapon: Weapon) {
  const stats = weapon.stats || {};
  const raw = [
    weapon.acquisitionType,
    weapon.acquisitionMethod,
    (weapon as any).acquisition,
    (weapon as any).shopType,
    (weapon as any).currency,
    stats.acquisitionType,
    stats.acquisitionMethod,
    stats.acquisition,
    stats.shopType,
    stats.currency,
    stats.availability,
  ].filter(Boolean).join(" ").toLowerCase();

  let key: AcquisitionKey = "unverified";
  if (/black\s*market|lapis|garnet|crate|box|prospect/.test(raw)) key = "black-market";
  else if (/battle\s*pass|event|reward|mission|season/.test(raw)) key = "event";
  else if (/mileage|\bmp\b/.test(raw)) key = "mp";
  else if (/\bzp\b|cash|premium/.test(raw)) key = "zp";
  else if (/\bgp\b|gp\s*(shop|store)|item\s*shop/.test(raw)) key = "gp";

  return {
    key,
    verified: Boolean(weapon.acquisitionVerified),
    raw: raw.trim(),
  };
}

function normalizeWeapon(weapon: Partial<Weapon> & Record<string, any>): Weapon {
  return {
    id: String(weapon.id || weapon._id || weapon.name || ""),
    name: String(weapon.name || "Unknown weapon"),
    image: String(weapon.image || weapon.imageUrl || ""),
    imageUrl: String(weapon.imageUrl || weapon.image || ""),
    backgroundUrl: String(weapon.backgroundUrl || weapon.background || ""),
    category: String(weapon.category || "Uncategorized"),
    description: String(weapon.description || ""),
    descriptionAr: String(weapon.descriptionAr || weapon.description_ar || ""),
    stats: weapon.stats || {},
    highlightedName: weapon.highlightedName,
    createdAt: weapon.createdAt || weapon.created_at,
    sourceUrl: weapon.sourceUrl || weapon.source_url,
    acquisitionType: weapon.acquisitionType || weapon.acquisition_type,
    acquisitionMethod: weapon.acquisitionMethod || weapon.acquisition_method,
    acquisitionVerified: Boolean(weapon.acquisitionVerified || weapon.acquisition_verified),
  };
}

export default function Weapons() {
  const { t, language } = useLanguage();
  const arabic = language === "ar";
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAcquisition, setSelectedAcquisition] = useState<AcquisitionKey>("all");
  const [letter, setLetter] = useState("");
  const [sort, setSort] = useState<"alpha" | "date">("alpha");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [results, setResults] = useState<Weapon[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchWeapons = async (opts?: { reset?: boolean; pageOverride?: number }) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const effectivePage = typeof opts?.pageOverride === "number" ? opts.pageOverride : page;
      const { getWeapons } = await import("@/lib/supabaseApi");
      const data = await getWeapons({
        q: searchQuery || undefined,
        letter: letter || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        sort: sort === "alpha" ? "name" : "date",
        order,
        page: effectivePage,
        pageSize,
      });
      const normalized = (data.items || []).map(normalizeWeapon);
      setTotal(data.total || 0);
      if (opts?.reset) setResults(normalized);
      else setResults((prev) => [...prev, ...normalized]);
    } catch (e: any) {
      setIsError(true);
      setError(new Error(e?.message || (arabic ? "تعذر تحميل الأسلحة." : "Failed to load weapons.")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      fetchWeapons({ reset: true, pageOverride: 1 });
    }, 250);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [searchQuery, selectedCategory, letter, sort, order]);

  const [allCategories, setAllCategories] = useState<string[]>(CF_FALLBACK_CATEGORIES);
  useEffect(() => {
    import("@/lib/supabaseApi").then(({ getWeaponCategories }) =>
      getWeaponCategories().then((cats) => {
        setAllCategories((prev) => Array.from(new Set([...prev, ...cats])).sort());
      }).catch(() => undefined)
    );
  }, []);

  const sortedWeapons = useMemo(() => {
    const list = [...results].sort((a, b) => {
      if (sort === "date") {
        const av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return order === "desc" ? bv - av : av - bv;
      }
      const cmp = a.name.localeCompare(b.name, arabic ? "ar" : "en", { sensitivity: "base" });
      return order === "desc" ? -cmp : cmp;
    });
    return list.filter((weapon) => selectedAcquisition === "all" || getAcquisition(weapon).key === selectedAcquisition);
  }, [results, sort, order, selectedAcquisition, arabic]);

  const acquisitionCounts = useMemo(() => {
    const counts: Record<AcquisitionKey, number> = { all: results.length, gp: 0, zp: 0, mp: 0, "black-market": 0, event: 0, unverified: 0 };
    results.forEach((weapon) => { counts[getAcquisition(weapon).key] += 1; });
    return counts;
  }, [results]);

  const breadcrumbs = [{ name: arabic ? "الأسلحة" : "Weapons", url: arabic ? "/ar/weapons" : "/weapons" }];
  const acquisitionKeys: AcquisitionKey[] = ["all", "gp", "zp", "mp", "black-market", "event", "unverified"];

  return (
    <>
      <SEOHead
        title={arabic ? "كتالوج أسلحة كروس فاير | CrossFire Wiki" : "CrossFire Weapons Catalogue | CrossFire Wiki"}
        description={arabic ? "كتالوج أسلحة كروس فاير مع تصنيف الفئات وطرق الاقتناء وحالة التحقق." : "A structured CrossFire weapon catalogue with categories, acquisition references and verification status."}
        keywords={["CrossFire weapons", "GP weapons", "ZP weapons", "CrossFire catalogue", "CrossFire Wiki"]}
        canonicalUrl={`https://crossfire.wiki${arabic ? "/ar" : ""}/weapons`}
        ogImage="https://z8games.akamaized.net/cfna/web/main/carousel/260715_cfwe_sniperweek_carouselm.jpg"
        ogImageAlt="CrossFire weapon catalogue"
        schemaType="CollectionPage"
        schemaData={{ name: arabic ? "كتالوج أسلحة كروس فاير" : "CrossFire Weapons Catalogue", description: arabic ? "فهرس أسلحة كروس فاير." : "A structured CrossFire weapons index." }}
        breadcrumbs={[
          { name: "CrossFire Wiki", url: "https://crossfire.wiki/" },
          { name: arabic ? "الأسلحة" : "Weapons", url: `https://crossfire.wiki${arabic ? "/ar" : ""}/weapons` },
        ]}
      />

      <div dir={arabic ? "rtl" : "ltr"} className="min-h-screen" style={{ background: "#0a0d12", color: "#e8edf3", fontFamily: '"Roboto Condensed", "Arial Narrow", sans-serif' }}>
        <section
          className="relative overflow-hidden border-b"
          style={{
            minHeight: 300,
            borderColor: "rgba(255,255,255,0.09)",
            backgroundImage: `linear-gradient(90deg, rgba(6,9,14,.98) 0%, rgba(6,9,14,.83) 42%, rgba(6,9,14,.42) 100%), url(${OFFICIAL_CATALOG_HEADER})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(circle at 75% 30%, rgba(245,166,35,.18), transparent 35%), linear-gradient(transparent 49%, rgba(245,166,35,.08) 50%, transparent 51%)" }} />
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-12">
            <Breadcrumbs items={breadcrumbs} />
            <div className="mt-12 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-12 w-12 border" style={{ borderColor: "rgba(245,166,35,.65)", background: "rgba(5,8,12,.78)" }}>
                  <WeaponGlyph category="Assault Rifle" color="#f5a623" size={28} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.28em]" style={{ color: "#f5a623" }}>{arabic ? "كتالوج الأسلحة" : "Weapons catalogue"}</p>
                  <p className="text-[10px] uppercase tracking-[.18em]" style={{ color: "#8e99a7" }}>CrossFire Wiki / Inventory</p>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">{arabic ? "الترسانة" : "Arsenal"}</h1>
              <p className="mt-4 text-sm md:text-base max-w-xl leading-relaxed" style={{ color: "#b7c0cb" }}>
                {arabic ? "استعرض الأسلحة حسب الفئة وطريقة الاقتناء كما تظهر في مراجع اللعبة. السجلات غير الموثقة تبقى موسومة بوضوح." : "Browse weapons by class and acquisition reference. Items without a verified source remain clearly marked."}
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="px-3 py-1 text-[10px] uppercase tracking-widest border" style={{ color: "#f5a623", borderColor: "rgba(245,166,35,.45)", background: "rgba(245,166,35,.08)" }}>{total || "—"} {arabic ? "سلاحًا" : "items"}</span>
                <span className="px-3 py-1 text-[10px] uppercase tracking-widest border" style={{ color: "#aab4c0", borderColor: "rgba(255,255,255,.14)", background: "rgba(0,0,0,.18)" }}>{arabic ? "فهرس قابل للبحث" : "Searchable index"}</span>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[.25em]" style={{ color: "#f5a623" }}>{arabic ? "طريقة الاقتناء" : "Acquisition"}</p>
              <h2 className="text-xl font-bold uppercase tracking-wide">{arabic ? "تصفّح الكتالوج" : "Browse catalogue"}</h2>
            </div>
            <p className="text-xs" style={{ color: "#7e8998" }}>{arabic ? "لا تُعد أي فئة مؤكدة ما لم يذكرها المصدر." : "A category is not treated as verified unless the source states it."}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-7">
            {acquisitionKeys.map((key) => {
              const meta = ACQUISITION_META[key];
              const active = selectedAcquisition === key;
              return (
                <button key={key} onClick={() => setSelectedAcquisition(key)} className="min-h-[62px] px-3 py-2 text-left transition-colors" style={{ border: `1px solid ${active ? meta.color : "rgba(255,255,255,.1)"}`, background: active ? `${meta.color}18` : "#11161d", color: active ? meta.color : "#9da7b4" }}>
                  <span className="block text-[10px] font-bold uppercase tracking-wider">{arabic ? meta.ar : meta.en}</span>
                  <span className="block text-lg font-black mt-1" style={{ color: active ? meta.color : "#e8edf3" }}>{acquisitionCounts[key]}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 md:p-4 mb-7 border" style={{ background: "#11161d", borderColor: "rgba(255,255,255,.1)" }}>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className={`absolute ${arabic ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4`} style={{ color: "#657080" }} />
                <Input placeholder={arabic ? "ابحث باسم السلاح..." : "Search weapon name..."} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setLetter(""); }} className={`${arabic ? "pr-10 pl-10" : "pl-10 pr-10"} h-10 border-0 rounded-none`} style={{ background: "#090c11", color: "#eef2f7" }} />
                {searchQuery && <button onClick={() => setSearchQuery("")} className={`absolute ${arabic ? "left-3" : "right-3"} top-1/2 -translate-y-1/2`}><X className="h-4 w-4" style={{ color: "#8792a0" }} /></button>}
              </div>
              <div className="flex gap-2">
                {(["alpha", "date"] as const).map((item) => <button key={item} onClick={() => setSort(item)} className="px-3 h-10 text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: sort === item ? "#f5a623" : "rgba(255,255,255,.12)", color: sort === item ? "#f5a623" : "#8c96a4", background: sort === item ? "rgba(245,166,35,.09)" : "#090c11" }}>{item === "alpha" ? (arabic ? "الاسم" : "Name") : (arabic ? "الأحدث" : "Latest")}</button>)}
                <button onClick={() => setOrder(order === "asc" ? "desc" : "asc")} className="flex items-center gap-1 px-3 h-10 text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: "rgba(255,255,255,.12)", color: "#8c96a4", background: "#090c11" }}><ChevronUp className={`h-3 w-3 ${order === "desc" ? "rotate-180" : ""}`} />{order === "asc" ? (arabic ? "أ-ي" : "A-Z") : (arabic ? "ي-أ" : "Z-A")}</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button onClick={() => setSelectedCategory("all")} className="px-2.5 py-1 text-[10px] uppercase tracking-wider border" style={{ borderColor: selectedCategory === "all" ? "#f5a623" : "rgba(255,255,255,.1)", color: selectedCategory === "all" ? "#f5a623" : "#788493", background: "#090c11" }}>{arabic ? "كل الفئات" : "All classes"}</button>
              {allCategories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className="px-2.5 py-1 text-[10px] uppercase tracking-wider border" style={{ borderColor: selectedCategory.toLowerCase() === category.toLowerCase() ? categoryColor(category) : "rgba(255,255,255,.1)", color: selectedCategory.toLowerCase() === category.toLowerCase() ? categoryColor(category) : "#788493", background: "#090c11" }}>{categoryLabel(category, arabic)}</button>)}
            </div>
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,.07)" }}>
              {ALPHABET.map((ch) => <button key={ch} onClick={() => setLetter(letter === ch ? "" : ch)} className="w-6 h-6 text-[10px] font-bold border" style={{ borderColor: letter === ch ? "#f5a623" : "rgba(255,255,255,.08)", color: letter === ch ? "#071018" : "#687483", background: letter === ch ? "#f5a623" : "#090c11" }}>{ch}</button>)}
            </div>
          </div>

          {isLoading && results.length === 0 ? <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} /></div> : isError ? <div className="py-20 text-center border" style={{ borderColor: "rgba(239,68,68,.25)", color: "#f87171" }}><p className="text-sm mb-3">{error?.message}</p><button onClick={() => fetchWeapons({ reset: true, pageOverride: 1 })} className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: "rgba(255,255,255,.15)", color: "#b9c1cb" }}>{arabic ? "إعادة المحاولة" : "Retry"}</button></div> : sortedWeapons.length === 0 ? <div className="py-20 text-center border" style={{ borderColor: "rgba(255,255,255,.1)" }}><WeaponGlyph category="Assault Rifle" color="#f5a623" size={48} /><p className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: "#657080" }}>{arabic ? "لا توجد نتائج مطابقة" : "No matching weapons"}</p></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedWeapons.map((weapon) => {
                const color = categoryColor(weapon.category);
                const acquisition = getAcquisition(weapon);
                const meta = ACQUISITION_META[acquisition.key];
                const title = weapon.highlightedName ? <span dangerouslySetInnerHTML={{ __html: weapon.highlightedName }} /> : weapon.name;
                return <Dialog key={weapon.id}>
                  <DialogTrigger asChild>
                    <button className="group text-left relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 focus:outline-none" style={{ background: "#e8ebef", color: "#10151c", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 8px 25px rgba(0,0,0,.22)" }}>
                      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
                      <div className="relative h-36 sm:h-40 overflow-hidden" style={{ background: `url(${OFFICIAL_CARD_BACKGROUND}) center/cover` }}>
                        <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg, transparent 0 45%, rgba(255,255,255,.12) 46%, transparent 47%), radial-gradient(circle at 20% 20%, rgba(245,166,35,.22), transparent 35%)" }} />
                        <WeaponImage weapon={weapon} alt={weapon.name} className="h-full w-full p-3 transition-transform duration-300 group-hover:scale-105" />
                        <span className="absolute z-20 top-2 right-2 px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold" style={{ background: "rgba(5,8,12,.82)", color: meta.color, border: `1px solid ${meta.color}66` }}>{acquisition.key === "unverified" ? (arabic ? "غير متحقق" : "Unverified") : (arabic ? meta.ar : meta.en)}</span>
                      </div>
                      <div className="p-3 min-h-[91px]">
                        <div className="flex items-center gap-2 mb-2"><WeaponGlyph category={weapon.category} color={color} size={18} /><span className="text-[9px] uppercase tracking-wider font-bold" style={{ color }}>{categoryLabel(weapon.category, arabic)}</span></div>
                        <h3 className="font-black text-[12px] uppercase leading-tight line-clamp-2">{title}</h3>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl p-0 overflow-hidden" style={{ background: "#11161d", border: "1px solid rgba(245,166,35,.32)", color: "#e8edf3" }}>
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                    <DialogHeader className="px-6 pt-5"><DialogTitle className="text-xl font-black uppercase">{title}</DialogTitle></DialogHeader>
                    <div className="px-6 pb-6 space-y-5 mt-3">
                      <div className="relative h-52 overflow-hidden flex items-center justify-center" style={{ background: `url(${OFFICIAL_CARD_BACKGROUND}) center/cover` }}>
                        <WeaponImage weapon={weapon} alt={weapon.name} className="h-full w-full p-7" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2"><span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold" style={{ background: `${color}1b`, color, border: `1px solid ${color}55` }}>{categoryLabel(weapon.category, arabic)}</span><span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold" style={{ background: `${meta.color}16`, color: meta.color, border: `1px solid ${meta.color}55` }}>{arabic ? meta.ar : meta.en}</span></div>
                      <div><p className="text-[10px] uppercase tracking-[.22em] mb-2" style={{ color: "#f5a623" }}>{arabic ? "الوصف" : "Description"}</p><p className="text-sm leading-7" style={{ color: "#b7c0cb" }}>{arabic ? (weapon.descriptionAr || "لا يتوفر وصف عربي موثق لهذا السلاح حتى الآن.") : (weapon.description || "No sourced description is available for this weapon yet.")}</p></div>
                      <div className="p-3 border" style={{ borderColor: acquisition.verified ? "rgba(117,214,160,.28)" : "rgba(255,255,255,.12)", background: acquisition.verified ? "rgba(117,214,160,.06)" : "rgba(255,255,255,.03)" }}><p className="text-[10px] uppercase tracking-[.2em] mb-1" style={{ color: acquisition.verified ? "#75d6a0" : "#aab4c0" }}>{arabic ? "حالة مصدر الاقتناء" : "Acquisition source status"}</p><p className="text-xs" style={{ color: "#b7c0cb" }}>{acquisition.verified ? (arabic ? "طريقة الاقتناء مرتبطة بمصدر موثق." : "The acquisition method is linked to a verified source.") : (arabic ? "لم يتم العثور على إثبات إقليمي كافٍ؛ لا تعتبر هذه الفئة حقيقة مؤكدة." : "No sufficient regional proof was found; this category is not treated as verified fact.")}</p></div>
                      {weapon.sourceUrl && <a href={weapon.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs" style={{ color: "#f5a623" }}>{arabic ? "فتح المصدر" : "Open source"}<ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                  </DialogContent>
                </Dialog>;
              })}
            </div>
          )}

          {results.length < total && results.length > 0 && <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"><span className="text-xs" style={{ color: "#778291" }}>{results.length} / {total}</span><button onClick={async () => { const next = page + 1; setPage(next); await fetchWeapons({ pageOverride: next }); }} disabled={isLoading} className="flex items-center gap-2 px-7 py-3 text-[10px] font-bold uppercase tracking-[.2em] border" style={{ borderColor: "rgba(245,166,35,.5)", color: "#f5a623", background: "rgba(245,166,35,.05)" }}>{isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{arabic ? "تحميل المزيد" : "Load more"}</button></div>}
        </main>
      </div>
    </>
  );
}
