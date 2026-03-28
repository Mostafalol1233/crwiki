import { Link } from "wouter";
import { SiX, SiYoutube, SiDiscord, SiFacebook, SiInstagram } from "react-icons/si";
import { ChevronUp } from "lucide-react";

export function Footer() {
  const newsLinks = [
    { label: "News", path: "/news" },
    { label: "Updates", path: "/posts" },
    { label: "Events", path: "/category/events" },
    { label: "Video Feeds", path: "/videos" },
  ];

  const gameLinks = [
    { label: "Overview", path: "/about" },
    { label: "Game Modes", path: "/modes" },
    { label: "Weapons", path: "/weapons" },
    { label: "Maps", path: "/maps" },
    { label: "Download", path: "/download" },
  ];

  const communityLinks = [
    { label: "Forum", path: "/posts" },
    { label: "Mercenaries", path: "/mercenaries" },
    { label: "Reviews", path: "/reviews" },
  ];

  const rankingLinks = [
    { label: "Competitive Ranking", path: "/ranks" },
    { label: "EXP Ranking", path: "/ranks" },
    { label: "Clan Ranking", path: "/ranks" },
  ];

  const supportLinks = [
    { label: "Support", path: "/support" },
    { label: "FAQ", path: "/faq" },
    { label: "Create Ticket", path: "/support" },
    { label: "Contact Us", path: "/contact" },
    { label: "Purchase ZP", path: "/pricing" },
  ];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="cf-footer" style={{ background: "#0f0f0f", borderTop: "1px solid #1e1e1e" }}>

      {/* Back to Top */}
      <div style={{ borderBottom: "1px solid #1a1a1a" }}>
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 mx-auto px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-[#f5a623] group"
          style={{ color: "#666" }}
        >
          <ChevronUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
          BACK TO TOP
        </button>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* NEWS */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
              NEWS
            </h4>
            <ul className="space-y-2.5">
              {newsLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.path} className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-block" style={{ color: "#888" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* GAME */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
              GAME
            </h4>
            <ul className="space-y-2.5">
              {gameLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.path} className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-block" style={{ color: "#888" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMUNITY */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
              COMMUNITY
            </h4>
            <ul className="space-y-2.5">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.path} className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-block" style={{ color: "#888" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* RANKING */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
              RANKING
            </h4>
            <ul className="space-y-2.5">
              {rankingLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.path} className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-block" style={{ color: "#888" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
              SUPPORT
            </h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.path} className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-block" style={{ color: "#888" }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* STAY CONNECTED */}
          <div>
            <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
              STAY CONNECTED
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { href: "https://www.facebook.com", icon: <SiFacebook className="h-4 w-4" />, title: "Facebook" },
                { href: "https://twitter.com/Bemora_BEMO", icon: <SiX className="h-4 w-4" />, title: "X / Twitter" },
                { href: "https://www.youtube.com/@Bemora-site", icon: <SiYoutube className="h-4 w-4" />, title: "YouTube" },
                { href: "https://discord.gg", icon: <SiDiscord className="h-4 w-4" />, title: "Discord" },
                { href: "https://www.instagram.com", icon: <SiInstagram className="h-4 w-4" />, title: "Instagram" },
              ].map(({ href, icon, title }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  className="flex items-center justify-center w-9 h-9 transition-all hover:bg-[#f5a623]/15 hover:text-[#f5a623] hover:-translate-y-0.5"
                  style={{ background: "#1a1a1a", color: "#666", borderRadius: "3px" }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <img src="/logo-new.png" alt="Bimora" className="h-7 w-auto object-contain" style={{ opacity: 0.5 }} />
            <span className="text-[11px]" style={{ color: "#444" }}>
              © Bimora Gaming. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="transition-colors hover:text-[#f5a623]" style={{ color: "#f5a623" }}>
              Privacy Policy
            </Link>
            <span style={{ color: "#2a2a2a" }}>|</span>
            <Link href="/terms" className="transition-colors hover:text-[#f5a623]" style={{ color: "#f5a623" }}>
              Terms & Conditions
            </Link>
            <span style={{ color: "#2a2a2a" }}>|</span>
            <Link href="/about" className="transition-colors hover:text-[#f5a623]" style={{ color: "#555" }}>
              About
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
