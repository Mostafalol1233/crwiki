import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, ChevronDown, Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState } from "react";
const siteLogoImage = "/logo-new.png";

interface DropdownItem {
  path: string;
  label: string;
}

interface MenuItem {
  label: string;
  path?: string;
  dropdown?: DropdownItem[];
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const leftMenuItems: MenuItem[] = [
    {
      label: t("explore") || "GAME",
      dropdown: [
        { path: "/modes", label: t("modes") || "Modes" },
        { path: "/maps", label: t("maps") || "Maps" },
        { path: "/ranks", label: t("ranks") || "Ranks" },
        { path: "/weapons", label: t("weapons") || "Weapons" },
        { path: "/download", label: t("download") || "Download" },
      ],
    },
    {
      label: t("blog") || "NEWS",
      dropdown: [
        { path: "/news", label: t("newsAndUpdates") || "News & Updates" },
        { path: "/posts", label: t("posts") || "Posts" },
        { path: "/category/events", label: t("events") || "Events" },
        { path: "/videos", label: t("videos") || "Videos" },
      ],
    },
    {
      label: t("pricing") || "SHOP",
      dropdown: [
        { path: "/pricing", label: t("pricing") || "Pricing" },
        { path: "/sellers", label: t("sellers") || "Sellers" },
        { path: "/reviews", label: t("reviews") || "Reviews" },
      ],
    },
  ];

  const rightMenuItems: MenuItem[] = [
    { path: "/ranks", label: t("ranks") || "RANKING" },
    { path: "/posts", label: t("community") || "COMMUNITY" },
    {
      label: t("support") || "ESPORTS",
      dropdown: [
        { path: "/faq", label: t("faq") || "FAQ" },
        { path: "/support", label: t("createTicket") || "Support Ticket" },
        { path: "/my-tickets", label: t("supportTickets") || "My Tickets" },
        { path: "/about", label: t("about") || "About" },
        { path: "/contact", label: t("contact") || "Contact" },
      ],
    },
    { path: "/mercenaries", label: t("mercenaries") || "MERCS" },
  ];

