import { Link } from "wouter";
import { ChevronUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import { SiDiscord, SiFacebook, SiInstagram, SiTwitch, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";
import { useLanguage } from "./LanguageProvider";
import { SITE_CONFIG } from "@/lib/siteConfig";

const GOLD = "#9a7c3f";
const GOLD_BORDER = "1px solid rgba(154,124,63,0.3)";
const socials = [
  { href: SITE_CONFIG.socials.whatsapp,  icon: SiWhatsapp,  title: "WhatsApp Channel", color: "#25d366" },
  { href: SITE_CONFIG.socials.facebook,  icon: SiFacebook,  title: "Facebook",          color: "#1877f2" },
  { href: SITE_CONFIG.socials.twitter,   icon: SiX,         title: "X / Twitter",       color: "hsl(var(--foreground))" },
  { href: SITE_CONFIG.socials.youtube,   icon: SiYoutube,   title: "YouTube",           color: "#ff0033" },
  { href: SITE_CONFIG.socials.discord,   icon: SiDiscord,   title: "Discord",           color: "#5865f2" },
  { href: SITE_CONFIG.socials.instagram, icon: SiInstagram, title: "Instagram",         color: "#e4405f" },
  { href: SITE_CONFIG.socials.twitch,    icon: SiTwitch,    title: "Twitch",            color: "#9146ff" },
];

function SectionTitle({ label }: { label: string }) {
  return (
    <h4
      style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: 800,
        fontSize: "12px",
        letterSpacing: "0.18em",
        color: GOLD,
        marginBottom: "14px",
        paddingBottom: "8px",
        borderBottom: GOLD_BORDER,
        paddingLeft: "8px",
        borderLeft: `2px solid rgba(154,124,63,0.5)`,
      }}
    >
      {label}
    </h4>
  );
}

