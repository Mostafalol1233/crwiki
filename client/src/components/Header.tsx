import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState } from "react";
const cfHeaderBg = "https://files.catbox.moe/c1tckc.png";

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
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { path: "/", label: t("home"), icon: CFIconHome },
    {
      label: t("explore"),
      icon: CFIconExplore,
      dropdown: [
        { path: "/modes", label: t("modes"), icon: CFIconTarget },
        { path: "/ranks", label: t("ranks"), icon: CFIconAward },
        { path: "/weapons", label: t("weapons"), icon: CFIconTarget },
        { path: "/download", label: t("download"), icon: CFIconExternal },
      ],
    },
    {
      label: t("blog"),
      icon: CFIconBook,
      dropdown: [
        { path: "/news", label: t("News&Updates"), icon: CFIconBook },
        { path: "/posts", label: t("posts"), icon: CFIconBook },
        { path: "/category/events", label: t("events"), icon: CFIconTrophy },
        { path: "/tutorials", label: t("tutorials"), icon: CFIconBook },
      ],
    },
    {
      label: t("support"),
      icon: CFIconHelp,
      dropdown: [
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
        { path: "/sellers", label: t("sellers"), icon: CFIconCart },
        { path: "/reviews", label: t("reviews"), icon: CFIconBook },
      ],
    },
    { path: "/mercenaries", label: t("Mercenaries"), icon: CFIconUsers },
  ];

  const isActiveDropdown = (items: DropdownItem[]) => {
    return items.some((item) => location === item.path);
  };

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpandedMenu(mobileExpandedMenu === label ? null : label);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Black Top Bar */}
      <div className="w-full bg-black/95 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center justify-end gap-6 text-xs md:text-sm">
          <Link href="/support" className="hover:underline">Support ▼</Link>
          <Link href="/login" className="hover:underline">Log In</Link>
          <Link href="/register" className="hover:underline">Sign Up</Link>
        </div>
      </div>

      {/* White Main Bar */}
      <div className="w-full border-b shadow bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex h-14 md:h-16 items-center gap-4">
            {/* Left: CrossFire wing emblem */}
            <Link href="/" className="flex items-center flex-shrink-0" data-testid="link-logo">
              <svg viewBox="0 0 64 24" width="64" height="24" aria-hidden>
                <path d="M2 12 L10 4 L28 4 L20 12 L28 20 L10 20 Z" fill="#000" />
                <path d="M30 4 L62 4 L54 12 L62 20 L30 20 L38 12 Z" fill="#000" />
              </svg>
              <span className="sr-only">CrossFire</span>
            </Link>

            {/* Center: Main navigation items */}
            <nav className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center gap-1">
                {/* NEWS with dropdown */}
                <div className="relative group">
                  <button className="px-4 py-2 text-sm uppercase italic font-extrabold tracking-wide text-black hover:underline">
                    NEWS
                    <ChevronDown className="inline-block ml-1 h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="py-2">
                      <Link href="/category/news" className="block px-4 py-2 text-sm italic text-gray-600 hover:bg-gray-100">NEWS</Link>
                      <Link href="/news" className="block px-4 py-2 text-sm italic text-gray-600 hover:bg-gray-100">UPDATES</Link>
                      <Link href="/events" className="block px-4 py-2 text-sm italic text-gray-600 hover:bg-gray-100">EVENTS</Link>
                      <Link href="/mercenaries" className="block px-4 py-2 text-sm italic text-gray-600 hover:bg-gray-100">RIVAL FACTIONS</Link>
                    </div>
                  </div>
                </div>

                {/* Other items */}
                <Link href="/modes" className="px-4 py-2 text-sm uppercase italic font-extrabold tracking-wide text-black hover:underline">GAME</Link>
                <Link href="/ranks" className="px-4 py-2 text-sm uppercase italic font-extrabold tracking-wide text-black hover:underline">RANKING</Link>
                <Link href="/community" className="px-4 py-2 text-sm uppercase italic font-extrabold tracking-wide text-black hover:underline">COMMUNITY</Link>
                <Link href="/events" className="px-4 py-2 text-sm uppercase italic font-extrabold tracking-wide text-black hover:underline">E-SPORTS</Link>
                <Link href="/sellers" className="px-4 py-2 text-sm uppercase italic font-extrabold tracking-wide text-black hover:underline">SHOP</Link>
              </div>
            </nav>

            {/* Right: Download button + toggles */}
            <div className="ml-auto flex items-center gap-2">
              <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold uppercase italic tracking-wide px-5 rounded-none">
                <Link href="/download">Download</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                data-testid="button-language-toggle"
                className="h-9 w-9 rounded-none hover:bg-gray-100"
                title={language === 'en' ? 'العربية' : 'English'}
                aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
              >
                <Globe className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                className="h-9 w-9 rounded-none hover:bg-gray-100"
                title={theme === 'light' ? 'Dark mode' : 'Light mode'}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 rounded-none hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
                title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-3 px-4 bg-white">
            <div className="grid grid-cols-1 gap-1">
              <Link href="/category/news" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">NEWS</Link>
              <Link href="/news" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">UPDATES</Link>
              <Link href="/events" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">EVENTS</Link>
              <Link href="/mercenaries" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">RIVAL FACTIONS</Link>
              <Link href="/modes" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">GAME</Link>
              <Link href="/ranks" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">RANKING</Link>
              <Link href="/community" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">COMMUNITY</Link>
              <Link href="/events" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">E-SPORTS</Link>
              <Link href="/sellers" className="block px-3 py-2 text-sm uppercase italic font-bold text-black">SHOP</Link>
              <Link href="/download" className="block px-3 py-2 text-sm uppercase italic font-extrabold text-black bg-yellow-400 text-center">DOWNLOAD</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
