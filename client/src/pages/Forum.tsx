import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MessageSquare, Users, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumCategories } from "@/lib/supabaseApi";

const ACCENT = "#f5a623";

/* Category short labels — no SVG icons, just bold letters */
const CAT_ABBR: Record<string, string> = {
  general: "GD",
  weapons: "WL",
  strategies: "ST",
  mercenaries: "MR",
  events: "EV",
  help: "HP",
};

interface ForumCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  threadCount: number;
  postCount: number;
}

export default function Forum() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getForumCategories()
      .then(setCategories)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const totalThreads = categories.reduce((s, c) => s + c.threadCount, 0);
  const totalPosts = categories.reduce((s, c) => s + c.postCount, 0);

  return (
    <>
      <style>{`
        @keyframes forumFadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .forum-cat { animation: forumFadeIn 0.35s ease forwards; }
        .forum-cat:hover .forum-cat-abbr { color: #f5a623; }
        .forum-cat:hover .forum-cat-arrow { opacity: 1; transform: translateX(3px); }
        .forum-cat-arrow { opacity: 0; transition: opacity 0.2s, transform 0.2s; }
      `}</style>

      <PageSEO
        title={isAr ? "منتدى المجتمع — CrossFire Wiki" : "Community Forum — CrossFire Wiki"}
        description={isAr ? "انضم إلى مجتمع CrossFire — ناقش الأسلحة والاستراتيجيات والفعاليات مع لاعبين من كل مكان." : "Join the CrossFire community — discuss weapons, strategies, events and more with players worldwide."}
        canonicalPath="/forum"
      />

      <div style={{ background: "var(--background)", minHeight: "100%" }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #080808 0%, #100c00 60%, #080808 100%)",
          borderBottom: "1px solid rgba(245,166,35,0.12)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.02) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 900, margin: "0 auto", padding: "44px 24px 36px", position: "relative", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 2, marginBottom: 16 }}>
              <MessageSquare style={{ width: 11, height: 11, color: ACCENT }} />
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: ACCENT }}>
                {isAr ? "مجتمع اللاعبين" : "Player Community"}
              </span>
            </div>

            <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, color: "var(--foreground)", margin: "0 0 12px" }}>
              CrossFire{" "}
              <span style={{ color: ACCENT }}>Forum</span>
            </h1>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>
              {isAr ? "ناقش، اسأل، شارك مع لاعبين من كل مكان" : "Discuss, ask and share with CrossFire players worldwide"}
            </p>

            {/* Start Discussion CTA */}
            <Link href="/forum/new" style={{ textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
              <button style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px",
                background: ACCENT, color: "#000",
                border: "none", borderRadius: 6,
                fontSize: 13, fontWeight: 800,
                cursor: "pointer", letterSpacing: "0.02em",
                boxShadow: "0 4px 16px rgba(245,166,35,0.3)",
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
              >
                <MessageSquare style={{ width: 14, height: 14 }} />
                {isAr ? "ابدأ نقاشاً جديداً" : "Start a Discussion"}
              </button>
            </Link>

            {/* Stats bar */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden" }}>
              {[
                { icon: MessageSquare, label: isAr ? "موضوع" : "Threads", value: totalThreads },
                { icon: Users, label: isAr ? "ردود" : "Posts", value: totalPosts },
                { icon: TrendingUp, label: isAr ? "تصنيفات" : "Categories", value: categories.length },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={label} style={{ padding: "12px 24px", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Categories ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 20px" }}>

          {/* Section label */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "#333" }}>
              {isAr ? "التصنيفات" : "CATEGORIES"}
            </span>
            <div style={{ height: 1, flex: 1, background: "rgba(255,255,255,0.05)" }} />
          </div>

          {error && (
            <div style={{ marginBottom: 24, padding: "14px 18px", borderRadius: 6, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", fontSize: 13 }}>
              {isAr ? "تعذّر تحميل الفئات." : "Failed to load categories."}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: 100, borderRadius: 6, background: "var(--card)", animation: "pulse 1.5s ease-in-out infinite", opacity: 0.5 }} />
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && categories.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {categories.map((cat, idx) => (
                <Link key={cat.id} href={`/forum/${cat.slug}`} style={{ textDecoration: "none" }}>
                  <div
                    className="forum-cat"
                    style={{
                      animationDelay: `${idx * 0.05}s`,
                      padding: "18px 20px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      transition: "background 0.18s, border-color 0.18s",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(245,166,35,0.04)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.18)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                    }}
                  >
                    {/* Top row: abbr label + arrow */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <span className="forum-cat-abbr" style={{
                        fontSize: 11, fontWeight: 900, letterSpacing: "0.2em",
                        color: "#333", textTransform: "uppercase", transition: "color 0.18s",
                      }}>
                        {CAT_ABBR[cat.slug] || "—"}
                      </span>
                      <ChevronRight className="forum-cat-arrow" style={{ width: 14, height: 14, color: ACCENT }} />
                    </div>

                    {/* Name */}
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--foreground)", margin: "0 0 5px", letterSpacing: "-0.01em" }}>
                      {isAr && cat.nameAr ? cat.nameAr : cat.name}
                    </h3>

                    {/* Description */}
                    <p style={{ fontSize: 11, color: "#555", margin: "0 0 14px", lineHeight: 1.5 }}>
                      {isAr && cat.descriptionAr ? cat.descriptionAr : cat.description}
                    </p>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 16, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: 11, color: "#444" }}>
                        <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{cat.threadCount}</span>
                        {" "}{isAr ? "موضوع" : "threads"}
                      </span>
                      <span style={{ fontSize: 11, color: "#444" }}>
                        <span style={{ color: "#666", fontWeight: 700 }}>{cat.postCount}</span>
                        {" "}{isAr ? "رد" : "posts"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && categories.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#444" }}>
              <MessageSquare style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>No categories found.</p>
            </div>
          )}

          {/* ── AI CTA ─────────────────────────────────────────────── */}
          <div style={{
            marginTop: 32, padding: "20px 24px",
            background: "linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(245,166,35,0.02) 100%)",
            border: "1px solid rgba(245,166,35,0.12)", borderRadius: 6,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 40, height: 40, flexShrink: 0, borderRadius: "50%",
              background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles style={{ width: 18, height: 18, color: ACCENT }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 3 }}>
                {isAr ? "مش لاقي إجابة؟ اسأل الذكاء الاصطناعي!" : "Can't find an answer? Ask the AI!"}
              </div>
              <div style={{ fontSize: 11, color: "#555" }}>
                {isAr ? "المساعد الذكي يعرف كل حاجة عن CrossFire — أسلحة، رتب، مرتزقة، وأكتر." : "Our AI knows everything about CrossFire — weapons, ranks, mercenaries and more."}
              </div>
            </div>
            <Link href="/ai" style={{ textDecoration: "none", flexShrink: 0 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", background: ACCENT, color: "#000",
                border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
                <Sparkles style={{ width: 12, height: 12 }} />
                {isAr ? "اسأل الذكاء الاصطناعي" : "Ask AI"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
