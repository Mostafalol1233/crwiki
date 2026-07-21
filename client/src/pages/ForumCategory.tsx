import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, MessageSquare, Eye, Clock, Pin, Plus, ArrowLeft, Lock, MessageCircle, Crosshair, Brain, UserCog, Trophy, HelpCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumCategories, getForumThreads } from "@/lib/supabaseApi";

const ACCENT = "#f5a623";

function timeAgo(dateStr: string, isAr: boolean): string {
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
  id: string;
  categoryId: string;
  title: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  lastReplyAt: string;
  createdAt: string;
}

interface Category {
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
    }).catch(() => {
      setLocation("/forum");
    }).finally(() => setLoading(false));
  }, [categorySlug, page]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="h-8 w-48 rounded animate-pulse mb-6" style={{ background: "var(--card)" }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-20 rounded-lg animate-pulse mb-3" style={{ background: "var(--card)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) return null;

  const catName = isAr && category.nameAr ? category.nameAr : category.name;
  const catDesc = isAr && category.descriptionAr ? category.descriptionAr : category.description;

  return (
    <>
      <PageSEO
        title={`${catName} — CrossFire Forum`}
        description={catDesc}
        canonicalPath={`/forum/${categorySlug}`}
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Category Header */}
        <div className="py-10" style={{ background: "var(--card)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs mb-5" style={{ color: "#555" }}>
              <Link href="/forum" style={{ color: "#555", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                {isAr ? "المنتدى" : "Forum"}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span style={{ color: "var(--foreground)" }}>{catName}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded flex-shrink-0"
                style={{ background: `${category.color}18`, border: `1px solid ${category.color}30` }}>
                {(() => {
                  const icons: Record<string, React.ComponentType<any>> = {
                    general: MessageCircle, weapons: Crosshair, strategies: Brain,
                    mercenaries: UserCog, events: Trophy, help: HelpCircle,
                  };
                  const Icon = icons[categorySlug] || MessageSquare;
                  return <Icon className="h-6 w-6" style={{ color: category.color }} />;
                })()}
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>{catName}</h1>
                <p className="text-sm mt-1" style={{ color: "#555" }}>{catDesc}</p>
                <div className="flex gap-5 mt-2">
                  <span className="text-xs" style={{ color: "#555" }}>
                    <span style={{ color: category.color, fontWeight: 700 }}>{total}</span> {isAr ? "موضوع" : "threads"}
                  </span>
                </div>
              </div>
              <div className="ml-auto">
                <Link href={`/forum/${categorySlug}/new`}>
                  <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded transition-all hover:brightness-110"
                    style={{ background: ACCENT, color: "#000", border: "none", cursor: "pointer" }}>
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? "موضوع جديد" : "New Thread"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Threads list */}
          {threads.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4"><MessageSquare className="h-12 w-12" style={{ color: "#333" }} /></div>
              <p className="font-bold text-sm mb-2" style={{ color: "var(--foreground)" }}>
                {isAr ? "لا توجد مواضيع بعد" : "No threads yet"}
              </p>
              <p className="text-xs mb-6" style={{ color: "#555" }}>
                {isAr ? "كن أول من يبدأ النقاش!" : "Be the first to start a discussion!"}
              </p>
              <Link href={`/forum/${categorySlug}/new`}>
                <button className="px-5 py-2.5 text-xs font-bold rounded"
                  style={{ background: ACCENT, color: "#000", border: "none", cursor: "pointer" }}>
                  {isAr ? "ابدأ موضوع" : "Start a Thread"}
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <Link key={thread.id} href={`/forum/${categorySlug}/${thread.id}`}>
                  <div className="group flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all"
                    style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,166,35,0.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}>

                    {/* Thread icon */}
                    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full"
                      style={{ background: thread.isPinned ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.05)" }}>
                      {thread.isPinned ? (
                        <Pin className="h-4 w-4" style={{ color: ACCENT }} />
                      ) : thread.isLocked ? (
                        <Lock className="h-4 w-4" style={{ color: "#555" }} />
                      ) : (
                        <MessageSquare className="h-4 w-4" style={{ color: "#555" }} />
                      )}
                    </div>

                    {/* Thread info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {thread.isPinned && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(245,166,35,0.15)", color: ACCENT }}>
                            {isAr ? "مثبت" : "Pinned"}
                          </span>
                        )}
                        {thread.isLocked && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#555" }}>
                            {isAr ? "مغلق" : "Locked"}
                          </span>
                        )}
                        <h3 className="font-semibold text-sm truncate group-hover:text-yellow-400 transition-colors"
                          style={{ color: "var(--foreground)" }}>
                          {thread.title}
                        </h3>
                      </div>
                      <div className="text-[11px]" style={{ color: "#555" }}>
                        {isAr ? "بقلم" : "by"} <span style={{ color: "#888" }}>{thread.authorName}</span>
                        {" · "}
                        <Clock className="h-3 w-3 inline mb-0.5" /> {timeAgo(thread.createdAt, isAr)}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-5 flex-shrink-0 text-center">
                      <div>
                        <div className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{thread.replyCount}</div>
                        <div className="text-[10px]" style={{ color: "#555" }}>{isAr ? "ردود" : "replies"}</div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-sm font-bold" style={{ color: "#666" }}>{thread.viewCount}</div>
                        <div className="text-[10px]" style={{ color: "#555" }}>{isAr ? "مشاهدة" : "views"}</div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="text-[11px]" style={{ color: "#555" }}>
                          {timeAgo(thread.lastReplyAt || thread.createdAt, isAr)}
                        </div>
                        <div className="text-[10px]" style={{ color: "#444" }}>{isAr ? "آخر رد" : "last reply"}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded transition-all disabled:opacity-30"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)", cursor: "pointer" }}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {isAr ? "السابق" : "Previous"}
              </button>
              <span className="flex items-center text-xs" style={{ color: "#555" }}>
                {page + 1} / {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded transition-all disabled:opacity-30"
                style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)", cursor: "pointer" }}>
                {isAr ? "التالي" : "Next"}
                <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </button>
            </div>
          )}

          {/* Back */}
          <div className="mt-8">
            <Link href="/forum" className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
              <ArrowLeft className="h-3.5 w-3.5" />
              {isAr ? "العودة إلى المنتدى" : "Back to Forum"}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
