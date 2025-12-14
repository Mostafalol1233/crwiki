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
  const { language, toggleLanguage } = useLanguage();

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

  const safeHtml = { __html: DOMPurify.sanitize(String(data.contentHtml || "")) };

  const finalDir = (data?.direction === 'rtl') ? 'rtl' : (data?.direction === 'ltr') ? 'ltr' : (language === "ar" ? 'rtl' : 'ltr');
  const finalAlign = finalDir === 'rtl' ? 'text-right' : 'text-left';
  const videoEmbedUrl = getYouTubeEmbedUrl(data.linkUrl);
  const isAudioLink = data.linkUrl ? /(\.mp3|\.ogg|\.wav|\.m4a)([?#]|$)/i.test(data.linkUrl) : false;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative z-[61] max-w-lg w-[92%] md:w-[640px] bg-background/60 backdrop-blur-lg border border-border shadow-2xl"
            dir={finalDir}
          >
            <div className="flex items-center justify-between p-2">
              <div />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (language !== "en") toggleLanguage(); }}
                  className={`px-2 py-1 text-xs rounded ${language === "en" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => { if (language !== "ar") toggleLanguage(); }}
                  className={`px-2 py-1 text-xs rounded ${language === "ar" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  aria-label="Switch to Arabic"
                >
                  AR
                </button>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {data.imageUrl ? (
              <img src={data.imageUrl} alt="Announcement" className="w-full h-auto object-cover" />
            ) : null}
            <div className={`p-4 prose max-w-none ${finalAlign}`}>
              <div dangerouslySetInnerHTML={safeHtml} />
              {videoEmbedUrl && (
                <div className="mt-3 aspect-video">
                  <iframe
                    src={videoEmbedUrl}
                    title="Announcement video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {isAudioLink && !videoEmbedUrl && (
                <div className="mt-3">
                  <audio controls src={data.linkUrl || ""} className="w-full" />
                </div>
              )}
              {data.linkUrl && !videoEmbedUrl && !isAudioLink && (
                <div className="mt-3">
                  <a className="text-primary underline" href={data.linkUrl} target="_blank" rel="noreferrer">
                    Learn more
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
