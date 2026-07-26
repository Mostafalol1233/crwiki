import { useLocation } from 'wouter';
import { LogOut } from 'lucide-react';
import { decodeAdminToken } from '@/lib/supabaseAdmin';

const BREADCRUMBS: Record<string, string[]> = {
  '/admin': ['Dashboard'],
  '/admin/analytics': ['Analytics'],
  '/admin/posts': ['Content', 'Posts'],
  '/admin/posts/new': ['Content', 'Posts', 'New Post'],
  '/admin/events': ['Content', 'Events'],
  '/admin/events/new': ['Content', 'Events', 'New Event'],
  '/admin/news': ['Content', 'News'],
  '/admin/news/new': ['Content', 'News', 'New Article'],
  '/admin/tutorials': ['Content', 'Tutorials'],
  '/admin/announcements': ['Content', 'Announcements'],
  '/admin/weapons': ['Game', 'Weapons'],
  '/admin/modes': ['Game', 'Modes'],
  '/admin/maps': ['Game', 'Maps'],
  '/admin/ranks': ['Game', 'Ranks'],
  '/admin/mercenaries': ['Game', 'Mercenaries'],
  '/admin/scraper': ['Game', 'Scraper'],
  '/admin/wiki-rescraper': ['Game', 'Wiki Rescraper'],
  '/admin/sellers': ['Commerce', 'Sellers'],
  '/admin/seller-reviews': ['Commerce', 'Seller Reviews'],
  '/admin/media': ['Media'],
  '/admin/users': ['System', 'Users'],
  '/admin/tickets': ['System', 'Tickets'],
  '/admin/bulk-seo': ['System', 'Bulk SEO'],
  '/admin/custom-pages': ['System', 'Custom Pages'],
  '/admin/faq': ['System', 'FAQ'],
  '/admin/site-settings': ['System', 'Site Settings'],
};

function getBreadcrumb(location: string): string[] {
  if (BREADCRUMBS[location]) return BREADCRUMBS[location];
  const base = Object.keys(BREADCRUMBS)
    .filter((k) => location.startsWith(k) && k !== '/admin')
    .sort((a, b) => b.length - a.length)[0];
  if (base) {
    const sub = location.replace(base, '').replace(/^\//, '');
    if (sub) return [...(BREADCRUMBS[base] || []), sub.charAt(0).toUpperCase() + sub.slice(1)];
    return BREADCRUMBS[base] || ['Admin'];
  }
  return ['Admin'];
}

export default function AdminTopbar() {
  const [location, navigate] = useLocation();
  const crumbs = getBreadcrumb(location);
  const token = decodeAdminToken();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <header style={{
      height: 52, background: '#09090b', borderBottom: '1px solid #27272a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          onClick={() => navigate('/admin')}
          style={{ fontSize: 13, color: '#52525b', textDecoration: 'none', cursor: 'pointer' }}
        >Admin</span>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#3f3f46', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: i === crumbs.length - 1 ? '#fafafa' : '#52525b', fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>
              {c}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#52525b', cursor: 'pointer', fontSize: 13 }}
        >
          <LogOut size={13} />
          Logout
        </button>
      </div>
    </header>
  );
}
