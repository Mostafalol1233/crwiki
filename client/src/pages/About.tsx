import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getModes, getMaps } from "@/lib/supabaseApi";
import {
  ChevronRight, Download, Crosshair, Users, Map, Sword,
  Trophy, Gamepad2, Globe2, Shield, Star, ArrowRight
} from "lucide-react";
import { SiDiscord, SiFacebook, SiYoutube, SiX } from "react-icons/si";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { localizedPath } from "@/lib/routePaths";

const ACCENT = "#d4a017";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "rgba(255,255,255,0.08)";

/* ── Game modes overview ── */
const GAME_MODES = [
  {
    name: "Team Deathmatch",
    nameAr: "تيم ديثماتش",
    desc: "Two teams fight to reach the kill limit first. Classic elimination-based format.",
    descAr: "فريقان يتنافسان على الوصول لأكبر عدد من القتل أولاً.",
    icon: Crosshair,
    color: "#ef4444",
  },
  {
    name: "Search & Destroy",
    nameAr: "سيرش آند ديستروي",
    desc: "One team plants a bomb, the other must defuse or eliminate all enemies before detonation.",
    descAr: "فريق يزرع القنبلة والآخر يحاول نزعها أو القضاء على الأعداء.",
    icon: Shield,
    color: "#f5a623",
  },
  {
    name: "Mutation Mode",
    nameAr: "موود الطفرة",
    desc: "Survive waves of infected zombies. Heroes fight to hold out — infected convert victims to their side.",
    descAr: "تعيش موجات من الزومبي. المتحولون يضمون الضحايا لفريقهم.",
    icon: Star,
    color: "#a855f7",
  },
  {
    name: "Ghost Mode",
    nameAr: "غوست موود",
    desc: "Ghosts from Black List are invisible — only visible when moving. Global Risk must locate and eliminate them.",
    descAr: "أحد الفريقين غير مرئي إلا لحظة الحركة. الآخر يجب أن يتعقبهم.",
    icon: Users,
    color: "#3b82f6",
  },
  {
    name: "Wave Mode",
    nameAr: "ويف موود",
    desc: "Cooperative survival against increasingly difficult AI-controlled enemy waves.",
    descAr: "بقاء تعاوني ضد موجات أعداء يتحكم فيهم الذكاء الاصطناعي.",
    icon: Gamepad2,
    color: "#22c55e",
  },
  {
    name: "Ranked Mode",
    nameAr: "الرانك",
    desc: "Competitive ranked play with ELO-based matchmaking and seasonal rewards.",
    descAr: "لعب تنافسي بنظام ELO مع مكافآت موسمية.",
    icon: Trophy,
    color: "#d4a017",
  },
];

const FACTIONS = [
  {
    name: "Global Risk",
    nameAr: "جلوبال ريسك",
    desc: "A private military company founded in 1999, contracted to protect corporations and governments worldwide.",
    descAr: "شركة عسكرية خاصة تأسست عام 1999، تعمل لحماية الشركات والحكومات.",
    color: "#3b82f6",
    side: "Defenders",
    image: "/global-risk-logo.png",
    bgColor: "rgba(59,130,246,0.06)",
  },
  {
    name: "Black List",
    nameAr: "بلاك ليست",
    desc: "A powerful international terrorist organization challenging Global Risk in covert operations globally.",
    descAr: "منظمة إرهابية دولية تواجه جلوبال ريسك في عمليات سرية حول العالم.",
    color: "#ef4444",
    side: "Attackers",
    image: "/black-list-logo.png",
    bgColor: "rgba(239,68,68,0.06)",
  },
];

const QUICK_STATS = [
  { value: "101", label: "Ranks", labelAr: "رتبة" },
  { value: "3,599", label: "Weapons", labelAr: "سلاح" },
  { value: "312", label: "Maps", labelAr: "خريطة" },
  { value: "60", label: "Game Modes", labelAr: "طور لعب" },
  { value: "41", label: "Mercenaries", labelAr: "شخصية" },
  { value: "Free", label: "To Play", labelAr: "مجاناً" },
];

