import { useLanguage } from "@/components/LanguageProvider";
import { Link } from "wouter";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
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
        <Link href="/">
          <a className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110" style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}>
            <Home className="h-3.5 w-3.5" />
            {t("backToHome")}
          </a>
        </Link>
      </div>
    </div>
  );
}
