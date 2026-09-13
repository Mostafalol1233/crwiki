import { useEffect, useMemo, useState } from "react";
import { BellRing, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import RawHtmlPreview from "@/components/RawHtmlPreview";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type Announcement = {
  contentHtml?: string;
  contentHtmlEn?: string;
  contentHtmlAr?: string;
  titleEn?: string;
  titleAr?: string;
  theme?: 'royal-gold' | 'obsidian-crimson' | 'arctic-silver' | 'emerald-vault';
  imageUrl?: string;
  linkUrl?: string;
  active?: boolean;
  dismissible?: boolean;
  updatedAt?: string;
  direction?: 'auto' | 'ltr' | 'rtl';
};

function getYouTubeEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/");
      const idx = parts.indexOf("embed");
      if (idx >= 0 && parts[idx + 1]) {
        return `https://www.youtube.com/embed/${parts[idx + 1]}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveAnnouncementTitle(html: string) {
  const headingMatch = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (headingMatch?.[1]) {
    const cleanHeading = stripHtml(headingMatch[1]);
    if (cleanHeading) return cleanHeading;
  }

  const plain = stripHtml(html);
  if (!plain) return "Announcement";
  return plain.length > 90 ? `${plain.slice(0, 90)}…` : plain;
}

export default function AnnouncementModal({ location }: { location: string }) {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Announcement | null>(null);
  const [scope, setScope] = useState<string>("global");
  const [enabled, setEnabled] = useState<boolean>(true);
  const [displayMs, setDisplayMs] = useState<number>(0);
  const { language } = useLanguage();
  const [viewLang, setViewLang] = useState<"en" | "ar">(language === "ar" ? "ar" : "en");

  const sellerSlugFromPath = useMemo(() => {
    try {
      // support /reviews/seller/:sellerName and /reviews/seller/slug/:slug
      if (location.startsWith("/reviews/seller/slug/")) {
        return location.replace("/reviews/seller/slug/", "");
      }
      if (location.startsWith("/reviews/seller/")) {
        const sellerName = decodeURIComponent(location.replace("/reviews/seller/", ""));
        return slugify(sellerName);
      }
      return "";
    } catch {
      return "";
    }
  }, [location]);

  useEffect(() => {
    let aborted = false;
    const isHomeRoute = location === "/" || location === "/ar" || location === "/ar/";
    const cacheKey = `crossfire_announcement_cache_${sellerSlugFromPath ? `seller_${sellerSlugFromPath}` : "global"}`;
    let hasCachedAnnouncement = false;

    // Render the last known announcement immediately, then refresh it in the background.
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached?.announcement?.active && (!cached.savedAt || Date.now() - cached.savedAt < 15 * 60 * 1000)) {
        setData(cached.announcement);
        setScope(sellerSlugFromPath ? `seller:${sellerSlugFromPath}` : "global");
        hasCachedAnnouncement = true;
        setLoading(false);
      }
    } catch {}

    (async () => {
      if (!hasCachedAnnouncement) setLoading(true);
      try {
        const settingsPromise = import("@/lib/supabaseApi").then(({ getSiteSettings }) => getSiteSettings()).catch(() => null);
        const announcementUrl = sellerSlugFromPath
          ? `/api/sitemap?type=announcements&seller=${encodeURIComponent(sellerSlugFromPath)}`
          : "/api/sitemap?type=announcements";
        const [settings, response] = await Promise.all([
          settingsPromise,
          globalThis.fetch(announcementUrl, { cache: "default" }),
        ]);
        const announcementsEnabled = Boolean((settings as any)?.announcements_enabled ?? true);
        if (!aborted) {
          setEnabled(announcementsEnabled);
          setDisplayMs(Number((settings as any)?.announcements_display_ms ?? 0) || 0);
        }
        if (!announcementsEnabled) {
          if (!aborted) { setData(null); setLoading(false); }
          return;
        }
        const payload = await response.json().catch(() => ({}));
        const json = payload?.announcement || null;
        const shouldUse = Boolean(!aborted && response.ok && json?.active && (sellerSlugFromPath || isHomeRoute));
        if (shouldUse) {
          setData(json);
          setScope(sellerSlugFromPath ? `seller:${sellerSlugFromPath}` : "global");
          try { localStorage.setItem(cacheKey, JSON.stringify({ announcement: json, savedAt: Date.now() })); } catch {}
        } else if (!hasCachedAnnouncement && !aborted) {
          setData(null);
        }
      } catch {
        // Keep the cached announcement visible if the background refresh fails.
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [sellerSlugFromPath, location]);

  useEffect(() => {
    if (!data) return;
    const hasEn = Boolean(data.contentHtmlEn && data.contentHtmlEn.trim().length > 0);
    const hasAr = Boolean(data.contentHtmlAr && data.contentHtmlAr.trim().length > 0);

    // If admin explicitly set direction, respect it first.
    if (data.direction === 'rtl' && hasAr) {
      setViewLang("ar");
      return;
    }
    if (data.direction === 'ltr' && hasEn) {
      setViewLang("en");
      return;
    }

    // Sync with global site language when both languages are available.
    if (hasEn && hasAr) {
      setViewLang(language === "ar" ? "ar" : "en");
      return;
    }

    // Fallbacks based on available content
    if (hasEn) {
      setViewLang("en");
    } else if (hasAr) {
      setViewLang("ar");
    } else {
      setViewLang(language === "ar" ? "ar" : "en");
    }
  }, [data, language]);

  useEffect(() => {
    if (!loading && data?.active) {
      const version = data.updatedAt || JSON.stringify({ c: data.contentHtml, i: data.imageUrl, l: data.linkUrl });
      const key = `announce_dismiss_${scope}_${version}`;
      const dismissed = localStorage.getItem(key);
      const allowGlobal = scope === "global" ? location === "/" : true;
      const shouldOpen = !dismissed && allowGlobal;
      setOpen(shouldOpen);
      if (!shouldOpen) setDetailsOpen(false);
      if (shouldOpen && displayMs > 0) {
        const timer = setTimeout(() => {
          const version2 = data.updatedAt || JSON.stringify({ c: data.contentHtml, i: data.imageUrl, l: data.linkUrl });
          const key2 = `announce_dismiss_${scope}_${version2}`;
          try { localStorage.setItem(key2, "1"); } catch {}
          setOpen(false);
          setDetailsOpen(false);
        }, displayMs);
        return () => clearTimeout(timer);
      }
    } else {
      setOpen(false);
      setDetailsOpen(false);
    }
  }, [loading, data, scope, location, displayMs]);

  if (!open || !data) return null;

  const onClose = () => {
    const version = data.updatedAt || JSON.stringify({ c: data.contentHtml, i: data.imageUrl, l: data.linkUrl });
    const key = `announce_dismiss_${scope}_${version}`;
    if (data.dismissible !== false) {
      try { localStorage.setItem(key, "1"); } catch {}
    }
    setOpen(false);
    setDetailsOpen(false);
  };

  const primaryHtml = viewLang === "ar"
    ? (data.contentHtmlAr || data.contentHtml)
    : (data.contentHtmlEn || data.contentHtml);

  const explicitDir = (data?.direction === 'rtl' || data?.direction === 'ltr') ? data.direction : undefined;
  const finalDir = explicitDir || (viewLang === 'ar' ? 'rtl' : 'ltr');
  const finalAlign = finalDir === 'rtl' ? 'text-right' : 'text-left';
  const videoEmbedUrl = getYouTubeEmbedUrl(data.linkUrl);
  const isAudioLink = data.linkUrl ? /(\.mp3|\.ogg|\.wav|\.m4a)([?#]|$)/i.test(data.linkUrl) : false;
  const announcementTitle = viewLang === "ar"
    ? (data.titleAr || data.titleEn || deriveAnnouncementTitle(String(primaryHtml || "")))
    : (data.titleEn || data.titleAr || deriveAnnouncementTitle(String(primaryHtml || "")));
  const theme = data.theme || 'royal-gold';
  const themeStyles = {
    'royal-gold': { shell: 'border-amber-300/60 bg-[linear-gradient(135deg,#17130a_0%,#2a1d08_48%,#0b0b0d_100%)] text-white', accent: 'bg-amber-400 text-black', badge: 'text-amber-100 bg-amber-950/80 border-amber-400/60', overlay: 'bg-black/90', muted: 'text-amber-100/80', secondary: 'bg-white/10 text-white border-white/30 hover:bg-white/20' },
    'obsidian-crimson': { shell: 'border-red-500/60 bg-[linear-gradient(135deg,#170b0d_0%,#2a1117_52%,#0b0b0d_100%)] text-white', accent: 'bg-red-600 text-white', badge: 'text-red-100 bg-red-950/80 border-red-500/60', overlay: 'bg-black/90', muted: 'text-red-100/80', secondary: 'bg-white/10 text-white border-white/30 hover:bg-white/20' },
    'arctic-silver': { shell: 'border-sky-400/60 bg-[linear-gradient(135deg,#0b1b2a_0%,#12324a_50%,#080d14_100%)] text-white', accent: 'bg-sky-400 text-slate-950', badge: 'text-sky-100 bg-sky-950/80 border-sky-400/60', overlay: 'bg-black/90', muted: 'text-sky-100/80', secondary: 'bg-white/10 text-white border-white/30 hover:bg-white/20' },
    'emerald-vault': { shell: 'border-emerald-400/60 bg-[linear-gradient(135deg,#071b14_0%,#0e3425_48%,#07100d_100%)] text-white', accent: 'bg-emerald-400 text-emerald-950', badge: 'text-emerald-100 bg-emerald-950/80 border-emerald-400/60', overlay: 'bg-black/90', muted: 'text-emerald-100/80', secondary: 'bg-white/10 text-white border-white/30 hover:bg-white/20' },
  }[theme];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed top-[96px] md:top-[118px] left-0 right-0 z-40 mx-auto max-w-6xl px-3 md:px-4"
            role="banner"
          >
            <div className={`relative w-full rounded-2xl border backdrop-blur-sm shadow-2xl overflow-hidden ${themeStyles.shell}`}>
              <div className="flex items-start gap-3 p-3 md:p-4">
                {data.imageUrl && (
                  <img src={data.imageUrl} alt="Announcement" className="h-12 w-12 md:h-14 md:w-14 rounded-lg object-cover shrink-0 border" />
                )}
                <div className={`min-w-0 flex-1 ${finalAlign}`} dir={finalDir}>
                  <div className={`flex items-center gap-2 text-[11px] uppercase tracking-wide ${themeStyles.muted} mb-1`}>
                    <BellRing className="h-3.5 w-3.5" />
                    <span className={`rounded-full border px-2 py-0.5 ${themeStyles.badge}`}>Announcement</span>
                  </div>
                  <p className="text-sm md:text-base font-semibold text-white line-clamp-2">{announcementTitle}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewLang("en")}
                    className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${viewLang === "en" ? themeStyles.accent : themeStyles.secondary}`}
                    aria-label="Switch to English"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLang("ar")}
                    className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${viewLang === "ar" ? themeStyles.accent : themeStyles.secondary}`}
                    aria-label="Switch to Arabic"
                  >
                    AR
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm hover:brightness-110 transition ${themeStyles.accent}`}
                  >
                    View
                  </button>
                  <button
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${themeStyles.secondary}`}
                    onClick={onClose}
                    aria-label="Dismiss announcement"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {detailsOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed inset-0 z-50 p-3 md:p-6 overflow-y-auto ${themeStyles.overlay}`}
                role="dialog"
                aria-modal="true"
              >
                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`relative mx-auto w-full max-w-4xl rounded-3xl border text-white shadow-2xl overflow-hidden ${themeStyles.shell}`}
                  dir={finalDir}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/15 bg-black/45 backdrop-blur p-3 md:p-4">
                    <h3 className={`text-base md:text-lg font-bold ${finalAlign}`}>{announcementTitle}</h3>
                    <button
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${themeStyles.secondary}`}
                      onClick={() => setDetailsOpen(false)}
                      aria-label="Close details"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row max-h-[80vh] overflow-y-auto overscroll-contain">
                    {data.imageUrl && (
                      <div className="md:w-2/5 h-52 sm:h-64 md:h-auto bg-black/30 p-2 md:p-4">
                        <img src={data.imageUrl} alt="Announcement" className="w-full h-full object-contain rounded-2xl" />
                      </div>
                    )}

                    <div className={`flex-1 p-4 md:p-6 ${finalAlign} min-w-0`}>
                      <RawHtmlPreview
                        html={String(primaryHtml || "")}
                        className="announcement-modal-preview" isRTL={finalDir === 'rtl'}
                      />

                      <div className="flex flex-wrap gap-3 mt-4 items-center">
                        {videoEmbedUrl && (
                          <button
                            onClick={() => window.open(data.linkUrl, '_blank')}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors"
                          >
                            <span>▶ Watch Video</span>
                          </button>
                        )}

                        {isAudioLink && !videoEmbedUrl && (
                          <div className="w-full max-w-xs bg-slate-100 rounded-lg p-1">
                            <audio controls src={data.linkUrl || ""} className="w-full h-8" />
                          </div>
                        )}

                        {data.linkUrl && !videoEmbedUrl && !isAudioLink && (
                          <a
                            className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-700 transition-colors"
                            href={data.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Learn more
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <style>{`
                    .announcement-modal-preview .raw-html-preview-container {
                      color: #f8fafc;
                    }
                    .announcement-modal-preview .raw-html-preview-container a {
                      color: #fcd34d;
                    }
                    .announcement-modal-preview .raw-html-preview-container {
                      max-height: none;
                      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
                      line-height: 1.85;
                    }
                    .announcement-modal-preview .raw-html-preview-container article {
                      max-width: 100%;
                    }
                    .announcement-modal-preview .raw-html-preview-container h3 {
                      margin-top: 1.75rem;
                      margin-bottom: 0.65rem;
                      padding-bottom: 0.35rem;
                      color: #fde68a;
                      border-bottom: 1px solid rgba(251,191,36,.45);
                    }
                    .announcement-modal-preview .raw-html-preview-container img {
                      width: 100%;
                      max-height: 20rem;
                      object-fit: contain;
                      background: rgba(0,0,0,.28);
                      border-radius: 1rem;
                      margin: 1rem auto 1.25rem;
                    }
                    .announcement-modal-preview .raw-html-preview-container p {
                      color: #f8fafc;
                      margin: 0.8rem 0;
                    }
                    .announcement-modal-preview .raw-html-preview-container strong { color: #fcd34d; }
                    .announcement-modal-preview .raw-html-preview-container aside {
                      color: #fef3c7;
                      background: rgba(0,0,0,.28);
                      border: 1px solid rgba(251,191,36,.35);
                      border-radius: .9rem;
                      padding: .85rem 1rem;
                    }
                    .announcement-modal-preview .raw-html-preview-container figcaption {
                      color: rgba(255,255,255,.75);
                      font-size: .82rem;
                      text-align: center;
                    }
                  `}</style>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
