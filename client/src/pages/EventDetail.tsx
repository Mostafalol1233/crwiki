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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getEventById, getEventBySlug, getComments, addComment, getEvents, getMercenaries } from "@/lib/supabaseApi";
import GallerySection from "@/components/GallerySection";
import { useToast } from "@/hooks/use-toast";
import RawHtmlPreview from "@/components/RawHtmlPreview";
import ContentImage from "@/components/ContentImage";
import { baseRelativePath, eventPath } from "@/lib/routePaths";

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

// Parse human-readable date ranges like "July 20–26, 2026" or "June 10 – August 5"
const MONTHS_MAP: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};
function parseDateStr(s: string): { start: Date | null; end: Date | null } {
  if (!s) return { start: null, end: null };
  // Already a valid ISO/parseable date?
  const direct = new Date(s);
  if (!isNaN(direct.getTime())) return { start: direct, end: direct };
  const yearM = s.match(/20\d{2}/); const year = yearM ? parseInt(yearM[0]) : new Date().getFullYear();
  // Cross-month: "June 10 – August 5"
  const xm = s.match(/([a-z]+)\s+(\d+)(?:st|nd|rd|th)?\s*[-–—~]+\s*([a-z]+)\s+(\d+)(?:st|nd|rd|th)?/i);
  if (xm) {
    const m1 = MONTHS_MAP[xm[1].toLowerCase()], m2 = MONTHS_MAP[xm[3].toLowerCase()];
    if (m1 !== undefined && m2 !== undefined) {
      const y2 = m2 < m1 ? year + 1 : year;
      return { start: new Date(year, m1, +xm[2], 0, 0), end: new Date(y2, m2, +xm[4], 23, 59) };
    }
  }
  // Same-month: "July 20th – 26th"
  const sm = s.match(/([a-z]+)\s+(\d+)(?:st|nd|rd|th)?\s*[-–—~]+\s*(\d+)(?:st|nd|rd|th)?/i);
  if (sm) {
    const m = MONTHS_MAP[sm[1].toLowerCase()];
    if (m !== undefined) return { start: new Date(year, m, +sm[2], 0, 0), end: new Date(year, m, +sm[3], 23, 59) };
  }
  // Single: "July 26"
  const sg = s.match(/([a-z]+)\s+(\d+)(?:st|nd|rd|th)?/i);
  if (sg) {
    const m = MONTHS_MAP[sg[1].toLowerCase()];
    if (m !== undefined) return { start: new Date(year, m, +sg[2], 0, 0), end: new Date(year, m, +sg[2], 23, 59) };
  }
  return { start: null, end: null };
}

function classifyStatus(evOrDateStr: any): "active" | "upcoming" | "ended" {
  if (!evOrDateStr) return "ended";
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  if (typeof evOrDateStr === "string") {
    // Legacy: single date string (e.g. from related events list)
    const d = new Date(evOrDateStr);
    if (isNaN(d.getTime())) return "ended";
    endDate = d;
  } else {
    const ev = evOrDateStr;
    if (ev.start_date) { const d = new Date(ev.start_date); if (!isNaN(d.getTime())) startDate = d; }
    if (ev.end_date)   { const d = new Date(ev.end_date);   if (!isNaN(d.getTime())) endDate = d; }
    if (!startDate && !endDate && ev.date) {
      const parsed = parseDateStr(ev.date);
      startDate = parsed.start;
      endDate = parsed.end;
    }
  }
  const refEnd = endDate || startDate;
  if (!refEnd || refEnd < now) return "ended";
  if (startDate && startDate > now) return "upcoming";
  return "active";
}

function getStatusStyle(s: string) {
  if (s === "active")   return { bg: "rgba(52,211,153,0.15)", color: "#34d399", border: "rgba(52,211,153,0.35)", label: "Active Now" };
  if (s === "upcoming") return { bg: "rgba(245,166,35,0.15)", color: GOLD,      border: "rgba(245,166,35,0.35)",   label: "Upcoming" };
  return                       { bg: "rgba(255,255,255,0.05)", color: "#555",    border: "rgba(255,255,255,0.1)",   label: "Ended" };
}

