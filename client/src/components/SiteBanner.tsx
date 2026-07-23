import { useState, useEffect } from "react";
import { X, Wrench } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

const BANNER_KEY = "cf_site_banner_v1_dismissed";

export default function SiteBanner() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(BANNER_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(BANNER_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const isAr = language === "ar";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        background: "linear-gradient(90deg, #1a1000 0%, #2a1800 50%, #1a1000 100%)",
        borderBottom: "1px solid rgba(212,160,23,0.35)",
        color: "#f5d97a",
        fontSize: 13,
        fontWeight: 500,
        padding: "9px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        position: "relative",
        zIndex: 60,
        letterSpacing: 0.1,
      }}
    >
      <Wrench size={14} style={{ opacity: 0.85, flexShrink: 0 }} />
      <span style={{ textAlign: "center", lineHeight: 1.5 }}>
        {isAr
          ? "🚧 الموقع لا يزال يعاني من بعض المشكلات — فريقنا يعمل على إصلاحها. شكرًا لصبركم."
          : "🚧 The site is still experiencing some issues — our team is actively working on fixes. Thank you for your patience."}
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          [isAr ? "left" : "right"]: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#f5d97a",
          opacity: 0.7,
          padding: 4,
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
      >
        <X size={14} />
      </button>
    </div>
  );
}
