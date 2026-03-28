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
      label: "NEWS",
      dropdown: [
        { path: "/news", label: "News" },
        { path: "/posts", label: "Updates" },
        { path: "/category/events", label: "Events" },
        { path: "/videos", label: "Video Feeds" },
      ],
    },
    {
      label: "GAME",
      dropdown: [
        { path: "/about", label: "Overview" },
        { path: "/modes", label: "Game Modes" },
        { path: "/maps", label: "Maps" },
        { path: "/weapons", label: "Weapons" },
        { path: "/download", label: "Download" },
      ],
    },
    {
      label: "SHOP",
      dropdown: [
        { path: "/pricing", label: "Buy ZP" },
        { path: "/sellers", label: "Sellers" },
        { path: "/reviews", label: "Reviews" },
      ],
    },
  ];

  const rightMenuItems: MenuItem[] = [
    { path: "/ranks", label: "RANKING" },
    {
      label: "COMMUNITY",
      dropdown: [
        { path: "/posts", label: "Forum" },
        { path: "/mercenaries", label: "Mercenaries" },
        { path: "/reviews", label: "Reviews" },
      ],
    },
    {
      label: "SUPPORT",
      dropdown: [
        { path: "/faq", label: "FAQ" },
        { path: "/support", label: "Create Ticket" },
        { path: "/my-tickets", label: "My Tickets" },
        { path: "/contact", label: "Contact Us" },
      ],
    },
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
        <div key={item.label} className="relative group h-full flex items-center">
          <button
            className="cf-nav-item flex items-center gap-1 px-3 py-2 text-[13px] font-black italic uppercase tracking-wider transition-colors hover:text-[#f5a623]"
            style={{ color: isActive ? "#f5a623" : "#d4d4d4" }}
          >
            {item.label}
            <ChevronDown className="h-3 w-3 opacity-50 transition-transform group-hover:rotate-180" />
          </button>
          <div
            className="absolute left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
            style={{
              background: "linear-gradient(180deg, #1c1c1c 0%, #111 100%)",
              border: "1px solid #2a2a2a",
              borderTop: "2px solid #f5a623",
              top: "100%",
              minWidth: "180px",
            }}
          >
            {item.dropdown.map((sub) => (
              <Link
                key={sub.path}
                href={sub.path}
                className="block px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all hover:text-[#f5a623] hover:bg-[#f5a623]/5"
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
      {/* ── Top utility bar ── */}
      <div style={{ background: "#060606", borderBottom: "1px solid #1c1c1c" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center justify-end gap-3">
          {(() => {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
            let user: any = null;
            if (userStr) { try { user = JSON.parse(userStr); } catch { user = null; } }
            if (token && user) {
              return (
                <>
                  <Link
                    href="/chat"
                    className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#f5a623]"
                    style={{ color: "#aaa" }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Chat</span>
                  </Link>
                  <div className="relative group">
                    <button
                      className="flex items-center gap-1.5 text-xs px-3 py-1 transition-colors hover:text-[#f5a623]"
                      style={{
                        color: "#ccc",
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                        borderRadius: "2px",
                      }}
                    >
                      {user.username || "Profile"}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <div
                      className="absolute right-0 mt-1 w-44 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                      style={{ background: "#141414", border: "1px solid #2a2a2a", borderTop: "2px solid #f5a623" }}
                    >
                      <Link href="/profile" className="block px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>Profile</Link>
                      <Link href="/my-tickets" className="block px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>My Tickets</Link>
                      <button
                        onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/"; }}
                        className="block w-full text-left px-4 py-2 text-xs transition-colors hover:text-[#f5a623]"
                        style={{ color: "#aaa" }}
                      >Logout</button>
                    </div>
                  </div>
                </>
              );
            }
            return (
              <div className="flex items-center gap-0 text-xs" style={{ border: "1px solid #2a2a2a", borderRadius: "2px", overflow: "hidden" }}>
                <Link
                  href="/login"
                  className="px-4 py-1.5 transition-colors hover:text-[#f5a623] hover:bg-[#1a1a1a]"
                  style={{ color: "#bbb", borderRight: "1px solid #2a2a2a" }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 font-bold transition-all hover:bg-[#f5a623]/10 hover:text-[#f5a623]"
                  style={{ color: "#f5a623" }}
                >
                  Sign Up
                </Link>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Main nav bar ── */}
      <div
        className="w-full relative"
        style={{
          background: "linear-gradient(180deg, #1e1e1e 0%, #111 60%, #0d0d0d 100%)",
          borderBottom: "2px solid #f5a623",
          boxShadow: "0 4px 24px rgba(0,0,0,0.8)",
        }}
      >
        {/* Angled corner overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 hidden lg:block pointer-events-none"
          style={{ background: "linear-gradient(to right, #050505, transparent)", clipPath: "polygon(0 0, 75% 0, 100% 100%, 0 100%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 hidden lg:block pointer-events-none"
          style={{ background: "linear-gradient(to left, #050505, transparent)", clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0 100%)" }} />

        {/* Desktop: left nav | center logo | right nav */}
        <div className="hidden md:flex items-stretch h-[64px] max-w-7xl mx-auto px-4 md:px-8">

          {/* LEFT */}
          <nav className="flex items-stretch flex-1 justify-end pr-6">
            {leftMenuItems.map(renderNavItem)}
          </nav>

          {/* CENTER LOGO */}
          <Link href="/" aria-label="Home" className="flex-shrink-0 flex items-center group px-3">
            <img
              src={siteLogoImage}
              alt="CrossFire"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
              loading="eager"
              width="240"
              height="140"
              onError={(e) => { (e.target as HTMLImageElement).src = "/crossfire-favicon.png"; }}
              draggable={false}
            />
          </Link>

          {/* RIGHT */}
          <nav className="flex items-stretch flex-1 justify-start pl-6">
            {rightMenuItems.map(renderNavItem)}

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative ml-auto flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 pointer-events-none" style={{ color: "#555" }} />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 w-32 h-7 text-xs focus:w-48 transition-all duration-300 rounded-sm"
                style={{ background: "#0a0a0a", border: "1px solid #252525", color: "#ccc" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <button
              onClick={() => toggleLanguage()}
              className="ml-2 h-7 w-7 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#666" }}
              title={language === "en" ? "العربية" : "English"}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleTheme()}
              className="h-7 w-7 flex items-center justify-center transition-colors hover:text-[#f5a623]"
              style={{ color: "#666" }}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </nav>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center h-14 px-4">
          <Link href="/" className="flex-shrink-0 mr-auto">
            <img
              src={siteLogoImage}
              alt="CrossFire"
              className="h-9 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/crossfire-favicon.png"; }}
              draggable={false}
            />
          </Link>
          <div className="flex items-center gap-1.5">
            <button onClick={() => toggleLanguage()} className="h-8 w-8 flex items-center justify-center hover:text-[#f5a623]" style={{ color: "#777" }}>
              <Globe className="h-4 w-4" />
            </button>
            <button onClick={() => toggleTheme()} className="h-8 w-8 flex items-center justify-center hover:text-[#f5a623]" style={{ color: "#777" }}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              className="h-8 w-8 flex items-center justify-center hover:text-[#f5a623]"
              style={{ color: "#ccc" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden py-3 px-4" style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
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
          <div className="space-y-0.5">
            {[...leftMenuItems, ...rightMenuItems].map((item) => (
              <div key={`m-${item.label}`}>
                {item.dropdown ? (
                  <>
                    <button
                      className="w-full text-left px-3 py-2 text-sm uppercase italic font-black transition-colors hover:text-[#f5a623] flex items-center justify-between"
                      style={{ color: "#ccc" }}
                      onClick={() => toggleMobileSubmenu(item.label)}
                    >
                      {item.label}
                      <ChevronDown className={`h-3 w-3 transition-transform ${mobileExpandedMenu === item.label ? "rotate-180" : ""}`} />
                    </button>
                    {mobileExpandedMenu === item.label && (
                      <div className="pl-4 pb-1" style={{ borderLeft: "2px solid #f5a623", marginLeft: "12px" }}>
                        {item.dropdown.map((sub) => (
                          <Link
                            key={`ms-${sub.path}`}
                            href={sub.path}
                            className="block px-3 py-1.5 text-xs uppercase tracking-wide transition-colors hover:text-[#f5a623]"
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
    </header>
  );
}
