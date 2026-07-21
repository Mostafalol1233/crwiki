import { BarChart2 } from 'lucide-react';

export default function Analytics() {
  const card = {
    background: '#18181b', border: '1px solid #27272a',
    borderRadius: 6, padding: '18px 20px',
  } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Analytics</h1>
      </div>

      <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 20px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={28} color="#d4a017" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 8px' }}>Analytics Coming Soon</h2>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0, maxWidth: 380 }}>
            Real page-view and engagement tracking will be available here once a server-side analytics integration (e.g. Plausible or Umami) is connected. The previous charts displayed randomly generated data and have been removed.
          </p>
        </div>
      </div>
    </div>
  );
}
