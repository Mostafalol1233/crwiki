import { SiWhatsapp } from "react-icons/si";
import { Wrench } from "lucide-react";

const WHATSAPP_LINK = "https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";

export default function Maintenance() {
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Dot grid bg */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }} />
      {/* Gold glow */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: "1px",
        background: "linear-gradient(to right, transparent, rgba(212,160,23,0.5), transparent)",
      }} />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 480 }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(212,160,23,0.12)",
          border: "1px solid rgba(212,160,23,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          <Wrench size={28} color="#d4a017" strokeWidth={1.5} />
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 14px",
          background: "rgba(212,160,23,0.1)",
          border: "1px solid rgba(212,160,23,0.25)",
          borderRadius: 999, marginBottom: 24,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4a017", boxShadow: "0 0 8px #d4a017", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#d4a017", letterSpacing: "0.08em" }}>
            Under Maintenance
          </span>
        </div>

        {/* English */}
        <h1 style={{
          fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 800,
          color: "#ffffff", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.1,
        }}>
          We'll be back soon
        </h1>
        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7,
          margin: "0 0 16px",
        }}>
          CrossFire Wiki is currently undergoing scheduled maintenance.
          Follow us on WhatsApp to get notified when we're back.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "20px 0" }} />

        {/* Arabic */}
        <p style={{
          fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.8,
          margin: "0 0 28px", direction: "rtl", fontWeight: 500,
        }}>
          الموقع حالياً تحت الصيانة.<br />
          ادخل هنا لمتابعة آخر التحديثات:
        </p>

        {/* WhatsApp button */}
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "13px 28px",
            background: "#25d366",
            borderRadius: 10, textDecoration: "none",
            fontSize: 15, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(37,211,102,0.4)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = "none";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(37,211,102,0.3)";
          }}
        >
          <SiWhatsapp size={20} />
          تابعنا على واتساب · Follow on WhatsApp
        </a>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 32 }}>
          CrossFire Wiki © {new Date().getFullYear()}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
