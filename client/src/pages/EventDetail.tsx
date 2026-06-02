import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Calendar, ArrowLeft, ChevronRight, ThumbsUp, ThumbsDown, MessageSquare, Send, Trash2 } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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

const QUICK_LINKS = [
  { label: "Events Home", path: "/category/events" },
  { label: "Latest News", path: "/news" },
  { label: "Community Posts", path: "/posts" },
  { label: "Game Modes", path: "/modes" },
  { label: "Weapons Database", path: "/weapons" },
  { label: "Support", path: "/support" },
];

function CommentAvatar({ name }: { name: string }) {
  const colors = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f39c12","#1abc9c","#e67e22"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ background: color }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentReactions({ commentId, likes, onLike }: { commentId: string; likes?: number; onLike?: (id: string) => void }) {
  const [localLikes, setLocalLikes] = useState(likes ?? 0);
  const [localDislikes, setLocalDislikes] = useState(0);
  const [localLoves, setLocalLoves] = useState(0);
  const [voted, setVoted] = useState<"like" | "dislike" | "love" | null>(null);

  const handleVote = (type: "like" | "dislike" | "love") => {
    if (voted === type) {
      if (type === "like") setLocalLikes((v) => Math.max(0, v - 1));
      if (type === "dislike") setLocalDislikes((v) => Math.max(0, v - 1));
      if (type === "love") setLocalLoves((v) => Math.max(0, v - 1));
      setVoted(null);
    } else {
      if (voted === "like") setLocalLikes((v) => Math.max(0, v - 1));
      if (voted === "dislike") setLocalDislikes((v) => Math.max(0, v - 1));
      if (voted === "love") setLocalLoves((v) => Math.max(0, v - 1));
      if (type === "like") { setLocalLikes((v) => v + 1); onLike?.(commentId); }
      if (type === "dislike") setLocalDislikes((v) => v + 1);
      if (type === "love") setLocalLoves((v) => v + 1);
      setVoted(type);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-3">
      <button
        onClick={() => handleVote("like")}
        className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:text-[#f5a623]"
        style={{ color: voted === "like" ? "#f5a623" : "#555" }}
      >
        <ThumbsUp className="h-3 w-3" /> {localLikes > 0 ? localLikes : ""} Like
      </button>
      <button
        onClick={() => handleVote("dislike")}
        className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:text-red-500"
        style={{ color: voted === "dislike" ? "#ef4444" : "#555" }}
      >
        <ThumbsDown className="h-3 w-3" /> {localDislikes > 0 ? localDislikes : ""} Dislike
      </button>
      <button
        onClick={() => handleVote("love")}
        className="flex items-center gap-1 text-[11px] font-bold transition-colors hover:text-pink-500"
        style={{ color: voted === "love" ? "#ec4899" : "#555" }}
      >
        <span className="text-[13px]">❤️</span> {localLoves > 0 ? localLoves : ""} Love
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

  const bg = theme === "light" ? "#f5f5f5" : "#0f0f0f";
  const bgSub = theme === "light" ? "#efefef" : "#0a0a0a";
  const bgCard = theme === "light" ? "#ffffff" : "#141414";
  const bgInput = theme === "light" ? "#f9f9f9" : "#0d0d0d";
  const border = theme === "light" ? "#e0e0e0" : "#1e1e1e";
  const borderSub = theme === "light" ? "#d5d5d5" : "#1a1a1a";
  const textMain = theme === "light" ? "#111111" : "#ffffff";
  const textMuted = theme === "light" ? "#555555" : "#888888";
  const textFaint = theme === "light" ? "#888888" : "#444444";
  const hoverBg = theme === "light" ? "#f0f0f0" : "#1a1a1a";
  const btnBorder = theme === "light" ? "#d0d0d0" : "#2a2a2a";
  const commentAlt = theme === "light" ? "#f9f9f9" : "#131313";
  const [contentLanguage, setContentLanguage] = useState<"en" | "ar" | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [newComment, setNewComment] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentEmail, setNewCommentEmail] = useState("");
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
      return await addComment({ postId: event!.id, postType: 'event', content: data.content, authorName: data.author });
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
    mutationFn: async (_id: string) => { /* likes handled client-side */ },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
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

  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="text-sm font-bold uppercase tracking-widest" style={{ color: textMuted }}>Loading event…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight mb-4" style={{ color: textMain }}>Event Not Found</h2>
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 mx-auto px-5 py-2 font-bold uppercase text-xs tracking-widest" style={{ background: "#f5a623", color: "#000" }}>
            <ArrowLeft className="h-4 w-4" /> Back to Home
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
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Events", url: "/category/events" },
    { name: title, url: eventUrl },
  ];

  return (
    <>
      <SEOHead
        title={event.seoTitle || `${title} | Bimora Gaming`}
        description={event.seoDescription || description?.replace(/<[^>]*>/g, "").substring(0, 155) || ""}
        keywords={event.seoKeywords || [event.type || "event", "crossfire event"]}
        canonicalUrl={event.canonicalUrl || eventUrl}
        ogImage={seoImage}
        twitterImage={event.twitterImage || seoImage}
        ogTitle={event.seoTitle || title}
        ogDescription={event.seoDescription || description?.replace(/<[^>]*>/g, "").substring(0, 155) || ""}
        ogType="article"
        ogUrl={eventUrl}
        noindex={false}
        schemaType={event.schemaType || "Event"}
        schemaData={{ name: title, description: description?.replace(/<[^>]*>/g, "").substring(0, 200) || "", image: seoImage || event.image, startDate: event.date }}
      />

      {/* Page wrapper */}
      <div className="min-h-screen" style={{ background: bg }}>

        {/* Sub-header breadcrumb bar */}
        <div style={{ background: bgSub, borderBottom: `1px solid ${borderSub}` }}>
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 py-8">

          {/* Back + language controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setLocation("/category/events")}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-[#f5a623]"
              style={{ color: textMuted, background: bgCard, border: `1px solid ${btnBorder}` }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Events
            </button>
            {hasArabicVersion && (
              <>
                <button onClick={() => setContentLanguage("en")} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: resolvedContentLanguage === "en" ? "#f5a623" : textMuted, background: bgCard, border: `1px solid ${btnBorder}` }}>English</button>
                <button onClick={() => setContentLanguage("ar")} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: resolvedContentLanguage === "ar" ? "#f5a623" : textMuted, background: bgCard, border: `1px solid ${btnBorder}` }}>العربية</button>
              </>
            )}
          </div>

          {/* Main 2-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: Article content ── */}
            <article className="flex-1 min-w-0" dir={useArabicContent ? "rtl" : undefined}>

              {/* Article header card */}
              <div className="mb-6 overflow-hidden" style={{ background: bgCard, border: `1px solid ${border}`, borderTop: "3px solid #f5a623" }}>
                <div className="p-6 md:p-8">
                  {/* Event type badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-black text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1"
                      style={{ background: "linear-gradient(180deg, #f9c84a 0%, #e08a00 100%)", clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)" }}
                    >
                      {event.type === "upcoming" ? "Upcoming" : "CrossFire Announcement"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: textMuted }}>
                      <Calendar className="h-3.5 w-3.5" /> {event.date}
                    </span>
                  </div>

                  <h1 className="font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tight leading-tight mb-6" style={{ color: textMain }}>
                    {title}
                  </h1>

                  {/* Author row */}
                  <div className="flex items-center gap-3 pb-5" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm" style={{ background: "#3a7bd5", color: "#fff" }}>GM</div>
                    <div>
                      <div className="text-[13px] font-black" style={{ color: textMain }}>[GM] Bimora Team</div>
                      <div className="text-[11px]" style={{ color: textFaint }}>{event.date}</div>
                    </div>
                  </div>
                </div>

                {/* Event banner image */}
                {event.image && (
                  <div className="w-full" style={{ background: bgSub }}>
                    <img
                      src={event.image}
                      alt={title}
                      className="w-full cursor-zoom-in"
                      style={{ maxHeight: "480px", objectFit: "cover", display: "block" }}
                      onClick={() => setViewer({ open: true, src: event.image!, alt: title })}
                    />
                  </div>
                )}
              </div>

              {/* Article body */}
              <div
                className="mb-6 p-6 md:p-8"
                style={{ background: bgCard, border: `1px solid ${border}` }}
                ref={contentRef}
                dir={useArabicContent ? "rtl" : undefined}
              >
                <RawHtmlPreview html={rawDescription || ""} isFullPage={false} isRTL={useArabicContent} />
              </div>

              {/* ── Comments section ── */}
              <div style={{ background: bgCard, border: `1px solid ${border}` }}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${border}` }}>
                  <MessageSquare className="h-4 w-4" style={{ color: "#f5a623" }} />
                  <span className="font-black uppercase tracking-widest text-[13px]" style={{ color: textMain }}>
                    Comments ({comments.length})
                  </span>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[12px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>
                    Be the first to comment!
                  </div>
                ) : (
                  <div>
                    {comments.map((comment: any, idx: number) => (
                      <div
                        key={comment.id}
                        className="px-6 py-5 flex gap-4"
                        style={{ borderBottom: `1px solid ${borderSub}`, background: idx % 2 === 0 ? bgCard : commentAlt }}
                      >
                        <CommentAvatar name={comment.name || comment.author || "User"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-[13px] font-black" style={{ color: textMain }}>{String(comment.name || comment.author || "").trim() || "Anonymous"}</span>
                            <span className="text-[11px]" style={{ color: textFaint }}>
                              {comment.createdAt ? (() => {
                                const d = new Date(comment.createdAt);
                                const day = String(d.getDate()).padStart(2, "0");
                                const month = String(d.getMonth() + 1).padStart(2, "0");
                                const year = d.getFullYear();
                                const hours = String(d.getHours()).padStart(2, "0");
                                const mins = String(d.getMinutes()).padStart(2, "0");
                                return `${day}-${month}-${year} ${hours}:${mins}`;
                              })() : ""}
                            </span>
                            {isAdminUser && (
                              <button
                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                                className="ml-auto text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded transition-colors hover:bg-red-500/20"
                                style={{ color: "#ef4444" }}
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-[13px] leading-relaxed" style={{ color: textMuted }}>{comment.content}</p>
                          <CommentReactions commentId={comment.id} likes={comment.likes} onLike={(id) => likeCommentMutation.mutate(id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post comment form */}
                <div className="px-6 py-5" style={{ borderTop: `1px solid ${border}`, background: bgSub }}>
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: textFaint }}>Leave a Comment</div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Your name"
                        value={newCommentAuthor}
                        onChange={(e) => setNewCommentAuthor(e.target.value)}
                        className="px-3 py-2 text-[13px] w-full outline-none"
                        style={{ background: bgInput, border: `1px solid ${btnBorder}`, color: textMain }}
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={newCommentEmail}
                        onChange={(e) => setNewCommentEmail(e.target.value)}
                        className="px-3 py-2 text-[13px] w-full outline-none"
                        style={{ background: bgInput, border: `1px solid ${btnBorder}`, color: textMain }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write your comment…"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment }); }}
                        className="flex-1 px-3 py-2 text-[13px] outline-none"
                        style={{ background: bgInput, border: `1px solid ${btnBorder}`, color: textMain }}
                      />
                      <button
                        onClick={() => { if (newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment }); }}
                        disabled={!newComment.trim() || !newCommentAuthor.trim() || addCommentMutation.isPending}
                        className="px-4 py-2 font-black uppercase text-[11px] tracking-widest transition-opacity disabled:opacity-40"
                        style={{ background: "#f5a623", color: "#000" }}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* ── RIGHT: Sidebar ── */}
            <aside className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

              {/* Discord widget */}
              <div className="overflow-hidden" style={{ background: bgCard, border: `1px solid ${border}` }}>
                <div className="px-4 pt-3 pb-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
                  <span className="font-black text-[12px] uppercase tracking-[0.18em]" style={{ color: "#f5a623" }}>Discord Community</span>
                  <span className="text-[10px] font-bold" style={{ color: "#5865F2" }}>● 2,594 Online</span>
                </div>
                <iframe
                  src="https://discord.com/widget?id=360821102580072449&theme=dark"
                  width="100%"
                  height="380"
                  allowTransparency={true}
                  frameBorder="0"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  style={{ display: "block" }}
                  title="CrossFire Discord"
                />
                <div className="p-3" style={{ borderTop: `1px solid ${border}` }}>
                  <a
                    href="https://discord.com/invite/crossfire"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center py-2.5 font-black text-[12px] uppercase tracking-widest transition-opacity hover:opacity-90"
                    style={{ background: "#5865F2", color: "#fff", clipPath: "polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)" }}
                  >
                    Join CrossFire Discord
                  </a>
                </div>
              </div>

              {/* Auth / Welcome box */}
              <div className="p-4" style={{ background: bgCard, border: `1px solid ${border}` }}>
                <div className="text-center mb-3">
                  <div className="font-black text-[13px] mb-1" style={{ color: textMain }}>Welcome!</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: textMuted }}>
                    It looks like you're new here. Sign in or register to get started.
                  </p>
                </div>
                {isLoggedIn ? (
                  <div className="text-center text-[12px] font-bold" style={{ color: "#f5a623" }}>You are signed in</div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login" className="flex-1 text-center py-2 font-black text-[12px] uppercase tracking-widest transition-colors" style={{ background: "#f5a623", color: "#000" }}>
                      Sign In
                    </Link>
                    <Link href="/register" className="flex-1 text-center py-2 font-black text-[12px] uppercase tracking-widest transition-colors" style={{ border: `1px solid ${btnBorder}`, color: textMuted }}>
                      Register
                    </Link>
                  </div>
                )}
              </div>

              <div style={{ background: bgCard, border: `1px solid ${border}` }}>
                <div className="px-4 py-3 font-black text-[11px] uppercase tracking-[0.2em]" style={{ color: "#f5a623", borderBottom: `1px solid ${borderSub}` }}>
                  Quick Links
                </div>
                <div className="py-1">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className="flex items-center justify-between px-4 py-2 text-[12px] transition-all hover:text-[#f5a623]"
                      style={{ color: textMuted, borderBottom: `1px solid ${borderSub}` }}
                    >
                      {link.label} <ChevronRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
