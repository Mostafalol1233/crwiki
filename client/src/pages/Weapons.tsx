import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Image as ImageIcon, Loader2, X, ChevronUp, Crosshair, Zap, Shield } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GoogleAdSlot } from "@/components/GoogleAdSlot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WEST_RECENT_WEAPONS, type WestRecentWeapon } from "@shared/crossfire-west-recent-weapons";

interface Weapon {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  backgroundUrl?: string;
  category?: string;
  description?: string;
  stats?: Record<string, any>;
  highlightedName?: string;
}

const normalizeWeapon = (weapon: Partial<Weapon> & Record<string, any>): Weapon => ({
  id: String(weapon.id || weapon._id || weapon.name || ""),
  name: String(weapon.name || "Unknown weapon"),
  image: String(weapon.image || weapon.imageUrl || ""),
  imageUrl: String(weapon.imageUrl || weapon.image || ""),
  backgroundUrl: String(weapon.backgroundUrl || weapon.background || ""),
  category: String(weapon.category || "Uncategorized"),
  description: String(weapon.description || ""),
  stats: weapon.stats || {},
  highlightedName: weapon.highlightedName,
});

const CATEGORY_COLORS: Record<string, { color: string; icon: any }> = {
  "Assault Rifle": { color: "#f87171", icon: Zap },
  "Sniper Rifle": { color: "#60a5fa", icon: Crosshair },
  "SMG": { color: "#4ade80", icon: Zap },
  "Shotgun": { color: "#fbbf24", icon: Shield },
  "Machine Gun": { color: "#a78bfa", icon: Zap },
  "Pistol": { color: "#f472b6", icon: Shield },
  "Melee": { color: "#2dd4bf", icon: Shield },
};

// Known CF categories used as instant fallback while API loads
const CF_FALLBACK_CATEGORIES = [
  "Assault Rifle", "Sniper Rifle", "SMG", "Shotgun", "Machine Gun", "Pistol", "Melee",
];

function getCatStyle(cat: string) {
  // Case-insensitive lookup — DB values may differ in casing from the keys
  const normalised = Object.keys(CATEGORY_COLORS).find(
    k => k.toLowerCase() === cat.toLowerCase()
  );
  return (normalised ? CATEGORY_COLORS[normalised] : null) || { color: "#f5a623", icon: Zap };
}

function getCategoryLabel(category: string, isArabic: boolean) {
  if (!isArabic) return category;
  const labels: Record<string, string> = {
    "Assault Rifle": "بندقية هجومية",
    "Sniper Rifle": "بندقية قنص",
    "SMG": "رشاش خفيف",
    "Shotgun": "بندقية خرطوش",
    "Machine Gun": "رشاش ثقيل",
    "Pistol": "مسدس",
    "Melee": "سلاح أبيض",
    "Uncategorized": "غير مصنف",
  };
  return labels[category] || category;
}