  const isActiveDropdown = (items: DropdownItem[]) =>
    items.some((item) => location === item.path);

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpandedMenu(mobileExpandedMenu === label ? null : label);
  };

  const renderNavItem = (item: MenuItem) => {
    if (item.dropdown) {
      const isActive = isActiveDropdown(item.dropdown);
      return (
        <div key={item.label} className="relative group">
          <button
            className="cf-nav-item flex items-center gap-1 px-3 py-2 text-[13px] font-black italic uppercase tracking-wider transition-colors hover:text-[#f5a623]"
            style={{ color: isActive ? "#f5a623" : "#d4d4d4" }}
          >
            {item.label}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          <div
            className="absolute left-0 mt-0 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            style={{
              background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)",
              border: "1px solid #2a2a2a",
              borderTop: "2px solid #f5a623",
              top: "100%",
            }}
          >
            {item.dropdown.map((sub) => (
              <Link
                key={sub.path}
                href={sub.path}
                className="block px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:text-[#f5a623] hover:bg-[#f5a623]/5 hover:pl-5"
                style={{ color: location === sub.path ? "#f5a623" : "#999" }}
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
        key={item.label}
        href={item.path || "#"}
        className="cf-nav-item px-3 py-2 text-[13px] font-black italic uppercase tracking-wider transition-colors hover:text-[#f5a623]"
        style={{ color: location === item.path ? "#f5a623" : "#d4d4d4" }}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top utility bar */}
      <div
        className="w-full"
        style={{
          background: "#070707",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-8 flex items-center justify-end gap-4 text-xs">
          {(() => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            let user: any = null;
            if (userStr) {
              try { user = JSON.parse(userStr); } catch { user = null; }
            }
            if (token && user) {
              return (
                <>
                  <Link href="/chat" className="flex items-center gap-1 transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Chat</span>
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center gap-1 transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>
                      <span>{user.username || "Profile"}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <div
                      className="absolute right-0 mt-1 w-44 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                      style={{ background: "#111", border: "1px solid #222" }}
                    >
                      <Link href="/profile" className="block px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>Profile</Link>
                      <Link href="/my-tickets" className="block px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>My Tickets</Link>
                      <button
                        onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; }}
                        className="block w-full text-left px-4 py-2 text-xs transition-colors hover:text-[#f5a623]"
                        style={{ color: "#aaa" }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              );
            }
            return (
              <>
                <Link href="/login" className="transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>{t("login") || "Login"}</Link>
                <span style={{ color: "#333" }}>|</span>
                <Link href="/register" className="transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>{t("signUp") || "Sign Up"}</Link>
              </>
            );
          })()}
        </div>
      </div>

      {/* Main nav bar — CF Official centered logo style */}
      <div
        className="w-full relative"
        style={{
          background: "linear-gradient(180deg, #222222 0%, #111111 60%, #0d0d0d 100%)",
          borderBottom: "2px solid #f5a623",
          boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
        }}
      >
        {/* Angled left/right decorative edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 hidden lg:block pointer-events-none"
          style={{
            background: "linear-gradient(to right, #050505, transparent)",
            clipPath: "polygon(0 0, 80% 0, 100% 100%, 0 100%)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 hidden lg:block pointer-events-none"
          style={{
            background: "linear-gradient(to left, #050505, transparent)",
            clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />

        {/* Desktop layout: left nav | logo center | right nav */}
        <div className="hidden md:flex items-center h-[68px] max-w-7xl mx-auto px-4 md:px-8">
          {/* LEFT NAV */}
          <nav className="flex items-center flex-1 justify-end pr-8">
            {leftMenuItems.map(renderNavItem)}
          </nav>

          {/* CENTER LOGO */}
          <Link href="/" aria-label="Home" className="flex-shrink-0 group">
            <img
              src={siteLogoImage}
              alt="CrossFire"
              className="h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
              loading="eager"
              width="280"
              height="180"
              onError={(e) => { (e.target as HTMLImageElement).src = "/crossfire-favicon.png"; }}
              draggable={false}
            />
          </Link>

          {/* RIGHT NAV */}
          <nav className="flex items-center flex-1 justify-start pl-8">
            {rightMenuItems.map(renderNavItem)}

            {/* Search */}
            <form onSubmit={handleSearch} className="relative ml-3 flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 pointer-events-none" style={{ color: "#555" }} />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-36 h-7 text-xs focus:w-52 transition-all duration-300 rounded-sm"
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #2a2a2a",
                  color: "#ccc",
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Language */}
            <button
              onClick={() => toggleLanguage()}
              className="ml-2 h-7 w-7 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#777" }}
              title={language === "en" ? "العربية" : "English"}
            >
              <Globe className="h-3.5 w-3.5" />
            </button>

            {/* Theme */}
            <button
              onClick={() => toggleTheme()}
              className="h-7 w-7 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#777" }}
              title={theme === "light" ? "Dark mode" : "Light mode"}
            >
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
          </nav>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex items-center h-14 px-4">
          <Link href="/" className="flex-shrink-0 mr-auto">
            <img
              src={siteLogoImage}
              alt="CrossFire"
              className="h-10 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/crossfire-favicon.png"; }}
              draggable={false}
            />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLanguage()}
              className="h-8 w-8 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#777" }}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleTheme()}
              className="h-8 w-8 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#777" }}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#ccc" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden py-3 px-4"
            style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}
          >
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: "#555" }} />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 h-9"
                style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#ccc" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="space-y-1">
              {[...leftMenuItems, ...rightMenuItems].map((item) => (
                <div key={`mobile-${item.label}`}>
                  {item.dropdown ? (
                    <>
                      <button
                        className="w-full text-left px-3 py-2 text-sm uppercase italic font-black transition-colors hover:text-[#f5a623]"
                        style={{ color: "#ccc" }}
                        onClick={() => toggleMobileSubmenu(item.label)}
                      >
                        {item.label}
                      </button>
                      {mobileExpandedMenu === item.label && (
                        <div className="pl-5 space-y-1" style={{ borderLeft: "2px solid #f5a623" }}>
                          {item.dropdown.map((sub) => (
                            <Link
                              key={`mobile-sub-${sub.path}`}
                              href={sub.path}
                              className="block px-3 py-1.5 text-sm transition-colors hover:text-[#f5a623]"
                              style={{ color: "#888" }}
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
                      className="block px-3 py-2 text-sm uppercase italic font-black transition-colors hover:text-[#f5a623]"
                      style={{ color: "#ccc" }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