const SOCIALS = [
  { href: SITE_CONFIG.socials.discord,  icon: SiDiscord,  label: "Discord",    color: "#5865f2" },
  { href: SITE_CONFIG.socials.facebook, icon: SiFacebook, label: "Facebook",   color: "#1877f2" },
  { href: SITE_CONFIG.socials.youtube,  icon: SiYoutube,  label: "YouTube",    color: "#ff0033" },
  { href: SITE_CONFIG.socials.twitter,  icon: SiX,        label: "X / Twitter", color: "#fff" },
];

export default function About() {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const localPath = (path: string) => localizedPath(path, language);

  const { data: dbModes } = useQuery({ queryKey: ["about-modes"], queryFn: getModes, staleTime: 10 * 60 * 1000 });
  const { data: dbMaps }  = useQuery({ queryKey: ["about-maps"],  queryFn: getMaps,  staleTime: 10 * 60 * 1000 });

  // Match DB mode images with our hardcoded list by partial name
  const modeImageMap: Record<string, string> = {};
  if (dbModes) {
    for (const m of dbModes as any[]) {
      modeImageMap[String(m.name || "").toLowerCase().trim()] = String(m.image || "");
    }
  }
  function getModeImage(modeName: string): string {
    const key = modeName.toLowerCase();
    for (const [k, v] of Object.entries(modeImageMap)) {
      if (k.includes(key.split(" ")[0]) || key.includes(k.split(" ")[0])) return v;
    }
    return "";
  }

  // Get maps grouped by mode type
  const allMaps = (dbMaps as any[]) || [];
  const tdmMaps = allMaps.filter(m =>
    String(m.mode || m.category || "").toLowerCase().includes("tdm") ||
    String(m.mode || m.category || "").toLowerCase().includes("deathmatch")
  ).filter(m => m.image || m.imageUrl).slice(0, 4);

  const sndMaps = allMaps.filter(m =>
    String(m.mode || m.category || "").toLowerCase().includes("s&d") ||
    String(m.mode || m.category || "").toLowerCase().includes("search")
  ).filter(m => m.image || m.imageUrl).slice(0, 4);

  // Generic recent maps if mode-specific ones are sparse
  const recentMaps = allMaps.filter(m => m.image || m.imageUrl).slice(0, 6);

  return (
    <>
      <PageSEO
        title="CrossFire Game Overview — CrossFire Wiki"
        description="Complete CrossFire game overview: factions, modes, weapons, mercenaries, rank system, and more. نظرة شاملة على لعبة CrossFire."
        canonicalPath="/about"
      />

      <div style={{ background: BG, minHeight: "100vh" }}>

        {/* ── Hero ── */}
        <div className="about-hero" style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(to bottom, #0d1117, #0a0a0a)",
          borderBottom: `1px solid ${BORDER}`,
          paddingTop: 80, paddingBottom: 80,
        }}>
          {/* Dot grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }} />
          {/* Background image */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `url('/cf-heroes-bg.png')`,
            backgroundSize: "cover", backgroundPosition: "center top",
            opacity: 0.06,
          }} />

          <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 12px", borderRadius: 999,
              background: "rgba(212,160,23,0.12)", border: `1px solid rgba(212,160,23,0.3)`,
              marginBottom: 20,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {isAr ? "نظرة عامة على اللعبة" : "Game Overview"}
              </span>
            </div>

            <h1 style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 800, fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              color: "#fff", margin: "0 0 16px",
              letterSpacing: "-0.03em", lineHeight: 1.1,
            }}>
              CrossFire
              <br />
              <span style={{ color: ACCENT }}>
                {isAr ? "دليل اللعبة الشامل" : "Complete Guide"}
              </span>
            </h1>

            <p style={{
              fontSize: 16, color: "rgba(255,255,255,0.55)",
              maxWidth: 560, lineHeight: 1.7, margin: "0 0 32px",
              fontFamily: "Inter, system-ui, sans-serif",
            }}>
              {isAr
                ? "CrossFire هي لعبة FPS مجانية متعددة اللاعبين من تطوير Smilegate، وتضم عالمًا تنافسيًا واسعًا ومجموعة كبيرة من الأطوار والخرائط."
                : "CrossFire is a free-to-play online FPS developed by Smilegate, with a broad competitive ecosystem and a large catalog of modes, maps, and weapons."}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href={localPath("/download")}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", background: ACCENT,
                  border: "none", borderRadius: 8, color: "#000",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}>
                  <Download size={16} /> {isAr ? "تنزيل اللعبة" : "Download CrossFire"}
                </button>
              </Link>
              <Link href={localPath("/ranks")}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px",
                  background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
                  borderRadius: 8, color: "#fff",
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}>
                  <Trophy size={16} /> {isAr ? "الرتب" : "Explore Ranks"}
                </button>
              </Link>
            </div>
          </div>
        </div>


        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }} className="about-content">

          {/* ── What is CrossFire ── */}
          <section style={{ marginBottom: 80 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48,
              alignItems: "center",
            }} className="about-intro-grid">
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                  {isAr ? "ما هي اللعبة؟" : "What is CrossFire?"}
                </span>
                <h2 style={{
                  fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  color: "#fff", margin: "0 0 20px", letterSpacing: "-0.02em", lineHeight: 1.2,
                }}>
                  {isAr ? "لعبة شوتر مجانية متعددة اللاعبين" : "A Tactical Multiplayer Shooter"}
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: "0 0 16px", fontFamily: "Inter, system-ui, sans-serif" }}>
                  {isAr
                    ? "CrossFire لعبة FPS مجانية طورتها شركة Smilegate الكورية. اللعبة متاحة على الكمبيوتر وبعض الأجهزة المحمولة. اللعبة تدور حول منظمتين مرتزقة: Global Risk وBlack List."
                    : "CrossFire is a free-to-play FPS developed by South Korean studio Smilegate. The game revolves around two mercenary organizations — Global Risk and Black List — competing across dozens of maps and game modes."}
                </p>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: "0 0 24px", fontFamily: "Inter, system-ui, sans-serif" }}>
                  {isAr
                    ? "بدأت اللعبة في 2007، وما زالت تحصل على تحديثات ومحتوى موسمي وفعاليات في المناطق التي تتوفر فيها الخدمة."
                    : "First launched in 2007, CrossFire continues to receive seasonal content, events, and competitive updates across its supported regions."}
                </p>
                <Link href={localPath("/weapons")}>
                  <button style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 20px",
                    background: "rgba(212,160,23,0.12)", border: `1px solid rgba(212,160,23,0.3)`,
                    borderRadius: 8, color: ACCENT,
                    fontWeight: 600, fontSize: 13, cursor: "pointer",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}>
                    {isAr ? "تصفح الأسلحة" : "Browse Weapons"} <ArrowRight size={14} />
                  </button>
                </Link>
              </div>
              <div style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 12, overflow: "hidden",
              }}>
                <img src="/cf-heroes-bg.png" alt="CrossFire" width={1200} height={260}
                  style={{ width: "100%", height: 260, objectFit: "cover", display: "block", opacity: 0.85 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              </div>
            </div>
          </section>

          {/* ── The Two Factions ── */}
          <section style={{ marginBottom: 80 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              {isAr ? "الفصائل" : "Factions"}
            </span>
            <h2 style={{
              fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
              fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
              color: "#fff", margin: "0 0 32px", letterSpacing: "-0.02em",
            }}>
              {isAr ? "فريقان يتقاتلان عبر العالم" : "Two Factions. One War."}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="about-factions-grid">
              {FACTIONS.map((faction) => (
                <div key={faction.name} style={{
                  background: CARD, border: `1px solid ${BORDER}`,
                  borderRadius: 12, overflow: "hidden",
                  borderTop: `3px solid ${faction.color}`,
                }}>
                  {/* Faction image banner */}
                  <div style={{
                    height: 160, background: faction.bgColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderBottom: `1px solid ${BORDER}`, position: "relative",
                    overflow: "hidden",
                  }}>
                    <img
                      src={faction.image}
                      alt={faction.name}
                      width={300} height={130}
                      style={{ maxHeight: 130, maxWidth: "70%", objectFit: "contain", position: "relative", zIndex: 1 }}
                      onError={e => {
                        const el = e.currentTarget as HTMLImageElement;
                        el.style.display = "none";
                        const parent = el.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.faction-fallback-text') as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }
                      }}
                    />
                    <div className="faction-fallback-text" style={{
                      display: "none", position: "absolute", inset: 0,
                      alignItems: "center", justifyContent: "center",
                      fontSize: 36, fontWeight: 900, color: `${faction.color}40`,
                      letterSpacing: "0.05em", fontFamily: "Inter, system-ui, sans-serif",
                    }}>
                      {faction.name.split(" ").map(w => w[0]).join("")}
                    </div>
                  </div>
                  <div style={{ padding: 28 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "3px 10px", borderRadius: 999,
                      background: `${faction.color}18`, border: `1px solid ${faction.color}44`,
                      marginBottom: 16,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: faction.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {isAr ? (faction.side === "Attackers" ? "المهاجمون" : "المدافعون") : faction.side}
                      </span>
                    </div>
                    <h3 style={{
                      fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
                      fontSize: "1.2rem", color: "#fff", margin: "0 0 12px",
                    }}>
                      {isAr ? faction.nameAr : faction.name}
                    </h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
                      {isAr ? faction.descAr : faction.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Game Modes ── */}
          <section style={{ marginBottom: 80 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              {isAr ? "أوضاع اللعب" : "Game Modes"}
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{
                fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
                fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                color: "#fff", margin: 0, letterSpacing: "-0.02em",
              }}>
                {isAr ? "أوضاع لعب متنوعة لكل أسلوب" : "A Mode for Every Playstyle"}
              </h2>
              <Link href={localPath("/modes")}>
                <button style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px",
                  background: "transparent", border: `1px solid ${BORDER}`,
                  borderRadius: 8, color: "rgba(255,255,255,0.5)",
                  fontSize: 13, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                }}>
                  {isAr ? "كل الأوضاع" : "All Modes"} <ChevronRight size={14} />
                </button>
              </Link>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}>
              {GAME_MODES.map((mode) => {
                const Icon = mode.icon;
                const dbImg = getModeImage(mode.name);
                return (
                  <div key={mode.name} style={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 12, overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${mode.color}44`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
                    {/* Mode image */}
                    {dbImg ? (
                      <div style={{ height: 120, overflow: "hidden", background: "#050505", position: "relative" }}>
                        <img
                          src={dbImg}
                          alt={mode.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(17,17,17,0.85) 0%, transparent 60%)" }} />
                        <div style={{ position: "absolute", top: 8, left: 10 }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                            padding: "2px 8px", borderRadius: 2,
                            background: `${mode.color}30`, color: mode.color, border: `1px solid ${mode.color}50`,
                          }}>
                            {isAr ? mode.nameAr : mode.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        height: 80, background: `${mode.color}08`,
                        borderBottom: `1px solid ${mode.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={32} color={`${mode.color}50`} strokeWidth={1} />
                      </div>
                    )}
                    <div style={{ padding: "16px 20px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: `${mode.color}18`, border: `1px solid ${mode.color}44`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 2,
                      }}>
                        <Icon size={16} color={mode.color} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 style={{
                          fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600,
                          fontSize: 15, color: "#fff", margin: "0 0 5px",
                        }}>
                          {isAr ? mode.nameAr : mode.name}
                        </h3>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6, fontFamily: "Inter, system-ui, sans-serif" }}>
                          {isAr ? mode.descAr : mode.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Maps Preview ── */}
          {recentMaps.length > 0 && (
            <section style={{ marginBottom: 80 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                {isAr ? "الخرائط" : "Maps"}
              </span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{
                  fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
                  fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                  color: "#fff", margin: 0, letterSpacing: "-0.02em",
                }}>
                  {isAr ? "ساحات المعارك" : "Battle Arenas"}
                </h2>
                <Link href={localPath("/maps")}>
                  <button style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 16px",
                    background: "transparent", border: `1px solid ${BORDER}`,
                    borderRadius: 8, color: "rgba(255,255,255,0.5)",
                    fontSize: 13, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif",
                  }}>
                    {isAr ? "كل الخرائط" : "All Maps"} <ChevronRight size={14} />
                  </button>
                </Link>
              </div>

              {/* TDM Maps */}
              {tdmMaps.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 14, background: "#ef4444", borderRadius: 2 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {isAr ? "تصفية الفريق" : "Team Deathmatch"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                    {tdmMaps.map((m: any) => (
                      <Link key={m.id} href="/maps">
                        <div style={{ borderRadius: 8, overflow: "hidden", position: "relative", aspectRatio: "16/9", background: "#050505", cursor: "pointer" }}>
                          <img src={m.image || m.imageUrl} alt={m.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />
                          <p style={{ position: "absolute", bottom: 8, left: 10, right: 8, fontSize: 11, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{m.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* S&D Maps */}
              {sndMaps.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 3, height: 14, background: "#f5a623", borderRadius: 2 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {isAr ? "البحث والتدمير" : "Search & Destroy"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                    {sndMaps.map((m: any) => (
                      <Link key={m.id} href="/maps">
                        <div style={{ borderRadius: 8, overflow: "hidden", position: "relative", aspectRatio: "16/9", background: "#050505", cursor: "pointer" }}>
                          <img src={m.image || m.imageUrl} alt={m.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />
                          <p style={{ position: "absolute", bottom: 8, left: 10, right: 8, fontSize: 11, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{m.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: all maps if no mode-specific ones found */}
              {tdmMaps.length === 0 && sndMaps.length === 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {recentMaps.map((m: any) => (
                    <Link key={m.id} href="/maps">
                      <div style={{ borderRadius: 8, overflow: "hidden", position: "relative", aspectRatio: "16/9", background: "#050505", cursor: "pointer" }}>
                        <img src={m.image || m.imageUrl} alt={m.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />
                        <p style={{ position: "absolute", bottom: 8, left: 10, right: 8, fontSize: 11, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>{m.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Currencies ── */}
          <section style={{ marginBottom: 80 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              {isAr ? "العملات" : "Currencies"}
            </span>
            <h2 style={{
              fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
              fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
              color: "#fff", margin: "0 0 28px", letterSpacing: "-0.02em",
            }}>
              {isAr ? "عملتان أساسيتان" : "Two Core Currencies"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="about-factions-grid">
              {/* ZP Card */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", borderTop: "3px solid #f5a623" }}>
                <div style={{
                  height: 120, background: "rgba(245,166,35,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderBottom: `1px solid rgba(245,166,35,0.15)`,
                }}>
                  <img
                    src="https://static.wikia.nocookie.net/crossfire/images/f/f7/ZP.png/revision/latest"
                    alt="ZP Coin"
                    style={{ maxHeight: 90, maxWidth: "60%", objectFit: "contain" }}
                    onError={e => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent) {
                        const fb = parent.querySelector(".zp-fallback") as HTMLElement;
                        if (fb) fb.style.display = "flex";
                      }
                    }}
                  />
                  <div className="zp-fallback" style={{
                    display: "none", width: 72, height: 72, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f5a623, #d4820a)",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "#000",
                    boxShadow: "0 4px 20px rgba(245,166,35,0.4)",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}>ZP</div>
                </div>
                <div style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700, fontSize: 16, color: "#f5a623", margin: "0 0 8px" }}>
                    {isAr ? "زد-بوينتس (Z-Points)" : "Z-Points (ZP)"}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7, fontFamily: "Inter, system-ui, sans-serif" }}>
                    {isAr
                      ? "العملة المدفوعة. تشتريها بفلوس حقيقية وتستخدمها لشراء أسلحة وشخصيات بريميوم من الشوب."
                      : "Premium currency purchased with real money. Used for premium weapons, characters, and items in the Item Shop."}
                  </p>
                </div>
              </div>
              {/* GP Card */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", borderTop: "3px solid #22c55e" }}>
                <div style={{
                  height: 120, background: "rgba(34,197,94,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderBottom: `1px solid rgba(34,197,94,0.15)`,
                }}>
                  <img
                    src="https://static.wikia.nocookie.net/crossfire/images/4/4f/GP.png/revision/latest"
                    alt="GP Coin"
                    style={{ maxHeight: 90, maxWidth: "60%", objectFit: "contain" }}
                    onError={e => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent) {
                        const fb = parent.querySelector(".gp-fallback") as HTMLElement;
                        if (fb) fb.style.display = "flex";
                      }
                    }}
                  />
                  <div className="gp-fallback" style={{
                    display: "none", width: 72, height: 72, borderRadius: "50%",
                    background: "linear-gradient(135deg, #22c55e, #15803d)",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: "#000",
                    boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}>GP</div>
                </div>
                <div style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700, fontSize: 16, color: "#22c55e", margin: "0 0 8px" }}>
                    {isAr ? "جيم-بوينتس (Game Points)" : "Game Points (GP)"}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7, fontFamily: "Inter, system-ui, sans-serif" }}>
                    {isAr
                      ? "عملة مجانية تكسبها من اللعب. تستخدمها في الـ MP Shop للحصول على أسلحة وأيتمات."
                      : "Free currency earned by playing. Used in the Military Point Shop for weapons and items without spending real money."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick links grid ── */}
          <section style={{ marginBottom: 80 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              {isAr ? "اكتشف المزيد" : "Explore the Wiki"}
            </span>
            <h2 style={{
              fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
              fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
              color: "#fff", margin: "0 0 28px", letterSpacing: "-0.02em",
            }}>
              {isAr ? "كل ما تحتاجه في مكان واحد" : "Everything in One Place"}
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}>
              {[
                { label: isAr ? "الأسلحة" : "Weapons", href: "/weapons", icon: Crosshair, desc: isAr ? "قاعدة بيانات شاملة" : "Full stats database" },
                { label: isAr ? "الخرائط" : "Maps", href: "/maps", icon: Map, desc: isAr ? "كل الخرائط" : "All official maps" },
                { label: isAr ? "الرتب" : "Ranks", href: "/ranks", icon: Trophy, desc: isAr ? "نظام التطور" : "Progression system" },
                { label: isAr ? "الشخصيات" : "Mercenaries", href: "/mercenaries", icon: Users, desc: isAr ? "جميع الشخصيات" : "All operatives" },
                { label: isAr ? "الأوضاع" : "Modes", href: "/modes", icon: Gamepad2, desc: isAr ? "أوضاع اللعب" : "Game modes guide" },
                { label: isAr ? "التنزيل" : "Download", href: "/download", icon: Download, desc: isAr ? "تحميل اللعبة" : "Get CrossFire" },
              ].map(({ label, href, icon: Icon, desc }) => (
                <Link key={href} href={href} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: 12, padding: 20,
                    cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = `rgba(212,160,23,0.4)`;
                      el.style.background = "#161616";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = BORDER;
                      el.style.background = CARD;
                    }}>
                    <Icon size={20} color={ACCENT} strokeWidth={1.5} style={{ marginBottom: 12 }} />
                    <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: "#fff", margin: "0 0 4px" }}>{label}</p>
                    <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Community ── */}
          <section>
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: "40px 36px",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24,
            }}>
              <div>
                <Globe2 size={32} color={ACCENT} strokeWidth={1.5} style={{ marginBottom: 16 }} />
                <h2 style={{
                  fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700,
                  fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                  color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em",
                }}>
                  {isAr ? "انضم للمجتمع" : "Join the Community"}
                </h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 480, lineHeight: 1.7, fontFamily: "Inter, system-ui, sans-serif" }}>
                  {isAr
                    ? "تواصل مع مجتمع لاعبي CrossFire عبر منصاتنا الاجتماعية، وتابع الأخبار والفعاليات والتحديثات الجديدة."
                    : "Connect with the CrossFire community through our social channels and follow news, events, and community updates."}
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {SOCIALS.map(({ href, icon: Icon, label, color }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 18px",
                      background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                      borderRadius: 8, color: "#fff",
                      fontWeight: 500, fontSize: 13, textDecoration: "none",
                      fontFamily: "Inter, system-ui, sans-serif",
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = `${color}66`;
                      el.style.background = `${color}18`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = BORDER;
                      el.style.background = "rgba(255,255,255,0.05)";
                    }}>
                    <Icon size={16} color={color} />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
