import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import {
  Calendar, ArrowLeft, ThumbsUp, ThumbsDown, MessageSquare, Send,
  Trash2, ChevronRight, MapPin, Tag, Clock, Zap, Globe, BookOpen,
  List, ExternalLink, Hash,
} from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { SEOHead } from "@/components/SEOHead";
import { ImageViewerOverlay, useZoomableImages } from "@/components/ImageViewer";
import { queryClient } from "@/lib/queryClient";
import { getEventBySlug, getComments, addComment, getEvents, getMercenaries } from "@/lib/supabaseApi";
import { useToast } from "@/hooks/use-toast";
import RawHtmlPreview from "@/components/RawHtmlPreview";

// ─── Constants ────────────────────────────────────────────────────────────────
const GOLD = "#f5a623";
const BORDER = "rgba(255,255,255,0.07)";
const CARD = "var(--card)";
const BG = "var(--background)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function classifyStatus(dateStr: string): "active" | "upcoming" | "ended" {
  if (!dateStr) return "ended";
  const d = new Date(dateStr);
  const now = new Date();
  const sevenAgo = new Date(now.getTime() - 7 * 86400000);
  if (d < sevenAgo) return "ended";
  if (d > new Date(now.getTime() + 30 * 86400000)) return "upcoming";
  return "active";
}

function getStatusStyle(s: string) {
  if (s === "active")   return { bg: "rgba(52,211,153,0.15)", color: "#34d399", border: "rgba(52,211,153,0.35)", label: "Active Now" };
  if (s === "upcoming") return { bg: "rgba(245,166,35,0.15)", color: GOLD,      border: "rgba(245,166,35,0.35)",   label: "Upcoming" };
  return                       { bg: "rgba(255,255,255,0.05)", color: "#555",    border: "rgba(255,255,255,0.1)",   label: "Ended" };
}

function fmtDate(d: string) {
  if (!d) return "";
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
    return d; // return raw string if unparseable (e.g. "July 20th")
  } catch { return d; }
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ dateStr }: { dateStr: string }) {
  const [p, setP] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(dateStr).getTime() - Date.now();
      if (diff <= 0) return setP({ d: 0, h: 0, m: 0, s: 0 });
      setP({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [dateStr]);
  const cells = [{ v: p.d, l: "Days" }, { v: p.h, l: "Hrs" }, { v: p.m, l: "Min" }, { v: p.s, l: "Sec" }];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {cells.map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{ minWidth: 38, padding: "5px 4px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 4, fontSize: 16, fontWeight: 900, color: GOLD, lineHeight: 1 }}>
            {String(v).padStart(2, "0")}
          </div>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────
function TableOfContents({ html }: { html: string }) {
  const headings = useMemo(() => {
    if (!html) return [];
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h2, h3")).map((el, i) => ({
      id: `toc-${i}`,
      text: el.textContent?.trim() || "",
      level: el.tagName === "H2" ? 2 : 3,
    })).filter((h) => h.text.length > 0 && h.text.length < 100);
  }, [html]);

  if (headings.length < 2) return null;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 6 }}>
        <List size={12} color={GOLD} />
        <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em" }}>Contents</span>
      </div>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
        {headings.map((h, i) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: h.level === 3 ? "4px 8px 4px 16px" : "4px 8px",
              fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none",
              borderRadius: 3, transition: "all 0.15s",
            }}
            className="toc-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 700, minWidth: 14 }}>{i + 1}.</span>
            <span>{h.text}</span>
          </a>
        ))}
      </div>
      <style>{`.toc-link:hover{color:${GOLD}!important;background:rgba(245,166,35,0.06)!important;}`}</style>
    </div>
  );
}

// ─── Infobox ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon, children }: { label: string; value?: string; icon?: any; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ width: 110, flexShrink: 0, padding: "9px 12px", background: "rgba(255,255,255,0.02)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5 }}>
        {Icon && <Icon size={10} color="rgba(255,255,255,0.25)" />}
        {label}
      </div>
      <div style={{ flex: 1, padding: "9px 12px", fontSize: 12, color: "rgba(255,255,255,0.75)", borderLeft: `1px solid ${BORDER}`, display: "flex", alignItems: "center" }}>
        {children || value}
      </div>
    </div>
  );
}

