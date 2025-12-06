import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

export function ImageViewerOverlay({ src, alt, open, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [pointers, setPointers] = useState<Map<number, { x: number; y: number }>>(new Map());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(6, s + 0.2));
      if (e.key === "-" || e.key === "_") setScale((s) => Math.max(1, s - 0.2));
      if (e.key === "ArrowLeft") setTranslate((t) => ({ ...t, x: t.x + 20 }));
      if (e.key === "ArrowRight") setTranslate((t) => ({ ...t, x: t.x - 20 }));
      if (e.key === "ArrowUp") setTranslate((t) => ({ ...t, y: t.y + 20 }));
      if (e.key === "ArrowDown") setTranslate((t) => ({ ...t, y: t.y - 20 }));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setPointers(new Map());
  }, [open, src]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const next = Math.min(6, Math.max(1, scale + delta * 0.0015));
    setScale(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setPointers((prev) => new Map(prev).set(e.pointerId, { x: e.clientX, y: e.clientY }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setPointers((prev) => {
      const next = new Map(prev);
      next.delete(e.pointerId);
      return next;
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    setPointers((prev) => {
      const next = new Map(prev);
      const last = next.get(e.pointerId);
      next.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (next.size === 1 && last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
      } else if (next.size >= 2) {
        const pts = Array.from(next.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const lastPts = Array.from(prev.values());
        if (lastPts.length >= 2) {
          const lastDist = Math.hypot(lastPts[0].x - lastPts[1].x, lastPts[0].y - lastPts[1].y);
          const delta = dist - lastDist;
          setScale((s) => Math.min(6, Math.max(1, s + delta * 0.01)));
        }
      }
      return next;
    });
  };

  const onDoubleClick = () => {
    setScale((s) => (s > 1 ? 1 : 2));
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70]"
        >
          <div
            ref={containerRef}
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          <div
            className="absolute inset-0 flex items-center justify-center touch-pan-y"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={onDoubleClick}
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt || "Image"}
              className="max-w-[92vw] max-h-[92vh] select-none"
              style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, transition: "transform 120ms ease" }}
              loading="eager"
              decoding="async"
              aria-label={alt || "Image viewer"}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useZoomableImages(container: React.RefObject<HTMLElement>, openViewer: (src: string, alt?: string) => void) {
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
    imgs.forEach((img) => {
      try {
        img.loading = "lazy";
        img.decoding = "async" as any;
      } catch {}
      img.style.maxWidth = "800px";
      img.style.height = "auto";
      img.style.cursor = "zoom-in";
      img.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openViewer(img.src, img.alt);
      }, { once: false });
    });
    return () => {
      imgs.forEach((img) => {
        img.style.cursor = "";
      });
    };
  }, [container, openViewer]);
}
