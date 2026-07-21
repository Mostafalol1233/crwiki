import { Link, useLocation } from "wouter";
import { Globe, Menu, X, Search, ChevronDown, User, LogOut, Ticket, MessageSquare } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DropdownItem { path: string; label: string }
interface MenuItem { label: string; path?: string; dropdown?: DropdownItem[] }

const ACCENT = "#d4a017";
const BG_HEADER = "#0a0a0a";
const BORDER = "rgba(255,255,255,0.08)";

export function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Reactive auth state — tracks Supabase session changes (login / logout)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) { setLocation(`/search?q=${encodeURIComponent(searchQ)}`); setMobileOpen(false); }
  };

  const navItems: MenuItem[] = [
    {
      label: t("navNews"),
      dropdown: [
        { path: "/news", label: t("news") },
        { path: "/posts", label: t("navUpdates") },
        { path: "/events", label: t("navEvents") },
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
        { path: "/reviews", label: t("navReviews") },
      ],
    },
    {
      label: t("navCommunity"),
      dropdown: [
        { path: "/posts", label: t("navForum") },
        { path: "/tutorials", label: t("navTutorials") },
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

  const isLoggedIn = !!session?.user;
  const user = session?.user ?? null;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "Profile";

  const isActive = (items: DropdownItem[]) => items.some(i => location === i.path || location.startsWith(i.path + "/"));

  function NavDrop({ item }: { item: MenuItem }) {
    if (!item.dropdown) return null;
    const active = isActive(item.dropdown);
    return (
      <div className="relative group h-full flex items-center">
        <button style={{
          display: "flex", alignItems: "center", gap: 4, height: "100%", padding: "0 14px",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif",
          color: active ? ACCENT : "rgba(255,255,255,0.7)",
          borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
          transition: "color 0.15s, border-color 0.15s",
        }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#fff"; }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
        >
          {item.label}
          <ChevronDown size={11} strokeWidth={2} style={{ opacity: 0.5, transition: "transform 0.2s" }} className="group-hover:rotate-180" />
        </button>

        <div className="absolute top-full left-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pt-1"
          style={{ minWidth: 180 }}>
          <div style={{
            background: "#111", border: `1px solid ${BORDER}`,
            borderRadius: 8, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            {item.dropdown.map((sub, i) => (
              <Link key={sub.path} href={sub.path}
                style={{
                  display: "block", padding: "9px 14px",
                  fontSize: 13, fontWeight: 450,
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: location === sub.path ? ACCENT : "rgba(255,255,255,0.65)",
                  background: location === sub.path ? "rgba(212,160,23,0.08)" : "transparent",
                  borderBottom: i < item.dropdown!.length - 1 ? `1px solid rgba(255,255,255,0.06)` : "none",
                  textDecoration: "none", transition: "color 0.12s, background 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = location === sub.path ? ACCENT : "rgba(255,255,255,0.65)"; (e.currentTarget as HTMLElement).style.background = location === sub.path ? "rgba(212,160,23,0.08)" : "transparent"; }}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: scrolled ? "rgba(10,10,10,0.95)" : BG_HEADER,
      borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.1)" : BORDER}`,
      backdropFilter: scrolled ? "blur(16px)" : "none",
      transition: "background 0.2s, border-color 0.2s, backdrop-filter 0.2s",
    }} dir="ltr">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", gap: 8 }}>

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0, marginRight: 8 }}>
          <img src="/logo-new.png" alt="CrossFire Wiki" style={{ height: 36, width: "auto", objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center h-full flex-1" style={{ height: 56 }}>
          {navItems.map(item => <NavDrop key={item.label} item={item} />)}
        </nav>

        {/* Right controls */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
              <input
                type="search" placeholder="Search..." value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{
                  height: 32, paddingLeft: 32, paddingRight: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${BORDER}`, borderRadius: 6,
                  color: "#fff", fontSize: 13, fontFamily: "Inter, system-ui, sans-serif",
                  outline: "none", width: 140, transition: "width 0.2s, border-color 0.2s",
                }}
                onFocus={e => { (e.target as HTMLElement).style.width = "180px"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
                onBlur={e => { (e.target as HTMLElement).style.width = "140px"; (e.target as HTMLElement).style.borderColor = BORDER; }}
              />
            </div>
          </form>

          {/* Language */}
          <button onClick={toggleLanguage} title={language === "en" ? "العربية" : "English"} style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            background: "none", border: `1px solid ${BORDER}`, borderRadius: 6,
            color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
            <Globe size={14} strokeWidth={1.5} />
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <div className="relative group">
              <button style={{
                display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 6,
                color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "Inter, system-ui, sans-serif",
                fontWeight: 500, cursor: "pointer",
              }}>
                <User size={13} strokeWidth={1.5} />
                {username}
                <ChevronDown size={11} strokeWidth={2} style={{ opacity: 0.4 }} />
              </button>
              <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pt-1" style={{ minWidth: 170 }}>
                <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                  {[
                    { href: "/profile", icon: User, label: t("navProfile") },
                    { href: "/my-tickets", icon: Ticket, label: t("navMyTickets") },
                    { href: "/chat", icon: MessageSquare, label: "Chat" },
                  ].map(({ href, icon: Icon, label }, i, arr) => (
                    <Link key={href} href={href} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                      fontSize: 13, color: "rgba(255,255,255,0.65)", textDecoration: "none",
                      fontFamily: "Inter, system-ui, sans-serif",
                      borderBottom: i < arr.length - 1 ? `1px solid rgba(255,255,255,0.06)` : "none",
                      transition: "color 0.12s",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)"}>
                      <Icon size={13} strokeWidth={1.5} /> {label}
                    </Link>
                  ))}
                  <button onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem("userId"); localStorage.removeItem("username"); window.location.href = "/"; }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                      fontSize: 13, color: "rgba(239,68,68,0.7)", background: "none", border: "none",
                      fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer", transition: "color 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#ef4444"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.7)"}>
                    <LogOut size={13} strokeWidth={1.5} /> {t("navLogout")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Link href="/login" style={{
                height: 32, padding: "0 14px", display: "flex", alignItems: "center",
                fontSize: 13, fontWeight: 500, fontFamily: "Inter, system-ui, sans-serif",
                color: "rgba(255,255,255,0.7)", textDecoration: "none",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 6,
                transition: "color 0.15s, border-color 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLElement).style.borderColor = BORDER; }}>
                {t("login")}
              </Link>
              <Link href="/register" style={{
                height: 32, padding: "0 14px", display: "flex", alignItems: "center",
                fontSize: 13, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif",
                color: "#000", textDecoration: "none",
                background: ACCENT, borderRadius: 6,
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden ml-auto" onClick={() => setMobileOpen(!mobileOpen)} style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, color: "rgba(255,255,255,0.7)", cursor: "pointer",
        }}>
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: "#0d0d0d", borderTop: `1px solid ${BORDER}` }}>
          {/* Mobile search */}
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <form onSubmit={handleSearch} style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
              <input type="search" placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 32px", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 6, color: "#fff", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", outline: "none", boxSizing: "border-box" }} />
            </form>
          </div>

          {/* Nav */}
          <nav style={{ padding: "8px 12px" }}>
            {navItems.map(item => (
              <div key={item.label}>
                <button onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 8px", background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", fontFamily: "Inter, system-ui, sans-serif",
                }}>
                  {item.label}
                  <ChevronDown size={13} style={{ opacity: 0.4, transform: mobileExpanded === item.label ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {mobileExpanded === item.label && item.dropdown && (
                  <div style={{ marginLeft: 12, marginBottom: 4, borderLeft: `1px solid ${BORDER}`, paddingLeft: 12 }}>
                    {item.dropdown.map(sub => (
                      <Link key={sub.path} href={sub.path} onClick={() => setMobileOpen(false)} style={{
                        display: "block", padding: "8px 4px",
                        fontSize: 13, color: location === sub.path ? ACCENT : "rgba(255,255,255,0.5)",
                        textDecoration: "none", fontFamily: "Inter, system-ui, sans-serif",
                      }}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile bottom */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
            <button onClick={toggleLanguage} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif", cursor: "pointer" }}>
              <Globe size={13} /> {language === "en" ? "عربي" : "English"}
            </button>
            {!isLoggedIn ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Link href="/login" onClick={() => setMobileOpen(false)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", textDecoration: "none", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 6, fontFamily: "Inter, system-ui, sans-serif" }}>
                  {t("login")}
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "#000", textDecoration: "none", background: ACCENT, borderRadius: 6, fontFamily: "Inter, system-ui, sans-serif" }}>
                  {t("signUp")}
                </Link>
              </div>
            ) : (
              <Link href="/profile" onClick={() => setMobileOpen(false)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 500, color: ACCENT, textDecoration: "none", border: `1px solid rgba(212,160,23,0.4)`, borderRadius: 6, fontFamily: "Inter, system-ui, sans-serif" }}>
                {username}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
