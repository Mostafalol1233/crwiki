import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, ChevronDown, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState, useEffect } from "react";
const siteLogoImage = "/logo-new.png";

function CFIconHome(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M3 11 L12 3 L21 11 L19 11 L19 21 L5 21 L5 11 Z" fill="url(#g)" stroke="#8a8a8a" strokeWidth="1.2" />
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b2b2b" />
          <stop offset="50%" stopColor="#5a5a5a" />
          <stop offset="100%" stopColor="#1c1c1c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconExplore(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M12 2 L15 9 L22 12 L15 15 L12 22 L9 15 L2 12 L9 9 Z" fill="url(#g2)" stroke="#8a8a8a" strokeWidth="1.2" />
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e2e2e" />
          <stop offset="50%" stopColor="#6a6a6a" />
          <stop offset="100%" stopColor="#202020" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconBook(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M4 4 H18 A2 2 0 0 1 20 6 V20 H6 A2 2 0 0 1 4 18 Z" fill="url(#g3)" stroke="#8a8a8a" strokeWidth="1.2" />
      <path d="M6 6 H20 V8 H6 Z" fill="#999" />
      <defs>
        <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#303030" />
          <stop offset="50%" stopColor="#707070" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconUsers(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M7 12 A3 3 0 1 0 7 6 A3 3 0 0 0 7 12 Z" fill="url(#g4)" stroke="#8a8a8a" strokeWidth="1.2" />
      <path d="M17 12 A3 3 0 1 0 17 6 A3 3 0 0 0 17 12 Z" fill="url(#g4)" stroke="#8a8a8a" strokeWidth="1.2" />
      <path d="M2 22 C2 18 6 16 9 16 C12 16 16 18 16 22 Z" fill="#3a3a3a" stroke="#8a8a8a" strokeWidth="1.1" />
      <path d="M8 22 C8 18 12 16 15 16 C18 16 22 18 22 22 Z" fill="#2e2e2e" stroke="#8a8a8a" strokeWidth="1.1" />
      <defs>
        <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b3b3b" />
          <stop offset="50%" stopColor="#7a7a7a" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconTrophy(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M6 4 H18 V6 A4 4 0 0 1 14 10 H10 A4 4 0 0 1 6 6 Z" fill="url(#g5)" stroke="#8a8a8a" strokeWidth="1.2" />
      <path d="M10 10 V14 H14 V10" fill="#555" />
      <path d="M8 14 H16 V18 H8 Z" fill="#666" stroke="#8a8a8a" strokeWidth="1" />
      <defs>
        <linearGradient id="g5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#808080" />
          <stop offset="100%" stopColor="#1f1f1f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconHelp(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z" fill="url(#g6)" stroke="#8a8a8a" strokeWidth="1.2" />
      <path d="M10 9 C10 7 12 6 14 7 C15 8 15 9 14 10 C13 11 12 11 12 13" stroke="#cfcfcf" strokeWidth="1.2" fill="none" />
      <rect x="11" y="16" width="2" height="2" fill="#cfcfcf" />
      <defs>
        <linearGradient id="g6" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#303030" />
          <stop offset="50%" stopColor="#696969" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconCart(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M3 4 H6 L7 10 H19 L21 6 H8" fill="url(#g7)" stroke="#8a8a8a" strokeWidth="1.2" />
      <circle cx="9" cy="19" r="2" fill="#767676" />
      <circle cx="17" cy="19" r="2" fill="#767676" />
      <defs>
        <linearGradient id="g7" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#7b7b7b" />
          <stop offset="100%" stopColor="#202020" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconTarget(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <circle cx="12" cy="12" r="8" fill="url(#g8)" stroke="#8a8a8a" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="4" fill="#5f5f5f" />
      <path d="M12 2 V6 M12 18 V22 M2 12 H6 M18 12 H22" stroke="#9a9a9a" strokeWidth="1.2" />
      <defs>
        <linearGradient id="g8" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2e2e2e" />
          <stop offset="50%" stopColor="#6e6e6e" />
          <stop offset="100%" stopColor="#1f1f1f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconAward(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M12 3 L15 9 L22 10 L17 14 L18 21 L12 18 L6 21 L7 14 L2 10 L9 9 Z" fill="url(#g9)" stroke="#8a8a8a" strokeWidth="1.2" />
      <defs>
        <linearGradient id="g9" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="50%" stopColor="#7a7a7a" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CFIconExternal(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M14 4 H20 V10 H18 V7 L10 15 L9 14 L17 6 H14 Z" fill="#7a7a7a" stroke="#8a8a8a" strokeWidth="1.2" />
      <rect x="4" y="10" width="8" height="8" fill="url(#g10)" stroke="#8a8a8a" strokeWidth="1.2" />
      <defs>
        <linearGradient id="g10" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#303030" />
          <stop offset="50%" stopColor="#6a6a6a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface DropdownItem {
  path: string;
  label: string;
  icon?: any;
}

interface MenuItem {
  label: string;
  path?: string;
  icon?: any;
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

  const menuItems: MenuItem[] = [
    {
      label: t("explore"),
      icon: CFIconExplore,
      dropdown: [
        { path: "/modes", label: t("modes"), icon: CFIconTarget },
        { path: "/maps", label: t("maps") || "Maps", icon: CFIconTarget },
        { path: "/ranks", label: t("ranks"), icon: CFIconAward },
        { path: "/weapons", label: t("weapons"), icon: CFIconTarget },
        { path: "/download", label: t("download"), icon: CFIconExternal },
      ],
    },
    {
      label: t("blog"),
      icon: CFIconBook,
      dropdown: [
        { path: "/news", label: t("newsAndUpdates"), icon: CFIconBook },
        { path: "/posts", label: t("posts"), icon: CFIconBook },
        { path: "/category/events", label: t("events"), icon: CFIconTrophy },
        { path: "/videos", label: t("videos"), icon: CFIconBook },
      ],
    },
    {
      label: t("support"),
      icon: CFIconHelp,
      dropdown: [
        { path: "/faq", label: t("faq") || "FAQ", icon: CFIconHelp },
        { path: "/support", label: t("createTicket") || "Create Ticket", icon: CFIconHelp },
        { path: "/my-tickets", label: t("supportTickets"), icon: CFIconHelp },
        { path: "/about", label: t("about"), icon: CFIconUsers },
        { path: "/contact", label: t("contact"), icon: CFIconUsers },
      ],
    },
    {
      label: t("pricing"),
      icon: CFIconCart,
      dropdown: [
        { path: "/pricing", label: t("pricing"), icon: CFIconCart },
        { path: "/sellers", label: t("sellers"), icon: CFIconCart },
        { path: "/reviews", label: t("reviews"), icon: CFIconBook },
      ],
    },
    { path: "/mercenaries", label: t("mercenaries"), icon: CFIconUsers },
  ];

  const isActiveDropdown = (items: DropdownItem[]) => {
    return items.some((item) => location === item.path);
  };

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpandedMenu(mobileExpandedMenu === label ? null : label);
  };

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: "#0d0d0d" }}>
      {/* Top utility bar */}
      <div className="w-full" style={{ background: "#070707", borderBottom: "1px solid #1a1a1a" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-8 flex items-center justify-end gap-4 text-xs">
          {(() => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
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
                      <span>{user.username || 'Profile'}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <div className="absolute right-0 mt-1 w-44 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{ background: "#111", border: "1px solid #222" }}>
                      <Link href="/profile" className="block px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>Profile</Link>
                      <Link href="/my-tickets" className="block px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>My Tickets</Link>
                      <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; }} className="block w-full text-left px-4 py-2 text-xs transition-colors hover:text-[#f5a623]" style={{ color: "#aaa" }}>Logout</button>
                    </div>
                  </div>
                </>
              );
            }
            return (
              <>
                <Link href="/login" className="transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>{t("login")}</Link>
                <span style={{ color: "#333" }}>|</span>
                <Link href="/register" className="transition-colors hover:text-[#f5a623]" style={{ color: "#888" }}>{t("signUp")}</Link>
              </>
            );
          })()}
        </div>
      </div>

      {/* Main nav bar — dark metallic CF style */}
      <div className="w-full relative" style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)", borderBottom: "2px solid #f5a623" }}>
        {/* Decorative angled left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-16 hidden lg:block" style={{ background: "linear-gradient(to right, #070707, transparent)", clipPath: "polygon(0 0, 70% 0, 100% 100%, 0 100%)" }} />
        {/* Decorative angled right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-16 hidden lg:block" style={{ background: "linear-gradient(to left, #070707, transparent)", clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }} />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex h-16 md:h-[72px] items-center gap-2">
            {/* Logo */}
            <Link href="/" aria-label="Home" className="flex items-center flex-shrink-0 group mr-2" data-testid="link-logo">
              <img
                src={siteLogoImage}
                alt="CrossFire"
                className="h-14 md:h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-2xl"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width="320"
                height="200"
                onError={(e) => { (e.target as HTMLImageElement).src = "/crossfire-favicon.png"; }}
                draggable={false}
                data-testid="img-logo"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center flex-1">
              {menuItems.map((item) => (
                <div key={item.label} className="relative group">
                  {item.dropdown ? (
                    <>
                      <button
                        className="px-4 py-2 text-sm font-black italic uppercase tracking-wide transition-colors hover:text-[#f5a623]"
                        style={{ color: isActiveDropdown(item.dropdown) ? "#f5a623" : "#ccc" }}
                        data-testid={`button-dropdown-${item.label.toLowerCase()}`}
                      >
                        {item.label}
                      </button>
                      <div className="absolute left-0 mt-0 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" style={{ background: "#111", border: "1px solid #222", top: "100%" }}>
                        {item.dropdown.map((subitem) => (
                          <Link
                            key={subitem.path}
                            href={subitem.path}
                            className="block px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors hover:text-[#f5a623] hover:bg-[#1a1a1a]"
                            style={{ color: location === subitem.path ? "#f5a623" : "#aaa" }}
                            data-testid={`link-dropdown-${subitem.label.toLowerCase()}`}
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.path || "#"}
                      className="px-4 py-2 text-sm font-black italic uppercase tracking-wide transition-colors hover:text-[#f5a623]"
                      style={{ color: location === item.path ? "#f5a623" : "#ccc" }}
                      data-testid={`link-nav-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Right controls */}
            <div className="ml-auto flex items-center gap-2">
              <form onSubmit={handleSearch} className="hidden lg:flex relative items-center">
                <Search className="absolute left-2.5 h-4 w-4" style={{ color: "#555" }} />
                <Input
                  type="search"
                  placeholder={t("search") || "Search..."}
                  className="pl-9 w-52 h-8 text-sm focus:w-72 transition-all duration-300"
                  style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#ccc", borderRadius: "2px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Language toggle */}
              <button
                onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
                data-testid="button-language-toggle"
                className="h-8 w-8 flex items-center justify-center transition-colors hover:text-[#f5a623]"
                style={{ color: "#888" }}
                title={language === 'en' ? 'العربية' : 'English'}
              >
                <Globe className="h-4 w-4" />
              </button>

              {/* Theme toggle */}
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                data-testid="button-theme-toggle"
                className="h-8 w-8 flex items-center justify-center transition-colors hover:text-[#f5a623]"
                style={{ color: "#888" }}
                title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              >
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden h-8 w-8 flex items-center justify-center transition-colors hover:text-[#f5a623]"
                style={{ color: "#888" }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 px-4" style={{ background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4" style={{ color: "#555" }} />
              <Input
                type="search"
                placeholder={t("search") || "Search..."}
                className="pl-9 h-9"
                style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#ccc" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={`mobile-${item.label}`} className="w-full">
                  {item.dropdown ? (
                    <>
                      <button
                        className="w-full text-left block px-3 py-2 text-sm uppercase italic font-black transition-colors hover:text-[#f5a623]"
                        style={{ color: "#ccc" }}
                        onClick={() => toggleMobileSubmenu(item.label)}
                      >
                        {item.label}
                      </button>
                      {mobileExpandedMenu === item.label && (
                        <div className="pl-5 space-y-1" style={{ borderLeft: "2px solid #f5a623" }}>
                          {item.dropdown.map((subitem) => (
                            <Link
                              key={`mobile-${subitem.path}`}
                              href={subitem.path}
                              className="block px-3 py-1.5 text-sm transition-colors hover:text-[#f5a623]"
                              style={{ color: "#888" }}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {subitem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.path || '#'}
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
