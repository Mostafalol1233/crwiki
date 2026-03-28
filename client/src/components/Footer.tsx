import { Link } from "wouter";
import { SiX, SiYoutube, SiDiscord, SiFacebook, SiInstagram, SiTwitch } from "react-icons/si";
import { ChevronUp } from "lucide-react";

export function Footer() {
  const newsLinks = [
    { label: "News", path: "/news" },
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
    { label: "Download", path: "/download" },
  ];

  const communityLinks = [
    { label: "Forum / Posts", path: "/posts" },
    { label: "Reviews", path: "/reviews" },
    { label: "Tutorials", path: "/tutorials" },
  ];

  const rankingLinks = [
    { label: "Player Rankings", path: "/ranks" },
    { label: "Buy ZP", path: "/pricing" },
    { label: "Sellers", path: "/sellers" },
  ];

  const supportLinks = [
    { label: "FAQ", path: "/faq" },
    { label: "Submit Ticket", path: "/support" },
    { label: "My Tickets", path: "/my-tickets" },
    { label: "Contact Us", path: "/contact" },
  ];

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const SectionTitle = ({ label }: { label: string }) => (
    <h4 className="font-black uppercase tracking-[0.2em] text-[11px] mb-5 pb-2.5" style={{ color: "#f5a623", borderBottom: "1px solid #1e1e1e" }}>
      {label}
    </h4>
  );

  const FooterLinks = ({ links }: { links: { label: string; path: string }[] }) => (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.path + link.label}>
          <Link href={link.path} className="text-[12px] transition-all hover:text-[#f5a623] hover:translate-x-1 inline-block" style={{ color: "#666" }}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer style={{ background: "#0a0a0a", borderTop: "2px solid #1a1a1a" }}>

      {/* Back to Top */}
      <div style={{ borderBottom: "1px solid #141414" }}>
        <button
          onClick={scrollToTop}
          className="flex items-center gap-2 mx-auto px-8 py-3 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-[#f5a623] group"
          style={{ color: "#444" }}
        >
          <ChevronUp className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
          BACK TO TOP
        </button>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div><SectionTitle label="NEWS" /><FooterLinks links={newsLinks} /></div>
          <div><SectionTitle label="GAME" /><FooterLinks links={gameLinks} /></div>
          <div><SectionTitle label="COMMUNITY" /><FooterLinks links={communityLinks} /></div>
          <div><SectionTitle label="RANKINGS" /><FooterLinks links={rankingLinks} /></div>
          <div><SectionTitle label="SUPPORT" /><FooterLinks links={supportLinks} /></div>

          {/* STAY CONNECTED */}
          <div>
            <SectionTitle label="STAY CONNECTED" />
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { href: "https://www.facebook.com/crossfireonline", icon: <SiFacebook className="h-4 w-4" />, title: "Facebook" },
                { href: "https://x.com/CrossFireOnline", icon: <SiX className="h-4 w-4" />, title: "X / Twitter" },
                { href: "https://www.youtube.com/c/CrossFireWest", icon: <SiYoutube className="h-4 w-4" />, title: "YouTube" },
                { href: "https://discord.gg/7AbuDrNNJM", icon: <SiDiscord className="h-4 w-4" />, title: "Discord" },
                { href: "https://www.instagram.com/crossfirewest/", icon: <SiInstagram className="h-4 w-4" />, title: "Instagram" },
                { href: "https://www.twitch.tv/cfonline/", icon: <SiTwitch className="h-4 w-4" />, title: "Twitch" },
              ].map(({ href, icon, title }) => (
                <a
                  key={title}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={title}
                  className="flex items-center justify-center w-9 h-9 transition-all hover:bg-[#f5a623]/15 hover:text-[#f5a623] hover:-translate-y-0.5"
                  style={{ background: "#181818", color: "#555", borderRadius: "3px" }}
                >
                  {icon}
                </a>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#3a3a3a" }}>
              Join the community. Stay up-to-date with the latest CrossFire news.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #141414" }}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo-new.png" alt="Bimora Gaming" className="h-6 w-auto object-contain" style={{ opacity: 0.35 }} />
            <span className="text-[11px]" style={{ color: "#333" }}>
              © {new Date().getFullYear()} Bimora Gaming. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms & Conditions" },
              { href: "/about", label: "About" },
            ].map((l, i) => (
              <span key={l.href} className="flex items-center gap-4">
                {i > 0 && <span style={{ color: "#222" }}>|</span>}
                <Link href={l.href} className="transition-colors hover:text-[#f5a623]" style={{ color: "#3a3a3a" }}>
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
