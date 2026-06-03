import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { Link } from "wouter";
import { ChevronRight, ExternalLink } from "lucide-react";
import { SiDiscord, SiFacebook, SiYoutube, SiX } from "react-icons/si";

const STATS = [
  { value: "53", label: "Ranks Documented" },
  { value: "49+", label: "Weapons Covered" },
  { value: "13+", label: "Game Modes" },
  { value: "10", label: "Mercenary Profiles" },
];

const FEATURES = [
  {
    num: "01",
    title: "Weapon Stats Database",
    body: "Every weapon entry includes damage, range, fire rate, reload time, and magazine size — pulled directly from in-game data and kept current with patches.",
  },
  {
    num: "02",
    title: "Event Tracker",
    body: "Seasonal events, limited giveaways, and community activations are logged as they go live — not two weeks after they end.",
  },
  {
    num: "03",
    title: "Mercenary Profiles",
    body: "Full profiles with lore, in-game voice lines, and faction breakdown for every CrossFire operative released to date.",
  },
  {
    num: "04",
    title: "Rank System Guide",
    body: "All 53 ranks with EXP thresholds, emblem previews, and progression paths — no guessing how far you are from the next tier.",
  },
  {
    num: "05",
    title: "ZP Seller Marketplace",
    body: "Vetted ZP top-up sellers with real reviews, price comparison, and delivery time data. No unknown middlemen.",
  },
  {
    num: "06",
    title: "Community-Maintained",
    body: "Built and updated by CrossFire players. If something's wrong, report it — corrections are pushed quickly.",
  },
];

const TOPICS = [
  "Weapons — full stat breakdowns per gun",
  "Game modes — objectives, map pools, scoring",
  "Mercenary roster — voice lines and lore",
  "Rank table — EXP thresholds and emblems",
  "Events — active and archived",
  "ZP marketplace — verified seller listings",
  "News — patch notes and announcements",
  "Tutorials — guides for new and returning players",
];

const SOCIALS = [
  { href: "https://discord.gg/7AbuDrNNJM", icon: <SiDiscord className="h-5 w-5" />, label: "Discord", sub: "Join the community server" },
  { href: "https://www.facebook.com/crossfireonline", icon: <SiFacebook className="h-5 w-5" />, label: "Facebook", sub: "Official CrossFire page" },
  { href: "https://www.youtube.com/c/CrossFireWest", icon: <SiYoutube className="h-5 w-5" />, label: "YouTube", sub: "Gameplay and event videos" },
  { href: "https://x.com/CrossFireOnline", icon: <SiX className="h-5 w-5" />, label: "X / Twitter", sub: "Game updates and news" },
];

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <PageSEO
        title="About — CrossFire Wiki | Bimora Gaming"
        description="About CrossFire Wiki — learn who maintains this site and our mission to provide accurate CrossFire game guides and community resources."
        canonicalPath="/about"
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Hero ── */}
        <div className="relative" style={{ background: "hsl(var(--card))", borderBottom: "1px solid rgba(245,166,35,0.12)" }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url('/cf-heroes-bg.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              opacity: 0.07,
            }}
          />
          <div className="relative max-w-5xl mx-auto px-6 md:px-10 py-20 md:py-28">
            <div className="mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: "#f5a623" }}>Bimora Gaming</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6" style={{ color: "var(--foreground)" }}>
              CrossFire<br />
              <span style={{ WebkitTextStroke: "1px #f5a623", color: "transparent" }}>Knowledge Base</span>
            </h1>
            <p className="text-sm md:text-base leading-relaxed max-w-xl mb-8" style={{ color: "#888" }}>
              A community-built reference site for CrossFire players. Weapon stats, event logs, mercenary profiles, rank data, and a verified ZP marketplace — in one place.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/weapons">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                >
                  Weapons DB <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link href="/events">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest border transition-all hover:border-[#f5a623] hover:text-[#f5a623]"
                  style={{ background: "transparent", color: "#666", borderColor: "rgba(255,255,255,0.1)", borderRadius: "2px" }}
                >
                  Events
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={{ borderBottom: "1px solid rgba(245,166,35,0.08)" }}>
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-black leading-none mb-1" style={{ color: "#f5a623" }}>{s.value}</div>
                <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24 space-y-20">

          {/* ── What it is ── */}
          <section className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] block mb-3" style={{ color: "#f5a623" }}>What This Is</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-5" style={{ color: "var(--foreground)" }}>
                Built Because CrossFire Deserved Better Docs
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#777" }}>
                CrossFire has been running since 2007. There's never been a clean, up-to-date reference for it. Forum posts get outdated. YouTube videos get removed. Wiki sites die. This one doesn't.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
                Bimora Gaming was built to fix the information problem — a structured database of game content maintained by people who actually play. Every weapon, every event, every rank. No filler.
              </p>
            </div>
            <div className="space-y-3">
              {TOPICS.map((topic, i) => (
                <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[10px] font-black mt-0.5 flex-shrink-0 w-5 text-right" style={{ color: "#f5a623", fontVariantNumeric: "tabular-nums" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] leading-snug" style={{ color: "#888" }}>{topic}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── What We Offer ── */}
          <section>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] block mb-2" style={{ color: "#f5a623" }}>What We Offer</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8" style={{ color: "var(--foreground)" }}>
              Six Sections. All of Them Useful.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
              {FEATURES.map((f) => (
                <div
                  key={f.num}
                  className="p-6 group"
                  style={{ background: "var(--background)" }}
                >
                  <div className="text-[11px] font-black mb-3" style={{ color: "#f5a623", fontVariantNumeric: "tabular-nums" }}>{f.num}</div>
                  <h3 className="font-black text-sm uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>{f.title}</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: "#666" }}>{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Community ── */}
          <section className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] block mb-3" style={{ color: "#f5a623" }}>Community</span>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-5" style={{ color: "var(--foreground)" }}>
                Players Built This. Players Run This.
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#777" }}>
                CrossFire Wiki isn't a media company's side project. It's maintained by the same people checking damage values in custom games at 2am. If you spot a stat that's off, report it — it gets fixed.
              </p>
              <Link href="/contact">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all hover:brightness-110"
                  style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "2px", color: "#f5a623" }}
                >
                  Submit a correction <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </div>

            <div className="space-y-2">
              {SOCIALS.map(({ href, icon, label, sub }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 group transition-all"
                  style={{ background: "hsl(var(--card))", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.25)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <span style={{ color: "#888" }}>{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-black uppercase tracking-wider" style={{ color: "var(--foreground)" }}>{label}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#555" }}>{sub}</div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#f5a623" }} />
                </a>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
