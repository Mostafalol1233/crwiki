import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Images } from "lucide-react";

export interface GalleryItem {
  url: string;
  description?: string;
}

interface GalleryOverlayProps {
  items: GalleryItem[];
  startIndex: number;
  onClose: () => void;
}

function GalleryOverlay({ items, startIndex, onClose }: GalleryOverlayProps) {
  const [idx, setIdx] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const item = items[idx];

  useEffect(() => {
    setScale(1);
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(items.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(4, s + 0.25));
      if (e.key === "-") setScale((s) => Math.max(1, s - 0.25));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.92)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Top bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "12px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",
          }}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
            {idx + 1} / {items.length}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setScale((s) => Math.min(4, s + 0.25))} title="Zoom In"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer" }}>
              <ZoomIn size={14} />
            </button>
            <button onClick={() => setScale((s) => Math.max(1, s - 0.25))} title="Zoom Out"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer" }}>
              <ZoomOut size={14} />
            </button>
            <button onClick={onClose} title="Close"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Prev / Next */}
        {idx > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
            style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
              border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {idx < items.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
              border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Image */}
        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, maxWidth: "90vw", maxHeight: "80vh" }}>
          <div style={{ overflow: "hidden", borderRadius: 8 }}>
            <motion.img
              key={item.url}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={item.url}
              alt={item.description || "Gallery image"}
              style={{
                maxWidth: "85vw",
                maxHeight: "65vh",
                objectFit: "contain",
                display: "block",
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease",
                cursor: scale > 1 ? "zoom-out" : "zoom-in",
              }}
              onClick={() => setScale((s) => s > 1 ? 1 : 2)}
            />
          </div>
          {item.description && (
            <div style={{
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
              padding: "10px 18px", maxWidth: "60ch", textAlign: "center",
            }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6 }}>{item.description}</p>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {items.length > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "12px 20px", display: "flex", gap: 8, justifyContent: "center",
              overflowX: "auto", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
            }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 52, height: 38, flexShrink: 0, padding: 0,
                  border: i === idx ? "2px solid #f5a623" : "2px solid transparent",
                  borderRadius: 4, overflow: "hidden", cursor: "pointer",
                  opacity: i === idx ? 1 : 0.55, transition: "all 0.15s",
                }}
              >
                <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface GallerySectionProps {
  items: GalleryItem[];
  title?: string;
}

const GOLD = "#f5a623";
const BORDER = "rgba(255,255,255,0.07)";

export default function GallerySection({ items, title = "Gallery" }: GallerySectionProps) {
  const [overlayIdx, setOverlayIdx] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <>
      <section style={{ marginBottom: 40 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 1 }} />
          <Images size={14} color={GOLD} />
          <h2 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.7)", margin: 0 }}>
            {title}
          </h2>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 400, marginLeft: 4 }}>
            {items.length} image{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: items.length === 1 ? "1fr" : items.length === 2 ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: 8,
        }}
          className="gallery-grid"
        >
          {items.map((item, i) => (
            <div
              key={i}
              onClick={() => setOverlayIdx(i)}
              style={{
                position: "relative",
                aspectRatio: items.length === 1 ? "16/7" : "4/3",
                borderRadius: 6,
                overflow: "hidden",
                cursor: "zoom-in",
                border: `1px solid ${BORDER}`,
                background: "rgba(255,255,255,0.03)",
              }}
              className="gallery-item"
            >
              <img
                src={item.url}
                alt={item.description || `Gallery image ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s ease" }}
                className="gallery-img"
              />
              {/* Hover overlay */}
              <div className="gallery-hover-overlay" style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)",
                opacity: 0, transition: "opacity 0.25s",
                display: "flex", alignItems: "flex-end", padding: "12px",
              }}>
                <div style={{ flex: 1 }}>
                  {item.description && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: "0 0 4px", fontWeight: 500, lineHeight: 1.4 }}>{item.description}</p>
                  )}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <ZoomIn size={10} /> Click to zoom
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .gallery-item:hover .gallery-hover-overlay { opacity: 1 !important; }
        .gallery-item:hover .gallery-img { transform: scale(1.04); }
        @media(max-width: 640px) {
          .gallery-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {overlayIdx !== null && (
        <GalleryOverlay
          items={items}
          startIndex={overlayIdx}
          onClose={() => setOverlayIdx(null)}
        />
      )}
    </>
  );
}
