import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import { Calendar, ArrowLeft, Languages, ChevronRight, ThumbsUp, ThumbsDown, MessageSquare, Send } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  { label: "All Categories", path: "/category/events" },
  { label: "Recent Posts", path: "/posts" },
  { label: "News", path: "/news" },
  { label: "Tutorials", path: "/tutorials" },
  { label: "Game Modes", path: "/modes" },
  { label: "Weapons", path: "/weapons" },
];

const SIDEBAR_CATEGORIES = [
  { section: "Z8Games", items: [{ label: "Off-Topic", count: null }, { label: "Forum Discussion", count: 1 }, { label: "Announcements", count: 16 }, { label: "Rules & Conduct", count: null }] },
  { section: "CrossFire", items: [{ label: "CF Announcements", count: "1k" }, { label: "Previous Announcements", count: "1k" }, { label: "CF Barracks", count: "2.6k" }, { label: "Community", count: "1.4k" }, { label: "Modes", count: 121 }, { label: "Suggestions", count: 620 }] },
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
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [contentLanguage, setContentLanguage] = useState<"en" | "ar" | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [newComment, setNewComment] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));

  const { data: event, isLoading, isError } = useQuery<Event>({
    queryKey: ["event", slug || legacyId],
    enabled: !!(slug || legacyId),
    retry: 1,
    queryFn: async () => {
      if (slug) {
        const res = await fetch(`/api/events/slug/${slug}`);
        if (!res.ok) throw new Error(`Failed to load event: ${res.status}`);
        return res.json();
      }
      if (!legacyId) throw new Error("No event ID or slug provided");
      const res = await fetch(`/api/events/${legacyId}`);
      if (!res.ok) throw new Error(`Failed to load event: ${res.status}`);
      return res.json();
    },
  });

  const { data: rawComments } = useQuery({
    queryKey: ["/api/events", event?.id, "comments"],
    enabled: !!event?.id,
    queryFn: async () => {
      const res = await fetch(`/api/events/${event!.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
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
    mutationFn: async (data: { author: string; content: string }) => {
      return await apiRequest(`/api/events/${event!.id}/comments`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      setNewComment("");
      setNewCommentAuthor("");
      toast({ title: "Comment posted!" });
    },
    onError: (err: any) => toast({ title: "Failed to post", description: err.message, variant: "destructive" }),
  });

  const likeCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      const userId = localStorage.getItem("userId");
      return await apiRequest(`/api/event-comments/${id}/like`, "POST", { userId: userId || undefined });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] }),
    onError: (err: any) => toast({ title: "Failed to like", description: err.message, variant: "destructive" }),
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
  const isAdmin = typeof window !== "undefined" && !!localStorage.getItem("adminToken");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#111" }}>
        <div className="text-sm font-bold uppercase tracking-widest" style={{ color: "#555" }}>Loading event…</div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#111" }}>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-tight mb-4" style={{ color: "#ccc" }}>Event Not Found</h2>
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
      <div className="min-h-screen" style={{ background: "#0f0f0f" }}>

        {/* Sub-header breadcrumb bar */}
        <div style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Back + language controls */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button
              onClick={() => setLocation("/category/events")}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors hover:text-[#f5a623]"
              style={{ color: "#555", background: "#151515", border: "1px solid #222" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Events
            </button>
            {hasArabicVersion && (
              <>
                <button onClick={() => setContentLanguage("en")} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: resolvedContentLanguage === "en" ? "#f5a623" : "#555", background: "#151515", border: "1px solid #222" }}>English</button>
                <button onClick={() => setContentLanguage("ar")} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ color: resolvedContentLanguage === "ar" ? "#f5a623" : "#555", background: "#151515", border: "1px solid #222" }}>العربية</button>
              </>
            )}
          </div>

          {/* Main 2-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT: Article content ── */}
            <article className="flex-1 min-w-0" dir={useArabicContent ? "rtl" : undefined}>

              {/* Article header card */}
              <div className="mb-6 overflow-hidden" style={{ background: "#141414", border: "1px solid #1e1e1e", borderTop: "3px solid #f5a623" }}>
                <div className="p-6 md:p-8">
                  {/* Event type badge */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-black text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1"
                      style={{ background: "linear-gradient(180deg, #f9c84a 0%, #e08a00 100%)", clipPath: "polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)" }}
                    >
                      {event.type === "upcoming" ? "Upcoming" : "CrossFire Announcement"}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>
                      <Calendar className="h-3.5 w-3.5" /> {event.date}
                    </span>
                  </div>

                  <h1 className="text-white font-black text-2xl md:text-3xl lg:text-4xl uppercase tracking-tight leading-tight mb-6">
                    {title}
                  </h1>

                  {/* Author row */}
                  <div className="flex items-center gap-3 pb-5" style={{ borderBottom: "1px solid #1e1e1e" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm" style={{ background: "#3a7bd5", color: "#fff" }}>GM</div>
                    <div>
                      <div className="text-[13px] font-black" style={{ color: "#ccc" }}>[GM] Bimora Team</div>
                      <div className="text-[11px]" style={{ color: "#444" }}>{event.date}</div>
                    </div>
                  </div>
                </div>

                {/* Event banner image */}
                {event.image && (
                  <div className="w-full" style={{ background: "#0a0a0a" }}>
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
                style={{ background: "#141414", border: "1px solid #1e1e1e" }}
                ref={contentRef}
                dir={useArabicContent ? "rtl" : undefined}
              >
                <RawHtmlPreview html={rawDescription || ""} isFullPage={false} isRTL={useArabicContent} />
              </div>

              {/* ── Comments section ── */}
              <div style={{ background: "#141414", border: "1px solid #1e1e1e" }}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #1e1e1e" }}>
                  <MessageSquare className="h-4 w-4" style={{ color: "#f5a623" }} />
                  <span className="font-black uppercase tracking-widest text-[13px]" style={{ color: "#ccc" }}>
                    Comments ({comments.length})
                  </span>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[12px] font-bold uppercase tracking-widest" style={{ color: "#333" }}>
                    Be the first to comment!
                  </div>
                ) : (
                  <div>
                    {comments.map((comment: any, idx: number) => (
                      <div
                        key={comment.id}
                        className="px-6 py-5 flex gap-4"
                        style={{ borderBottom: "1px solid #181818", background: idx % 2 === 0 ? "#141414" : "#131313" }}
                      >
                        <CommentAvatar name={comment.author || "User"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[13px] font-black" style={{ color: "#ccc" }}>{comment.author || "Anonymous"}</span>
                            <span className="text-[11px]" style={{ color: "#3a3a3a" }}>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}</span>
                          </div>
                          <p className="text-[13px] leading-relaxed" style={{ color: "#888" }}>{comment.content}</p>
                          <CommentReactions commentId={comment.id} likes={comment.likes} onLike={(id) => likeCommentMutation.mutate(id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post comment form */}
                <div className="px-6 py-5" style={{ borderTop: "1px solid #1e1e1e", background: "#111" }}>
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#444" }}>Leave a Comment</div>
                  <div className="flex gap-3 flex-col sm:flex-row">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={newCommentAuthor}
                      onChange={(e) => setNewCommentAuthor(e.target.value)}
                      className="px-3 py-2 text-[13px] w-full sm:w-44 outline-none"
                      style={{ background: "#0d0d0d", border: "1px solid #222", color: "#ccc" }}
                    />
                    <div className="flex flex-1 gap-2">
                      <input
                        type="text"
                        placeholder="Write your comment…"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, content: newComment }); }}
                        className="flex-1 px-3 py-2 text-[13px] outline-none"
                        style={{ background: "#0d0d0d", border: "1px solid #222", color: "#ccc" }}
                      />
                      <button
                        onClick={() => { if (newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, content: newComment }); }}
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
              <div style={{ background: "#3c4fa3", borderRadius: "4px", overflow: "hidden" }}>
                <div className="px-4 py-3 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  <span className="text-white font-black text-sm">Discord</span>
                  <span className="ml-auto text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>2182 Members Online</span>
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {["Bimora Player 1", "Bimora Player 2", "Bimora Player 3", "Bimora Player 4", "Bimora Player 5"].map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#43b581" }} />
                      <span className="text-[12px] font-bold" style={{ color: "rgba(255,255,255,0.8)" }}>{name}</span>
                    </div>
                  ))}
                  <a
                    href="https://discord.com/invite/CxUJx54s?utm_source=Discord%20Widget&utm_medium=Connect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-3 text-center py-2 font-black text-[12px] uppercase tracking-widest transition-opacity hover:opacity-90"
                    style={{ background: "#7289da", color: "#fff" }}
                  >
                    Join Discord
                  </a>
                </div>
              </div>

              {/* Auth / Welcome box */}
              <div className="p-4" style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
                <div className="text-center mb-3">
                  <div className="font-black text-[13px] mb-1" style={{ color: "#ccc" }}>Welcome!</div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#555" }}>
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
                    <Link href="/register" className="flex-1 text-center py-2 font-black text-[12px] uppercase tracking-widest transition-colors hover:border-[#f5a623]" style={{ border: "1px solid #2a2a2a", color: "#aaa" }}>
                      Register
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Links — admin only */}
              {isAdmin && (
                <div style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
                  <div className="px-4 py-3 font-black text-[11px] uppercase tracking-[0.2em]" style={{ color: "#f5a623", borderBottom: "1px solid #1a1a1a" }}>
                    Quick Links
                  </div>
                  <div className="py-1">
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.path}
                        href={link.path}
                        className="flex items-center justify-between px-4 py-2 text-[12px] transition-all hover:text-[#f5a623] hover:bg-[#1a1a1a]"
                        style={{ color: "#666" }}
                      >
                        {link.label} <ChevronRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories — admin only */}
              {isAdmin && (
                <div style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
                  <div className="px-4 py-3 font-black text-[11px] uppercase tracking-[0.2em]" style={{ color: "#f5a623", borderBottom: "1px solid #1a1a1a" }}>
                    Categories
                  </div>
                  {SIDEBAR_CATEGORIES.map((section) => (
                    <div key={section.section}>
                      <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: "#f5a623", background: "#111", borderBottom: "1px solid #181818" }}>
                        {section.section}
                      </div>
                      {section.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between px-4 py-1.5" style={{ borderBottom: "1px solid #181818" }}>
                          <span className="text-[11px] hover:text-[#f5a623] cursor-pointer transition-colors" style={{ color: "#666" }}>{item.label}</span>
                          {item.count !== null && (
                            <span className="text-[10px] font-bold" style={{ color: "#333" }}>{item.count}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

            </aside>
          </div>
        </div>
      </div>
      <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open={viewer.open} onClose={() => setViewer((v) => ({ ...v, open: false }))} />
    </>
  );
}
