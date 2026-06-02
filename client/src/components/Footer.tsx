import { Link } from "wouter";
import { SiX, SiYoutube, SiDiscord, SiFacebook, SiInstagram, SiTwitch } from "react-icons/si";
import { ChevronUp, Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const SectionTitle = ({ label }: { label: string }) => (
    <h4 className="font-black uppercase tracking-[0.2em] text-[10px] mb-5 pb-2.5 flex items-center gap-2" style={{ color: "#f5a623", borderBottom: "1px solid #1a1a1a" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#f5a623" }} />
      {label}
    </h4>
  );

  const FooterLinks = ({ links }: { links: { label: string; path: string }[] }) => (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.path + link.label}>
          <Link
            href={link.path}
            className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-flex items-center gap-1.5 group"
            style={{ color: "#555" }}
          >
            <span className="w-1 h-1 rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "#f5a623" }} />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const socials = [
    { href: "https://www.facebook.com/crossfireonline", icon: <SiFacebook className="h-3.5 w-3.5" />, title: "Facebook", color: "#1877f2" },
    { href: "https://x.com/CrossFireOnline", icon: <SiX className="h-3.5 w-3.5" />, title: "X / Twitter", color: "#000" },
    { href: "https://www.youtube.com/c/CrossFireWest", icon: <SiYoutube className="h-3.5 w-3.5" />, title: "YouTube", color: "#ff0000" },
    { href: "https://discord.gg/7AbuDrNNJM", icon: <SiDiscord className="h-3.5 w-3.5" />, title: "Discord", color: "#5865f2" },
    { href: "https://www.instagram.com/crossfirewest/", icon: <SiInstagram className="h-3.5 w-3.5" />, title: "Instagram", color: "#e1306c" },
    { href: "https://www.twitch.tv/cfonline/", icon: <SiTwitch className="h-3.5 w-3.5" />, title: "Twitch", color: "#9146ff" },
  ];

  return (
    <footer style={{ background: "#080808", borderTop: "2px solid #161616" }}>

      {/* ── Newsletter banner ── */}
      <div style={{ background: "linear-gradient(to right, #0f0f0f 0%, #141008 50%, #0f0f0f 100%)", borderBottom: "1px solid rgba(245,166,35,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4" style={{ color: "#f5a623" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: "#f5a623" }}>Stay Informed</span>
            </div>
            <p className="font-black uppercase text-lg md:text-xl leading-tight" style={{ color: "#e0e0e0" }}>
              Get the latest CrossFire news & events
            </p>
            <p className="text-[12px] mt-1" style={{ color: "#555" }}>Weekly digest of updates, tournaments and guides.</p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 md:w-56 h-9 px-3 text-[12px] outline-none rounded-sm"
              style={{
                background: "#141414",
                border: `1px solid ${subStatus === "err" ? "#f87171" : "rgba(255,255,255,0.1)"}`,
                color: "#ccc",
              }}
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 h-9 px-4 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all hover:brightness-110"
              style={{ background: "#f5a623", color: "#000" }}
            >
              Subscribe <ArrowRight className="h-3 w-3" />
            </button>
          </form>

          {subStatus === "ok" && (
            <div className="text-[11px] font-bold" style={{ color: "#4ade80" }}>✓ Subscribed successfully!</div>
          )}
        </div>
      </div>

      {/* ── Back to Top ── */}
      <div style={{ borderBottom: "1px solid #111" }}>
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 mx-auto px-8 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] transition-all hover:text-[#f5a623] group"
          style={{ color: "#333" }}
        >
          <ChevronUp className="h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
          BACK TO TOP
        </button>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          <div><SectionTitle label="NEWS" /><FooterLinks links={newsLinks} /></div>
          <div><SectionTitle label="GAME" /><FooterLinks links={gameLinks} /></div>
          <div><SectionTitle label="COMMUNITY" /><FooterLinks links={communityLinks} /></div>
          <div><SectionTitle label="SHOP" /><FooterLinks links={shopLinks} /></div>
          <div><SectionTitle label="SUPPORT" /><FooterLinks links={supportLinks} /></div>

          {/* Social + app info */}
          <div>
            <SectionTitle label="FOLLOW US" />
            <div className="grid grid-cols-3 gap-1.5 mb-5">
              {socials.map(({ href, icon, title, color }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  className="group flex items-center justify-center w-9 h-9 transition-all hover:-translate-y-0.5"
                  style={{ background: "#161616", borderRadius: "3px", border: "1px solid #1e1e1e" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color + "60"; (e.currentTarget as HTMLElement).style.color = color; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#555"; }}
                >
                  <span style={{ color: "#555", transition: "color 0.2s" }}>{icon}</span>
                </a>
              ))}
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: "#2e2e2e" }}>
              Join 2.4M+ players in the global CrossFire community.
            </p>

            {/* Download badge */}
            <Link href="/download">
              <div
                className="mt-4 flex items-center gap-2.5 p-3 transition-all hover:border-[#f5a623] cursor-pointer"
                style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "3px" }}
              >
                <div className="w-7 h-7 flex items-center justify-center rounded flex-shrink-0" style={{ background: "rgba(245,166,35,0.12)" }}>
                  <span style={{ color: "#f5a623", fontSize: "14px" }}>↓</span>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Play Now</p>
                  <p className="text-[11px] font-black uppercase" style={{ color: "#f5a623" }}>Download CrossFire</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: "1px solid #111" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo-new.png" alt="Bimora Gaming" className="h-5 w-auto object-contain" style={{ opacity: 0.25 }} />
            <span className="text-[10px]" style={{ color: "#2e2e2e" }}>
              © {new Date().getFullYear()} Bimora Gaming · CrossFire Wiki. Not affiliated with Smilegate or Z8Games.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/sitemap.xml", label: "Sitemap" },
              { href: "/about", label: "About" },
            ].map((l, i) => (
              <span key={l.href} className="flex items-center gap-4">
                {i > 0 && <span style={{ color: "#1e1e1e" }}>·</span>}
                <Link href={l.href} className="transition-colors hover:text-[#f5a623]" style={{ color: "#333" }}>
                  {l.label}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
