import { useEffect, useState } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { FileText, Calendar, Newspaper, Ticket, Plus, Database, X } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Stats {
  posts: number;
  events: number;
  news: number;
  tickets: number;
}

const CARD_COLORS = {
  posts: '#3b82f6',
  events: '#d4a017',
  news: '#22c55e',
  tickets: '#f59e0b',
};

function StatCard({ label, value, icon, color, href }: { label: string; value: number; icon: React.ReactNode; color: string; href: string }) {
  return (
    <div
      onClick={() => { window.history.pushState(null, '', href); window.dispatchEvent(new PopStateEvent('popstate')); }}
      style={{ display: 'block', textDecoration: 'none', background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = color; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#27272a'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: '#52525b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#fafafa', lineHeight: 1 }}>{value.toLocaleString()}</div>
        </div>
        <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Static placeholder — replace with a real analytics integration
const MOCK_VIEWS = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  views: 0,
}));

const QUICK_ACTIONS = [
  { label: 'New Post', href: '/admin/posts?new=1', icon: <Plus size={14} /> },
  { label: 'New Event', href: '/admin/events?new=1', icon: <Plus size={14} /> },
  { label: 'New News', href: '/admin/news?new=1', icon: <Plus size={14} /> },
  { label: 'Upload Media', href: '/admin/media', icon: <Plus size={14} /> },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ posts: 0, events: 0, news: 0, tickets: 0 });
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrationDismissed, setMigrationDismissed] = useState(() => localStorage.getItem('gallery_migration_dismissed') === '1');
  const client = supabaseService;

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    // Check if gallery column exists
    client.from('events').select('gallery').limit(0).then(({ error }) => {
      if (error?.message?.toLowerCase().includes('gallery') || error?.message?.includes('42703')) {
        setNeedsMigration(true);
      }
    });
    Promise.all([
      client.from('posts').select('id', { count: 'exact', head: true }),
      client.from('events').select('id', { count: 'exact', head: true }),
      client.from('news').select('id', { count: 'exact', head: true }),
      client.from('tickets').select('id', { count: 'exact', head: true }),
    ]).then(([posts, events, news, tickets]) => {
      setStats({
        posts: posts.count || 0,
        events: events.count || 0,
        news: news.count || 0,
        tickets: tickets.count || 0,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const h2: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 14 };
  const section: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '18px 20px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#52525b', margin: '4px 0 0' }}>Overview of your CrossFire Wiki</p>
      </div>

      {/* Gallery migration notice */}
      {needsMigration && !migrationDismissed && (
        <div style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 6, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Database size={16} color="#f5a623" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f5a623', margin: '0 0 4px' }}>One-time Gallery Setup Required</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', lineHeight: 1.5 }}>
              To enable the gallery feature on events &amp; posts, run this SQL once in your{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#f5a623' }}>Supabase SQL editor</a>:
            </p>
            <pre style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#a1a1aa', margin: 0, whiteSpace: 'pre-wrap', userSelect: 'all' }}>
{`ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';
ALTER TABLE posts  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';`}
            </pre>
          </div>
          <button onClick={() => { setMigrationDismissed(true); localStorage.setItem('gallery_migration_dismissed', '1'); }}
            style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Published Posts" value={stats.posts} icon={<FileText size={18} />} color={CARD_COLORS.posts} href="/admin/posts" />
        <StatCard label="Events" value={stats.events} icon={<Calendar size={18} />} color={CARD_COLORS.events} href="/admin/events" />
        <StatCard label="News Articles" value={stats.news} icon={<Newspaper size={18} />} color={CARD_COLORS.news} href="/admin/news" />
        <StatCard label="Open Tickets" value={stats.tickets} icon={<Ticket size={18} />} color={CARD_COLORS.tickets} href="/admin/tickets" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        <div style={section}>
          <h2 style={h2}>Page Views — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_VIEWS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 13 }} />
              <Line type="monotone" dataKey="views" stroke="#d4a017" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={section}>
          <h2 style={h2}>Content Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Posts', value: stats.posts },
              { name: 'Events', value: stats.events },
              { name: 'News', value: stats.news },
              { name: 'Tickets', value: stats.tickets },
            ]} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 13 }} />
              <Bar dataKey="value" fill="#d4a017" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={section}>
        <h2 style={h2}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((a) => (
            <a key={a.href} href={a.href}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', textDecoration: 'none', fontSize: 13, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#d4a017'; (e.currentTarget as HTMLAnchorElement).style.color = '#d4a017'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLAnchorElement).style.color = '#fafafa'; }}>
              {a.icon}
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
