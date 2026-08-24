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
  descriptionStatus?: "reference-described" | "unverified";
  availabilityEn?: string;
  availabilityAr?: string;
  acquisitionKind?: string;
  acquisitionLabelEn?: string;
  acquisitionLabelAr?: string;
  acquisitionDetailsEn?: string;
  acquisitionDetailsAr?: string;
  acquisitionSources?: string[];
  officialCatalogueUrl?: string;
  sourceKind?: string;
  matchMode?: string;
  stats?: Record<string, any>;
  highlightedName?: string;
  createdAt?: string;
  sourceUrl?: string;
  acquisitionType?: string;
  acquisitionMethod?: string;
  acquisitionVerified?: boolean;
}

type AcquisitionKey = "all" | "gp" | "zp" | "mp" | "black-market" | "event" | "unverified";

const NEUTRAL_UI = "#aeb8c4";

const ACQUISITION_META: Record<AcquisitionKey, { en: string; ar: string; color: string }> = {
  all: { en: "All items", ar: "كل الأسلحة", color: NEUTRAL_UI },
  gp: { en: "GP Shop", ar: "متجر GP", color: NEUTRAL_UI },
  zp: { en: "ZP / Cash", ar: "ZP / نقدي", color: NEUTRAL_UI },
  mp: { en: "Mileage", ar: "متجر الأميال", color: NEUTRAL_UI },
  "black-market": { en: "Black Market", ar: "السوق السوداء", color: NEUTRAL_UI },
  event: { en: "Event / Pass", ar: "فعالية / تذكرة", color: NEUTRAL_UI },
  unverified: { en: "Unverified", ar: "غير متحقق", color: NEUTRAL_UI },
};

const CATEGORY_COLORS: Record<string, string> = {};

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

const WEAPON_GLYPH_SOURCES = {
  assault: "/assets/ui/quiver/weapon-assault-rifle.svg",
  sniper: "/assets/ui/quiver/weapon-sniper-rifle.svg",
  smg: "/assets/ui/quiver/weapon-smg.svg",
  shotgun: "/assets/ui/quiver/weapon-shotgun.svg",
  machine: "/assets/ui/quiver/weapon-machine-gun.svg",
  pistol: "/assets/ui/quiver/weapon-pistol.svg",
} as const;

function weaponGlyphSource(category?: string) {
  const kind = normaliseCategory(category || "assault rifle");
  if (kind.includes("sniper")) return WEAPON_GLYPH_SOURCES.sniper;
  if (kind.includes("shotgun")) return WEAPON_GLYPH_SOURCES.shotgun;
  if (kind.includes("pistol")) return WEAPON_GLYPH_SOURCES.pistol;
  if (kind === "smg" || kind.includes("submachine")) return WEAPON_GLYPH_SOURCES.smg;
  if (kind.includes("machine")) return WEAPON_GLYPH_SOURCES.machine;
  return WEAPON_GLYPH_SOURCES.assault;
}