// ─── Comment Components ───────────────────────────────────────────────────────
function CommentAvatar({ name }: { name: string }) {
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#9b59b6", "#f39c12", "#1abc9c", "#e67e22"];
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
      <button onClick={() => handleVote("like")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: voted === "like" ? GOLD : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ThumbsUp size={12} /> {localLikes > 0 ? localLikes : ""} Like
      </button>
      <button onClick={() => handleVote("dislike")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: voted === "dislike" ? "#ef4444" : "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <ThumbsDown size={12} /> {localDislikes > 0 ? localDislikes : ""} Dislike
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventDetail() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const legacyId = params?.legacyId as string | undefined;
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<{ open: boolean; src: string; alt?: string }>({ open: false, src: "" });
  const [newComment, setNewComment] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentEmail, setNewCommentEmail] = useState("");
  const [contentLanguage, setContentLanguage] = useState<"en" | "ar" | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useZoomableImages(contentRef, (src, alt) => setViewer({ open: true, src, alt }));

  const { data: event, isLoading, isError } = useQuery<any>({
    queryKey: ["event", slug || legacyId],
    enabled: !!(slug || legacyId),
    retry: 1,
    queryFn: async () => {
      if (slug) return getEventBySlug(slug);
      if (!legacyId) throw new Error("No event ID or slug provided");
      const { items } = await getEvents({ limit: 200 });
      const found = items.find((e: any) => e.id === legacyId);
      if (!found) throw new Error("Event not found");
      return found;
    },
  });

  // Mercenaries — used for GM author avatar (Xenon character)
  const { data: mercenaries } = useQuery<any[]>({
    queryKey: ["mercenaries-for-author"],
    queryFn: () => getMercenaries(),
    staleTime: 10 * 60 * 1000,
  });
  const xenon = useMemo(() => {
    if (!mercenaries?.length) return null;
    return (
      mercenaries.find((m: any) => m.name?.toLowerCase().includes("xenon")) ||
      mercenaries.find((m: any) => m.image) ||
      null
    );
  }, [mercenaries]);

  // Related events
  const { data: relatedData } = useQuery<{ items: any[] }>({
    queryKey: ["/api/events", { limit: 6 }],
    queryFn: () => getEvents({ limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });
  const relatedEvents = (relatedData?.items || []).filter((e: any) => e.id !== event?.id).slice(0, 4);

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
    mutationFn: async (data: { author: string; content: string; email?: string }) =>
      addComment({ postId: event!.id, postType: "event", content: data.content, authorName: data.author }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      setNewComment(""); setNewCommentAuthor(""); setNewCommentEmail("");
      toast({ title: "Comment posted!" });
    },
    onError: (err: any) => toast({ title: "Failed to post", description: err.message, variant: "destructive" }),
  });

  const isAdminUser = !!(typeof window !== "undefined" && localStorage.getItem("adminToken"));

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
      if (typeof window !== "undefined" && window.location.pathname !== slugUrl) setLocation(slugUrl);
    }
  }, [legacyId, event?.event_name_slug, setLocation]);

  const hasArabicVersion = Boolean((event?.titleAr && event.titleAr.trim()) || (event?.descriptionAr && event.descriptionAr.trim()));
  const resolvedLang = contentLanguage || (language === "ar" && hasArabicVersion ? "ar" : "en");
  const useAr = resolvedLang === "ar" && hasArabicVersion;
  const title = useAr ? event?.titleAr || event?.title || "" : event?.title || event?.titleAr || "";
  const description = useAr ? event?.descriptionAr || event?.description || "" : event?.description || event?.descriptionAr || "";

  // Inject heading IDs for TOC scroll
  const rawDescription = useMemo(() => {
    if (!description) return "";
    const doc = new DOMParser().parseFromString(description, "text/html");
    doc.querySelectorAll("h2, h3").forEach((h, i) => { h.id = `toc-${i}`; });
    return doc.body.innerHTML;
  }, [description]);

  const status = classifyStatus(event?.date || "");
  const statusStyle = getStatusStyle(status);

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${GOLD}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.2em" }}>Loading Event…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Event not found.</p>
          <Link href="/events">
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, cursor: "pointer" }}>← Back to Events</span>
          </Link>
        </div>
      </div>
    );
  }

  const seoImage = event.ogImage || event.image;
  const canonicalOrigin = "https://crossfire.wiki";
  const eventSlug = event.event_name_slug || slug || legacyId;
  const eventUrl = `${canonicalOrigin}/events/${eventSlug}`;
  const seoDesc = event.seoDescription || stripHtml(description).substring(0, 155) || "";
  const seoTitle = event.seoTitle || `${title} | CrossFire Wiki`;
  const eventKeywords = [
    title,
    event.type || "event",
    "CrossFire event",
    "CrossFire Wiki",
    "كروس فاير ايفنت",
    ...(event.tags || []),
  ].filter(Boolean);

  // Event schema endDate: default to startDate + 7 days if not provided
  const startDate = event.date ? new Date(event.date).toISOString() : undefined;
  const endDate = event.endDate
    ? new Date(event.endDate).toISOString()
    : startDate
    ? new Date(new Date(event.date).getTime() + 7 * 86400000).toISOString()
    : undefined;

  const eventBreadcrumbs = [
    { name: "Home", url: canonicalOrigin + "/" },
    { name: "Events", url: canonicalOrigin + "/events" },
    { name: title, url: eventUrl },
  ];

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        keywords={eventKeywords}
        canonicalUrl={event.canonicalUrl || eventUrl}
        ogImage={seoImage}
        ogImageAlt={`${title} — CrossFire Event`}
        ogImageWidth={1200}
        ogImageHeight={630}
        twitterImage={seoImage}
        ogTitle={event.seoTitle || title}
        ogDescription={seoDesc}
        ogType="article"
        ogUrl={eventUrl}
        noindex={false}
        articlePublishedTime={startDate}
        articleModifiedTime={new Date().toISOString()}
        articleAuthor="CrossFire Wiki"
        articleSection="Events"
        articleTags={eventKeywords}
        hreflangAlternates={[
          { lang: "en", url: eventUrl },
          { lang: "ar", url: eventUrl.replace("https://crossfire.wiki", "https://crossfire.wiki/ar") },
        ]}
        breadcrumbs={eventBreadcrumbs}
        schemaType="Event"
        schemaData={{
          "@id": eventUrl,
          name: title,
          description: stripHtml(description).substring(0, 500),
          image: seoImage
            ? {
                "@type": "ImageObject",
                url: seoImage,
                width: 1200,
                height: 630,
                caption: title,
              }
            : undefined,
          url: eventUrl,
          startDate,
          endDate,
          eventStatus: status === "ended"
            ? "https://schema.org/EventCancelled"
            : status === "upcoming"
            ? "https://schema.org/EventScheduled"
            : "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          location: {
            "@type": "VirtualLocation",
            url: "https://crossfire.wiki",
          },
          organizer: {
            "@type": "Organization",
            name: "CrossFire Wiki",
            url: "https://crossfire.wiki",
          },
          inLanguage: "en",
        }}
        extraSchemas={seoImage ? [
          {
            "@type": "ImageObject",
            contentUrl: seoImage,
            url: seoImage,
            name: title,
            description: seoDesc,
            width: 1200,
            height: 630,
            caption: `${title} — CrossFire Event`,
          }
        ] : undefined}
      />

      <div style={{ minHeight: "100vh", background: BG }}>

        {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
        <div style={{ position: "relative", height: 480, overflow: "hidden", background: "#050505" }}>
          {/* Background image */}
          {event.image && (
            <>
              <img
                src={event.image}
                alt=""
                aria-hidden
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center",
                  filter: "blur(8px) brightness(0.35)",
                  transform: "scale(1.08)",
                }}
              />
              <img
                src={event.image}
                alt={title}
                onLoad={() => setHeroLoaded(true)}
                style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  maxHeight: "90%", maxWidth: "55%",
                  objectFit: "contain",
                  opacity: heroLoaded ? 1 : 0,
                  transition: "opacity 0.5s",
                  zIndex: 1,
                  borderRadius: 4,
                  boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
                }}
              />
            </>
          )}

          {/* Gradient overlays */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(5,5,5,0) 40%, rgba(5,5,5,0.7) 75%, #0a0a0a 100%)", zIndex: 2 }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${GOLD}, rgba(245,166,35,0.3) 50%, transparent)`, zIndex: 3 }} />

          {/* Breadcrumb — top left */}
          <div style={{ position: "absolute", top: 20, left: 24, display: "flex", alignItems: "center", gap: 6, zIndex: 4 }}>
            <Link href="/"><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 600 }}>Home</span></Link>
            <ChevronRight size={11} color="rgba(255,255,255,0.25)" />
            <Link href="/events"><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 600 }}>Events</span></Link>
            <ChevronRight size={11} color="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          </div>

          {/* Back button — top left below breadcrumb */}
          <Link href="/events">
            <div style={{
              position: "absolute", top: 50, left: 24, zIndex: 4,
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)", borderRadius: 3, cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}>
              <ArrowLeft size={11} /> Back to Events
            </div>
          </Link>

          {/* Hero bottom content */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 32px 28px", zIndex: 4 }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              {/* Badges row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {event.type && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(245,166,35,0.2)", border: "1px solid rgba(245,166,35,0.4)", color: GOLD, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", borderRadius: 2, backdropFilter: "blur(8px)" }}>
                    <Tag size={9} /> {event.type}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", borderRadius: 2, backdropFilter: "blur(8px)" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusStyle.color, boxShadow: status === "active" ? `0 0 6px ${statusStyle.color}` : "none" }} />
                  {statusStyle.label}
                </span>
                {hasArabicVersion && (
                  <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                    {["en", "ar"].map((l) => (
                      <button key={l} onClick={() => setContentLanguage(l as "en" | "ar")} style={{
                        padding: "3px 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        background: resolvedLang === l ? GOLD : "rgba(0,0,0,0.4)",
                        color: resolvedLang === l ? "#000" : "rgba(255,255,255,0.5)",
                        border: `1px solid ${resolvedLang === l ? GOLD : "rgba(255,255,255,0.15)"}`,
                        borderRadius: 2, cursor: "pointer", backdropFilter: "blur(8px)",
                      }}>
                        <Globe size={9} style={{ display: "inline", marginRight: 3 }} />{l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: "clamp(1.6rem, 4vw, 2.8rem)", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.1,
                color: "#fff", margin: "0 0 12px",
                textShadow: "0 2px 20px rgba(0,0,0,0.8)",
              }}>
                {title}
              </h1>

              {/* Meta row */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {event.date && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                    <Calendar size={12} color={GOLD} />
                    {fmtDate(event.date)}
                  </span>
                )}
                {event.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                    <MapPin size={12} color={GOLD} />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }} className="event-detail-grid">

            {/* ── ARTICLE BODY ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Language toggle (non-hero, compact) */}
              {hasArabicVersion && (
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {["en", "ar"].map((l) => (
                    <button key={l} onClick={() => setContentLanguage(l as "en" | "ar")} style={{
                      padding: "4px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                      background: resolvedLang === l ? GOLD : CARD,
                      color: resolvedLang === l ? "#000" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${resolvedLang === l ? GOLD : BORDER}`,
                      borderRadius: 3, cursor: "pointer",
                    }}>
                      {l === "en" ? "English" : "العربية"}
                    </button>
                  ))}
                </div>
              )}

              {/* Article body */}
              <div
                ref={contentRef}
                dir={useAr ? "rtl" : undefined}
                className="event-article-body"
              >
                <RawHtmlPreview html={rawDescription || ""} isFullPage={false} isRTL={useAr} />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, margin: "40px 0" }} />

              {/* Related Events */}
              {relatedEvents.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 1 }} />
                    <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                      Related Events
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="related-grid">
                    {relatedEvents.map((ev: any) => {
                      const evStatus = getStatusStyle(classifyStatus(ev.date));
                      return (
                        <Link key={ev.id} href={`/events/${ev.event_name_slug || ev.id}`}>
                          <div style={{
                            display: "flex", gap: 10, padding: "10px 12px",
                            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5,
                            cursor: "pointer", transition: "all 0.2s",
                          }} className="related-card">
                            {(ev.image || ev.imageUrl) && (
                              <div style={{ width: 56, height: 40, borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                                <img src={ev.image || ev.imageUrl} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: evStatus.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 9, color: evStatus.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{evStatus.label}</span>
                              </div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{ev.title}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <style>{`.related-card:hover{border-color:rgba(245,166,35,0.2)!important;transform:translateY(-1px);}`}</style>
                </section>
              )}

              {/* Discord CTA */}
              <div style={{
                background: CARD, border: `1px solid rgba(88,101,242,0.2)`,
                borderRadius: 6, padding: "24px 28px", marginBottom: 32,
                display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 4px" }}>Community</p>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Join the CrossFire Discord</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>2,594 members online · Stay up to date on events and updates</p>
                </div>
                <a href="https://discord.gg/7AbuDrNNJM" target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", background: "#5865f2", borderRadius: 4,
                  color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
                  flexShrink: 0,
                }}>
                  <ExternalLink size={13} /> Join Discord
                </a>
              </div>

              {/* Comments */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={14} color={GOLD} />
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)" }}>
                    Discussion ({comments.length})
                  </span>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                    Be the first to comment on this event.
                  </div>
                ) : (
                  <div>
                    {comments.map((c: any, idx: number) => (
                      <div key={c.id} style={{
                        padding: "16px 20px", borderBottom: `1px solid ${BORDER}`,
                        display: "flex", gap: 12,
                        background: idx % 2 === 1 ? "rgba(255,255,255,0.01)" : "transparent",
                      }}>
                        <CommentAvatar name={c.name || c.author || "User"} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                              {String(c.name || c.author || "").trim() || "Anonymous"}
                            </span>
                            {c.createdAt && (
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                                {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                            {isAdminUser && (
                              <button onClick={() => deleteCommentMutation.mutate(c.id)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                                <Trash2 size={11} /> Delete
                              </button>
                            )}
                          </div>
                          <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", margin: 0 }}>{c.content}</p>
                          <CommentReactions commentId={c.id} likes={c.likes} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post comment */}
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.01)" }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>Leave a Comment</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }} className="comment-grid">
                    <input type="text" placeholder="Your name" value={newCommentAuthor} onChange={(e) => setNewCommentAuthor(e.target.value)} style={{ padding: "9px 12px", fontSize: 13, background: BG, border: `1px solid ${BORDER}`, color: "var(--foreground)", outline: "none", borderRadius: 3, width: "100%" }} />
                    <input type="email" placeholder="Email (optional)" value={newCommentEmail} onChange={(e) => setNewCommentEmail(e.target.value)} style={{ padding: "9px 12px", fontSize: 13, background: BG, border: `1px solid ${BORDER}`, color: "var(--foreground)", outline: "none", borderRadius: 3, width: "100%" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" placeholder="Write your comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment }); }}
                      style={{ flex: 1, padding: "9px 12px", fontSize: 13, background: BG, border: `1px solid ${BORDER}`, color: "var(--foreground)", outline: "none", borderRadius: 3 }}
                    />
                    <button
                      onClick={() => { if (newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment }); }}
                      disabled={!newComment.trim() || !newCommentAuthor.trim() || addCommentMutation.isPending}
                      style={{ padding: "9px 16px", background: GOLD, border: "none", borderRadius: 3, color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (!newComment.trim() || !newCommentAuthor.trim()) ? 0.4 : 1 }}
                    >
                      <Send size={13} /> Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SIDEBAR ── */}
            <aside style={{ width: 300, flexShrink: 0 }} className="event-sidebar">
              <div style={{ position: "sticky", top: 80 }}>

                {/* INFOBOX */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden", marginBottom: 16 }}>
                  {/* Header */}
                  <div style={{ padding: "10px 14px", background: `linear-gradient(to right, rgba(245,166,35,0.1), transparent)`, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 6 }}>
                    <BookOpen size={12} color={GOLD} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em" }}>Event Information</span>
                  </div>

                  {/* Hero image thumbnail */}
                  {event.image && (
                    <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setViewer({ open: true, src: event.image, alt: title })}>
                      <img src={event.image} alt={title} style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                    </div>
                  )}

                  {/* Info rows */}
                  <InfoRow label="Status" icon={Zap}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: statusStyle.color, fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusStyle.color, boxShadow: status === "active" ? `0 0 6px ${statusStyle.color}` : "none" }} />
                      {statusStyle.label}
                    </span>
                  </InfoRow>

                  {event.type && (
                    <InfoRow label="Type" icon={Tag} value={event.type} />
                  )}

                  {event.date && (
                    <InfoRow label="Date" icon={Calendar}>
                      <span style={{ fontSize: 11 }}>{fmtDate(event.date)}</span>
                    </InfoRow>
                  )}

                  {event.location && (
                    <InfoRow label="Location" icon={MapPin} value={event.location} />
                  )}

                  {/* Countdown for upcoming events */}
                  {(status === "upcoming" || status === "active") && event.date && (
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
                        {status === "upcoming" ? "Starts In" : "Time Remaining"}
                      </p>
                      <Countdown dateStr={event.date} />
                    </div>
                  )}

                  {/* View on events page */}
                  <div style={{ padding: "10px 14px" }}>
                    <Link href="/events">
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "7px", background: "rgba(245,166,35,0.08)", border: `1px solid rgba(245,166,35,0.2)`,
                        borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
                      }} className="view-all-btn">
                        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em" }}>All Events</span>
                        <ChevronRight size={12} color={GOLD} />
                      </div>
                    </Link>
                    <style>{`.view-all-btn:hover{background:rgba(245,166,35,0.12)!important;}`}</style>
                  </div>
                </div>

                {/* Table of Contents */}
                <TableOfContents html={rawDescription} />

                {/* Quick Links */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Hash size={12} color={GOLD} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em" }}>Explore Wiki</span>
                  </div>
                  <div style={{ padding: "6px" }}>
                    {[
                      { label: "All Events",       href: "/events" },
                      { label: "Latest News",       href: "/news" },
                      { label: "Weapons Database",  href: "/weapons" },
                      { label: "Rank Progression",  href: "/ranks" },
                      { label: "Game Modes",        href: "/modes" },
                      { label: "Mercenaries",       href: "/mercenaries" },
                    ].map(({ label, href }) => (
                      <Link key={href} href={href}>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "7px 10px", borderRadius: 3, cursor: "pointer", transition: "background 0.15s",
                        }} className="ql-item">
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{label}</span>
                          <ChevronRight size={11} color="rgba(255,255,255,0.2)" />
                        </div>
                      </Link>
                    ))}
                    <style>{`.ql-item:hover{background:rgba(255,255,255,0.04)!important;}`}</style>
                  </div>
                </div>

              </div>
            </aside>
          </div>

          <style>{`
            @media(max-width:900px){.event-sidebar{display:none!important;}}
            @media(max-width:640px){
              .event-detail-grid{display:block!important;}
              .related-grid{grid-template-columns:1fr!important;}
              .comment-grid{grid-template-columns:1fr!important;}
            }
          `}</style>
        </div>
      </div>

      {/* Event article content styles */}
      <style>{`
        .event-article-body {
          font-size: 15px;
          line-height: 1.85;
          color: rgba(255,255,255,0.75);
        }
        .event-article-body h1,
        .event-article-body h2,
        .event-article-body h3,
        .event-article-body h4 {
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          color: #fff;
          margin: 2em 0 0.6em;
          padding-top: 0.5em;
          scroll-margin-top: 80px;
        }
        .event-article-body h2 {
          font-size: 1.15rem;
          border-left: 3px solid ${GOLD};
          padding-left: 12px;
        }
        .event-article-body h3 { font-size: 1rem; color: rgba(255,255,255,0.85); }
        .event-article-body p { margin-bottom: 1.1em; }
        .event-article-body img {
          max-width: 100%; height: auto; display: block;
          margin: 1.8em 0; border-radius: 4px;
          cursor: zoom-in;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .event-article-body a { color: ${GOLD}; }
        .event-article-body ul, .event-article-body ol { padding-left: 1.6em; margin-bottom: 1em; }
        .event-article-body li { margin-bottom: 0.4em; color: rgba(255,255,255,0.65); }
        .event-article-body table {
          width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 13px;
        }
        .event-article-body th {
          padding: 8px 12px; background: rgba(245,166,35,0.08);
          border: 1px solid rgba(255,255,255,0.07); font-weight: 700;
          text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: ${GOLD};
        }
        .event-article-body td {
          padding: 8px 12px; border: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.6);
        }
        .event-article-body tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .event-article-body blockquote {
          border-left: 3px solid ${GOLD}; margin: 1.5em 0;
          padding: 10px 18px; background: rgba(245,166,35,0.04);
          font-style: italic; color: rgba(255,255,255,0.5);
        }
        .event-article-body strong, .event-article-body b { color: #fff; font-weight: 700; }
        .event-article-body hr { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 2em 0; }
      `}</style>

      <ImageViewerOverlay open={viewer.open} src={viewer.src} alt={viewer.alt} onClose={() => setViewer({ open: false, src: "" })} />
    </>
  );
}
