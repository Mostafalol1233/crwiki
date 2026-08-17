import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Send, Loader2, Shield, Clock, Eye, Lock } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumThread, getForumPosts, createForumPost, incrementThreadViews, getMercenaries } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";

const ACCENT = "#f5a623";

/* ── Mercenary avatar pool ─────────────────────────────────────────────── */
// Will be populated from Supabase — deterministically assigned per author
let _mercPool: { name: string; image: string }[] = [];

function getMercForAuthor(authorName: string): { name: string; image: string } | null {
  if (!_mercPool.length) return null;
  const hash = authorName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return _mercPool[hash % _mercPool.length];
}

function MercAvatar({ authorName, size = 42 }: { authorName: string; size?: number }) {
  const merc = getMercForAuthor(authorName);
  const initials = (authorName || "?").slice(0, 2).toUpperCase();
  const hue = (authorName || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  if (merc?.image) {
    return (
      <div style={{
        width: size, height: size, flexShrink: 0, borderRadius: "50%",
        overflow: "hidden", border: "1.5px solid rgba(245,166,35,0.3)",
        background: "#0a0a0a", boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      }}>
        <img
          src={merc.image}
          alt={merc.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          onError={e => {
            // Fallback to initials if image fails
            const el = e.currentTarget.parentElement as HTMLElement;
            if (el) {
              el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:hsl(${hue},45%,20%);font-size:${size * 0.33}px;font-weight:700;color:hsl(${hue},70%,65%)">${initials}</div>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, flexShrink: 0, borderRadius: "50%",
      background: `hsl(${hue},45%,20%)`, border: `1.5px solid hsl(${hue},40%,30%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: `hsl(${hue},70%,65%)`,
      boxShadow: "0 0 10px rgba(0,0,0,0.4)",
    }}>
      {initials}
    </div>
  );
}

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

interface Post {
  id: string; threadId: string; body: string;
  authorId: string; authorName: string; authorAvatar: string;
  isOp: boolean; createdAt: string;
}

interface Thread {
  id: string; categoryId: string; categoryName: string;
  categoryNameAr: string; categorySlug: string; title: string; body: string;
  authorName: string; isPinned: boolean; isLocked: boolean;
  viewCount: number; replyCount: number; createdAt: string;
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
  const [mercReady, setMercReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load mercs for avatars
  useEffect(() => {
    if (_mercPool.length) { setMercReady(true); return; }
    getMercenaries().then(mercs => {
      _mercPool = mercs
        .filter((m: any) => m.image || m.image_url)
        .map((m: any) => ({ name: m.name, image: m.image || m.image_url || "" }));
      setMercReady(true);
    }).catch(() => setMercReady(true));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const data = result?.data;
      setUserSession(data?.session);
      if (data?.session?.user) {
        const meta = data.session.user.user_metadata;
        setReplyName(meta?.username || data.session.user.email?.split("@")[0] || "");
      }
    });
  }, []);

  useEffect(() => {
    if (!threadId) return;
    Promise.all([getForumThread(threadId), getForumPosts(threadId)]).then(([t, p]) => {
      setThread(t);
      setPosts(p);
      incrementThreadViews(threadId).catch(() => {});
    }).catch(() => setLocation("/forum"))
      .finally(() => setLoading(false));
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
      await createForumPost({ threadId, body, authorName: name, authorId: user?.id, authorAvatar: user?.user_metadata?.avatar || "", isOp: false });
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
      <div style={{ background: "var(--background)", minHeight: "100%" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px" }}>
          {[200, 180, 160].map((w, i) => (
            <div key={i} style={{ height: i === 0 ? 120 : 80, borderRadius: 6, background: "var(--card)", marginBottom: 10, opacity: 0.4 }} />
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
      <style>{`
        @keyframes postIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .post-card { animation: postIn 0.3s ease forwards; }
      `}</style>

      <PageSEO title={`${thread.title} — CrossFire Forum`} description={thread.body.slice(0, 160)} canonicalPath={`/forum/${categorySlug}/${threadId}`} />

      <div style={{ background: "var(--background)", minHeight: "100%" }}>

        {/* ── Thread header bar ─────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #080808 0%, #100c00 60%, #080808 100%)",
          borderBottom: "1px solid rgba(245,166,35,0.1)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.015) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

          <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px", position: "relative" }}>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 11, color: "#444", flexWrap: "wrap" }}>
              <Link href="/forum" style={{ color: "#555", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                {isAr ? "المنتدى" : "Forum"}
              </Link>
              <ChevronRight style={{ width: 11, height: 11 }} />
              <Link href={`/forum/${categorySlug}`} style={{ color: "#555", textDecoration: "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
                {catName}
              </Link>
              <ChevronRight style={{ width: 11, height: 11 }} />
              <span style={{ color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{thread.title}</span>
            </div>

            {thread.isLocked && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 3, marginBottom: 10, fontSize: 10, color: "#555" }}>
                <Lock style={{ width: 10, height: 10 }} />
                {isAr ? "هذا الموضوع مغلق" : "Thread locked"}
              </div>
            )}

            <h1 style={{ fontSize: "clamp(17px,3vw,22px)", fontWeight: 900, color: "var(--foreground)", margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              {thread.title}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: "#555" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 11, height: 11 }} /> {timeAgo(thread.createdAt, isAr)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Eye style={{ width: 11, height: 11 }} /> {thread.viewCount} {isAr ? "مشاهدة" : "views"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ChevronRight style={{ width: 11, height: 11 }} /> {replies.length} {isAr ? "رد" : "replies"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Posts ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px" }}>

          {/* OP post */}
          <PostCard post={opPost} isAr={isAr} isOp={true} mercReady={mercReady} />

          {/* Replies */}
          {replies.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#2a2a2a", padding: "12px 0 8px" }}>
                {isAr ? `${replies.length} ردود` : `${replies.length} REPLIES`}
              </div>
              <div>
                {replies.map((post, idx) => (
                  <PostCard key={post.id} post={post} isAr={isAr} isOp={false} number={idx + 1} mercReady={mercReady} style={{ animationDelay: `${idx * 0.04}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />

          {/* ── Reply form ────────────────────────────────────────── */}
          {thread.isLocked ? (
            <div style={{ marginTop: 24, padding: "14px 18px", borderRadius: 6, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", color: "#444", fontSize: 12, textAlign: "center" }}>
              {isAr ? "هذا الموضوع مغلق ولا يمكن الرد عليه." : "This thread is locked. No new replies."}
            </div>
          ) : (
            <div style={{ marginTop: 24, padding: "20px 22px", borderRadius: 6, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: "var(--foreground)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isAr ? "أضف ردك" : "Post a Reply"}
              </h3>

              {!userSession && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#444", marginBottom: 6 }}>
                    {isAr ? "اسمك" : "Your Name"}
                  </label>
                  <input
                    type="text"
                    value={replyName}
                    onChange={e => setReplyName(e.target.value)}
                    placeholder={isAr ? "اكتب اسمك..." : "Enter your name..."}
                    dir={isAr ? "rtl" : "ltr"}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "var(--foreground)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              )}

              <textarea
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder={isAr ? "اكتب ردك هنا..." : "Write your reply here..."}
                dir={isAr ? "rtl" : "ltr"}
                rows={5}
                disabled={submitting}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "var(--foreground)", fontSize: 13, resize: "none", outline: "none", boxSizing: "border-box", marginBottom: 12, fontFamily: "inherit" }}
              />

              {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>}
              {success && <p style={{ fontSize: 12, color: "#22c55e", marginBottom: 10 }}>{isAr ? "تم إرسال ردك." : "Reply posted."}</p>}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={{ fontSize: 11, color: "#3a3a3a" }}>
                  {userSession ? (isAr ? `ترد بوصفك: ${replyName}` : `Replying as: ${replyName}`) : (isAr ? "يمكنك الرد بدون تسجيل دخول" : "No login required")}
                </p>
                <button
                  onClick={submitReply}
                  disabled={!replyBody.trim() || submitting}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "9px 20px", background: !replyBody.trim() || submitting ? "rgba(245,166,35,0.3)" : ACCENT,
                    color: "#000", border: "none", borderRadius: 6,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    opacity: !replyBody.trim() || submitting ? 0.5 : 1,
                  }}>
                  {submitting ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 14, height: 14 }} />}
                  {isAr ? "إرسال الرد" : "Post Reply"}
                </button>
              </div>
            </div>
          )}

          {/* Back link */}
          <div style={{ marginTop: 20 }}>
            <Link href={`/forum/${categorySlug}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555", textDecoration: "none" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = ACCENT; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#555"; }}>
              <ArrowLeft style={{ width: 13, height: 13 }} />
              {isAr ? `العودة إلى "${catName}"` : `Back to "${catName}"`}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Post card component ──────────────────────────────────────────────── */
function PostCard({ post, isAr, isOp, number, mercReady, style: extraStyle }: {
  post: any; isAr: boolean; isOp: boolean; number?: number; mercReady: boolean; style?: React.CSSProperties;
}) {
  return (
    <div
      className="post-card"
      style={{
        display: "flex",
        gap: 0,
        marginBottom: isOp ? 4 : 2,
        borderRadius: 6,
        overflow: "hidden",
        border: isOp ? "1px solid rgba(245,166,35,0.14)" : "1px solid rgba(255,255,255,0.05)",
        background: isOp ? "rgba(245,166,35,0.025)" : "rgba(255,255,255,0.015)",
        ...extraStyle,
      }}
    >
      {/* Author sidebar */}
      <div style={{
        width: 72, flexShrink: 0,
        background: isOp ? "rgba(245,166,35,0.04)" : "rgba(255,255,255,0.02)",
        borderRight: isOp ? "1px solid rgba(245,166,35,0.1)" : "1px solid rgba(255,255,255,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "18px 8px 14px", gap: 6,
      }}>
        <MercAvatar authorName={post.authorName || "?"} size={42} />
        <div style={{ fontSize: 10, fontWeight: 700, color: isOp ? ACCENT : "#666", textAlign: "center", wordBreak: "break-word", lineHeight: 1.3 }}>
          {(post.authorName || "?").slice(0, 12)}
        </div>
        {isOp && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", background: "rgba(245,166,35,0.12)", borderRadius: 2 }}>
            <Shield style={{ width: 8, height: 8, color: ACCENT }} />
            <span style={{ fontSize: 8, fontWeight: 900, color: ACCENT, letterSpacing: "0.1em" }}>OP</span>
          </div>
        )}
        {number && !isOp && (
          <span style={{ fontSize: 9, color: "#333", fontWeight: 700 }}>#{number}</span>
        )}
      </div>

      {/* Post content */}
      <div style={{ flex: 1, minWidth: 0, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isOp ? "var(--foreground)" : "#ccc" }}>{post.authorName}</span>
            {isOp && (
              <span style={{ fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {isAr ? "صاحب الموضوع" : "Thread Author"}
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: "#3a3a3a" }}>{timeAgo(post.createdAt, isAr)}</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: isOp ? "var(--foreground)" : "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap", wordBreak: "break-word" }} dir="auto">
          {post.body}
        </div>
      </div>
    </div>
  );
}
