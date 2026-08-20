import { useLocation } from 'wouter';
import { useAdminStore } from '@/store/adminStore';
import { decodeAdminToken } from '@/lib/supabaseAdmin';
import {
  LayoutDashboard, BarChart2, FileText, Calendar, Newspaper, Trophy,
  BookOpen, Megaphone, Swords, RefreshCw, Store, Star, BriefcaseBusiness,
  Image, Users, Ticket, Search, FileCode, HelpCircle, Settings,
  ChevronLeft, ChevronRight, Crosshair, Map, Shield, User2,
  Zap, Film, LayoutGrid, Code2,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={16} /> },
      { label: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={16} /> },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Posts', path: '/admin/posts', icon: <FileText size={16} /> },
      { label: 'Events', path: '/admin/events', icon: <Calendar size={16} /> },
      { label: 'Competition', path: '/admin/competition', icon: <Trophy size={16} /> },
      { label: 'News', path: '/admin/news', icon: <Newspaper size={16} /> },
      { label: 'Tutorials', path: '/admin/tutorials', icon: <BookOpen size={16} /> },
      { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone size={16} /> },
    ],
  },
  {
    title: 'Game',
    items: [
      { label: 'Weapons', path: '/admin/weapons', icon: <Crosshair size={16} /> },
      { label: 'Modes', path: '/admin/modes', icon: <Zap size={16} /> },
      { label: 'Maps', path: '/admin/maps', icon: <Map size={16} /> },
      { label: 'Ranks', path: '/admin/ranks', icon: <Shield size={16} /> },
      { label: 'Mercenaries', path: '/admin/mercenaries', icon: <User2 size={16} /> },
      { label: 'Scraper', path: '/admin/scraper', icon: <Swords size={16} /> },
      { label: 'Wiki Rescraper', path: '/admin/wiki-rescraper', icon: <RefreshCw size={16} /> },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Sellers', path: '/admin/sellers', icon: <Store size={16} /> },
      { label: 'Service Listings', path: '/admin/services', icon: <BriefcaseBusiness size={16} /> },
      { label: 'Seller Reviews', path: '/admin/seller-reviews', icon: <Star size={16} />, roles: ['super_admin'] },
    ],
  },
  {
    title: 'Media',
    items: [
      { label: 'Media', path: '/admin/media', icon: <Image size={16} /> },
      { label: 'Highlights', path: '/admin/highlights', icon: <Film size={16} /> },
      { label: 'Portal Images', path: '/admin/portals', icon: <LayoutGrid size={16} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Users', path: '/admin/users', icon: <Users size={16} />, roles: ['super_admin'] },
      { label: 'Tickets', path: '/admin/tickets', icon: <Ticket size={16} /> },
      { label: 'Bulk SEO', path: '/admin/bulk-seo', icon: <Search size={16} /> },
      { label: 'Custom Pages', path: '/admin/custom-pages', icon: <FileCode size={16} /> },
      { label: 'FAQ', path: '/admin/faq', icon: <HelpCircle size={16} /> },
      { label: 'Site Settings', path: '/admin/site-settings', icon: <Settings size={16} />, roles: ['super_admin'] },
      { label: 'Hardcoded Config', path: '/admin/hardcoded-config', icon: <Code2 size={16} />, roles: ['super_admin'] },
    ],
  },
];

export default function AdminSidebar() {
  const [location, navigate] = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useAdminStore();
  const token = decodeAdminToken();
  const role = token?.role || '';

  const isActive = (path: string) => {
    if (path === '/admin') return location === '/admin';
    return location.startsWith(path);
  };

  const width = sidebarCollapsed ? 60 : 220;

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: sidebarCollapsed ? '8px 0' : '7px 14px',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    color: active ? '#d4a017' : '#a1a1aa',
    background: active ? 'rgba(212,160,23,0.07)' : 'transparent',
    borderLeft: active ? '2px solid #d4a017' : '2px solid transparent',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'background 0.1s, color 0.1s',
    userSelect: 'none',
  });

  return (
    <aside style={{
      width, minWidth: width, height: '100vh', background: '#09090b',
      borderRight: '1px solid #27272a', display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid #27272a', flexShrink: 0 }}>
        {!sidebarCollapsed && (
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            CF <span style={{ color: '#d4a017' }}>Wiki</span> Admin
          </span>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid #27272a', borderRadius: 4, cursor: 'pointer', color: '#52525b', flexShrink: 0, marginLeft: sidebarCollapsed ? 'auto' : 0 }}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {NAV.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(role) || role === 'super_admin'
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              {section.title && !sidebarCollapsed && (
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 500, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {section.title}
                </div>
              )}
              {section.title && sidebarCollapsed && <div style={{ height: 12 }} />}
              {visibleItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <div
                    key={item.path}
                    role="button"
                    tabIndex={0}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={navItemStyle(active)}
                    onClick={() => navigate(item.path)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.background = '#18181b';
                        (e.currentTarget as HTMLDivElement).style.color = '#fafafa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        (e.currentTarget as HTMLDivElement).style.color = '#a1a1aa';
                      }
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>{item.icon}</span>
                    {!sidebarCollapsed && item.label}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      {!sidebarCollapsed && token && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid #27272a', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#fafafa', fontWeight: 500 }}>{token.username}</div>
          <div style={{ fontSize: 11, color: '#52525b', marginTop: 1 }}>{token.role?.replace(/_/g, ' ')}</div>
        </div>
      )}
    </aside>
  );
}
