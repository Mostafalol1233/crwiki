import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const RANGES = ['7d', '30d', '90d'] as const;
type Range = typeof RANGES[number];

function mock(days: number, base: number) {
  return Array.from({ length: days }, (_, i) => ({
    day: String(i + 1),
    views: Math.floor(Math.random() * base + base * 0.3),
    clicks: Math.floor(Math.random() * base * 0.4 + 50),
  }));
}

export default function Analytics() {
  const [range, setRange] = useState<Range>('30d');
  const [subTab, setSubTab] = useState<'general' | 'tutorials' | 'sellers'>('general');

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const data = mock(days, 600);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', fontSize: 13, border: '1px solid', borderRadius: 4,
    borderColor: active ? '#d4a017' : '#3f3f46',
    background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
    color: active ? '#d4a017' : '#a1a1aa', cursor: 'pointer',
  });

  const rangeBtn = (r: Range): React.CSSProperties => ({
    padding: '4px 12px', fontSize: 12, border: '1px solid',
    borderColor: range === r ? '#d4a017' : '#27272a',
    background: range === r ? 'rgba(212,160,23,0.1)' : 'transparent',
    color: range === r ? '#d4a017' : '#52525b', cursor: 'pointer', borderRadius: 4,
  });

  const card: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '18px 20px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map((r) => <button key={r} type="button" onClick={() => setRange(r)} style={rangeBtn(r)}>{r}</button>)}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {(['general', 'tutorials', 'sellers'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setSubTab(t)} style={tabStyle(subTab === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 16 }}>
          {subTab === 'general' ? 'Page Views' : subTab === 'tutorials' ? 'Tutorial Views' : 'Seller Profile Views'}
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4a017" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f22" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 13 }} />
            <Area type="monotone" dataKey="views" stroke="#d4a017" strokeWidth={2} fill="url(#gold)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 16 }}>Clicks</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={Math.max(4, Math.floor(800 / days))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f22" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} interval={Math.floor(days / 7)} />
            <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 13 }} />
            <Bar dataKey="clicks" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
