import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/components/LanguageProvider";
import RawHtmlPreview from "@/components/RawHtmlPreview";

type BellAnnouncement = {
  id: string;
  titleEn?: string;
  titleAr?: string;
  contentHtmlEn?: string;
  contentHtmlAr?: string;
  imageUrl?: string;
  linkUrl?: string;
  updatedAt?: string;
  createdAt?: string;
  direction?: string;
};

const SEEN_KEY = "cf_ann_seen_ids";
const DISMISSED_KEY = "cf_ann_dismissed_ids";
const BORDER = "rgba(255,255,255,0.08)";
const GOLD = "#f5a623";

function readIds(key: string): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeIds(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids).slice(-200)));
  } catch {}
}

function stripHtml(value: string): string {
  return String(value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fmtDate(iso: string | undefined, arabic: boolean): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(arabic ? "ar-EG" : "en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function NotificationBell() {
  const { language } = useLanguage();
  const arabic = language === "ar";
  const [items, setItems] = useState<BellAnnouncement[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BellAnnouncement | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => readIds(SEEN_KEY));
  const [dismissed, setDismissed] = useState<Set<string>>(() => readIds(DISMISSED_KEY));
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sitemap?type=announcements-list&limit=50", { headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const payload = await res.json().catch(() => ({}));
      const rows = Array.isArray(payload?.announcements) ? payload.announcements : [];
      setItems(rows.filter((r: any) => r && r.id).map((r: any) => ({ ...r, id: String(r.id) })));
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const visible = useMemo(() => items.filter((a) => !dismissed.has(a.id)), [items, dismissed]);
  const unread = useMemo(() => visible.filter((a) => !seen.has(a.id)).length, [visible, seen]);

  const titleOf = (a: BellAnnouncement) =>
    (arabic ? a.titleAr || a.titleEn : a.titleEn || a.titleAr) || (arabic ? "إعلان جديد" : "New announcement");

  const snippetOf = (a: BellAnnouncement) => {
    const html = arabic ? a.contentHtmlAr || a.contentHtmlEn : a.contentHtmlEn || a.contentHtmlAr;
    const plain = stripHtml(html || "");
    return plain.length > 110 ? `${plain.slice(0, 110)}…` : plain;
  };

  const markSeen = (id: string) => {
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeIds(SEEN_KEY, next);
      return next;
    });
  };

  const markAllRead = () => {
    setSeen((prev) => {
      const next = new Set(prev);
      visible.forEach((a) => next.add(a.id));
      writeIds(SEEN_KEY, next);
      return next;
    });
  };

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      writeIds(DISMISSED_KEY, next);
      return next;
    });
    if (selected?.id === id) setSelected(null);
  };

  const openDetails = (a: BellAnnouncement) => {
    markSeen(a.id);
    setSelected(a);
  };

  const detailHtml = selected ? (arabic ? selected.contentHtmlAr || selected.contentHtmlEn : selected.contentHtmlEn || selected.contentHtmlAr) || "" : "";
  const detailRtl = selected ? (selected.direction === "rtl" || (selected.direction !== "ltr" && arabic)) : arabic;

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={arabic ? "الإعلانات" : "Announcements"}
        aria-label={arabic ? "الإعلانات" : "Announcements"}
        style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          background: open ? "rgba(245,166,35,0.12)" : "none",
          border: `1px solid ${open ? "rgba(245,166,35,0.5)" : BORDER}`, borderRadius: 6,
          color: open ? GOLD : "rgba(255,255,255,0.6)", cursor: "pointer", position: "relative",
        }}
      >
        <Bell size={15} strokeWidth={1.8} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -6, insetInlineEnd: -6, minWidth: 17, height: 17,
            padding: "0 4px", borderRadius: 9, background: GOLD, color: "#000",
            fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "Inter, system-ui, sans-serif",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", insetInlineEnd: 0, width: 350, maxWidth: "86vw",
          background: "#111", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.65)", zIndex: 80,
        }} dir={arabic ? "rtl" : "ltr"}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
              {arabic ? "الإعلانات" : "Announcements"}
              <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}> · {visible.length}</span>
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: GOLD, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                <CheckCheck size={13} /> {arabic ? "تعليم الكل كمقروء" : "Mark all read"}
              </button>
            )}
          </div>

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {visible.length === 0 && (
              <div style={{ padding: "28px 16px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                {arabic ? "مفيش إعلانات دلوقتي — أول ما ينزل إعلان جديد هيظهر هنا." : "No announcements right now — new ones will show up here."}
              </div>
            )}
            {visible.map((a) => {
              const isNew = !seen.has(a.id);
              return (
                <div key={a.id} style={{
                  display: "flex", gap: 10, padding: "11px 14px", cursor: "pointer",
                  borderBottom: `1px solid rgba(255,255,255,0.05)`,
                  background: isNew ? "rgba(245,166,35,0.06)" : "transparent",
                }}
                  onClick={() => openDetails(a)}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = isNew ? "rgba(245,166,35,0.06)" : "transparent")}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: isNew ? GOLD : "rgba(255,255,255,0.15)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isNew ? 800 : 600, color: "#fff", lineHeight: 1.5 }}>{titleOf(a)}</div>
                    {snippetOf(a) && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginTop: 2 }}>{snippetOf(a)}</div>}
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{fmtDate(a.createdAt || a.updatedAt, arabic)}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(a.id); }}
                    aria-label={arabic ? "إخفاء" : "Dismiss"}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", alignSelf: "flex-start", padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto text-white" style={{ background: "#0a0a0a", border: `1px solid ${BORDER}` }}>
          <DialogHeader><DialogTitle className="sr-only">{selected ? titleOf(selected) : ""}</DialogTitle></DialogHeader>
          {selected && (
            <div dir={detailRtl ? "rtl" : "ltr"}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.6 }}>{titleOf(selected)}</h2>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{fmtDate(selected.createdAt || selected.updatedAt, arabic)}</div>
              {selected.imageUrl && (
                <img src={selected.imageUrl} alt="" loading="lazy" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 8, marginTop: 12 }} />
              )}
              <div style={{ marginTop: 12 }}>
                <RawHtmlPreview html={detailHtml} isRTL={detailRtl} />
              </div>
              {selected.linkUrl && (
                <a href={selected.linkUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, color: GOLD, fontSize: 13, fontWeight: 700 }}>
                  {arabic ? "افتح الرابط" : "Open link"} ↗
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
