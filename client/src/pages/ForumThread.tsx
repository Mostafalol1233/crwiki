import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Send, Loader2, User, Shield, Clock, Eye } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumThread, getForumPosts, createForumPost, incrementThreadViews } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";

const ACCENT = "#f5a623";

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

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  const hue = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},50%,25%)`, border: `1px solid hsl(${hue},40%,35%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: size * 0.35, fontWeight: 700, color: `hsl(${hue},70%,70%)` }}>
      {initials}
    </div>
  );
}

interface Post {
  id: string;
  threadId: string;
  body: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isOp: boolean;
  createdAt: string;
}

interface Thread {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryNameAr: string;
  categorySlug: string;
  title: string;
  body: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
}

export default function ForumThread({ params }: { params: { categorySlug: string; threadId: string } }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [, setLocation] = useLocation();
  const categorySlug = params?.categorySlug || "";
  const threadId = params?.threadId || "";

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [replyName, setReplyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserSession(data.session);
      if (data.session?.user) {
        const meta = data.session.user.user_metadata;
        setReplyName(meta?.username || data.session.user.email?.split("@")[0] || "");
      }
    });
  }, []);

  // Load thread and posts
  useEffect(() => {
    if (!threadId) return;
    Promise.all([
      getForumThread(threadId),
      getForumPosts(threadId),
    ]).then(([t, p]) => {
      setThread(t);
      setPosts(p);
      // Increment view count (fire and forget)
      incrementThreadViews(threadId).catch(() => {});
    }).catch(() => {
      setLocation("/forum");
    }).finally(() => setLoading(false));
  }, [threadId]);

  const submitReply = async () => {
    const body = replyBody.trim();
    const name = replyName.trim() || (isAr ? "مجهول" : "Anonymous");
    if (!body) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      await createForumPost({
        threadId,
        body,
        authorName: name,
        authorId: user?.id,
        authorAvatar: user?.user_metadata?.avatar || "",
        isOp: false,
      });
      // Refresh posts
      const updated = await getForumPosts(threadId);
      setPosts(updated);
      setReplyBody("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      setError(err.message || (isAr ? "فشل الإرسال" : "Failed to post reply"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="h-6 w-64 rounded animate-pulse mb-6" style={{ background: "var(--card)" }} />
          {[1,2,3].map(i => (
            <div key={i} className="h-40 rounded-lg animate-pulse mb-4" style={{ background: "var(--card)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!thread) return null;

  const catName = isAr && thread.categoryNameAr ? thread.categoryNameAr : thread.categoryName;
  const opPost = posts.find(p => p.isOp) || { id: "op", body: thread.body, authorName: thread.authorName, authorAvatar: "", createdAt: thread.createdAt, isOp: true };
  const replies = posts.filter(p => !p.isOp);

  return (
    <>
      <PageSEO
        title={`${thread.title} — CrossFire Forum`}
        description={thread.body.slice(0, 160)}
        canonicalPath={`/forum/${categorySlug}/${threadId}`}
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        {/* Thread header */}
        <div className="py-8" style={{ background: "var(--card)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs mb-4 flex-wrap" style={{ color: "#555" }}>
              <Link href="/forum" style={{ color: "#555", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                {isAr ? "المنتدى" : "Forum"}
              </Link>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <Link href={`/forum/${categorySlug}`} style={{ color: "#555", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                {catName}
              </Link>
              <ChevronRight className="h-3 w-3 flex-shrink-0" />
              <span style={{ color: "var(--foreground)" }} className="truncate">{thread.title}</span>
            </div>

            <h1 className="text-xl md:text-2xl font-black mb-3" style={{ color: "var(--foreground)" }}>{thread.title}</h1>

            <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: "#555" }}>
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {thread.authorName}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(thread.createdAt, isAr)}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {thread.viewCount} {isAr ? "مشاهدة" : "views"}</span>
              <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> {replies.length} {isAr ? "رد" : "replies"}</span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-3xl">
          {/* OP Post */}
          <PostCard post={opPost} isAr={isAr} isOp={true} />

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#444" }}>
                {isAr ? `${replies.length} ردود` : `${replies.length} Replies`}
              </div>
              <div className="space-y-2">
                {replies.map((post, idx) => (
                  <PostCard key={post.id} post={post} isAr={isAr} isOp={false} number={idx + 1} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />

          {/* Reply form */}
          {thread.isLocked ? (
            <div className="mt-8 p-4 rounded-lg text-center text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#555" }}>
              🔒 {isAr ? "هذا الموضوع مغلق ولا يمكن الرد عليه." : "This thread is locked. No new replies."}
            </div>
          ) : (
            <div className="mt-8 p-5 rounded-lg" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: "var(--foreground)" }}>
                {isAr ? "أضف ردك" : "Post a Reply"}
              </h3>

              {/* Name field (only if not logged in) */}
              {!userSession && (
                <div className="mb-3">
                  <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#555" }}>
                    {isAr ? "اسمك" : "Your Name"}
                  </label>
                  <input
                    type="text"
                    value={replyName}
                    onChange={e => setReplyName(e.target.value)}
                    placeholder={isAr ? "اكتب اسمك..." : "Enter your name..."}
                    dir={isAr ? "rtl" : "ltr"}
                    className="w-full text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "var(--foreground)", padding: "10px 14px" }}
                  />
                </div>
              )}

              {/* Reply body */}
              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder={isAr ? "اكتب ردك هنا..." : "Write your reply here..."}
                dir={isAr ? "rtl" : "ltr"}
                rows={5}
                disabled={submitting}
                className="w-full text-sm resize-none focus:outline-none mb-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "var(--foreground)", padding: "10px 14px" }}
              />

              {error && (
                <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>
              )}
              {success && (
                <p className="text-xs mb-3" style={{ color: "#10b981" }}>
                  {isAr ? "✓ تم إرسال ردك!" : "✓ Reply posted!"}
                </p>
              )}

              <div className="flex items-center justify-between gap-4">
                <p className="text-xs" style={{ color: "#444" }}>
                  {isAr
                    ? userSession ? `ترد بوصفك: ${replyName}` : "يمكنك الرد بدون تسجيل دخول"
                    : userSession ? `Replying as: ${replyName}` : "No login required to reply"}
                </p>
                <button
                  onClick={submitReply}
                  disabled={!replyBody.trim() || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: ACCENT, color: "#000", border: "none", cursor: "pointer" }}>
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {isAr ? "إرسال الرد" : "Post Reply"}
                </button>
              </div>
            </div>
          )}

          {/* Back */}
          <div className="mt-6">
            <Link href={`/forum/${categorySlug}`} className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: "#555", textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
              <ArrowLeft className="h-3.5 w-3.5" />
              {isAr ? `العودة إلى "${catName}"` : `Back to "${catName}"`}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function PostCard({ post, isAr, isOp, number }: { post: any; isAr: boolean; isOp: boolean; number?: number }) {
  return (
    <div className="flex gap-4 p-5 rounded-lg" style={{ background: isOp ? "rgba(245,166,35,0.04)" : "var(--card)", border: isOp ? "1px solid rgba(245,166,35,0.12)" : "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
        <Avatar name={post.authorName || "?"} />
        {isOp && (
          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded" style={{ background: "rgba(245,166,35,0.15)", color: ACCENT }}>OP</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{post.authorName}</span>
            {isOp && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: ACCENT }}>
                <Shield className="h-2.5 w-2.5" />
                {isAr ? "صاحب الموضوع" : "Thread Author"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "#444" }}>
            {number && <span>#{number}</span>}
            <span>{timeAgo(post.createdAt, isAr)}</span>
          </div>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap" dir="auto" style={{ color: "var(--foreground)", opacity: 0.9 }}>
          {post.body}
        </div>
      </div>
    </div>
  );
}
