import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, Search, ChevronDown, MessageSquare, Bell, User } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState, useEffect } from "react";

interface DropdownItem { path: string; label: string; icon?: string }
interface MenuItem { label: string; path?: string; dropdown?: DropdownItem[] }

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const navItems: MenuItem[] = [
    {
      label: t("navNews"),
      dropdown: [
        { path: "/news", label: t("news") },
        { path: "/posts", label: t("navUpdates") },
        { path: "/category/events", label: t("navEvents") },
        { path: "/videos", label: t("navVideos") },
      ],
    },
    {
      label: t("navGame"),
      dropdown: [
        { path: "/about", label: t("navGameOverview") },
        { path: "/modes", label: t("navModes") },
        { path: "/maps", label: t("navMaps") },
        { path: "/weapons", label: t("navWeapons") },
        { path: "/mercenaries", label: t("navMercenaries") },
        { path: "/ranks", label: t("navRankings") },
        { path: "/download", label: t("navDownload") },
      ],
    },
    {
      label: t("navShop"),
      dropdown: [
        { path: "/sellers", label: t("navSellers") },
        { path: "/pricing", label: "Buy ZP" },
        { path: "/reviews", label: t("navReviews") },
      ],
    },
    {
      label: t("navCommunity"),
      dropdown: [
        { path: "/posts", label: t("navForum") },
        { path: "/tutorials", label: "Tutorials" },
        { path: "/contact", label: t("navContact") },
      ],
    },
    {
      label: t("navSupport"),
      dropdown: [
        { path: "/faq", label: t("navFAQ") },
        { path: "/support", label: t("navSubmitTicket") },
        { path: "/my-tickets", label: t("navMyTickets") },
      ],
    },
  ];

  const isActiveDrop = (items: DropdownItem[]) => items.some((i) => location === i.path || location.startsWith(i.path + "/"));
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

  const NavDropdown = ({ item, align = "left" }: { item: MenuItem; align?: "left" | "right" }) => {
    if (!item.dropdown) return null;
    const active = isActiveDrop(item.dropdown);
    return (
      <div className="relative group flex items-center self-stretch">
        <button
          className="self-stretch flex items-center gap-1 px-4 text-[12px] font-bold uppercase tracking-widest transition-colors hover:text-[#f5a623]"
          style={{
            color: active ? navAccent : textColor,
            borderBottom: `2px solid ${active ? navAccent : "transparent"}`,
          }}
        >
          {item.label}
          <ChevronDown className="h-3 w-3 opacity-60 transition-transform group-hover:rotate-180 duration-200" />
        </button>
        <div
          className="absolute top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 shadow-2xl min-w-[190px]"
          style={{
            background: dropBg,
            border: `1px solid ${dropBorder}`,
            borderTop: `2px solid ${navAccent}`,
            [align === "right" ? "right" : "left"]: 0,
            marginTop: "2px",
          }}
        >
          {item.dropdown.map((sub, i) => (
            <Link
              key={`${sub.path}-${i}`}
              href={sub.path}
              className="flex items-center px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-150"
              style={{
                color: location === sub.path ? navAccent : dropText,
                background: location === sub.path ? dropHover : "transparent",
                borderBottom: i < item.dropdown!.length - 1 ? `1px solid ${dropBorder}` : "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = dropHover;
                (e.currentTarget as HTMLElement).style.color = navAccent;
                (e.currentTarget as HTMLElement).style.paddingLeft = "20px";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = location === sub.path ? dropHover : "transparent";
                (e.currentTarget as HTMLElement).style.color = location === sub.path ? navAccent : dropText;
                (e.currentTarget as HTMLElement).style.paddingLeft = "16px";
              }}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <header
      className="sticky top-0 z-50 w-full transition-shadow duration-300"
      dir="ltr"
      style={{ boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none" }}
    >
      {/* ── TOP BAR ── */}
      <div style={{ background: topBg, borderBottom: `1px solid ${topBorder}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo-new.png"
              alt="Bimora Gaming"
              className="h-14 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              draggable={false}
            />
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
                  <button
                    className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold rounded transition-all hover:border-[#f5a623] hover:text-[#f5a623]"
                    style={{ color: textColor, background: isDark ? "#1a1a1a" : "#f0f0f0", border: `1px solid ${navBorder}` }}
                  >
                    <User className="h-3 w-3" />
                    {user?.username || "Profile"}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <div
                    className="absolute right-0 top-full mt-1 w-48 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
                    style={{ background: dropBg, border: `1px solid ${dropBorder}`, borderTop: `2px solid ${navAccent}` }}
                  >
                    <Link href="/profile" className="block px-4 py-2.5 text-[12px] transition-colors hover:text-[#f5a623]" style={{ color: dropText, borderBottom: `1px solid ${dropBorder}` }}>
                      {t("navProfile")}
                    </Link>
                    <Link href="/my-tickets" className="block px-4 py-2.5 text-[12px] transition-colors hover:text-[#f5a623]" style={{ color: dropText, borderBottom: `1px solid ${dropBorder}` }}>
                      {t("navMyTickets")}
                    </Link>
                    <button
                      onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; }}
                      className="w-full text-left px-4 py-2.5 text-[12px] transition-colors hover:text-red-400"
                      style={{ color: dropText }}
                    >
                      {t("navLogout")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1 ml-1">
                <Link
                  href="/login"
                  className="h-8 px-4 flex items-center text-[12px] font-semibold rounded transition-all hover:text-[#f5a623] hover:border-[#f5a623]"
                  style={{ color: textColor, background: isDark ? "#1a1a1a" : "#f0f0f0", border: `1px solid ${navBorder}` }}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="h-8 px-4 flex items-center text-[12px] font-bold rounded transition-opacity hover:opacity-90 hover:shadow-[0_0_12px_rgba(245,166,35,0.4)]"
                  style={{ background: navAccent, color: "#000000" }}
                >
                  {t("signUp")}
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
      <div
        style={{
          background: navBg,
          borderBottom: `2px solid ${navAccent}`,
          boxShadow: isDark ? "0 2px 20px rgba(0,0,0,0.5)" : "0 2px 12px rgba(0,0,0,0.08)",
          overflow: "visible",
        }}
      >
        <div className="hidden md:flex items-center max-w-7xl mx-auto px-4 md:px-6 h-14" style={{ overflow: "visible" }}>

          <div className="flex-1" />

          {/* Left nav: NEWS + GAME */}
          <nav className="flex items-center self-stretch">
            {navItems.slice(0, 2).map((item) => (
              <NavDropdown key={item.label} item={item} align="left" />
            ))}
          </nav>

          {/* Center: Download button */}
          <div className="flex-shrink-0 flex flex-col items-center mx-5" style={{ position: "relative" }}>
            <Link href="/download">
              <button
                className="group relative overflow-hidden font-black uppercase tracking-[0.22em] text-[13px] transition-all duration-200 hover:brightness-110 active:scale-95"
                style={{
                  minWidth: "180px",
                  padding: "11px 36px",
                  background: "linear-gradient(180deg, #f9c84a 0%, #e89b10 45%, #c67800 100%)",
                  color: "#1a0a00",
                  border: "none",
                  clipPath: "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)",
                  boxShadow: "0 0 24px rgba(245,166,35,0.45), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.25)",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <span style={{ textShadow: "0 1px 1px rgba(0,0,0,0.25)" }}>DOWNLOAD</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)" }} />
              </button>
            </Link>
          </div>

          {/* Right nav: SHOP + COMMUNITY + SUPPORT */}
          <nav className="flex items-center self-stretch">
            {navItems.slice(2, 5).map((item) => (
              <NavDropdown key={item.label} item={item} align="right" />
            ))}
          </nav>

          <div className="flex-1" />
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
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${mobileExpandedMenu === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {mobileExpandedMenu === item.label && (
                      <div className="mb-1 ml-3" style={{ borderLeft: `2px solid ${navAccent}`, paddingLeft: "12px" }}>
                        {item.dropdown.map((sub, i) => (
                          <Link
                            key={`ms-${sub.path}-${i}`}
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
              <button onClick={toggleLanguage} className="h-8 w-8 flex items-center justify-center rounded hover:text-[#f5a623] transition-colors" style={{ color: mutedColor }}>
                <Globe className="h-4 w-4" />
              </button>
              <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded hover:text-[#f5a623] transition-colors" style={{ color: mutedColor }}>
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-1.5 text-[12px] font-semibold rounded transition-colors" style={{ color: textColor, border: `1px solid ${navBorder}` }} onClick={() => setMobileMenuOpen(false)}>
                  {t("login")}
                </Link>
                <Link href="/register" className="px-4 py-1.5 text-[12px] font-bold rounded" style={{ background: navAccent, color: "#000" }} onClick={() => setMobileMenuOpen(false)}>
                  {t("signUp")}
                </Link>
              </div>
            ) : (
              <Link href="/profile" className="px-4 py-1.5 text-[12px] font-semibold rounded transition-colors" style={{ color: navAccent, border: `1px solid ${navAccent}` }} onClick={() => setMobileMenuOpen(false)}>
                {user?.username}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
