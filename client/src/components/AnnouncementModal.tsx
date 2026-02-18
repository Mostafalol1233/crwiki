import { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";

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

export default function AnnouncementModal({ location }: { location: string }) {
  const [open, setOpen] = useState(false);
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
    (async () => {
      setLoading(true);
      setData(null);
      try {
        try {
          const sres = await fetch(`/api/public/settings/announcements`);
          if (sres.ok) {
            const sj = await sres.json();
            setEnabled(Boolean(sj?.enabled ?? true));
            setDisplayMs(Number(sj?.displayMs ?? 0) || 0);
            if (!Boolean(sj?.enabled ?? true)) {
              return;
            }
          }
        } catch {}
        let res: Response | null = null;
        let scopeLabel = "global";

        if (sellerSlugFromPath) {
          res = await fetch(`/api/announcements/seller/${encodeURIComponent(sellerSlugFromPath)}`);
          if (res.ok) {
            const json = await res.json();
            if (!aborted && json && json.active) {
              setData(json);
              setScope(`seller:${sellerSlugFromPath}`);
            }
          }
        }

        if (!res || !res.ok || !(data && data.active)) {
          const resGlobal = await fetch(`/api/announcements/global`);
          if (resGlobal.ok) {
            const json = await resGlobal.json();
            if (!aborted && json && json.active) {
              if (location === "/") {
                setData(json);
                scopeLabel = "global";
                setScope(scopeLabel);
              }
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [sellerSlugFromPath]);

  useEffect(() => {
    if (!data) return;
    const hasEn = Boolean(data.contentHtmlEn && data.contentHtmlEn.trim().length > 0);
    const hasAr = Boolean(data.contentHtmlAr && data.contentHtmlAr.trim().length > 0);
    // If admin explicitly set direction, respect it for initial language when possible
    if (data.direction === 'rtl' && hasAr) {
      setViewLang("ar");
      return;
    }
    if (data.direction === 'ltr' && hasEn) {
      setViewLang("en");
      return;
    }
    // Fallbacks based on available content
    if (hasEn && !hasAr) {
      setViewLang("en");
    } else if (hasAr && !hasEn) {
      setViewLang("ar");
    } else if (!hasEn && !hasAr) {
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
      if (shouldOpen && displayMs > 0) {
        const timer = setTimeout(() => {
          const version2 = data.updatedAt || JSON.stringify({ c: data.contentHtml, i: data.imageUrl, l: data.linkUrl });
          const key2 = `announce_dismiss_${scope}_${version2}`;
          try { localStorage.setItem(key2, "1"); } catch {}
          setOpen(false);
        }, displayMs);
        return () => clearTimeout(timer);
      }
    } else {
      setOpen(false);
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
  };

  const primaryHtml = viewLang === "ar"
    ? (data.contentHtmlAr || data.contentHtml)
    : (data.contentHtmlEn || data.contentHtml);
  const safeHtml = { __html: DOMPurify.sanitize(String(primaryHtml || "")) };

  const explicitDir = (data?.direction === 'rtl' || data?.direction === 'ltr') ? data.direction : undefined;
  const finalDir = explicitDir || (viewLang === 'ar' ? 'rtl' : 'ltr');
  const finalAlign = finalDir === 'rtl' ? 'text-right' : 'text-left';
  const videoEmbedUrl = getYouTubeEmbedUrl(data.linkUrl);
  const isAudioLink = data.linkUrl ? /(\.mp3|\.ogg|\.wav|\.m4a)([?#]|$)/i.test(data.linkUrl) : false;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-[70px] left-0 right-0 z-40 mx-auto max-w-7xl px-4"
          role="banner"
        >
          <div
            className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-slate-900/95 via-indigo-900/95 to-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl text-white ring-1 ring-white/10"
            dir={finalDir}
          >
            {/* Header / Controls */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewLang("en")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded border border-white/10 transition-colors ${viewLang === "en" ? "bg-white text-indigo-950" : "bg-black/20 text-white/70 hover:bg-black/40"}`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setViewLang("ar")}
                className={`px-2 py-0.5 text-[10px] font-bold rounded border border-white/10 transition-colors ${viewLang === "ar" ? "bg-white text-indigo-950" : "bg-black/20 text-white/70 hover:bg-black/40"}`}
                aria-label="Switch to Arabic"
              >
                AR
              </button>
              <button
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row">
              {data.imageUrl && (
                <div className="md:w-1/3 h-32 md:h-auto relative">
                  <img 
                    src={data.imageUrl} 
                    alt="Announcement" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-indigo-900/50" />
                </div>
              )}
              
              <div className={`flex-1 p-4 md:p-6 ${finalAlign}`}>
                <div 
                  className="prose prose-invert prose-sm max-w-none text-white/90"
                  dangerouslySetInnerHTML={safeHtml} 
                />
                
                <div className="flex flex-wrap gap-3 mt-3 items-center">
                  {videoEmbedUrl && (
                    <button 
                      onClick={() => window.open(data.linkUrl, '_blank')}
                      className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors"
                    >
                      <span>▶ Watch Video</span>
                    </button>
                  )}
                  
                  {isAudioLink && !videoEmbedUrl && (
                    <div className="w-full max-w-xs bg-white/10 rounded-lg p-1">
                      <audio controls src={data.linkUrl || ""} className="w-full h-8" />
                    </div>
                  )}
                  
                  {data.linkUrl && !videoEmbedUrl && !isAudioLink && (
                    <a 
                      className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold text-indigo-950 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm"
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
