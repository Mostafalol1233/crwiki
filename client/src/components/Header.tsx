import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, Search, MessageSquare, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState } from "react";
const siteLogoImage = "/logo-new.png";
const centerLogoImage = "/crossfire-logo.png";

interface DropdownItem { path: string; label: string }
interface MenuItem { label: string; path?: string; dropdown?: DropdownItem[] }

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { setLocation(`/search?q=${encodeURIComponent(searchQuery)}`); setMobileMenuOpen(false); }
  };

  const leftMenuItems: MenuItem[] = [
    {
      label: "NEWS",
      dropdown: [
        { path: "/news", label: "News" },
        { path: "/posts", label: "Updates" },
        { path: "/category/events", label: "Events" },
        { path: "/videos", label: "Feeds" },
      ],
    },
    {
      label: "GAME",
      dropdown: [
        { path: "/about", label: "Game Overview" },
        { path: "/modes", label: "Modes" },
        { path: "/maps", label: "Maps" },
        { path: "/weapons", label: "Weapons" },
        { path: "/mercenaries", label: "Mercenaries" },
        { path: "/download", label: "Download" },
      ],
    },
  ];

  const rightMenuItems: MenuItem[] = [
    {
      label: "RANKING",
      dropdown: [
        { path: "/ranks#exp", label: "EXP Ranking" },
        { path: "/ranks#competitive", label: "Competitive Ranking" },
      ],
    },
    {
      label: "COMMUNITY",
      dropdown: [
        { path: "/posts", label: "Forum" },
        { path: "/reviews", label: "Reviews" },
        { path: "/contact", label: "Contact" },
      ],
    },
    {
      label: "SUPPORT",
      dropdown: [
        { path: "/faq", label: "FAQ" },
        { path: "/support", label: "Submit Ticket" },
        { path: "/my-tickets", label: "My Tickets" },
      ],
    },
  ];

  const isActiveDrop = (items: DropdownItem[]) => items.some((i) => location === i.path);
  const toggleMobileSub = (label: string) => setMobileExpandedMenu(mobileExpandedMenu === label ? null : label);

  const NavItem = ({ item }: { item: MenuItem }) => {
    if (item.dropdown) {
      const active = isActiveDrop(item.dropdown);
      return (
        <div className="relative group h-full flex items-center">
          <button
            className="cf-nav-item h-full flex items-center px-4 text-[13px] font-black uppercase tracking-wider transition-colors hover:text-[#f5a623]"
            style={{ color: active ? "#f5a623" : (theme === "light" ? "#444" : "#ccc"), letterSpacing: "0.08em" }}
          >
            {item.label}
          </button>
          <div
            className="absolute left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pt-0"
            style={{ top: "100%", minWidth: "190px", background: theme === "light" ? "linear-gradient(180deg,#ffffff 0%,#f7f7f7 100%)" : "linear-gradient(180deg,#1e1e1e 0%,#131313 100%)", border: theme === "light" ? "1px solid #dadada" : "1px solid #2a2a2a", borderTop: "2px solid #f5a623" }}
          >
            {item.dropdown.map((sub) => (
              <Link
                key={sub.path}
                href={sub.path}
                className="block px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all hover:text-[#f5a623] hover:pl-6"
                style={{ color: location === sub.path ? "#f5a623" : (theme === "light" ? "#555" : "#888"), borderBottom: theme === "light" ? "1px solid #ececec" : "1px solid #1a1a1a" }}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      );
    }
    return (
      <Link
        href={item.path || "#"}
        className="cf-nav-item h-full flex items-center px-4 text-[13px] font-black uppercase tracking-wider transition-colors hover:text-[#f5a623]"
        style={{ color: location === item.path ? "#f5a623" : (theme === "light" ? "#444" : "#ccc"), letterSpacing: "0.08em" }}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ── Top utility bar ── */}
      <div style={{ background: theme === "light" ? "#f7f7f7" : "#060606", borderBottom: theme === "light" ? "1px solid #d9d9d9" : "1px solid #181818" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center justify-between gap-3 text-[12px]">
          {/* Site logo — left */}
          <Link href="/" aria-label="Home" className="flex items-center flex-shrink-0">
            <img src="/logo-new.png" alt="Bimora Gaming" className="h-7 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} draggable={false} />
          </Link>
          {(() => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            let user: any = null;
            if (userStr) { try { user = JSON.parse(userStr); } catch { } }
            if (token && user) {
              return (
                <>
                  <Link href="/chat" className="flex items-center gap-1.5 transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>
                    <MessageSquare className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Chat</span>
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 px-3 py-1 transition-colors hover:text-[#f5a623]" style={{ color: theme === "light" ? "#333" : "#ccc", background: theme === "light" ? "#ffffff" : "#151515", border: theme === "light" ? "1px solid #d6d6d6" : "1px solid #2a2a2a" }}>
                      {user.username || "Profile"} <ChevronDown className="h-3 w-3" />
                    </button>
                    <div className="absolute right-0 mt-1 w-44 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50" style={{ background: theme === "light" ? "#ffffff" : "#141414", border: theme === "light" ? "1px solid #d6d6d6" : "1px solid #2a2a2a", borderTop: "2px solid #f5a623" }}>
                      <Link href="/profile" className="block px-4 py-2 transition-colors hover:text-[#f5a623]" style={{ color: theme === "light" ? "#444" : "#aaa" }}>Profile</Link>
                      <Link href="/my-tickets" className="block px-4 py-2 transition-colors hover:text-[#f5a623]" style={{ color: theme === "light" ? "#444" : "#aaa" }}>My Tickets</Link>
                      <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; }} className="block w-full text-left px-4 py-2 transition-colors hover:text-[#f5a623]" style={{ color: theme === "light" ? "#444" : "#aaa" }}>Logout</button>
                    </div>
                  </div>
                </>
              );
            }
            return (
              <div className="flex items-center overflow-hidden" style={{ border: theme === "light" ? "1px solid #d0d0d0" : "1px solid #282828", background: theme === "light" ? "#ffffff" : "#0e0e0e" }}>
                <Link href="/register" className="px-4 py-1.5 font-bold transition-all hover:bg-[#f5a623]/10" style={{ color: "#f5a623", borderRight: theme === "light" ? "1px solid #d0d0d0" : "1px solid #282828" }}>
                  Sign Up
                </Link>
                <Link href="/login" className="px-4 py-1.5 transition-colors hover:text-[#f5a623] hover:bg-[#1a1a1a]" style={{ color: theme === "light" ? "#444" : "#aaa" }}>
                  Login
                </Link>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Main nav — CF style ── */}
      <div
        className="w-full relative"
        style={{
          backgroundImage: "url(/nav-decoration.png)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundColor: theme === "light" ? "#f3f3f3" : "#0f0f0f",
          borderTop: theme === "light" ? "1px solid #dadada" : "1px solid #2b2b2b",
          borderBottom: "2px solid #7a5310",
          boxShadow: "0 4px 30px rgba(0,0,0,0.95)",
        }}
      >

        {/* Desktop */}
        <div className="hidden md:flex items-stretch h-[70px] max-w-7xl mx-auto px-4 md:px-8 relative" style={{ zIndex: 2 }}>
          {/* LEFT NAV */}
          <nav className="flex items-stretch flex-1">
            {leftMenuItems.map((item) => <NavItem key={item.label} item={item} />)}
          </nav>

          {/* CENTER LOGO — CF logo bar image */}
          <Link href="/" aria-label="Home" className="flex-shrink-0 flex items-center px-4 group">
            <img
              src={centerLogoImage}
              alt="CrossFire"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
              loading="eager"
              width="300"
              height="50"
              onError={(e) => { (e.target as HTMLImageElement).src = siteLogoImage; }}
              draggable={false}
            />
          </Link>

          {/* RIGHT NAV */}
          <nav className="flex items-stretch flex-1 justify-end">
            {rightMenuItems.map((item) => <NavItem key={item.label} item={item} />)}

          </nav>
        </div>
        <div className="hidden md:flex justify-center pb-2 -mt-1">
          <Link
            href="/download"
            className="px-20 py-2 font-black text-xl tracking-[0.25em] uppercase"
            style={{ background: "linear-gradient(180deg,#f3ba2f 0%, #d18b00 100%)", color: "#101010", boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}
          >
            Download
          </Link>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center h-14 px-4" style={{ background: theme === "light" ? "#fafafa" : "transparent" }}>
          <Link href="/" className="mr-auto">
            <img src={siteLogoImage} alt="CrossFire" className="h-9 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/crossfire-favicon.png"; }} draggable={false} />
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={toggleLanguage} className="h-8 w-8 flex items-center justify-center hover:text-[#f5a623]" style={{ color: theme === "light" ? "#555" : "#666" }}><Globe className="h-4 w-4" /></button>
            <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center hover:text-[#f5a623]" style={{ color: theme === "light" ? "#555" : "#666" }}>{theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
            <button className="h-8 w-8 flex items-center justify-center hover:text-[#f5a623]" style={{ color: theme === "light" ? "#444" : "#ccc" }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden py-3 px-4" style={{ background: theme === "light" ? "#ffffff" : "#0d0d0d", borderBottom: theme === "light" ? "1px solid #e3e3e3" : "1px solid #1a1a1a" }}>
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: "#444" }} />
            <Input type="search" placeholder="Search..." className="pl-9 h-9" style={{ background: theme === "light" ? "#f5f5f5" : "#0a0a0a", border: theme === "light" ? "1px solid #d8d8d8" : "1px solid #2a2a2a", color: theme === "light" ? "#333" : "#ccc" }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>
          <div className="space-y-0.5">
            {[...leftMenuItems, ...rightMenuItems].map((item) => (
              <div key={`m-${item.label}`}>
                {item.dropdown ? (
                  <>
                    <button className="w-full text-left px-3 py-2 text-sm font-black uppercase tracking-wider flex items-center justify-between hover:text-[#f5a623]" style={{ color: theme === "light" ? "#444" : "#ccc" }} onClick={() => toggleMobileSub(item.label)}>
                      {item.label}
                      <ChevronDown className={`h-3 w-3 transition-transform ${mobileExpandedMenu === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {mobileExpandedMenu === item.label && (
                      <div className="pl-4 pb-1" style={{ borderLeft: "2px solid #f5a623", marginLeft: "12px" }}>
                        {item.dropdown.map((sub) => (
                          <Link key={`ms-${sub.path}`} href={sub.path} className="block px-3 py-1.5 text-xs uppercase tracking-wide transition-colors hover:text-[#f5a623]" style={{ color: theme === "light" ? "#666" : "#777" }} onClick={() => setMobileMenuOpen(false)}>
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.path || "#"} className="block px-3 py-2 text-sm font-black uppercase tracking-wider hover:text-[#f5a623]" style={{ color: theme === "light" ? "#444" : "#ccc" }} onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
