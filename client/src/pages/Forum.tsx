import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  MessageSquare, Users, TrendingUp, Sparkles, Bot, ChevronRight,
  MessageCircle, Crosshair, Brain, UserCog, Trophy, HelpCircle
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumCategories } from "@/lib/supabaseApi";

const ACCENT = "#f5a623";

// Map category slugs to Lucide icons
const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  general: MessageCircle,
  weapons: Crosshair,
  strategies: Brain,
  mercenaries: UserCog,
  events: Trophy,
  help: HelpCircle,
};

function CategoryIcon({ slug, color }: { slug: string; color: string }) {
  const Icon = CATEGORY_ICONS[slug] || MessageSquare;
  return (
    <div
      className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <Icon className="h-5 w-5" style={{ color }} />
    </div>
  );
}

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
      <PageSEO
        title={isAr ? "منتدى المجتمع — CrossFire Wiki" : "Community Forum — CrossFire Wiki"}
        description={isAr ? "انضم إلى مجتمع CrossFire — ناقش الأسلحة والاستراتيجيات والفعاليات مع لاعبين من كل مكان." : "Join the CrossFire community — discuss weapons, strategies, events and more with players worldwide."}
        canonicalPath="/forum"
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Hero */}
        <div className="relative py-16 text-center overflow-hidden" style={{ background: "linear-gradient(to bottom, hsl(var(--card)) 0%, hsl(var(--background)) 100%)", borderBottom: "1px solid rgba(245,166,35,0.12)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 70%)" }} />
          <div className="relative container mx-auto px-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 2 }}>
              <MessageSquare className="h-3.5 w-3.5" style={{ color: ACCENT }} />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
                {isAr ? "مجتمع اللاعبين" : "Player Community"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3" style={{ color: "var(--foreground)" }}>
              {isAr ? (
                <><span style={{ color: ACCENT }}>منتدى</span> CrossFire</>
              ) : (
                <>CrossFire <span style={{ color: ACCENT }}>Forum</span></>
              )}
            </h1>
            <p className="text-sm mb-8" style={{ color: "#666" }}>
              {isAr ? "ناقش، اسأل، شارك — مع لاعبين من كل مكان" : "Discuss, ask, share — with players from everywhere"}
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8">
              {[
                { icon: MessageSquare, label: isAr ? "موضوع" : "Threads", value: totalThreads },
                { icon: Users, label: isAr ? "ردود" : "Posts", value: totalPosts },
                { icon: TrendingUp, label: isAr ? "تصنيفات" : "Categories", value: categories.length },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-black" style={{ color: ACCENT }}>{value.toLocaleString()}</div>
                  <div className="text-[11px] uppercase tracking-widest mt-0.5" style={{ color: "#555" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-5xl">
          {/* Error state */}
          {error && (
            <div className="mb-8 p-5 rounded-lg text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-sm" style={{ color: "#ef4444" }}>
                {isAr ? "تعذّر تحميل الفئات. تأكد من إعداد الجداول في Supabase." : "Failed to load categories. Check your Supabase setup."}
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-32 rounded-lg animate-pulse" style={{ background: "var(--card)" }} />
              ))}
            </div>
          )}

          {/* Category Grid */}
          {!loading && categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/forum/${cat.slug}`}>
                  <div className="group p-5 rounded-lg cursor-pointer transition-all duration-200 hover:translate-y-[-2px]"
                    style={{
                      background: "var(--card)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderLeft: `3px solid ${cat.color}`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = cat.color; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}>
                    <div className="flex items-start gap-4">
                      <CategoryIcon slug={cat.slug} color={cat.color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                            {isAr && cat.nameAr ? cat.nameAr : cat.name}
                          </h3>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "#444" }} />
                        </div>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: "#666" }}>
                          {isAr && cat.descriptionAr ? cat.descriptionAr : cat.description}
                        </p>
                        <div className="flex gap-4">
                          <span className="text-[11px]" style={{ color: "#555" }}>
                            <span style={{ color: cat.color, fontWeight: 700 }}>{cat.threadCount}</span> {isAr ? "موضوع" : "threads"}
                          </span>
                          <span className="text-[11px]" style={{ color: "#555" }}>
                            <span style={{ color: "#888", fontWeight: 700 }}>{cat.postCount}</span> {isAr ? "رد" : "posts"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && categories.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" style={{ color: "#333" }} />
              <p className="text-sm" style={{ color: "#555" }}>No categories found.</p>
            </div>
          )}

          {/* AI Assistant CTA */}
          <div className="mt-10 p-6 rounded-lg flex items-center gap-5" style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(245,166,35,0.02) 100%)", border: "1px solid rgba(245,166,35,0.15)" }}>
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 rounded-full" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}>
              <Bot className="h-6 w-6" style={{ color: ACCENT }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                {isAr ? "مش لاقي إجابة؟ اسأل الذكاء الاصطناعي!" : "Can't find an answer? Ask the AI!"}
              </h3>
              <p className="text-xs" style={{ color: "#555" }}>
                {isAr ? "المساعد الذكي يعرف كل حاجة عن CrossFire — أسلحة، رتب، مرتزقة، وأكتر." : "Our AI assistant knows everything about CrossFire — weapons, ranks, mercenaries, and more."}
              </p>
            </div>
            <Link href="/ai">
              <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded transition-all hover:brightness-110 flex-shrink-0"
                style={{ background: ACCENT, color: "#000", border: "none", cursor: "pointer" }}>
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "اسأل الذكاء الاصطناعي" : "Ask AI"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
