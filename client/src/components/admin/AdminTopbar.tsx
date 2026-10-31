import { useLocation } from 'wouter';
import { LogOut } from 'lucide-react';
import { getAdminBreadcrumb } from '@/pages/admin/adminRoutes';

export default function AdminTopbar() {
  const [location, navigate] = useLocation();
  const crumbs = getAdminBreadcrumb(location);

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