function FooterLink({ label, path }: { label: string; path: string }) {
  const [hovered, setHovered] = useState(false);
  const { language } = useLanguage();
  const localizedPath = language === "ar" && !path.startsWith("/ar") ? `/ar${path}` : path;
  return (
    <li>
      <Link href={localizedPath}>
        <span
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: "15px",
            fontWeight: 700,
            color: hovered ? GOLD : "hsl(var(--foreground))",
            opacity: hovered ? 1 : 0.82,
            cursor: "pointer",
            transition: "color 0.2s, opacity 0.2s",
            display: "inline-block",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}

export function Footer() {
  const { t, language } = useLanguage();
  const prefix = language === "ar" ? "/ar" : "";
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "ok" | "err">("idle");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setSubStatus("err"); return; }
    setSubStatus("ok");
    setEmail("");
    setTimeout(() => setSubStatus("idle"), 4000);
  };

  const gameLinks = [
    { label: t("footerGameOverview"), path: "/about" },
    { label: t("footerGameModes"), path: "/modes" },
    { label: t("weapons"), path: "/weapons" },
    { label: t("maps"), path: "/maps" },
    { label: t("mercenaries"), path: "/mercenaries" },
    { label: t("ranks"), path: "/ranks" },
    { label: t("download"), path: "/download" },
  ];
  const communityLinks = [
    { label: t("footerForumPosts"), path: "/posts" },
    { label: t("reviews"), path: "/reviews" },
    { label: t("footerTutorials"), path: "/tutorials" },
    { label: t("footerContactUs"), path: "/contact" },
  ];
  const shopLinks = [
    { label: t("footerSellersMarket"), path: "/sellers" },
    { label: t("navServices"), path: "/services" },
    { label: t("footerCommunityReviews"), path: "/reviews" },
  ];
  const supportLinks = [
    { label: t("faq"), path: "/faq" },
    { label: t("footerSubmitTicket"), path: "/support" },
    { label: t("footerMyTickets"), path: "/my-tickets" },
  ];

  return (
    <footer
      style={{
        background: "hsl(var(--background))",
        borderTop: GOLD_BORDER,
      }}
    >
      {/* Newsletter */}
      <div style={{ borderBottom: GOLD_BORDER }}>
        <div
          className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 300,
                fontSize: "10px",
                letterSpacing: "0.18em",
                color: GOLD,
                marginBottom: "6px",
              }}
            >
              {t("footerStayInformed")}
            </p>
            <h3
              style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 300,
                fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
                letterSpacing: "0.1em",
                color: "hsl(var(--foreground))",
                margin: "0 0 4px",
              }}
            >
              {t("footerNewsEventsTitle")}
            </h3>
            <p
              style={{
                fontFamily: "'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.9rem",
                color: "hsl(var(--muted-foreground))",
                opacity: 0.6,
              }}
            >
              {t("footerNewsletterSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-stretch gap-0 w-full md:w-auto">
            <input
              type="email"
              placeholder={t("footerEmailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px 14px",
                fontFamily: "'EB Garamond', serif",
                fontSize: "14px",
                background: "transparent",
                border: subStatus === "err" ? "1px solid rgba(239,68,68,0.6)" : GOLD_BORDER,
                borderRight: "none",
                color: "hsl(var(--foreground))",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 18px",
                fontFamily: "'Cinzel', serif",
                fontSize: "10px",
                letterSpacing: "0.18em",
                fontWeight: 400,
                background: "transparent",
                border: GOLD_BORDER,
                color: GOLD,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(154,124,63,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {t("footerSubscribe")} <ArrowRight size={12} strokeWidth={1.5} />
            </button>
          </form>

          {subStatus === "ok" && (
            <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.88rem", color: GOLD }}>
              {t("footerSubscribed")}
            </span>
          )}
        </div>
      </div>

      {/* Back to top */}
      <div style={{ borderBottom: GOLD_BORDER }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: "0 auto",
            padding: "10px 24px",
            fontFamily: "'Cinzel', serif",
            fontSize: "9px",
            letterSpacing: "0.25em",
            color: "hsl(var(--muted-foreground))",
            background: "none",
            border: "none",
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
        >
          <ChevronUp size={14} strokeWidth={1.5} /> {t("footerBackToTop")}
        </button>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10">
          <div>
            <SectionTitle label={t("footerNewsSection")} />
            <ul className="space-y-2.5">
              <FooterLink label={t("footerLatestNews")} path="/news" />
              <FooterLink label={t("footerUpdates")} path="/posts" />
              <FooterLink label={t("events")} path="/events" />
              <FooterLink label={t("videos")} path="/videos" />
            </ul>
          </div>
          <div>
            <SectionTitle label={t("footerGameSection")} />
            <ul className="space-y-2.5">{gameLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>
          <div>
            <SectionTitle label={t("footerCommunitySection")} />
            <ul className="space-y-2.5">{communityLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>
          <div>
            <SectionTitle label={t("footerShopSection")} />
            <ul className="space-y-2.5">{shopLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>
          <div>
            <SectionTitle label={t("footerSupportSection")} />
            <ul className="space-y-2.5">{supportLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>

          {/* Socials */}
          <div>
            <SectionTitle label={t("footerFollowSection")} />
            <div className="grid grid-cols-4 gap-2 mb-5">
              {socials.map(({ href, icon: Icon, title, color }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  aria-label={title}
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: GOLD_BORDER,
                    color,
                    background: "rgba(154,124,63,0.05)",
                    fontSize: "18px",
                    transition: "color 0.2s, border-color 0.2s, background 0.2s, transform 0.2s",
                    textDecoration: "none",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = GOLD; el.style.background = "rgba(154,124,63,0.12)"; el.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(154,124,63,0.3)"; el.style.background = "rgba(154,124,63,0.05)"; el.style.transform = "translateY(0)"; }}
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </div>
            <a
              href={SITE_CONFIG.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  border: GOLD_BORDER,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  background: "rgba(37,211,102,0.06)",
                  marginBottom: "8px",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.06)"; }}
              >
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", color: "hsl(var(--foreground))", opacity: 0.75, marginBottom: "2px" }}>{t("footerJoinCommunity")}</p>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: 900, letterSpacing: "0.12em", color: "#128c4a" }}>{t("footerWhatsappChannel")}</p>
              </div>
            </a>
            <Link href={`${prefix}/download`}>
              <div
                style={{
                  padding: "10px 12px",
                  border: GOLD_BORDER,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  background: "transparent",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(154,124,63,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "10px", fontWeight: 800, letterSpacing: "0.2em", color: "hsl(var(--foreground))", opacity: 0.75, marginBottom: "2px" }}>{t("footerPlayNow")}</p>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "14px", fontWeight: 900, letterSpacing: "0.12em", color: GOLD }}>{t("footerDownloadCF")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: GOLD_BORDER }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <span
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: "14px",
              fontWeight: 700,
              color: "hsl(var(--foreground))",
              opacity: 0.7,
            }}
          >
            {t("copyright")}
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            {[
              { href: "/privacy", label: t("footerPrivacy") },
              { href: "/terms", label: t("footerTerms") },
              { href: "/about", label: t("about") },
            ].map(({ href, label }) => (
              <Link key={href} href={`${prefix}${href}`}>
                <span
                  style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "hsl(var(--foreground))",
                    opacity: 0.75,
                    cursor: "pointer",
                    transition: "opacity 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.color = GOLD; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0.75"; el.style.color = "hsl(var(--foreground))"; }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