function fmtDate(d: string, language: "en" | "ar" = "en") {
  if (!d) return "";
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }
    return d; // return raw string if unparseable (e.g. "July 20th")
  } catch { return d; }
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ dateStr, language = "en" }: { dateStr: string; language?: "en" | "ar" }) {
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
  const cells = language === "ar"
    ? [{ v: p.d, l: "يوم" }, { v: p.h, l: "س" }, { v: p.m, l: "د" }, { v: p.s, l: "ث" }]
    : [{ v: p.d, l: "Days" }, { v: p.h, l: "Hrs" }, { v: p.m, l: "Min" }, { v: p.s, l: "Sec" }];
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
function TableOfContents({ html, language = "en" }: { html: string; language?: "en" | "ar" }) {
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
        <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em" }}>{language === "ar" ? "المحتويات" : "Contents"}</span>
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
      const found = await getEventById(legacyId);
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
      return apiRequest("/api/admin/rebuild", "POST", {
        action: "admin-table", type: "comments", operation: "delete", id: commentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", event?.id, "comments"] });
      toast({ title: "Comment deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    if (legacyId && event?.event_name_slug) {
      const slugUrl = eventPath(event.event_name_slug);
      const currentPath = typeof window !== "undefined" ? baseRelativePath(window.location.pathname) : "";
      if (currentPath !== slugUrl) setLocation(slugUrl);
    }
  }, [legacyId, event?.event_name_slug, language, setLocation]);

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

  // Compute status using stored ISO date fields (start_date + end_date), falling back to date string
  const parsedFromDate = useMemo(() => parseDateStr(event?.date || ""), [event?.date]);
  const status = classifyStatus(event ?? null);
  const statusLabel = (value: string) => language === "ar"
    ? (value === "active" ? "نشطة الآن" : value === "upcoming" ? "قادمة" : "منتهية")
    : (value === "active" ? "Active Now" : value === "upcoming" ? "Upcoming" : "Ended");
  // Countdown target: count to start for upcoming, count to end for active
  const countdownDateStr: string = (() => {
    if (status === "upcoming") {
      if (event?.start_date) { const d = new Date(event.start_date); if (!isNaN(d.getTime())) return event.start_date; }
      if (parsedFromDate.start) return parsedFromDate.start.toISOString();
    }
    // Active or ended: count to end date
    if (event?.end_date) { const d = new Date(event.end_date); if (!isNaN(d.getTime())) return event.end_date; }
    if (parsedFromDate.end) return parsedFromDate.end.toISOString();
    if (event?.start_date) { const d = new Date(event.start_date); if (!isNaN(d.getTime())) return event.start_date; }
    if (parsedFromDate.start) return parsedFromDate.start.toISOString();
    return event?.date || "";
  })();
  const isCountdownActive = (status === "upcoming" || status === "active") && !!countdownDateStr;
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
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{language === "ar" ? "الفعالية غير موجودة" : "Event not found."}</p>
          <Link href={baseRelativePath("/events")}>
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 700, cursor: "pointer" }}>← {language === "ar" ? "العودة إلى الفعاليات" : "Back to Events"}</span>
          </Link>
        </div>
      </div>
    );
  }

  const eventImage = event.image || event.image_url || event.imageUrl || "";
  const seoImage = event.ogImage || eventImage;
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

  // Safe ISO converter — returns undefined instead of throwing on "July 24th" style strings
  const safeISO = (s: string | undefined | null): string | undefined => {
    if (!s) return undefined;
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString();
    } catch { return undefined; }
  };

  // Event schema uses persisted ISO fields first, then the human-readable date as a fallback.
  const startDate = safeISO(event.start_date) || safeISO(event.date);
  const endDate = safeISO(event.end_date) || (startDate
    ? safeISO(new Date(new Date(startDate).getTime() + 7 * 86400000).toISOString())
    : undefined);
  const modifiedDate = safeISO(event.updated_at) || startDate;


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
        articleModifiedTime={modifiedDate}
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
            ? "https://schema.org/EventCompleted"
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
          inLanguage: useAr ? "ar" : "en",
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
        <div className="event-hero" style={{ position: "relative", height: 480, overflow: "hidden", background: "#050505" }}>
          {/* Background image */}
          {eventImage && (
            <>
              <ContentImage
                src={eventImage}
                alt=""
                aria-hidden
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center",
                  filter: "blur(8px) brightness(0.35)",
                  transform: "scale(1.08)",
                }}
              />
              <ContentImage
                className="event-hero-image"
                src={eventImage}
                alt={title}
                onLoad={() => setHeroLoaded(true)}
                style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "min(860px, 55vw)",
                  maxHeight: "90%", maxWidth: "92vw",
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
            <Link href={baseRelativePath("/")}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 600 }}>{language === "ar" ? "الرئيسية" : "Home"}</span></Link>
            <ChevronRight size={11} color="rgba(255,255,255,0.25)" />
            <Link href={baseRelativePath("/events")}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 600 }}>{language === "ar" ? "الفعاليات" : "Events"}</span></Link>
            <ChevronRight size={11} color="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          </div>

          {/* Back button — top left below breadcrumb */}
          <Link href={baseRelativePath("/events")}>
            <div style={{
              position: "absolute", top: 50, left: 24, zIndex: 4,
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)", borderRadius: 3, cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}>
              <ArrowLeft size={11} /> {language === "ar" ? "العودة إلى الفعاليات" : "Back to Events"}
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
                  {statusLabel(status)}
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
                    {fmtDate(event.date, language)}
                  </span>
                )}
                {event.location && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                    <MapPin size={12} color={GOLD} />
                    {event.location}
                  </span>
                )}
              </div>

              {/* Hero countdown — auto-shown for active/upcoming events */}
              {isCountdownActive && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    {language === "ar" ? (status === "upcoming" ? "يبدأ خلال" : "ينتهي خلال") : (status === "upcoming" ? "Starts In" : "Ends In")}
                  </span>
                  <Countdown dateStr={countdownDateStr} language={language} />
                </div>
              )}
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

              {/* Gallery */}
              {Array.isArray(event.gallery) && event.gallery.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <GallerySection items={event.gallery} title={language === "ar" ? "معرض الفعالية" : "Event Gallery"} />
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER} 20%, ${BORDER} 80%, transparent)`, margin: "40px 0" }} />

              {/* Related Events */}
              {relatedEvents.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 1 }} />
                    <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                      {language === "ar" ? "فعاليات ذات صلة" : "Related Events"}
                    </h2>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="related-grid">
                    {relatedEvents.map((ev: any) => {
                      const evStatus = getStatusStyle(classifyStatus(ev));
                      return (
                        <Link key={ev.id} href={eventPath(ev.event_name_slug || ev.id)}>
                          <div style={{
                            display: "flex", gap: 10, padding: "10px 12px",
                            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5,
                            cursor: "pointer", transition: "all 0.2s",
                          }} className="related-card">
                            {(ev.image || ev.imageUrl) && (
                              <div style={{ width: 56, height: 40, borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                                <ContentImage src={ev.image || ev.imageUrl} alt={useAr ? (ev.titleAr || ev.title) : ev.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: evStatus.color, flexShrink: 0 }} />
                                <span style={{ fontSize: 9, color: evStatus.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{statusLabel(classifyStatus(ev))}</span>
                              </div>
                              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{useAr ? (ev.titleAr || ev.title) : ev.title}</p>
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
                  <p style={{ fontSize: 10, fontWeight: 800, color: "#5865f2", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 4px" }}>{language === "ar" ? "المجتمع" : "Community"}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{language === "ar" ? "انضم إلى ديسكورد CrossFire" : "Join the CrossFire Discord"}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{language === "ar" ? "تابع آخر الفعاليات والتحديثات مع مجتمع CrossFire" : "Stay up to date on events and updates with the CrossFire community"}</p>
                </div>
                <a href="https://discord.gg/7AbuDrNNJM" target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 20px", background: "#5865f2", borderRadius: 4,
                  color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
                  flexShrink: 0,
                }}>
                  <ExternalLink size={13} /> {language === "ar" ? "انضم إلى ديسكورد" : "Join Discord"}
                </a>
              </div>

              {/* Comments */}
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
                <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={14} color={GOLD} />
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)" }}>
                    {language === "ar" ? `النقاش (${comments.length})` : `Discussion (${comments.length})`}

                  </span>
                </div>

                {/* Comment list */}
                {comments.length === 0 ? (
                  <div style={{ padding: "32px 20px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                    {language === "ar" ? "كن أول من يعلّق على هذه الفعالية." : "Be the first to comment on this event."}
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
                        <div style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
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
                                <Trash2 size={11} /> {language === "ar" ? "حذف" : "Delete"}
                              </button>
                            )}
                          </div>
                          <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", margin: 0, overflowWrap: "anywhere", wordBreak: "break-word" }}>{c.content}</p>
                          <CommentReactions commentId={c.id} likes={c.likes} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post comment */}
                <div style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.01)" }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>{language === "ar" ? "اكتب تعليقًا" : "Leave a Comment"}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }} className="comment-grid">
                    <input type="text" placeholder={language === "ar" ? "اسمك" : "Your name"} value={newCommentAuthor} onChange={(e) => setNewCommentAuthor(e.target.value)} style={{ padding: "9px 12px", fontSize: 13, background: BG, border: `1px solid ${BORDER}`, color: "var(--foreground)", outline: "none", borderRadius: 3, width: "100%" }} />
                    <input type="email" placeholder={language === "ar" ? "البريد الإلكتروني (اختياري)" : "Email (optional)"} value={newCommentEmail} onChange={(e) => setNewCommentEmail(e.target.value)} style={{ padding: "9px 12px", fontSize: 13, background: BG, border: `1px solid ${BORDER}`, color: "var(--foreground)", outline: "none", borderRadius: 3, width: "100%" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="text" placeholder={language === "ar" ? "اكتب تعليقك…" : "Write your comment…"} value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment }); }}
                      style={{ flex: 1, padding: "9px 12px", fontSize: 13, background: BG, border: `1px solid ${BORDER}`, color: "var(--foreground)", outline: "none", borderRadius: 3 }}
                    />
                    <button
                      onClick={() => { if (newComment.trim() && newCommentAuthor.trim()) addCommentMutation.mutate({ author: newCommentAuthor, email: newCommentEmail, content: newComment }); }}
                      disabled={!newComment.trim() || !newCommentAuthor.trim() || addCommentMutation.isPending}
                      style={{ padding: "9px 16px", background: GOLD, border: "none", borderRadius: 3, color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: (!newComment.trim() || !newCommentAuthor.trim()) ? 0.4 : 1 }}
                    >
                      <Send size={13} /> {language === "ar" ? "نشر" : "Post"}
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
                    <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em" }}>{language === "ar" ? "بيانات الفعالية" : "Event Information"}</span>
                  </div>

                  {/* Hero image thumbnail */}
                  {eventImage && (
                    <div style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setViewer({ open: true, src: eventImage, alt: title })}>
                      <ContentImage src={eventImage} alt={title} loading="lazy" style={{ width: "100%", maxHeight: 220, objectFit: "contain", padding: 12, background: "rgba(0,0,0,0.16)", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                    </div>
                  )}

                  {/* Info rows */}
                  <InfoRow label={language === "ar" ? "الحالة" : "Status"} icon={Zap}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: statusStyle.color, fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusStyle.color, boxShadow: status === "active" ? `0 0 6px ${statusStyle.color}` : "none" }} />
                      {statusLabel(status)}
                    </span>
                  </InfoRow>

                  {event.type && (
                    <InfoRow label={language === "ar" ? "النوع" : "Type"} icon={Tag} value={event.type} />
                  )}

                  {event.date && (
                    <InfoRow label={language === "ar" ? "التاريخ" : "Date"} icon={Calendar}>
                      <span style={{ fontSize: 11 }}>{fmtDate(event.date, language)}</span>
                    </InfoRow>
                  )}

                  {event.location && (
                    <InfoRow label={language === "ar" ? "المكان" : "Location"} icon={MapPin} value={event.location} />
                  )}

                  {/* Countdown for upcoming events */}
                  {isCountdownActive && (
                    <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
                        {language === "ar" ? (status === "upcoming" ? "يبدأ خلال" : "الوقت المتبقي") : (status === "upcoming" ? "Starts In" : "Time Remaining")}
                      </p>
                      <Countdown dateStr={countdownDateStr} language={language} />
                    </div>
                  )}

                  {/* View on events page */}
                  <div style={{ padding: "10px 14px" }}>
                    <Link href={baseRelativePath("/events")}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "7px", background: "rgba(245,166,35,0.08)", border: `1px solid rgba(245,166,35,0.2)`,
                        borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
                      }} className="view-all-btn">
                        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.08em" }}>{language === "ar" ? "كل الفعاليات" : "All Events"}</span>
                        <ChevronRight size={12} color={GOLD} />
                      </div>
                    </Link>
                    <style>{`.view-all-btn:hover{background:rgba(245,166,35,0.12)!important;}`}</style>
                  </div>
                </div>

                {/* Table of Contents */}
                <TableOfContents html={rawDescription} language={useAr ? "ar" : "en"} />

                {/* Quick Links */}
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Hash size={12} color={GOLD} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em" }}>{language === "ar" ? "استكشف الويكي" : "Explore Wiki"}</span>
                  </div>
                  <div style={{ padding: "6px" }}>
                    {[
                      { label: language === "ar" ? "كل الفعاليات" : "All Events", href: "/events" },
                      { label: language === "ar" ? "آخر الأخبار" : "Latest News", href: "/news" },
                      { label: language === "ar" ? "قاعدة الأسلحة" : "Weapons Database", href: "/weapons" },
                      { label: language === "ar" ? "تطور الرتب" : "Rank Progression", href: "/ranks" },
                      { label: language === "ar" ? "أوضاع اللعب" : "Game Modes", href: "/modes" },
                      { label: language === "ar" ? "المرتزقة" : "Mercenaries", href: "/mercenaries" },
                    ].map(({ label, href }) => (
                      <Link key={href} href={baseRelativePath(href)}>
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
              .event-hero{height:360px!important;}
              .event-hero-image{width:92vw!important;max-width:92vw!important;max-height:44%!important;}
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
          min-width: 0;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
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
          width: 100%; max-width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 13px;
          table-layout: auto;
        }
        .event-article-body pre,
        .event-article-body table { overflow-x: auto; }
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