function StatBar({ label, value, color = "#f5a623" }: { label: string; value: any; color?: string }) {
  const num = Math.min(Math.max(parseFloat(String(value)) || 0, 0), 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#666" }}>{label}</span>
        <span className="text-[10px] font-black tabular-nums" style={{ color }}>{value ?? "—"}</span>
      </div>
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${num}%`, background: `linear-gradient(to right, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function RecentWeaponCard({ weapon, isArabic }: { weapon: WestRecentWeapon; isArabic: boolean }) {
  const category = isArabic ? weapon.categoryAr : weapon.category;
  const description = isArabic ? weapon.descriptionAr : weapon.descriptionEn;
  const availability = isArabic ? weapon.availabilityAr : weapon.availabilityEn;
  const verification = isArabic ? weapon.verificationAr : weapon.verificationEn;
  const releaseName = isArabic ? weapon.releaseNameAr : weapon.releaseName;
  const sourceLabel = isArabic ? "المصدر الرسمي" : weapon.sourceLabel;
  const catStyle = getCatStyle(weapon.category);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative w-full overflow-hidden text-left transition-all duration-300 hover:-translate-y-1"
          style={{
            background: "var(--card)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] opacity-80" style={{ background: `linear-gradient(to right, ${catStyle.color}, transparent)` }} />
          <div className="relative flex h-40 items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,0,0,0.2))" }}>
            <img
              src={weapon.imageUrl}
              alt={`${weapon.name} — ${releaseName}`}
              className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.opacity = "0.2"; }}
            />
            <span className="absolute left-2 top-2 px-2 py-1 text-[8px] font-black uppercase tracking-widest" style={{ background: "rgba(0,0,0,0.7)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.35)", borderRadius: "2px" }}>
              {weapon.imageKind === "catalogue" ? (isArabic ? "صورة الكتالوج" : "Catalogue image") : (isArabic ? "صورة الإصدار" : "Release artwork")}
            </span>
            <span className="absolute bottom-2 right-2 px-2 py-1 text-[8px] font-black uppercase tracking-widest" style={{ background: `${catStyle.color}22`, color: catStyle.color, border: `1px solid ${catStyle.color}44`, borderRadius: "2px" }}>
              {category}
            </span>
          </div>
          <div className="space-y-2 p-3">
            <h3 className="min-h-[2.5rem] text-sm font-black leading-tight" style={{ color: "var(--foreground)" }}>{isArabic ? weapon.nameAr : weapon.name}</h3>
            <div className="flex items-center justify-between gap-2 text-[10px]" style={{ color: "#777" }}>
              <span>{releaseName}</span>
              <time dateTime={weapon.releaseDate}>{new Date(`${weapon.releaseDate}T00:00:00Z`).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time>
            </div>
            <p className="line-clamp-2 text-[11px] leading-relaxed" style={{ color: "#888" }}>{description}</p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" style={{ background: "hsl(var(--card))", border: "1px solid rgba(245,166,35,0.25)", padding: 0 }}>
        <div className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: `linear-gradient(to right, ${catStyle.color}, #f5a623, transparent)` }} />
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest" style={{ background: `${catStyle.color}18`, color: catStyle.color, borderRadius: "2px" }}>{category}</span>
            <span className="text-[10px]" style={{ color: "#777" }}>{releaseName}</span>
          </div>
          <DialogTitle className="text-2xl font-black leading-tight" style={{ color: "var(--foreground)" }}>{isArabic ? weapon.nameAr : weapon.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 px-6 pb-6 mt-4">
          <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.08), rgba(0,0,0,0.24))" }}>
            <img src={weapon.imageUrl} alt={isArabic ? weapon.nameAr : weapon.name} className="max-h-64 w-full object-contain p-7" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>{isArabic ? "الوصف" : "Description"}</h4>
              <p className="text-sm leading-relaxed" style={{ color: "#999" }}>{description}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#f5a623" }}>{isArabic ? "الإتاحة" : "Availability"}</h4>
              <p className="text-sm leading-relaxed" style={{ color: "#999" }}>{availability}</p>
            </div>
          </div>
          <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "#777" }}>{verification}</p>
            <a href={weapon.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-[10px] font-black uppercase tracking-widest transition-colors hover:text-white" style={{ color: "#f5a623" }}>
              {sourceLabel} ↗
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Weapons() {
  const { t, language } = useLanguage();
  const isArabic = language === "ar";
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [letter, setLetter] = useState<string>("");
  const [sort, setSort] = useState<"alpha" | "date">("alpha");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
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
        sort, order, page: effectivePage, pageSize,
      });
      const normalizedItems = (data.items || []).map(normalizeWeapon);
      setTotal(data.total || 0);
      if (opts?.reset) setResults(normalizedItems);
      else setResults((prev) => [...prev, ...normalizedItems]);
    } catch (e: any) {
      setIsError(true);
      setError(new Error(e?.message || "Failed to load weapons"));
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
      getWeaponCategories()
        .then(cats => {
          // Merge API result with fallback — never shrink the list
          setAllCategories(prev => {
            const merged = new Set([...prev, ...cats]);
            return Array.from(merged).sort();
          });
        })
        .catch(() => { /* keep fallback list */ })
    );
  }, []);

  const categories = useMemo(() => {
    return ["all", ...allCategories];
  }, [allCategories]);

  const sortedWeapons = useMemo(() => {
    const startsWithDigit = (s: string) => /^\d/.test(s);
    if (sort === "date") {
      return [...results].sort((a: any, b: any) => {
        const av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return order === "desc" ? bv - av : av - bv;
      });
    }
    return [...results].sort((a, b) => {
      const aNum = startsWithDigit(a.name);
      const bNum = startsWithDigit(b.name);
      if (aNum !== bNum) return aNum ? 1 : -1; // push number-names to end
      const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return order === "desc" ? -cmp : cmp;
    });
  }, [results, sort, order]);

  const breadcrumbs = [{ name: isArabic ? "الأسلحة" : "Weapons", url: isArabic ? "/ar/weapons" : "/weapons" }];
  const recentWeapons = useMemo(
    () => [...WEST_RECENT_WEAPONS].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)),
    []
  );

  return (
    <>
      <SEOHead
        title={isArabic ? "أسلحة CrossFire — دليل الترسانة الكامل | CrossFire Wiki" : "CrossFire Weapons — Complete Arsenal Guide | CrossFire Wiki"}
        description={isArabic ? "استكشف ترسانة CrossFire الكاملة: البنادق الهجومية والقناصة والرشاشات والمسدسات والأسلحة البيضاء، مع صور وفئات ووصف موثق." : "Explore the full CrossFire weapon arsenal: Assault Rifles, Sniper Rifles, SMGs, Shotguns, Machine Guns, Pistols and Melee. Detailed stats, images and descriptions."}
        keywords={["crossfire weapons", "cf weapons", "weapon guide", "weapon stats", "crossfire AK47", "crossfire M4A1", "crossfire sniper", "best weapons crossfire"]}
        canonicalUrl={isArabic ? "https://crossfire.wiki/ar/weapons" : "https://crossfire.wiki/weapons"}
        ogImage="https://z8games.akamaized.net/cfna/web/main/carousel/260715_cfwe_sniperweek_carouselm.jpg"
        ogImageAlt={isArabic ? "أسلحة CrossFire — الترسانة الكاملة" : "CrossFire Weapons — Full Arsenal with Stats"}
        schemaType="CollectionPage"
        schemaData={{ name: isArabic ? "أسلحة CrossFire" : "CrossFire Weapons", description: isArabic ? "قاعدة بيانات أسلحة CrossFire مع الصور والفئات والوصف." : "Complete CrossFire weapon database with stats, categories and descriptions" }}
        breadcrumbs={[
          { name: isArabic ? "ويكي CrossFire" : "CrossFire Wiki", url: isArabic ? "https://crossfire.wiki/ar/" : "https://crossfire.wiki/" },
          { name: isArabic ? "الأسلحة" : "Weapons", url: isArabic ? "https://crossfire.wiki/ar/weapons" : "https://crossfire.wiki/weapons" },
        ]}
      />

      <div className="min-h-screen py-10 md:py-14" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbs} />

          {/* ── Header ── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}>
                <Crosshair className="h-6 w-6" style={{ color: "#f5a623" }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-0.5" style={{ color: "#f5a623" }}>{isArabic ? "الترسانة الكاملة" : "Full Arsenal"}</p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                  {t("weapons") || "Weapons"}
                </h1>
              </div>
            </div>
            <p className="text-sm mt-2" style={{ color: "#666" }}>
              {total > 0 ? (isArabic ? `${total} سلاحًا` : `${total} weapons`) : (isArabic ? "جارٍ التحميل..." : "Loading...")} — {isArabic ? "استكشف الإحصاءات والفئات والتفاصيل" : "explore stats, categories and details"}
            </p>
          </div>

          <GoogleAdSlot slot="weapons-top" />

          {/* ── CrossFire West individual releases ── */}
          <section className="mb-10" aria-labelledby="west-recent-weapons-heading">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: "#f5a623" }}>
                  {isArabic ? "إصدارات موثقة" : "Verified releases"}
                </p>
                <h2 id="west-recent-weapons-heading" className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                  {isArabic ? "أحدث أسلحة CrossFire West" : "Latest CrossFire West weapons"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: "#777" }}>
                  {isArabic
                    ? "كل اسم هنا يمثل سجلًا مستقلًا. نستخدم صورة الكتالوج عندما يوفرها Z8Games، ونوضح صراحةً عندما تكون الصورة صورة إصدار مجمعة من خارطة الطريق الرسمية."
                    : "Every name below is an individual record. We use an individual Z8Games catalogue image where available and clearly label release artwork when the publisher only provides a grouped roadmap image."}
                </p>
              </div>
              <div className="shrink-0 text-[10px] font-black uppercase tracking-widest" style={{ color: "#666" }}>
                {recentWeapons.length} {isArabic ? "سجلًا فرديًا" : "individual records"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentWeapons.map((weapon) => (
                <RecentWeaponCard key={weapon.id} weapon={weapon} isArabic={isArabic} />
              ))}
            </div>
          </section>

          {/* ── Filters ── */}
          <div className="space-y-3 mb-8">
            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#555" }} />
              <Input
                placeholder={isArabic ? "ابحث في الأسلحة..." : "Search weapons..."}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value) setLetter(""); }}
                className="pl-10 pr-10"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#555" }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {isLoading && !searchQuery && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin" style={{ color: "#666" }} /></span>
              )}
            </div>

            {/* Alphabet filter */}
            <div className="flex flex-wrap gap-1">
              {ALPHABET.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setLetter(letter === ch ? "" : ch)}
                  className="w-7 h-7 flex items-center justify-center text-[11px] font-black transition-all rounded-sm"
                  style={{
                    background: letter === ch ? "#f5a623" : "var(--card)",
                    color: letter === ch ? "#000" : "#666",
                    border: `1px solid ${letter === ch ? "#f5a623" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {ch}
                </button>
              ))}
              {letter && (
                <button
                  onClick={() => setLetter("")}
                  className="h-7 px-2 flex items-center gap-1 text-[10px] font-bold rounded-sm"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <X className="h-3 w-3" /> {isArabic ? "مسح" : "Clear"}
                </button>
              )}
            </div>

            {/* Category filters */}
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const style = cat !== "all" ? getCatStyle(cat) : { color: "#f5a623", icon: Zap };
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all"
                      style={{
                        background: selectedCategory === cat ? style.color : "var(--card)",
                        color: selectedCategory === cat ? "#000" : "#666",
                        border: `1px solid ${selectedCategory === cat ? style.color : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {cat === "all" ? (isArabic ? "الكل" : "All") : getCategoryLabel(cat, isArabic)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sort controls */}
            <div className="flex items-center gap-2">
              {(["alpha", "date"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all"
                  style={{
                    background: sort === s ? "rgba(245,166,35,0.15)" : "var(--card)",
                    color: sort === s ? "#f5a623" : "#666",
                    border: `1px solid ${sort === s ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {s === "alpha" ? (isArabic ? "الاسم" : "Name") : (isArabic ? "التاريخ" : "Date")}
                </button>
              ))}
              <button
                onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all"
                style={{ background: "var(--card)", color: "#666", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <ChevronUp className={`h-3 w-3 transition-transform duration-200 ${order === "desc" ? "rotate-180" : ""}`} />
                {order === "asc" ? (isArabic ? "تصاعدي" : "Asc") : (isArabic ? "تنازلي" : "Desc")}
              </button>
            </div>
          </div>

          {/* ── Weapons Grid ── */}
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f5a623" }} />
            </div>
          ) : isError ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(239,68,68,0.2)", borderRadius: "4px" }}>
              <p className="text-sm mb-3" style={{ color: "#f87171" }}>{(error as Error)?.message || "Failed to load weapons."}</p>
              <button
                onClick={() => fetchWeapons({ reset: true, pageOverride: 1 })}
                className="px-5 py-2 text-[10px] font-black uppercase tracking-wider transition-all hover:bg-[#f5a623] hover:text-black"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: "2px" }}
              >
                {isArabic ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          ) : sortedWeapons.length === 0 ? (
            <div className="py-20 text-center" style={{ border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <Crosshair className="h-12 w-12 mx-auto mb-3 opacity-20" style={{ color: "#f5a623" }} />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#444" }}>
                {searchQuery ? (isArabic ? "لا توجد أسلحة تطابق بحثك" : "No weapons match your search") : (isArabic ? "لا توجد أسلحة متاحة" : "No weapons available")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {sortedWeapons.map((weapon) => {
                const catStyle = getCatStyle(weapon.category || "");
                const statEntries = Object.entries(weapon.stats || {}).slice(0, 3);
                return (
                  <Dialog key={weapon.id}>
                    <DialogTrigger asChild>
                      <div
                        className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                        style={{
                          background: "var(--card)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "4px",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Top accent on hover */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: catStyle.color }} />

                        {/* Image */}
                        <div
                          className="relative overflow-hidden"
                          style={{
                            aspectRatio: "4/3",
                            background: weapon.backgroundUrl
                              ? `url('${weapon.backgroundUrl}') center/cover`
                              : "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
                          }}
                        >
                          {weapon.image ? (
                            <img
                              src={weapon.image}
                              alt={weapon.name}
                              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8" style={{ color: "#222" }} />
                            </div>
                          )}
                          {/* Category badge */}
                          {weapon.category && (
                            <div className="absolute bottom-1.5 right-1.5">
                              <span
                                className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5"
                                style={{ background: `${catStyle.color}20`, color: catStyle.color, borderRadius: "2px", border: `1px solid ${catStyle.color}30` }}
                              >
                                {getCategoryLabel(weapon.category, isArabic)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="px-2.5 pt-2.5 pb-3 space-y-2">
                          <h3 className="font-black text-[11px] uppercase tracking-tight leading-tight line-clamp-2" style={{ color: "var(--foreground)" }}>
                            {weapon.highlightedName ? (
                              <span dangerouslySetInnerHTML={{ __html: weapon.highlightedName }} />
                            ) : weapon.name}
                          </h3>

                          {/* Stats mini bars */}
                          {statEntries.length > 0 && (
                            <div className="space-y-1.5">
                              {statEntries.map(([key, val]) => (
                                <StatBar key={key} label={key} value={val} color={catStyle.color} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogTrigger>

                    {/* ── Detail Modal ── */}
                    <DialogContent
                      className="max-w-lg"
                      style={{ background: "hsl(var(--card))", border: "1px solid rgba(245,166,35,0.2)", padding: 0 }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${catStyle.color}, transparent)` }} />
                      <DialogHeader className="px-6 pt-6 pb-0">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                          {weapon.highlightedName ? (
                            <span dangerouslySetInnerHTML={{ __html: weapon.highlightedName }} />
                          ) : weapon.name}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="px-6 pb-6 space-y-5 mt-4">
                        {/* Image */}
                        <div
                          className="relative flex items-center justify-center h-44 rounded overflow-hidden"
                          style={{
                            background: weapon.backgroundUrl
                              ? `url('${weapon.backgroundUrl}') center/cover`
                              : "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)",
                          }}
                        >
                          {weapon.image ? (
                            <img src={weapon.image} alt={weapon.name} className="h-full w-full object-contain p-6" />
                          ) : (
                            <ImageIcon className="h-16 w-16" style={{ color: "#222" }} />
                          )}
                        </div>

                        {/* Category + description */}
                        <div className="flex items-center gap-3">
                          {weapon.category && (
                            <span
                              className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1"
                              style={{ background: `${catStyle.color}18`, color: catStyle.color, borderRadius: "2px" }}
                            >
                              {weapon.category}
                            </span>
                          )}
                        </div>

                        {weapon.description && (
                          <p className="text-[12px] leading-relaxed" style={{ color: "#777" }}>
                            {weapon.description}
                          </p>
                        )}

                        {/* Full stats */}
                        {weapon.stats && Object.keys(weapon.stats).length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#f5a623" }}>Weapon Stats</p>
                            <div className="space-y-2.5">
                              {Object.entries(weapon.stats).map(([key, val]) => (
                                <StatBar key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={val} color={catStyle.color} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}

          {/* Load more */}
          {results.length < total && results.length > 0 && (
            <div className="flex items-center justify-center mt-10 gap-4">
              <span className="text-[11px] font-bold" style={{ color: "#444" }}>
                {results.length} / {total} weapons
              </span>
              <button
                onClick={async () => {
                  const next = page + 1;
                  setPage(next);
                  await fetchWeapons({ pageOverride: next });
                }}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[#f5a623] hover:text-black disabled:opacity-40"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#888", borderRadius: "2px" }}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
