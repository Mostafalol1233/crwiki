import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, Search, ChevronDown, MessageSquare, Download } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState } from "react";

interface DropdownItem { path: string; label: string }
interface MenuItem { label: string; path?: string; dropdown?: DropdownItem[] }

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isDark = theme === "dark";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { setLocation(`/search?q=${encodeURIComponent(searchQuery)}`); setMobileMenuOpen(false); }
  };

  const navItems: MenuItem[] = [
    {
      label: "NEWS",
      dropdown: [
        { path: "/news", label: "News" },
        { path: "/posts", label: "Updates" },
        { path: "/category/events", label: "Events" },
        { path: "/videos", label: "Videos" },
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
        { path: "/ranks", label: "Rankings" },
        { path: "/download", label: "Download" },
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

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user: any = null;
  if (userStr) { try { user = JSON.parse(userStr); } catch { } }
  const isLoggedIn = !!(token && user);

  const topBg = isDark ? "#080808" : "#ffffff";
  const topBorder = isDark ? "#1c1c1c" : "#e5e5e5";
  const navBg = isDark ? "#111111" : "#f8f8f8";
  const navBorder = isDark ? "#222222" : "#e0e0e0";
  const navAccent = "#f5a623";
  const textColor = isDark ? "#cccccc" : "#333333";
  const mutedColor = isDark ? "#666666" : "#999999";
  const dropBg = isDark ? "#141414" : "#ffffff";
  const dropBorder = isDark ? "#252525" : "#e8e8e8";
  const dropText = isDark ? "#aaaaaa" : "#444444";
  const dropHover = isDark ? "#1e1e1e" : "#f5f5f5";

  return (
    <header className="sticky top-0 z-50 w-full" dir="ltr">

      {/* ── TOP BAR ── */}
      <div style={{ background: topBg, borderBottom: `1px solid ${topBorder}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-10 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo-new.png" alt="Bimora Gaming" className="h-7 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} draggable={false} />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1">
            {/* Desktop search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center mr-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: mutedColor }} />
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-8 pr-3 text-[12px] outline-none rounded-sm w-36 focus:w-48 transition-all duration-200"
                  style={{ background: isDark ? "#1a1a1a" : "#f0f0f0", border: `1px solid ${navBorder}`, color: textColor }}
                />
              </div>
            </form>

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              title={language === "en" ? "Switch to Arabic" : "Switch to English"}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-[#f5a623]"
              style={{ color: mutedColor }}
            >
              <Globe className="h-4 w-4" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-[#f5a623]"
              style={{ color: mutedColor }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Auth */}
            {isLoggedIn ? (
              <>
                <Link href="/chat" className="hidden md:flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-[#f5a623]" style={{ color: mutedColor }}>
                  <MessageSquare className="h-4 w-4" />
                </Link>
                <div className="relative group hidden md:block">
                  <button className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold rounded transition-colors hover:text-[#f5a623]" style={{ color: textColor, background: isDark ? "#1a1a1a" : "#f0f0f0", border: `1px solid ${navBorder}` }}>
                    {user?.username || "Profile"} <ChevronDown className="h-3 w-3" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-44 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50" style={{ background: dropBg, border: `1px solid ${dropBorder}`, borderTop: `2px solid ${navAccent}` }}>
                    <Link href="/profile" className="block px-4 py-2.5 text-[12px] transition-colors hover:text-[#f5a623]" style={{ color: dropText, borderBottom: `1px solid ${dropBorder}` }}>Profile</Link>
                    <Link href="/my-tickets" className="block px-4 py-2.5 text-[12px] transition-colors hover:text-[#f5a623]" style={{ color: dropText, borderBottom: `1px solid ${dropBorder}` }}>My Tickets</Link>
                    <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; }} className="w-full text-left px-4 py-2.5 text-[12px] transition-colors hover:text-[#f5a623]" style={{ color: dropText }}>Logout</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1 ml-1">
                <Link href="/login" className="h-8 px-4 flex items-center text-[12px] font-semibold rounded transition-colors hover:text-[#f5a623]" style={{ color: textColor, background: isDark ? "#1a1a1a" : "#f0f0f0", border: `1px solid ${navBorder}` }}>
                  Login
                </Link>
                <Link href="/register" className="h-8 px-4 flex items-center text-[12px] font-bold rounded transition-opacity hover:opacity-90" style={{ background: navAccent, color: "#000000" }}>
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-8 w-8 flex items-center justify-center ml-1 rounded transition-colors hover:text-[#f5a623]"
              style={{ color: textColor }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV BAR ── */}
      <div style={{ background: navBg, borderBottom: `2px solid ${navAccent}`, boxShadow: isDark ? "0 2px 20px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.08)" }}>
        <div className="hidden md:flex items-stretch max-w-7xl mx-auto px-4 md:px-6 h-12">

          {/* Left nav items */}
          <nav className="flex items-stretch">
            {navItems.map((item) => {
              if (!item.dropdown) return null;
              const active = isActiveDrop(item.dropdown);
              return (
                <div key={item.label} className="relative group h-full flex items-center">
                  <button
                    className="h-full flex items-center gap-1 px-5 text-[12px] font-bold uppercase tracking-widest transition-colors hover:text-[#f5a623] border-b-2 border-transparent group-hover:border-[#f5a623]"
                    style={{ color: active ? navAccent : textColor }}
                  >
                    {item.label}
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </button>
                  <div
                    className="absolute left-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 shadow-xl min-w-[180px]"
                    style={{ background: dropBg, border: `1px solid ${dropBorder}`, borderTop: `2px solid ${navAccent}` }}
                  >
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className="flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all"
                        style={{
                          color: location === sub.path ? navAccent : dropText,
                          borderBottom: `1px solid ${dropBorder}`,
                          background: location === sub.path ? dropHover : "transparent",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = dropHover; (e.currentTarget as HTMLElement).style.color = navAccent; (e.currentTarget as HTMLElement).style.paddingLeft = "20px"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = location === sub.path ? dropHover : "transparent"; (e.currentTarget as HTMLElement).style.color = location === sub.path ? navAccent : dropText; (e.currentTarget as HTMLElement).style.paddingLeft = "16px"; }}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Center logo */}
          <Link href="/" className="flex-1 flex items-center justify-center px-4">
            <img
              src="/crossfire-logo.png"
              alt="CrossFire"
              className="h-8 w-auto object-contain hover:opacity-90 transition-opacity"
              onError={(e) => { (e.target as HTMLImageElement).src = "/logo-new.png"; }}
              draggable={false}
            />
          </Link>

          {/* Download CTA */}
          <div className="flex items-center">
            <Link
              href="/download"
              className="flex items-center gap-2 px-5 h-8 text-[11px] font-black uppercase tracking-widest rounded-sm transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, #f5a623 0%, #d18b00 100%)`, color: "#000000" }}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Link>
          </div>
        </div>
      </div>

      {/* ── MOBILE MENU ── */}
      {mobileMenuOpen && (
        <div style={{ background: isDark ? "#0d0d0d" : "#ffffff", borderBottom: `1px solid ${navBorder}` }}>
          {/* Mobile search */}
          <div className="px-4 pt-3 pb-2">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedColor }} />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-[13px] outline-none"
                style={{ background: isDark ? "#1a1a1a" : "#f5f5f5", border: `1px solid ${navBorder}`, color: textColor }}
              />
            </form>
          </div>

          {/* Mobile nav items */}
          <nav className="px-2 pb-3">
            {navItems.map((item) => (
              <div key={`m-${item.label}`}>
                {item.dropdown ? (
                  <>
                    <button
                      className="w-full flex items-center justify-between px-3 py-2.5 text-[12px] font-black uppercase tracking-widest rounded transition-colors hover:text-[#f5a623]"
                      style={{ color: textColor }}
                      onClick={() => toggleMobileSub(item.label)}
                    >
                      {item.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mobileExpandedMenu === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {mobileExpandedMenu === item.label && (
                      <div className="mb-1 ml-3" style={{ borderLeft: `2px solid ${navAccent}`, paddingLeft: "12px" }}>
                        {item.dropdown.map((sub) => (
                          <Link
                            key={`ms-${sub.path}`}
                            href={sub.path}
                            className="block px-2 py-2 text-[11px] uppercase tracking-wide font-semibold transition-colors hover:text-[#f5a623]"
                            style={{ color: location === sub.path ? navAccent : mutedColor }}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.path || "#"}
                    className="block px-3 py-2.5 text-[12px] font-black uppercase tracking-widest rounded transition-colors hover:text-[#f5a623]"
                    style={{ color: location === item.path ? navAccent : textColor }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile bottom row */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${navBorder}` }}>
            <div className="flex items-center gap-2">
              <button onClick={toggleLanguage} className="h-8 w-8 flex items-center justify-center rounded hover:text-[#f5a623] transition-colors" style={{ color: mutedColor }}><Globe className="h-4 w-4" /></button>
              <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded hover:text-[#f5a623] transition-colors" style={{ color: mutedColor }}>{isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
            </div>
            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-1.5 text-[12px] font-semibold rounded transition-colors" style={{ color: textColor, border: `1px solid ${navBorder}` }} onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link href="/register" className="px-4 py-1.5 text-[12px] font-bold rounded" style={{ background: navAccent, color: "#000" }} onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </div>
            ) : (
              <Link href="/profile" className="px-4 py-1.5 text-[12px] font-semibold rounded transition-colors" style={{ color: navAccent, border: `1px solid ${navAccent}` }} onClick={() => setMobileMenuOpen(false)}>{user?.username}</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
