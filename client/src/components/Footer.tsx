import { Link } from "wouter";
import { SiX, SiYoutube, SiDiscord, SiFacebook, SiInstagram, SiTwitch } from "react-icons/si";
import { ChevronUp, ArrowRight } from "lucide-react";
import { useState } from "react";

const GOLD = "#9a7c3f";
const GOLD_BORDER = "1px solid rgba(154,124,63,0.3)";

const newsLinks = [
  { label: "Latest News", path: "/news" },
  { label: "Updates", path: "/posts" },
  { label: "Events", path: "/category/events" },
  { label: "Videos", path: "/videos" },
];
const gameLinks = [
  { label: "Game Overview", path: "/about" },
  { label: "Game Modes", path: "/modes" },
  { label: "Weapons", path: "/weapons" },
  { label: "Maps", path: "/maps" },
  { label: "Mercenaries", path: "/mercenaries" },
  { label: "Rankings", path: "/ranks" },
  { label: "Download", path: "/download" },
];
const communityLinks = [
  { label: "Forum / Posts", path: "/posts" },
  { label: "Reviews", path: "/reviews" },
  { label: "Tutorials", path: "/tutorials" },
  { label: "Contact Us", path: "/contact" },
];
const shopLinks = [
  { label: "Sellers", path: "/sellers" },
  { label: "Buy ZP", path: "/pricing" },
  { label: "Seller Reviews", path: "/reviews" },
];
const supportLinks = [
  { label: "FAQ", path: "/faq" },
  { label: "Submit Ticket", path: "/support" },
  { label: "My Tickets", path: "/my-tickets" },
];
const socials = [
  { href: "https://www.facebook.com/crossfireonline", icon: <SiFacebook className="h-3.5 w-3.5" />, title: "Facebook" },
  { href: "https://x.com/CrossFireOnline", icon: <SiX className="h-3.5 w-3.5" />, title: "X / Twitter" },
  { href: "https://www.youtube.com/c/CrossFireWest", icon: <SiYoutube className="h-3.5 w-3.5" />, title: "YouTube" },
  { href: "https://discord.gg/7AbuDrNNJM", icon: <SiDiscord className="h-3.5 w-3.5" />, title: "Discord" },
  { href: "https://www.instagram.com/crossfirewest/", icon: <SiInstagram className="h-3.5 w-3.5" />, title: "Instagram" },
  { href: "https://www.twitch.tv/cfonline/", icon: <SiTwitch className="h-3.5 w-3.5" />, title: "Twitch" },
];

function SectionTitle({ label }: { label: string }) {
  return (
    <h4
      style={{
        fontFamily: "'Cinzel', serif",
        fontWeight: 400,
        fontSize: "10px",
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
  return (
    <li>
      <Link href={path}>
        <span
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: "13px",
            color: hovered ? GOLD : "hsl(var(--muted-foreground))",
            opacity: hovered ? 1 : 0.6,
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
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<"idle" | "ok" | "err">("idle");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setSubStatus("err"); return; }
    setSubStatus("ok");
    setEmail("");
    setTimeout(() => setSubStatus("idle"), 4000);
  };

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
              Stay Informed
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
              CrossFire News & Events
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
              Weekly digest of updates, tournaments and guides.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-stretch gap-0 w-full md:w-auto">
            <input
              type="email"
              placeholder="Your email address"
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
              Subscribe <ArrowRight className="h-3 w-3" />
            </button>
          </form>

          {subStatus === "ok" && (
            <span style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.88rem", color: GOLD }}>
              ✓ Subscribed
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
          <ChevronUp className="h-3.5 w-3.5" /> BACK TO TOP
        </button>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10">
          <div>
            <SectionTitle label="NEWS" />
            <ul className="space-y-2.5"><FooterLink label="Latest News" path="/news" /><FooterLink label="Updates" path="/posts" /><FooterLink label="Events" path="/category/events" /><FooterLink label="Videos" path="/videos" /></ul>
          </div>
          <div>
            <SectionTitle label="GAME" />
            <ul className="space-y-2.5">{gameLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>
          <div>
            <SectionTitle label="COMMUNITY" />
            <ul className="space-y-2.5">{communityLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>
          <div>
            <SectionTitle label="SHOP" />
            <ul className="space-y-2.5">{shopLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>
          <div>
            <SectionTitle label="SUPPORT" />
            <ul className="space-y-2.5">{supportLinks.map((l) => <FooterLink key={l.path} label={l.label} path={l.path} />)}</ul>
          </div>

          {/* Socials */}
          <div>
            <SectionTitle label="FOLLOW US" />
            <div className="flex flex-wrap gap-2 mb-5">
              {socials.map(({ href, icon, title }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: GOLD_BORDER,
                    color: "hsl(var(--muted-foreground))",
                    transition: "color 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = GOLD; el.style.borderColor = GOLD; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = "hsl(var(--muted-foreground))"; el.style.borderColor = "rgba(154,124,63,0.3)"; }}
                >
                  {icon}
                </a>
              ))}
            </div>
            <Link href="/download">
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
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "8px", letterSpacing: "0.2em", color: "hsl(var(--muted-foreground))", opacity: 0.5, marginBottom: "2px" }}>PLAY NOW</p>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "0.12em", color: GOLD }}>Download CrossFire</p>
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
              fontSize: "12px",
              color: "hsl(var(--muted-foreground))",
              opacity: 0.3,
            }}
          >
            © {new Date().getFullYear()} Bimora Gaming · CrossFire Wiki. Not affiliated with Smilegate or Z8Games.
          </span>
          <div style={{ display: "flex", gap: "20px" }}>
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/about", label: "About" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}>
                <span
                  style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "12px",
                    color: "hsl(var(--muted-foreground))",
                    opacity: 0.4,
                    cursor: "pointer",
                    transition: "opacity 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.color = GOLD; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0.4"; el.style.color = "hsl(var(--muted-foreground))"; }}
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