function WeaponGlyph({ category, color, size = 24 }: { category?: string; color?: string; size?: number }) {
  const kind = normaliseCategory(category || "assault rifle");
  const tint = color || NEUTRAL_UI;
  if (kind.includes("melee")) {
    return (
      <span aria-hidden="true" style={{ width: size * 1.8, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
        <span style={{ width: size * 1.25, height: Math.max(2, size * 0.1), background: tint, transform: "rotate(-45deg)", borderRadius: 999 }} />
        <span style={{ position: "absolute", width: size * 0.32, height: Math.max(3, size * 0.14), background: tint, transform: "translate(7px, 7px) rotate(-45deg)", borderRadius: 999, opacity: 0.65 }} />
      </span>
    );
  }
  const source = weaponGlyphSource(category);
  return (
    <span aria-hidden="true" style={{ width: size * 1.8, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <img src={source} alt="" width={size * 1.8} height={size} loading="eager" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
    </span>
  );
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

function acquisitionDisplay(weapon: Weapon, key: AcquisitionKey, arabic: boolean) {
  const custom = arabic ? weapon.acquisitionDetailsAr : weapon.acquisitionDetailsEn;
  if (custom && custom.length <= 180 && !/no verified|لا توجد طريقة|regional proof|إثبات إقليمي/i.test(custom)) return custom;
  const labels: Record<AcquisitionKey, { en: string; ar: string }> = {
    all: { en: "See the recorded acquisition method below.", ar: "راجع طريقة الاقتناء المسجلة أدناه." },
    gp: { en: "Buy it from the GP Shop.", ar: "يُشترى من متجر GP." },
    zp: { en: "Buy it with ZP or the listed cash currency.", ar: "يُشترى باستخدام ZP أو العملة النقدية المحددة." },
    mp: { en: "Get it from the Mileage Shop.", ar: "يُحصل عليه من متجر الأميال." },
    "black-market": { en: "Obtain it through the Black Market system.", ar: "يُحصل عليه من نظام السوق السوداء." },
    event: { en: "Obtain it through the listed event, pass, or reward.", ar: "يُحصل عليه من الفعالية أو التذكرة أو المكافأة المحددة." },
    unverified: { en: "The acquisition method is not verified yet.", ar: "طريقة الاقتناء غير موثقة حتى الآن." },
  };
  return arabic ? labels[key].ar : labels[key].en;
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

  const kind = String(weapon.acquisitionKind || "").toLowerCase();
  let key: AcquisitionKey = "unverified";
  if (kind === "black_market") key = "black-market";
  else if (["event", "battle_pass", "ranked_reward", "mode_reward", "reward"].includes(kind)) key = "event";
  else if (kind === "mileage_shop") key = "mp";
  else if (kind === "item_shop") {
    if (/\bzp\b/.test(raw)) key = "zp";
    else if (/\bgp\b/.test(raw)) key = "gp";
  } else if (kind === "coupon_exchange" || kind === "vvip") key = "zp";

  if (key === "unverified") {
    if (/black\s*market|lapis|garnet|crate|box|prospect/.test(raw)) key = "black-market";
    else if (/battle\s*pass|event|reward|mission|season/.test(raw)) key = "event";
    else if (/mileage|\bmp\b/.test(raw)) key = "mp";
    else if (/\bzp\b|zp\s*(shop|cash)/.test(raw)) key = "zp";
    else if (/\bgp\b|gp\s*(shop|store)|item\s*shop/.test(raw)) key = "gp";
  }

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
    descriptionStatus: weapon.descriptionStatus,
    availabilityEn: String(weapon.availabilityEn || ""),
    availabilityAr: String(weapon.availabilityAr || ""),
    acquisitionKind: String(weapon.acquisitionKind || "unverified"),
    acquisitionLabelEn: String(weapon.acquisitionLabelEn || "Unverified"),
    acquisitionLabelAr: String(weapon.acquisitionLabelAr || "غير متحقق منه"),
    acquisitionDetailsEn: String(weapon.acquisitionDetailsEn || ""),
    acquisitionDetailsAr: String(weapon.acquisitionDetailsAr || ""),
    acquisitionSources: Array.isArray(weapon.acquisitionSources) ? weapon.acquisitionSources : [],
    officialCatalogueUrl: String(weapon.officialCatalogueUrl || "https://crossfire.z8games.com/weapons.html"),
    sourceKind: String(weapon.sourceKind || "unverified"),
    matchMode: String(weapon.matchMode || "not-found"),
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
  const requestIdRef = useRef(0);

  const fetchWeapons = async (opts?: { reset?: boolean; pageOverride?: number }) => {
    const requestId = ++requestIdRef.current;
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
      if (requestId !== requestIdRef.current) return;
      const normalized = (data.items || []).map(normalizeWeapon);
      setTotal(data.total || 0);
      if (opts?.reset) {
        setResults(normalized.slice(0, pageSize));
      } else {
        setResults((prev) => {
          const merged = new Map(prev.map((weapon) => [weapon.id, weapon]));
          normalized.slice(0, pageSize).forEach((weapon: Weapon) => merged.set(weapon.id, weapon));
          return Array.from(merged.values());
        });
      }
    } catch (e: any) {
      if (requestId !== requestIdRef.current) return;
      setIsError(true);
      setError(new Error(e?.message || (arabic ? "تعذر تحميل الأسلحة." : "Failed to load weapons.")));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
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
          <div className="absolute inset-0 opacity-35" style={{ background: "linear-gradient(transparent 49%, rgba(174,184,196,.08) 50%, transparent 51%)" }} />
          <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-12">
            <Breadcrumbs items={breadcrumbs} />
            <div className="mt-12 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-12 w-12 border" style={{ borderColor: "rgba(174,184,196,.45)", background: "rgba(5,8,12,.78)" }}>
                  <WeaponGlyph category="Assault Rifle" color={NEUTRAL_UI} size={28} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.28em]" style={{ color: NEUTRAL_UI }}>{arabic ? "كتالوج الأسلحة" : "Weapons catalogue"}</p>
                  <p className="text-[10px] uppercase tracking-[.18em]" style={{ color: "#8e99a7" }}>CrossFire Wiki / Inventory</p>
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">{arabic ? "الترسانة" : "Arsenal"}</h1>
              <p className="mt-4 text-sm md:text-base max-w-xl leading-relaxed" style={{ color: "#b7c0cb" }}>
                {arabic ? "استعرض الأسلحة حسب الفئة وطريقة الاقتناء كما تظهر في مراجع اللعبة. السجلات غير الموثقة تبقى موسومة بوضوح." : "Browse weapons by class and acquisition reference. Items without a verified source remain clearly marked."}
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                <span className="px-3 py-1 text-[10px] uppercase tracking-widest border" style={{ color: NEUTRAL_UI, borderColor: "rgba(174,184,196,.35)", background: "rgba(174,184,196,.08)" }}>{total || "—"} {arabic ? "سلاحًا" : "items"}</span>
                <span className="px-3 py-1 text-[10px] uppercase tracking-widest border" style={{ color: "#aab4c0", borderColor: "rgba(255,255,255,.14)", background: "rgba(0,0,0,.18)" }}>{arabic ? "فهرس قابل للبحث" : "Searchable index"}</span>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[.25em]" style={{ color: NEUTRAL_UI }}>{arabic ? "طريقة الاقتناء" : "Acquisition"}</p>
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
                <Input type="search" inputMode="search" autoComplete="off" spellCheck={false} aria-label={arabic ? "البحث عن سلاح" : "Search weapons"} placeholder={arabic ? "ابحث باسم السلاح..." : "Search weapon name..."} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setLetter(""); }} onKeyDown={(e) => { if (e.key === "Escape") setSearchQuery(""); }} className={`${arabic ? "pr-10 pl-10" : "pl-10 pr-10"} h-10 border-0 rounded-none`} style={{ background: "#090c11", color: "#eef2f7" }} />
                {searchQuery && <button onClick={() => setSearchQuery("")} className={`absolute ${arabic ? "left-3" : "right-3"} top-1/2 -translate-y-1/2`}><X className="h-4 w-4" style={{ color: "#8792a0" }} /></button>}
              </div>
              <div className="flex gap-2">
                {(["alpha", "date"] as const).map((item) => <button key={item} onClick={() => setSort(item)} className="px-3 h-10 text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: sort === item ? NEUTRAL_UI : "rgba(255,255,255,.12)", color: sort === item ? NEUTRAL_UI : "#8c96a4", background: sort === item ? "rgba(174,184,196,.09)" : "#090c11" }}>{item === "alpha" ? (arabic ? "الاسم" : "Name") : (arabic ? "الأحدث" : "Latest")}</button>)}
                <button onClick={() => setOrder(order === "asc" ? "desc" : "asc")} className="flex items-center gap-1 px-3 h-10 text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: "rgba(255,255,255,.12)", color: "#8c96a4", background: "#090c11" }}><ChevronUp className={`h-3 w-3 ${order === "desc" ? "rotate-180" : ""}`} />{order === "asc" ? (arabic ? "أ-ي" : "A-Z") : (arabic ? "ي-أ" : "Z-A")}</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button onClick={() => setSelectedCategory("all")} className="px-2.5 py-1 text-[10px] uppercase tracking-wider border" style={{ borderColor: selectedCategory === "all" ? NEUTRAL_UI : "rgba(255,255,255,.1)", color: selectedCategory === "all" ? NEUTRAL_UI : "#788493", background: "#090c11" }}>{arabic ? "كل الفئات" : "All classes"}</button>
              {allCategories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className="px-2.5 py-1 text-[10px] uppercase tracking-wider border" style={{ borderColor: selectedCategory.toLowerCase() === category.toLowerCase() ? NEUTRAL_UI : "rgba(255,255,255,.1)", color: selectedCategory.toLowerCase() === category.toLowerCase() ? NEUTRAL_UI : "#788493", background: "#090c11" }}>{categoryLabel(category, arabic)}</button>)}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider" style={{ color: "#788493" }} aria-live="polite">
              <span>{searchQuery ? (arabic ? `نتائج البحث عن: ${searchQuery}` : `Results for: ${searchQuery}`) : (arabic ? "اكتب اسم السلاح للبحث" : "Type a weapon name to search")}</span>
              {isLoading && <span className="inline-flex items-center gap-1" style={{ color: NEUTRAL_UI }}><Loader2 className="h-3 w-3 animate-spin" />{arabic ? "جارٍ البحث" : "Searching"}</span>}
            </div>
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,.07)" }}>
              {ALPHABET.map((ch) => <button key={ch} onClick={() => setLetter(letter === ch ? "" : ch)} className="w-6 h-6 text-[10px] font-bold border" style={{ borderColor: letter === ch ? NEUTRAL_UI : "rgba(255,255,255,.08)", color: letter === ch ? "#071018" : "#687483", background: letter === ch ? NEUTRAL_UI : "#090c11" }}>{ch}</button>)}
            </div>
          </div>

          {isLoading && results.length === 0 ? <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" style={{ color: NEUTRAL_UI }} /></div> : isError ? <div className="py-20 text-center border" style={{ borderColor: "rgba(239,68,68,.25)", color: "#f87171" }}><p className="text-sm mb-3">{error?.message}</p><button onClick={() => fetchWeapons({ reset: true, pageOverride: 1 })} className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider border" style={{ borderColor: "rgba(255,255,255,.15)", color: "#b9c1cb" }}>{arabic ? "إعادة المحاولة" : "Retry"}</button></div> : sortedWeapons.length === 0 ? <div className="py-20 text-center border" style={{ borderColor: "rgba(255,255,255,.1)" }}><WeaponGlyph category="Assault Rifle" color={NEUTRAL_UI} size={48} /><p className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: "#657080" }}>{arabic ? "لا توجد نتائج مطابقة" : "No matching weapons"}</p></div> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedWeapons.map((weapon) => {
                const color = NEUTRAL_UI;
                const acquisition = getAcquisition(weapon);
                const meta = ACQUISITION_META[acquisition.key];
                const title = weapon.highlightedName ? <span dangerouslySetInnerHTML={{ __html: weapon.highlightedName }} /> : weapon.name;
                return <Dialog key={weapon.id}>
                  <DialogTrigger asChild>
                    <button className="group text-left relative overflow-hidden transition-transform duration-200 hover:-translate-y-1 focus:outline-none" style={{ background: "#e8ebef", color: "#10151c", border: "1px solid rgba(255,255,255,.14)", boxShadow: "0 8px 25px rgba(0,0,0,.22)" }}>
                      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "#7e8998" }} />
                      <div className="relative h-36 sm:h-40 overflow-hidden" style={{ background: `url(${OFFICIAL_CARD_BACKGROUND}) center/cover` }}>
                        <div className="absolute inset-0 opacity-35" style={{ background: "linear-gradient(135deg, transparent 0 45%, rgba(255,255,255,.12) 46%, transparent 47%)" }} />
                        <WeaponImage weapon={weapon} alt={weapon.name} className="h-full w-full p-3 transition-transform duration-300 group-hover:scale-105" />
                        <span className="absolute z-20 top-2 right-2 px-1.5 py-0.5 text-[8px] uppercase tracking-wider font-bold" style={{ background: "rgba(5,8,12,.82)", color: NEUTRAL_UI, border: "1px solid rgba(174,184,196,.28)" }}>{acquisition.key === "unverified" ? (arabic ? "غير متحقق" : "Unverified") : (arabic ? meta.ar : meta.en)}</span>
                      </div>
                      <div className="p-3 min-h-[91px]">
                        <div className="flex items-center gap-2 mb-2"><WeaponGlyph category={weapon.category} color={color} size={18} /><span className="text-[9px] uppercase tracking-wider font-bold" style={{ color }}>{categoryLabel(weapon.category, arabic)}</span></div>
                        <h3 className="font-black text-[12px] uppercase leading-tight line-clamp-2">{title}</h3>
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl p-0 overflow-hidden" style={{ background: "#11161d", border: "1px solid rgba(174,184,196,.28)", color: "#e8edf3" }}>
                    <div className="h-px" style={{ background: "#7e8998" }} />
                    <DialogHeader className="px-6 pt-5"><DialogTitle className="text-xl font-black uppercase">{title}</DialogTitle></DialogHeader>
                    <div className="px-6 pb-6 space-y-5 mt-3">
                      <div className="relative h-52 overflow-hidden flex items-center justify-center" style={{ background: `url(${OFFICIAL_CARD_BACKGROUND}) center/cover` }}>
                        <WeaponImage weapon={weapon} alt={weapon.name} className="h-full w-full p-7" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2"><span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold" style={{ background: "rgba(174,184,196,.08)", color: NEUTRAL_UI, border: "1px solid rgba(174,184,196,.28)" }}>{categoryLabel(weapon.category, arabic)}</span><span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold" style={{ background: "rgba(174,184,196,.08)", color: NEUTRAL_UI, border: "1px solid rgba(174,184,196,.28)" }}>{arabic ? meta.ar : meta.en}</span></div>
                      <div><p className="text-[10px] uppercase tracking-[.22em] mb-2" style={{ color: NEUTRAL_UI }}>{arabic ? "الوصف" : "Description"}</p><p className="text-sm leading-7" style={{ color: "#b7c0cb" }}>{arabic ? (weapon.descriptionAr || "لا يتوفر وصف عربي موثق لهذا السلاح حتى الآن.") : (weapon.description || "No sourced description is available for this weapon yet.")}</p></div>
                      <div className="p-3 border" style={{ borderColor: "rgba(174,184,196,.2)", background: "rgba(174,184,196,.04)" }}><p className="text-[10px] uppercase tracking-[.2em] mb-1" style={{ color: NEUTRAL_UI }}>{arabic ? "طريقة الاقتناء" : "Acquisition method"}</p><p className="text-xs leading-6" style={{ color: "#b7c0cb" }}>{acquisitionDisplay(weapon, acquisition.key, arabic)}</p></div>
                      {weapon.sourceUrl && <a href={weapon.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs" style={{ color: NEUTRAL_UI }}>{arabic ? "فتح المصدر" : "Open source"}<ExternalLink className="h-3.5 w-3.5" /></a>}
                    </div>
                  </DialogContent>
                </Dialog>;
              })}
            </div>
          )}

          {results.length < total && results.length > 0 && <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10"><span className="text-xs" style={{ color: "#778291" }}>{results.length} / {total}</span><button onClick={async () => { const next = page + 1; setPage(next); await fetchWeapons({ pageOverride: next }); }} disabled={isLoading} className="flex items-center gap-2 px-7 py-3 text-[10px] font-bold uppercase tracking-[.2em] border" style={{ borderColor: "rgba(174,184,196,.5)", color: NEUTRAL_UI, background: "rgba(174,184,196,.05)" }}>{isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{arabic ? "تحميل المزيد" : "Load more"}</button></div>}
        </main>
      </div>
    </>
  );
}
