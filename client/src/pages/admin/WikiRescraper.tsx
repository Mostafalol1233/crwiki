import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { RefreshCw, RefreshCcw } from 'lucide-react';

type ContentType = 'news' | 'events' | 'posts';

interface RescrapeItem {
  id: string;
  title: string;
  source_url: string;
  updated_at?: string;
  status?: 'idle' | 'scraping' | 'done' | 'error';
}

export default function WikiRescraper() {
  const [type, setType] = useState<ContentType>('news');
  const [items, setItems] = useState<RescrapeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<string[]>([]);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const table = type === 'posts' ? 'posts' : type;
    const { data } = await client.from(table).select('id, title, source_url, updated_at').not('source_url', 'is', null).neq('source_url', '').order('updated_at', { ascending: true });
    setItems((data || []).map((r: any) => ({ id: String(r.id), title: String(r.title || ''), source_url: String(r.source_url || ''), updated_at: r.updated_at })));
    setLoading(false);
  }, [client, type]);

  useEffect(() => { fetch(); }, [fetch]);

  const rescrapeOne = async (item: RescrapeItem) => {
    setScraping((p) => ({ ...p, [item.id]: true }));
    setLog((l) => [`Scraping: ${item.title}...`, ...l]);
    try {
      const res = await globalThis.fetch(`/api/admin/scraper`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify({ url: item.source_url, type }),
      });
      if (!res.ok) throw new Error('Scrape failed');
      setLog((l) => [`Done: ${item.title}`, ...l]);
      toast.success(`Rescraped: ${item.title}`);
    } catch (e: any) {
      setLog((l) => [`Error: ${item.title} — ${e.message}`, ...l]);
      toast.error(`Failed: ${item.title}`);
    } finally {
      setScraping((p) => ({ ...p, [item.id]: false }));
    }
  };

  const rescrapeAll = async () => {
    for (const item of items) {
      await rescrapeOne(item);
    }
    toast.success('Rescrape complete');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 13, border: '1px solid',
    borderColor: active ? '#d4a017' : '#27272a',
    background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
    color: active ? '#d4a017' : '#52525b', cursor: 'pointer', borderRadius: 4,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Wiki Rescraper</h1>
        <button type="button" onClick={rescrapeAll} disabled={loading || items.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>
          <RefreshCcw size={13} />Rescrape All ({items.length})
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {(['news', 'events', 'posts'] as ContentType[]).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} style={tabStyle(type === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#52525b' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#52525b' }}>No items with source URLs</div>
          ) : items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < items.length - 1 ? '1px solid #1f1f22' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#fafafa', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#52525b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.source_url}</div>
              </div>
              <span style={{ fontSize: 11, color: '#3f3f46', flexShrink: 0 }}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}</span>
              <button type="button" onClick={() => rescrapeOne(item)} disabled={scraping[item.id]}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: scraping[item.id] ? '#52525b' : '#a1a1aa', cursor: scraping[item.id] ? 'wait' : 'pointer', fontSize: 12, flexShrink: 0 }}>
                <RefreshCw size={11} style={{ animation: scraping[item.id] ? 'spin 1s linear infinite' : 'none' }} />
                {scraping[item.id] ? 'Scraping...' : 'Rescrape'}
              </button>
            </div>
          ))}
        </div>

        {/* Log panel */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Activity Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
            {log.length === 0 ? (
              <span style={{ fontSize: 12, color: '#3f3f46' }}>No activity yet</span>
            ) : log.map((l, i) => (
              <div key={i} style={{ fontSize: 12, color: l.startsWith('Error') ? '#ef4444' : l.startsWith('Done') ? '#22c55e' : '#a1a1aa', lineHeight: 1.4 }}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
