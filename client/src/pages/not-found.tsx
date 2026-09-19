import { useLanguage } from "@/components/LanguageProvider";
import { Link, useLocation } from "wouter";
import { Home, AlertTriangle, Search } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useState } from "react";

const POPULAR_LINKS = [
  { href: "/weapons", en: "Weapons", ar: "الأسلحة" },
  { href: "/mercenaries", en: "Mercenaries", ar: "الشخصيات" },
  { href: "/ribbons", en: "Ribbons", ar: "الريبونات" },
  { href: "/events", en: "Events", ar: "الفعاليات" },
  { href: "/ranks", en: "Ranks", ar: "الرتب" },
  { href: "/modes", en: "Modes", ar: "الأطوار" },
];

export default function NotFound() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [q, setQ] = useState("");
  const arabic = language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <SEOHead
        title="404 — Page Not Found | CrossFire Wiki"
        description="The page you're looking for doesn't exist or has been moved."
        robots="noindex, nofollow"
      />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(245,166,35,0.04) 0%, transparent 70%)" }} />
      <div className="relative text-center">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "4px" }}>
          <AlertTriangle className="h-8 w-8" style={{ color: "#f5a623" }} />
        </div>
        <div className="text-[120px] font-black leading-none mb-2" style={{ color: "rgba(245,166,35,0.12)", lineHeight: 1 }}>404</div>
        <h1 className="text-2xl font-black uppercase tracking-tight mb-3" style={{ color: "var(--foreground)" }}>
          {t("notFound")}
        </h1>
        <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: "#555" }}>
          {t("notFoundText")}
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110" style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}>
          <Home className="h-3.5 w-3.5" />
          {t("backToHome")}
        </Link>
        <form
          className="mt-6 mx-auto flex max-w-xs items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) setLocation(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute start-3 top-1/2 -translate-y-1/2" style={{ color: "#666" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={arabic ? "دوّر في الموقع…" : "Search the wiki…"}
              aria-label={arabic ? "بحث" : "Search"}
              className="w-full h-10 ps-9 pe-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px" }}
            />
          </div>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
          {POPULAR_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-[11px] font-bold transition-all hover:brightness-125"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
            >
              {arabic ? l.ar : l.en}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
