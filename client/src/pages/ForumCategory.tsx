import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, MessageSquare, Eye, Clock, Pin, Plus, ArrowLeft, Lock } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumCategories, getForumThreads } from "@/lib/supabaseApi";

const ACCENT = "#f5a623";

const CAT_ABBR: Record<string, string> = {
  general: "GD", weapons: "WL", strategies: "ST",
  mercenaries: "MR", events: "EV", help: "HP",
};

function timeAgo(dateStr: string, isAr: boolean): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (isAr) {
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface Thread {
  id: string; categoryId: string; title: string; authorName: string;
  isPinned: boolean; isLocked: boolean; viewCount: number;
  replyCount: number; lastReplyAt: string; createdAt: string;
}

interface Category {
  id: string; name: string; nameAr: string; slug: string;
  description: string; descriptionAr: string; icon: string;
  color: string; threadCount: number; postCount: number;
}

export default function ForumCategory({ params }: { params: { categorySlug: string } }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [, setLocation] = useLocation();
  const categorySlug = params?.categorySlug || "";
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    getForumCategories().then(cats => {
      const cat = cats.find(c => c.slug === categorySlug);
      if (cat) {
        setCategory(cat);
        return getForumThreads(cat.id, { limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      }
      throw new Error("Category not found");
    }).then(result => {
      setThreads(result.items);
      setTotal(result.total);
    }).catch(() => setLocation("/forum"))
      .finally(() => setLoading(false));
  }, [categorySlug, page]);

  if (loading) {
    return (
      <div style={{ background: "var(--background)", minHeight: "100%" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ height: 32, width: 200, borderRadius: 4, background: "var(--card)", marginBottom: 24, opacity: 0.5 }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 6, background: "var(--card)", marginBottom: 8, opacity: 0.4 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) return null;

  const catName = isAr && category.nameAr ? category.nameAr : category.name;
  const catDesc = isAr && category.descriptionAr ? category.descriptionAr : category.description;
  const abbr = CAT_ABBR[categorySlug] || "??";

  return (
    <>
      <PageSEO title={`${catName} — CrossFire Forum`} description={catDesc} canonicalPath={`/forum/${categorySlug}`} />

      <div style={{ background: "var(--background)", minHeight: "100%" }}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #080808 0%, #100c00 60%, #080808 100%)",
          borderBottom: "1px solid rgba(245,166,35,0.1)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.018) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

          <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 24px", position: "relative" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, fontSize: 11, color: "#444" }}>
              <Link href="/forum" style={{ color: "#555", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                {isAr ? "المنتدى" : "Forum"}
              </Link>
              <ChevronRight style={{ width: 11, height: 11 }} />
              <span style={{ color: "var(--foreground)" }}>{catName}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Monogram badge */}
              <div style={{
                width: 48, height: 48, flexShrink: 0, borderRadius: 6,
                background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, color: "#f5a623", letterSpacing: "0.1em",
              }}>
                {abbr}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--foreground)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{catName}</h1>
                <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{catDesc}</p>
              </div>
              <Link href={`/forum/${categorySlug}/new`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", background: ACCENT, color: "#000",
                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                }}>
                  <Plus style={{ width: 13, height: 13 }} />
                  {isAr ? "موضوع جديد" : "New Thread"}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Thread list ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px" }}>

          {/* Table header */}
          {threads.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 64px 64px 100px", gap: 12, padding: "6px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#333" }}>{isAr ? "الموضوع" : "THREAD"}</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#333", textAlign: "center" }}>{isAr ? "ردود" : "REPLIES"}</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#333", textAlign: "center", display: "none" }} className="sm:block">{isAr ? "مشاهدات" : "VIEWS"}</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#333", textAlign: "right" }}>{isAr ? "آخر نشاط" : "ACTIVITY"}</span>
            </div>
          )}

          {threads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <MessageSquare style={{ width: 36, height: 36, margin: "0 auto 12px", color: "#2a2a2a" }} />
              <p style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)", marginBottom: 6 }}>
                {isAr ? "لا توجد مواضيع بعد" : "No threads yet"}
              </p>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>
                {isAr ? "كن أول من يبدأ النقاش!" : "Be the first to start a discussion!"}
              </p>
              <Link href={`/forum/${categorySlug}/new`} style={{ textDecoration: "none" }}>
                <button style={{ padding: "9px 20px", background: ACCENT, color: "#000", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {isAr ? "ابدأ موضوع" : "Start a Thread"}
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {threads.map((thread, i) => (
                <Link key={thread.id} href={`/forum/${categorySlug}/${thread.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 64px 64px 100px",
                      gap: 12,
                      alignItems: "center",
                      padding: "13px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.15s",
                      cursor: "pointer",
                      borderRadius: i === 0 ? "4px 4px 0 0" : i === threads.length - 1 ? "0 0 4px 4px" : 0,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(245,166,35,0.03)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {/* Thread info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {thread.isPinned && (
                          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", padding: "2px 6px", background: "rgba(245,166,35,0.12)", color: ACCENT, borderRadius: 2 }}>
                            {isAr ? "مثبت" : "PIN"}
                          </span>
                        )}
                        {thread.isLocked && (
                          <Lock style={{ width: 10, height: 10, color: "#444", flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {thread.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#444" }}>
                        <Clock style={{ width: 10, height: 10, display: "inline", marginBottom: 1 }} />
                        {" "}{isAr ? "بقلم" : "by"}{" "}
                        <span style={{ color: "#666" }}>{thread.authorName}</span>
                        {" · "}{timeAgo(thread.createdAt, isAr)}
                      </div>
                    </div>

                    {/* Replies */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: thread.replyCount > 0 ? "var(--foreground)" : "#333" }}>{thread.replyCount}</div>
                    </div>

                    {/* Views */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, color: "#555" }}>{thread.viewCount}</div>
                    </div>

                    {/* Last activity */}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#444" }}>{timeAgo(thread.lastReplyAt || thread.createdAt, isAr)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "var(--foreground)", cursor: "pointer", opacity: page === 0 ? 0.3 : 1 }}>
                <ArrowLeft style={{ width: 13, height: 13 }} />
                {isAr ? "السابق" : "Prev"}
              </button>
              <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#555" }}>
                {page + 1} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "var(--foreground)", cursor: "pointer", opacity: (page + 1) * PAGE_SIZE >= total ? 0.3 : 1 }}>
                {isAr ? "التالي" : "Next"}
                <ArrowLeft style={{ width: 13, height: 13, transform: "rotate(180deg)" }} />
              </button>
            </div>
          )}

          {/* Back */}
          <div style={{ marginTop: 28 }}>
            <Link href="/forum" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555", textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
              <ArrowLeft style={{ width: 13, height: 13 }} />
              {isAr ? "العودة إلى المنتدى" : "Back to Forum"}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
