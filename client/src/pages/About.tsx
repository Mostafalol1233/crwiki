import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { Link } from "wouter";
import { Shield, Zap, Users, BookOpen, Target, Trophy, ChevronRight, ExternalLink } from "lucide-react";
import { SiDiscord, SiFacebook, SiYoutube, SiX } from "react-icons/si";

const STATS = [
  { value: "2.4M+", label: "Active Players" },
  { value: "300+", label: "Weapons Documented" },
  { value: "312", label: "Maps Catalogued" },
  { value: "50+", label: "Game Modes Covered" },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Accurate Guides",
    body: "We refresh weapon stats, patch notes, and gameplay references as updates drop so players always find current, reliable information.",
    color: "#f5a623",
  },
  {
    icon: Users,
    title: "Community-First",
    body: "CrossFire Wiki is built for new and veteran players alike — practical content, clean explanations, zero fluff.",
    color: "#4ade80",
  },
  {
    icon: Zap,
    title: "Clear & Fast",
    body: "Easy navigation, structured pages, and direct answers. Get what you need in seconds — not after reading ten paragraphs.",
    color: "#818cf8",
  },
  {
    icon: Shield,
    title: "Always Up to Date",
    body: "Events, mercenaries, ranks, and modes — every section is maintained and synced with the CrossFire live game cycle.",
    color: "#38bdf8",
  },
  {
    icon: Target,
    title: "Competitive Edge",
    body: "Stat breakdowns, damage calculators, and detailed weapon categories help you make data-driven loadout choices.",
    color: "#fb923c",
  },
  {
    icon: Trophy,
    title: "Seller Marketplace",
    body: "A verified ZP top-up marketplace connects players with trusted sellers — with real reviews and safety ratings.",
    color: "#f43f5e",
  },
];

const TOPICS = [
  "Weapons & full stat breakdowns",
  "All game modes & objectives",
  "Map guides & callout references",
  "Mercenary profiles & voice lines",
  "Rank progression & EXP thresholds",
  "Community events & announcements",
  "Tutorials & beginner guides",
  "ZP seller reviews & marketplace",
];

const SOCIALS = [
  { href: "https://discord.gg/7AbuDrNNJM", icon: <SiDiscord className="h-4 w-4" />, label: "Discord", color: "#5865f2" },
  { href: "https://www.facebook.com/crossfireonline", icon: <SiFacebook className="h-4 w-4" />, label: "Facebook", color: "#1877f2" },
  { href: "https://www.youtube.com/c/CrossFireWest", icon: <SiYoutube className="h-4 w-4" />, label: "YouTube", color: "#ff0000" },
  { href: "https://x.com/CrossFireOnline", icon: <SiX className="h-4 w-4" />, label: "X / Twitter", color: "#e0e0e0" },
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
        <div className="relative overflow-hidden py-20 md:py-28" style={{ background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 70%)" }} />
          <div className="max-w-4xl mx-auto px-6 md:px-10 text-center relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-[1px] w-12" style={{ background: "linear-gradient(to left, #f5a623, transparent)" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>About Bimora Gaming</span>
              <div className="h-[1px] w-12" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none mb-6" style={{ color: "var(--foreground)" }}>
              The CrossFire<br />
              <span style={{ color: "#f5a623" }}>Knowledge Hub</span>
            </h1>
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#888" }}>
              Bimora Gaming is a community-maintained CrossFire wiki providing accurate, up-to-date game guides, event coverage, weapon stats, and a trusted seller marketplace.
            </p>

            <div className="flex items-center justify-center gap-3 mt-8">
              <Link href="/posts">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
                >
                  Explore Guides <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link href="/contact">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:border-[#f5a623] hover:text-[#f5a623]"
                  style={{ background: "transparent", color: "#666", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px" }}
                >
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={{ background: "hsl(var(--card))", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black leading-none mb-1" style={{ color: "#f5a623" }}>{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24 space-y-20">

          {/* ── Mission ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, rgba(245,166,35,0.3), transparent)" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Our Mission</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
              Why We Built This
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "#777" }}>
              CrossFire is one of the longest-running FPS games globally — yet reliable, structured information about it has always been scattered across forums, YouTube videos, and unofficial wikis. Bimora Gaming was built to fix that: a single, clean platform where players can find every weapon's stats, every map's layout, every event's details, and a safe space to buy ZP from verified sellers.
            </p>
          </section>

          {/* ── Features grid ── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, rgba(245,166,35,0.3), transparent)" }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>What We Offer</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8" style={{ color: "var(--foreground)" }}>
              Platform Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="p-5 transition-all hover:-translate-y-0.5"
                    style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
                  >
                    <div className="w-9 h-9 flex items-center justify-center rounded mb-3" style={{ background: `${f.color}15` }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: f.color, height: "18px", width: "18px" }} />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-tight mb-2" style={{ color: "var(--foreground)" }}>{f.title}</h3>
                    <p className="text-[12px] leading-relaxed" style={{ color: "#666" }}>{f.body}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── What we cover ── */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, rgba(245,166,35,0.3), transparent)" }} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Content</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
                What We Cover
              </h2>
              <ul className="space-y-2">
                {TOPICS.map((topic) => (
                  <li key={topic} className="flex items-start gap-2.5">
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: "#f5a623" }} />
                    <span className="text-[13px] leading-relaxed" style={{ color: "#888" }}>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-[1px] flex-1" style={{ background: "linear-gradient(to right, rgba(245,166,35,0.3), transparent)" }} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#f5a623" }}>Community</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
                Join the Community
              </h2>
              <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#777" }}>
                CrossFire Wiki is a living project — driven by players, for players. Whether you want to read guides, report errors, or contribute to the wiki, you're welcome here. Join us on any of the platforms below.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SOCIALS.map(({ href, icon, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 transition-all hover:-translate-y-0.5"
                    style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color + "50"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <span style={{ color }}>{icon}</span>
                    <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#888" }}>{label}</span>
                    <ExternalLink className="h-3 w-3 ml-auto" style={{ color: "#444" }} />
                  </a>
                ))}
              </div>

              <Link href="/contact">
                <div
                  className="mt-4 flex items-center gap-2 px-4 py-3 transition-all hover:border-[#f5a623] group cursor-pointer"
                  style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "3px" }}
                >
                  <span className="text-[12px] font-black uppercase tracking-wider flex-1" style={{ color: "#f5a623" }}>Got a question or tip?</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: "#f5a623" }} />
                </div>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
