import { Link } from "wouter";
import { SiX, SiYoutube, SiDiscord, SiFacebook, SiInstagram } from "react-icons/si";
import { ChevronUp } from "lucide-react";

export function Footer() {
  const newsLinks = [
    { label: "News", path: "/news" },
    { label: "Updates", path: "/posts" },
    { label: "Events", path: "/category/events" },
    { label: "New Feeds", path: "/news" },
  ];

  const gameLinks = [
    { label: "Overview", path: "/about" },
    { label: "Getting Started", path: "/download" },
    { label: "Download", path: "/download" },
    { label: "Media", path: "/videos" },
  ];

  const communityLinks = [
    { label: "Forum", path: "/posts" },
    { label: "Shop", path: "/pricing" },
  ];

  const rankingLinks = [
    { label: "Competitive Ranking", path: "/ranks" },
    { label: "EXP Ranking", path: "/ranks" },
    { label: "Clan Ranking", path: "/ranks" },
  ];

  const supportLinks = [
    { label: "Support", path: "/support" },
    { label: "FAQ", path: "/faq" },
    { label: "Redeem Code", path: "/support" },
    { label: "Recover ID/PW", path: "/support" },
    { label: "Purchase ZP", path: "/pricing" },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="cf-footer relative" style={{ background: "#111111", borderTop: "1px solid #222" }}>

      {/* Back to Top */}
      <div className="flex justify-center" style={{ borderBottom: "1px solid #1e1e1e" }}>
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:text-[#f5a623]"
          style={{ color: "#888" }}
        >
          <ChevronUp className="h-4 w-4" />
          BACK TO TOP
        </button>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">

          {/* NEWS */}
          <div>
            <h4 className="font-black uppercase tracking-[0.18em] text-xs mb-5" style={{ color: "#f5a623" }}>
              NEWS
            </h4>
            <ul className="space-y-2.5">
              {newsLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.path}
                    className="text-xs transition-colors hover:text-[#f5a623]"
                    style={{ color: "#aaa" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* GAME */}
          <div>
            <h4 className="font-black uppercase tracking-[0.18em] text-xs mb-5" style={{ color: "#f5a623" }}>
              GAME
            </h4>
            <ul className="space-y-2.5">
              {gameLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.path}
                    className="text-xs transition-colors hover:text-[#f5a623]"
                    style={{ color: "#aaa" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMMUNITY */}
          <div>
            <h4 className="font-black uppercase tracking-[0.18em] text-xs mb-5" style={{ color: "#f5a623" }}>
              COMMUNITY
            </h4>
            <ul className="space-y-2.5">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.path}
                    className="text-xs transition-colors hover:text-[#f5a623]"
                    style={{ color: "#aaa" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* RANKING */}
          <div>
            <h4 className="font-black uppercase tracking-[0.18em] text-xs mb-5" style={{ color: "#f5a623" }}>
              RANKING
            </h4>
            <ul className="space-y-2.5">
              {rankingLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.path}
                    className="text-xs transition-colors hover:text-[#f5a623]"
                    style={{ color: "#aaa" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h4 className="font-black uppercase tracking-[0.18em] text-xs mb-5" style={{ color: "#f5a623" }}>
              SUPPORT
            </h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.path}
                    className="text-xs transition-colors hover:text-[#f5a623]"
                    style={{ color: "#aaa" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* STAY CONNECTED */}
          <div>
            <h4 className="font-black uppercase tracking-[0.18em] text-xs mb-5" style={{ color: "#f5a623" }}>
              STAY CONNECTED
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded transition-colors hover:bg-[#f5a623]/20"
                style={{ background: "#1e1e1e", color: "#aaa" }}
                title="Facebook"
              >
                <SiFacebook className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/Bemora_BEMO"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded transition-colors hover:bg-[#f5a623]/20"
                style={{ background: "#1e1e1e", color: "#aaa" }}
                title="X / Twitter"
              >
                <SiX className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/@Bemora-site"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded transition-colors hover:bg-[#f5a623]/20"
                style={{ background: "#1e1e1e", color: "#aaa" }}
                title="YouTube"
              >
                <SiYoutube className="h-4 w-4" />
              </a>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded transition-colors hover:bg-[#f5a623]/20"
                style={{ background: "#1e1e1e", color: "#aaa" }}
                title="Discord"
              >
                <SiDiscord className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded transition-colors hover:bg-[#f5a623]/20"
                style={{ background: "#1e1e1e", color: "#aaa" }}
                title="Instagram"
              >
                <SiInstagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1e1e1e" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <img src="/logo-new.png" alt="CrossFire" className="h-8 w-auto object-contain opacity-70" />
            <span className="text-xs" style={{ color: "#555" }}>
              © Smilegate West, Inc. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs transition-colors hover:text-[#f5a623]"
              style={{ color: "#f5a623" }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: "#333" }}>|</span>
            <Link
              href="/terms"
              className="text-xs transition-colors hover:text-[#f5a623]"
              style={{ color: "#f5a623" }}
            >
              Terms and Conditions
            </Link>
            <span style={{ color: "#333" }}>|</span>
            <span className="text-xs" style={{ color: "#555" }}>Imprint</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
