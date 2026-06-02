import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Calendar, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Send, Trash2 } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { queryClient } from "@/lib/queryClient";
import { getEventBySlug, getComments, addComment } from "@/lib/supabaseApi";
import { useToast } from "@/hooks/use-toast";
import RawHtmlPreview from "@/components/RawHtmlPreview";

interface Event {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  date: string;
  type?: "upcoming" | "trending";
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  twitterImage?: string;
  schemaType?: string;
  event_name_slug?: string;
}

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

const GOLD = "#9a7c3f";
const GOLD_BORDER = "rgba(154,124,63,0.3)";

function CommentAvatar({ name }: { name: string }) {
  const colors = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f39c12","#1abc9c","#e67e22"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ background: color }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentReactions({ commentId, likes, onLike }: { commentId: string; likes?: number; onLike?: (id: string) => void }) {
  const [localLikes, setLocalLikes] = useState(likes ?? 0);
  const [localDislikes, setLocalDislikes] = useState(0);
  const [voted, setVoted] = useState<"like" | "dislike" | null>(null);

  const handleVote = (type: "like" | "dislike") => {
    if (voted === type) {
      if (type === "like") setLocalLikes((v) => Math.max(0, v - 1));
      else setLocalDislikes((v) => Math.max(0, v - 1));
      setVoted(null);
    } else {
      if (voted === "like") setLocalLikes((v) => Math.max(0, v - 1));
      if (voted === "dislike") setLocalDislikes((v) => Math.max(0, v - 1));
      if (type === "like") { setLocalLikes((v) => v + 1); onLike?.(commentId); }
      else setLocalDislikes((v) => v + 1);
      setVoted(type);
    }
  };

  return (
    <div className="flex items-center gap-4 mt-3">
      <button
        onClick={() => handleVote("like")}
        className="flex items-center gap-1 text-[11px] transition-colors"
        style={{ color: voted === "like" ? GOLD : "hsl(var(--muted-foreground))", fontFamily: "'EB Garamond', serif" }}
      >
        <ThumbsUp className="h-3 w-3" /> {localLikes > 0 ? localLikes : ""} Like
      </button>
      <button
        onClick={() => handleVote("dislike")}
        className="flex items-center gap-1 text-[11px] transition-colors"
        style={{ color: voted === "dislike" ? "#ef4444" : "hsl(var(--muted-foreground))", fontFamily: "'EB Garamond', serif" }}
      >
        <ThumbsDown className="h-3 w-3" /> {localDislikes > 0 ? localDislikes : ""} Dislike
      </button>
    </div>
  );
}

