import { ExternalLink, Skull } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function GraveGames() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Hero Image */}
      <div className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
        <img
          src="/assets/news-gravegames.jpg"
          alt="Grave Games - The Spider's Web"
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-grave-games-hero"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(245,166,35,0.06) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "2px" }}>
            <Skull className="h-3 w-3" style={{ color: "#f5a623" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>CrossFire Event</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none mb-2">
            {t("theSpidersWeb")}
          </h2>
          <p className="text-sm text-white/60">{t("eventDates")}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-1" style={{ color: "var(--foreground)" }}>
            {t("graveGames")}
          </h1>
          <p className="text-sm" style={{ color: "#666" }}>{t("graveGamesSubtitle")}</p>
        </div>

        {/* Info Card */}
        <div className="p-6 md:p-8 mb-6" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
          <h3 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: "var(--foreground)" }}>{t("eventInformation")}</h3>

          <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#888" }}>
            <p>{t("eventDescription")}</p>
            <p>{t("eventDetails")}</p>
          </div>

          {/* Features */}
          <div className="mt-6 p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "3px" }}>
            <h4 className="font-black text-xs uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>{t("eventFeatures")}</h4>
            <ul className="space-y-2">
              {["eventFeature1","eventFeature2","eventFeature3","eventFeature4","eventFeature5"].map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm" style={{ color: "#888" }}>
                  <span style={{ color: "#f5a623", marginTop: "2px" }}>›</span>
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Warning Card */}
          <div className="mt-4 p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "3px" }}>
            <h4 className="font-black text-xs uppercase tracking-wider mb-2" style={{ color: "#f87171" }}>{t("limitedTimeOnly")}</h4>
            <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{t("limitedTimeText")}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <a
            href="https://www.z8games.com/login.html?returnurl=https://crossfire.z8games.com/event/gravegames_progress"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-login-progress"
          >
            <button
              className="inline-flex items-center gap-2 px-6 py-3 font-black text-[11px] uppercase tracking-widest transition-all hover:brightness-110"
              style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
              data-testid="button-login-check-progress"
            >
              <ExternalLink className="h-4 w-4" />
              {t("loginToCheckProgress")}
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
