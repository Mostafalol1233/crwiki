import { SiWhatsapp } from "react-icons/si";

const WHATSAPP_LINK = "https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";
const HERO_BG = "/cf-heroes-bg.png";

// Minimal head meta for maintenance — injected directly so it works before
// the full React tree mounts. noindex keeps search engines from caching it.
function MaintenanceMeta() {
  if (typeof document !== "undefined") {
    document.title = "CrossFire Wiki — Back Soon";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "robots"); document.head.appendChild(meta); }
    meta.setAttribute("content", "noindex, nofollow");
  }
  return null;
}

export default function Maintenance() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "24px",
      position: "relative", overflow: "hidden",
      background: "#0a0a0a",
    }}>
      {/* Hero background image */}
      <img
        src={HERO_BG}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top",
          opacity: 0.22,
          pointerEvents: "none",
        }}
      />
      {/* Dark gradient overlay — bottom fade */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.82) 100%)",
      }} />

      {/* Content */}
      <div style={{ position: "relative", textAlign: "center", maxWidth: 460 }}>

        {/* Logo */}
        <img
          src="/logo-new.png"
          alt="CrossFire Wiki"
          style={{ height: 52, width: "auto", objectFit: "contain", marginBottom: 36, opacity: 0.9 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />

        {/* Status pill */}
        <div style={{ marginBottom: 28 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 14px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999,
            fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.06em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4a017", display: "inline-block" }} />
            Under Maintenance
          </span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: "clamp(2rem, 6vw, 3rem)", fontWeight: 800,
          color: "#ffffff", margin: "0 0 16px",
          letterSpacing: "-0.03em", lineHeight: 1.1,
        }}>
          We'll be back soon
        </h1>

        {/* English sub */}
        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
          margin: "0 0 20px",
        }}>
          CrossFire Wiki is currently undergoing maintenance.
          Follow us on WhatsApp to get notified when we're back.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "20px 0" }} />

        {/* Arabic */}
        <p style={{
          fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.9,
          margin: "0 0 32px", direction: "rtl",
        }}>
          الموقع حالياً تحت الصيانة.<br />
          ادخل هنا لمتابعة آخر التحديثات:
        </p>

        {/* WhatsApp CTA */}
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "13px 28px",
            background: "#25d366",
            borderRadius: 8, textDecoration: "none",
            fontSize: 15, fontWeight: 600, color: "#fff",
          }}
        >
          <SiWhatsapp size={19} />
          تابعنا على واتساب · Follow on WhatsApp
        </a>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", marginTop: 36 }}>
          CrossFire Wiki © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
