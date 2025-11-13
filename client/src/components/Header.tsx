import { Link, useLocation } from "wouter";
import { Moon, Sun, Globe, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { useLanguage } from "./LanguageProvider";
import { useState } from "react";
import logoLightImage from "@assets/generated_images/Bimora_favicon_icon_f416a2cf.png";
const logoDarkImage = logoLightImage;

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
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { path: "/", label: t("home") },
    {
      label: t("explore"),
      dropdown: [
        { path: "/modes", label: t("modes") },
        { path: "/ranks", label: t("ranks") },
        { path: "/weapons", label: t("weapons") },
      ],
    },
    {
      label: t("blog"),
      dropdown: [
        { path: "/news", label: t("posts") },
        { path: "/category/events", label: t("events") },
        { path: "/tutorials", label: t("tutorials") },
      ],
    },
    {
      label: t("support"),
      dropdown: [
        { path: "/support", label: t("createTicket") || "Create Ticket" },
        { path: "/my-tickets", label: t("supportTickets") },
        { path: "/about", label: t("about") },
        { path: "/contact", label: t("contact") },
      ],
    },
    {
      label: t("pricing"),
      dropdown: [
        { path: "/sellers", label: t("sellers") },
        { path: "/reviews", label: t("reviews") },
      ],
    },
    { path: "/mercenaries", label: t("mercenaries") },
  ];

  const isActiveDropdown = (items: DropdownItem[]) => {
    return items.some((item) => location === item.path);
  };

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpandedMenu(mobileExpandedMenu === label ? null : label);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Desktop Header */}
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0" data-testid="link-logo">
            <img 
              src={theme === 'dark' ? logoDarkImage : logoLightImage}
              alt="Bimora Gaming Blog" 
              className="h-10 md:h-12 w-auto object-contain"
              data-testid="img-logo"
            />
          </Link>

          {/* Desktop Navigation with Dropdowns */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-1">
            {menuItems.map((item) => (
              <div key={item.label} className="relative group">
                {item.dropdown ? (
                  <>
                    <button
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                        isActiveDropdown(item.dropdown)
                          ? "text-foreground bg-accent/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                      }`}
                      data-testid={`button-dropdown-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 mt-0 w-48 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-2">
                      {item.dropdown.map((subitem) => (
                        <Link
                          key={subitem.path}
                          href={subitem.path}
                          className={`block px-4 py-2.5 text-sm transition-colors ${
                            location === subitem.path
                              ? "text-foreground font-medium bg-accent/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                          }`}
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
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      location === item.path
                        ? "text-foreground bg-accent/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                    }`}
                    data-testid={`link-nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Theme & Language Toggles */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              data-testid="button-language-toggle"
              className="h-9 w-9"
              title={language === 'en' ? 'العربية' : 'English'}
            >
              <Globe className="h-5 w-5" />
              <span className="sr-only">Toggle language</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="h-9 w-9"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
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
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
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