export default function EventDetail() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const legacyId = params?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { toast } = useToast();

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [newComment, setNewComment] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentEmail, setNewCommentEmail] = useState("");
  const [contentLanguage, setContentLanguage] = useState<"en" | "ar" | null>(null);
  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));

  const { data: event, isLoading, isError } = useQuery<Event>({
    queryKey: ["event", slug || legacyId],
    enabled: !!(slug || legacyId),
    retry: 1,
    queryFn: async () => {
      if (slug) return getEventBySlug(slug);
      if (!legacyId) throw new Error("No event ID or slug provided");
      const { getEvents } = await import("@/lib/supabaseApi");
      const { items } = await getEvents({ limit: 200 });
      const found = items.find((e: any) => e.id === legacyId);
      if (!found) throw new Error("Event not found");
      return found;
    },
  });

  const { data: rawComments } = useQuery({
    queryKey: ["/api/events", event?.id, "comments"],
    enabled: !!event?.id,
    queryFn: () => getComments(event!.id),
  });

  const comments = useMemo(() => {
    const arr = Array.isArray(rawComments) ? rawComments : [];
    const seen = new Set<string>();
    return arr
      .map((c: any) => ({ ...c, id: String(c?.id || c?._id || "").trim() }))
      .filter((c: any) => c.id && c.id !== "undefined")
      .filter((c: any) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
  }, [rawComments]);

  const addCommentMutation = useMutation({
    mutationFn: async (data: { author: string; content: string; email?: string }) => {
      return await addComment({ postId: event!.id, postType: "event", content: data.content, authorName: data.author });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      setNewComment("");
      setNewCommentAuthor("");
      setNewCommentEmail("");
      toast({ title: "Comment posted!" });
    },
    onError: (err: any) => toast({ title: "Failed to post", description: err.message, variant: "destructive" }),
  });

  const isAdminUser = !!(typeof window !== "undefined" && localStorage.getItem("adminToken"));

  const likeCommentMutation = useMutation({
    mutationFn: async (_id: string) => {},
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (legacyId && event?.event_name_slug) {
      const slugUrl = `/events/${event.event_name_slug}`;
      if (typeof window !== "undefined" && window.location.pathname !== slugUrl) {
        setLocation(slugUrl);
      }
    }
  }, [legacyId, event?.event_name_slug, setLocation]);

  const preferredArabic = language === "ar";
  const hasArabicVersion = Boolean((event?.titleAr && event.titleAr.trim()) || (event?.descriptionAr && event.descriptionAr.trim()));
  const resolvedContentLanguage = contentLanguage || (preferredArabic && hasArabicVersion ? "ar" : "en");
  const useArabicContent = resolvedContentLanguage === "ar" && hasArabicVersion;
  const title = useArabicContent ? event?.titleAr || event?.title || "" : event?.title || event?.titleAr || "";
  const description = useArabicContent ? event?.descriptionAr || event?.description || "" : event?.description || event?.descriptionAr || "";

  const rawDescription = useMemo(() => {
    if (!description) return "";
    const doc = new DOMParser().parseFromString(description, "text/html");
    doc.querySelectorAll("h2, h3, h4").forEach((h, i) => { h.id = `event-heading-${i}`; });
    return doc.body.innerHTML;
  }, [description]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.3em", color: GOLD }}>LOADING EVENT…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="text-center">
          <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 300, fontSize: "1.4rem", letterSpacing: "0.12em", color: "hsl(var(--foreground))", marginBottom: "20px" }}>
            Event Not Found
          </h2>
          <button
            onClick={() => setLocation("/")}
            style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.18em", padding: "10px 20px", border: `1px solid ${GOLD_BORDER}`, color: GOLD, background: "transparent", cursor: "pointer" }}
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    );
  }

  const firstImageMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(description || "");
  const descriptionImage = firstImageMatch ? firstImageMatch[1] : undefined;
  const seoImage = event.ogImage || event.image || descriptionImage;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventSlug = event.event_name_slug || slug || legacyId;
  const eventUrl = `${baseUrl}/events/${eventSlug}`;

  return (
    <>
      <SEOHead
        title={event.seoTitle || `${title} | CrossFire Wiki`}
        description={event.seoDescription || stripHtml(description).substring(0, 155) || ""}
        keywords={event.seoKeywords || [event.type || "event", "crossfire event"]}
        canonicalUrl={event.canonicalUrl || eventUrl}
        ogImage={seoImage}
        twitterImage={event.twitterImage || seoImage}
        ogTitle={event.seoTitle || title}
        ogDescription={event.seoDescription || stripHtml(description).substring(0, 155) || ""}
        ogType="article"
        ogUrl={eventUrl}
        noindex={false}
        schemaType={event.schemaType || "Event"}
        schemaData={{ name: title, description: stripHtml(description).substring(0, 200) || "", image: seoImage || event.image, startDate: event.date }}
      />

      {/* Page wrapper */}
      <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>

        {/* Breadcrumb bar */}
        <div style={{ borderBottom: `1px solid ${GOLD_BORDER}` }}>
          <div className="max-w-[680px] mx-auto px-6 py-3 flex items-center gap-2">
            <Link href="/">
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", opacity: 0.4, cursor: "pointer" }}>HOME</span>
            </Link>
            <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.3, fontSize: "10px", margin: "0 4px" }}>›</span>
            <Link href="/category/events">
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", opacity: 0.4, cursor: "pointer" }}>EVENTS</span>
            </Link>
            <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.3, fontSize: "10px", margin: "0 4px" }}>›</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", opacity: 0.4, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title}
            </span>
          </div>
        </div>

        {/* Article — full width, max 680px centered */}
        <div className="max-w-[680px] mx-auto px-6 py-10">

          {/* Back + language toggles */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setLocation("/category/events")}
              style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", opacity: 0.5, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0 }}
            >
              <ArrowLeft className="h-3 w-3" /> EVENTS
            </button>
            {hasArabicVersion && (
              <>
                <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.2 }}>|</span>
                <button onClick={() => setContentLanguage("en")} style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", color: resolvedContentLanguage === "en" ? GOLD : "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", opacity: resolvedContentLanguage === "en" ? 1 : 0.4 }}>EN</button>
                <button onClick={() => setContentLanguage("ar")} style={{ fontFamily: "'Cinzel', serif", fontSize: "9px", letterSpacing: "0.15em", color: resolvedContentLanguage === "ar" ? GOLD : "hsl(var(--muted-foreground))", background: "none", border: "none", cursor: "pointer", opacity: resolvedContentLanguage === "ar" ? 1 : 0.4 }}>AR</button>
              </>
            )}
          </div>

          <article dir={useArabicContent ? "rtl" : undefined}>

            {/* Event meta row — badge + date */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.6rem",
                  fontWeight: 400,
                  letterSpacing: "0.18em",
                  color: GOLD,
                  border: `1px solid ${GOLD_BORDER}`,
                  padding: "4px 10px",
                }}
              >
                {event.type === "upcoming" ? "Upcoming" : "CrossFire Event"}
              </span>
              <span
                style={{
                  fontFamily: "'EB Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "0.88rem",
                  color: "hsl(var(--muted-foreground))",
                  opacity: 0.6,
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Calendar className="h-3.5 w-3.5" /> {event.date}
              </span>
            </div>

            {/* Title — Cinzel 300, 28px */}
            <h1
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 300,
                fontSize: "28px",
                letterSpacing: "0.08em",
                lineHeight: 1.25,
                color: "hsl(var(--foreground))",
                margin: "0 0 20px",
              }}
            >
              {title}
            </h1>

            {/* Author row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "20px",
                marginBottom: "24px",
                borderBottom: `1px solid ${GOLD_BORDER}`,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#3a7bd5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  flexShrink: 0,
                }}
              >
                GM
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.1em", color: "hsl(var(--foreground))" }}>
                  [GM] Bimora Team
                </div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", opacity: 0.5, marginTop: "2px" }}>
                  {event.date}
                </div>
              </div>
            </div>

            {/* Featured image — 280px, cover */}
            {event.image && (
              <div
                style={{ width: "100%", height: "280px", overflow: "hidden", marginBottom: "32px", cursor: "zoom-in" }}
                onClick={() => setViewer({ open: true, src: event.image!, alt: title })}
              >
                <img
                  src={event.image}
                  alt={title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                />
              </div>
            )}

            {/* Article content — EB Garamond 16px line-height 1.9 */}
            <div
              ref={contentRef}
              dir={useArabicContent ? "rtl" : undefined}
              style={{ marginBottom: "40px" }}
              className="event-article-body"
            >
              <RawHtmlPreview html={rawDescription || ""} isFullPage={false} isRTL={useArabicContent} />
            </div>

            {/* Gold divider */}
            <div style={{ width: "100%", height: "1px", background: GOLD_BORDER, marginBottom: "40px" }} />

          </article>

          {/* Discord community block — full width, themed dark */}
          <div
            style={{
              marginBottom: "40px",
              background: "hsl(var(--card))",
              border: `1px solid ${GOLD_BORDER}`,
              padding: "40px 32px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "9px",
                letterSpacing: "0.22em",
                color: GOLD,
                marginBottom: "12px",
              }}
            >
              COMMUNITY
            </p>
            <h3
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 300,
                fontSize: "1.4rem",
                letterSpacing: "0.1em",
                color: theme === "light" ? "hsl(var(--foreground))" : "#e8e0d0",
                marginBottom: "8px",
              }}
            >
              Join the CrossFire Discord
            </h3>
            <p
              style={{
                fontFamily: "'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "1rem",
                color: theme === "light" ? "hsl(var(--muted-foreground))" : "rgba(232,224,208,0.5)",
                marginBottom: "6px",
              }}
            >
              2,594 members online · Stay up to date on events and updates
            </p>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                color: "#5865F2",
                opacity: 0.7,
                marginBottom: "24px",
              }}
            >
              ● 2,594 Online
            </p>
            <a
              href="https://discord.gg/7AbuDrNNJM"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                letterSpacing: "0.2em",
                padding: "12px 28px",
                border: `1px solid ${GOLD_BORDER}`,
                color: GOLD,
                textDecoration: "none",
                transition: "background 0.2s",
                background: "transparent",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(154,124,63,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              JOIN DISCORD
            </a>
          </div>

          {/* Comments section */}
          <div style={{ border: `1px solid ${GOLD_BORDER}` }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <MessageSquare className="h-4 w-4" style={{ color: GOLD }} />
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 400, fontSize: "0.75rem", letterSpacing: "0.15em", color: "hsl(var(--foreground))" }}>
                COMMENTS ({comments.length})
              </span>
            </div>

            {/* Comment list */}
            {comments.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.95rem", color: "hsl(var(--muted-foreground))", opacity: 0.5 }}>
                Be the first to comment.
              </div>
            ) : (
              <div>
                {comments.map((comment: any, idx: number) => (
                  <div
                    key={comment.id}
                    style={{
                      padding: "18px 20px",
                      borderBottom: `1px solid ${GOLD_BORDER}`,
                      display: "flex",
                      gap: "14px",
                      background: idx % 2 === 1 ? "hsl(var(--muted) / 0.3)" : "transparent",
                    }}
                  >
                    <CommentAvatar name={comment.name || comment.author || "User"} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.08em", color: "hsl(var(--foreground))" }}>
                          {String(comment.name || comment.author || "").trim() || "Anonymous"}
                        </span>
                        <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", opacity: 0.45 }}>
                          {comment.createdAt ? (() => {
                            const d = new Date(comment.createdAt);
                            return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
                          })() : ""}
                        </span>
                        {isAdminUser && (
                          <button
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        )}
                      </div>
                      <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "1rem", lineHeight: 1.6, color: "hsl(var(--muted-foreground))", margin: 0 }}>
                        {comment.content}
                      </p>
                      <CommentReactions commentId={comment.id} likes={comment.likes} onLike={(id) => likeCommentMutation.mutate(id)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Post comment form */}
            <div style={{ padding: "20px", borderTop: `1px solid ${GOLD_BORDER}`, background: "hsl(var(--muted) / 0.2)" }}>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.18em", color: "hsl(var(--muted-foreground))", opacity: 0.5, marginBottom: "12px" }}>
                LEAVE A COMMENT
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }} className="comment-form-grid">
                <input
                  type="text"
                  placeholder="Your name"
                  value={newCommentAuthor}
                  onChange={(e) => setNewCommentAuthor(e.target.value)}
                  style={{ padding: "10px 12px", fontFamily: "'EB Garamond', serif", fontSize: "14px", background: "hsl(var(--background))", border: `1px solid ${GOLD_BORDER}`, color: "hsl(var(--foreground))", outline: "none", width: "100%" }}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={newCommentEmail}
                  onChange={(e) => setNewCommentEmail(e.target.value)}
                  style={{ padding: "10px 12px", fontFamily: "'EB Garamond', serif", fontSize: "14px", background: "hsl(var(--background))", border: `1px solid ${GOLD_BORDER}`, color: "hsl(var(--foreground))", outline: "none", width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Write your comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newComment.trim() && newCommentAuthor.trim())
                      addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment });
                  }}
                  style={{ flex: 1, padding: "10px 12px", fontFamily: "'EB Garamond', serif", fontSize: "14px", background: "hsl(var(--background))", border: `1px solid ${GOLD_BORDER}`, color: "hsl(var(--foreground))", outline: "none" }}
                />
                <button
                  onClick={() => {
                    if (newComment.trim() && newCommentAuthor.trim())
                      addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment });
                  }}
                  disabled={!newComment.trim() || !newCommentAuthor.trim() || addCommentMutation.isPending}
                  style={{
                    padding: "10px 16px",
                    fontFamily: "'Cinzel', serif",
                    fontSize: "9px",
                    letterSpacing: "0.15em",
                    background: "transparent",
                    border: `1px solid ${GOLD_BORDER}`,
                    color: GOLD,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: (!newComment.trim() || !newCommentAuthor.trim() || addCommentMutation.isPending) ? 0.4 : 1,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!(!newComment.trim() || !newCommentAuthor.trim())) (e.currentTarget as HTMLElement).style.background = "rgba(154,124,63,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image viewer overlay */}
      {viewer.open && (
        <ImageViewerOverlay src={viewer.src} alt={viewer.alt} onClose={() => setViewer({ open: false, src: "" })} />
      )}

      <style>{`
        .event-article-body {
          font-family: 'EB Garamond', serif;
          font-size: 16px;
          line-height: 1.9;
          color: hsl(var(--foreground));
        }
        .event-article-body h1,
        .event-article-body h2,
        .event-article-body h3,
        .event-article-body h4 {
          font-family: 'Cinzel', serif;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: hsl(var(--foreground));
          margin: 1.6em 0 0.5em;
        }
        .event-article-body h2 { font-size: 1.2rem; }
        .event-article-body h3 { font-size: 1rem; }
        .event-article-body p { margin-bottom: 1.1em; }
        .event-article-body img { max-width: 100%; height: auto; display: block; margin: 1.5em 0; }
        .event-article-body a { color: #9a7c3f; }
        .event-article-body ul, .event-article-body ol { padding-left: 1.5em; margin-bottom: 1em; }
        .event-article-body li { margin-bottom: 0.3em; }
        @media (max-width: 640px) {
          .comment-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
