import { useEffect, useMemo, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { X } from "lucide-react";

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
};

export default function AnnouncementModal({ location }: { location: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Announcement | null>(null);
  const [scope, setScope] = useState<string>("global");

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
              setData(json);
              scopeLabel = "global";
              setScope(scopeLabel);
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
      setOpen(!dismissed);
    } else {
      setOpen(false);
    }
  }, [loading, data, scope]);

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* modal */}
      <div className="relative z-[61] max-w-lg w-[92%] md:w-[640px] bg-background/60 backdrop-blur-lg border border-border shadow-2xl">
        <button
          className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded hover:bg-muted"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {data.imageUrl ? (
          <img src={data.imageUrl} alt="Announcement" className="w-full h-auto object-cover" />
        ) : null}
        <div className="p-4 prose max-w-none">
          <div dangerouslySetInnerHTML={safeHtml} />
          {data.linkUrl ? (
            <div className="mt-3">
              <a className="text-primary underline" href={data.linkUrl} target="_blank" rel="noreferrer">
                Learn more
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
