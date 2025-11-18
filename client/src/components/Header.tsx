import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, ChevronDown, Home, BookOpen, Users, Trophy, HelpCircle, ShoppingCart, Gamepad2, Target, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState } from "react";
import logoLightImage from "@assets/generated_images/Bimora_favicon_icon_f416a2cf.png";
const logoDarkImage = logoLightImage;

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
    { path: "/", label: t("home"), icon: Home },
    {
      label: t("explore"),
      icon: Gamepad2,
      dropdown: [
        { path: "/modes", label: t("modes"), icon: Target },
        { path: "/ranks", label: t("ranks"), icon: Award },
        { path: "/weapons", label: t("weapons"), icon: Target },
      ],
    },
    {
      label: t("blog"),
      icon: BookOpen,
      dropdown: [
        { path: "/news", label: t("News&Updates"), icon: BookOpen },
        { path: "/posts", label: t("posts"), icon: BookOpen },
        { path: "/category/events", label: t("events"), icon: Trophy },
        { path: "/tutorials", label: t("tutorials"), icon: BookOpen },
      ],
    },
    {
      label: t("support"),
      icon: HelpCircle,
      dropdown: [
        { path: "/support", label: t("createTicket") || "Create Ticket", icon: HelpCircle },
        { path: "/my-tickets", label: t("supportTickets"), icon: HelpCircle },
        { path: "/about", label: t("about"), icon: Users },
        { path: "/contact", label: t("contact"), icon: Users },
      ],
    },
    {
      label: t("pricing"),
      icon: ShoppingCart,
      dropdown: [
        { path: "/sellers", label: t("sellers"), icon: ShoppingCart },
        { path: "/reviews", label: t("reviews"), icon: BookOpen },
      ],
    },
    { path: "/mercenaries", label: t("Mercenaries"), icon: Users },
  ];

  const isActiveDropdown = (items: DropdownItem[]) => {
    return items.some((item) => location === item.path);
  };

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpandedMenu(mobileExpandedMenu === label ? null : label);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background/95 via-background to-background/95 border-primary/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80 shadow-md shadow-primary/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Desktop Header */}
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo & Branding (portal-style: direct to Events hub) */}
          <Link href="/events" className="flex items-center space-x-3 flex-shrink-0 group" data-testid="link-logo">
            <div className="relative">
              <img
                src={theme === 'dark' ? logoDarkImage : logoLightImage}
                alt="Bimora Gaming - CrossFire Wiki"
                className="h-10 md:h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-300"
                width="48"
                height="48"
                data-testid="img-logo"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-base font-bold italic bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent" style={{ fontFamily: 'serif' }}>CrossFire.Wiki</span>
              <span className="text-xs text-muted-foreground font-medium italic" style={{ fontFamily: 'serif' }}>by Bimora Gaming</span>
            </div>
          </Link>

          {/* Desktop Navigation with Premium Dropdowns */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-0.5">
            {menuItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.dropdown ? (
                  <>
                    <button
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg group/btn ${
                        isActiveDropdown(item.dropdown)
                          ? "text-primary bg-primary/10 shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                      }`}
                      data-testid={`button-dropdown-${item.label.toLowerCase()}`}
                    >
                      {item.icon && <item.icon className="h-4 w-4 transition-transform" />}
                      {item.label}
                      <ChevronDown className="h-4 w-4 transition-all duration-300 group-hover/btn:rotate-180" />
                    </button>
                    
                    {/* Premium Dropdown Menu */}
                    <div className="absolute left-0 mt-1 w-56 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pt-2 -translate-y-1 group-hover:translate-y-0">
                      <div className="px-2 py-1">
                        {item.dropdown.map((subitem) => (
                          <Link
                            key={subitem.path}
                            href={subitem.path}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                              location === subitem.path
                                ? "text-foreground font-medium bg-primary/15 border border-primary/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                            }`}
                            data-testid={`link-dropdown-${subitem.label.toLowerCase()}`}
                          >
                            {subitem.icon && <subitem.icon className="h-4 w-4" />}
                            <span>{subitem.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.path || "#"}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                      location === item.path
                        ? "text-primary bg-primary/10 shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
                    }`}
                    data-testid={`link-nav-${item.label.toLowerCase()}`}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Premium Theme & Language Toggles */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              data-testid="button-language-toggle"
              className="h-9 w-9 rounded-lg hover:bg-accent/30 transition-all duration-300"
              title={language === 'en' ? 'العربية' : 'English'}
              aria-label={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Toggle language</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="h-9 w-9 rounded-lg hover:bg-accent/30 transition-all duration-300"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-lg hover:bg-accent/30 transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle mobile menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 px-2 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.dropdown ? (
                  <>
                    <button
                      onClick={() => toggleMobileSubmenu(item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        mobileExpandedMenu === item.label
                          ? "text-foreground bg-accent/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                      }`}
                      data-testid={`button-mobile-dropdown-${item.label.toLowerCase()}`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          mobileExpandedMenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    
                    {/* Mobile Dropdown Items */}
                    {mobileExpandedMenu === item.label && (
                      <div className="ml-4 mt-1 space-y-1 border-l border-border pl-4">
                        {item.dropdown.map((subitem) => (
                          <Link
                            key={subitem.path}
                            href={subitem.path}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setMobileExpandedMenu(null);
                            }}
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              location === subitem.path
                                ? "text-foreground font-medium bg-accent/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                            }`}
                            data-testid={`link-mobile-dropdown-${subitem.label.toLowerCase()}`}
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.path || "#"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      location === item.path
                        ? "text-foreground bg-accent/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                    }`}
                    data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
