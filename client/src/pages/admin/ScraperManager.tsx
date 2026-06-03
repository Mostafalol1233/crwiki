import { useState } from 'react';
import { toast } from 'sonner';
import { Play, Download } from 'lucide-react';

interface ScrapeResult {
  title?: string;
  description?: string;
  images?: string[];
  stats?: Record<string, any>;
  raw?: string;
}

const SCRAPE_TYPES = ['News', 'Event', 'Weapon', 'Map', 'Mercenary'] as const;

export default function ScraperManager() {
  const [url, setUrl] = useState('');
  const [type, setType] = useState<typeof SCRAPE_TYPES[number]>('News');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [importing, setImporting] = useState(false);

  const scrape = async () => {
    if (!url) { toast.error('Enter a URL'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify({ url, type: type.toLowerCase() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
      toast.success('Scraped successfully');
    } catch (e: any) {
      toast.error(e.message || 'Scrape failed');
    } finally {
      setLoading(false);
    }
  };

  const importToDb = async () => {
    if (!result) return;
    setImporting(true);
    try {
      const res = await fetch('/api/admin/scraper/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify({ data: result, type: type.toLowerCase(), sourceUrl: url }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success('Imported to database');
      setResult(null);
      setUrl('');
    } catch (e: any) {
      toast.error(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Content Scraper</h1>

      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={lbl}>Source URL</label><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://forum.z8games.com/..." style={inp} /></div>
        <div>
          <label style={lbl}>Content Type</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SCRAPE_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                style={{ padding: '6px 14px', fontSize: 13, border: '1px solid', borderRadius: 4, borderColor: type === t ? '#d4a017' : '#3f3f46', background: type === t ? 'rgba(212,160,23,0.1)' : 'transparent', color: type === t ? '#d4a017' : '#a1a1aa', cursor: 'pointer' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={scrape} disabled={loading || !url}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: loading ? '#27272a' : '#d4a017', border: 'none', borderRadius: 4, color: loading ? '#52525b' : '#09090b', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontSize: 14, width: 'fit-content' }}>
          <Play size={14} fill="currentColor" />{loading ? 'Scraping...' : 'Scrape Preview'}
        </button>
      </div>

      {result && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fafafa' }}>Scraped Data Preview</span>
            <button type="button" onClick={importToDb} disabled={importing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#22c55e', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              <Download size={13} />{importing ? 'Importing...' : 'Import to DB'}
            </button>
          </div>
          {result.title && <div><span style={{ fontSize: 12, color: '#52525b', display: 'block', marginBottom: 2 }}>Title</span><span style={{ color: '#fafafa', fontSize: 14 }}>{result.title}</span></div>}
          {result.description && <div><span style={{ fontSize: 12, color: '#52525b', display: 'block', marginBottom: 4 }}>Description</span><p style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.description}</p></div>}
          {result.images && result.images.length > 0 && (
            <div>
              <span style={{ fontSize: 12, color: '#52525b', display: 'block', marginBottom: 8 }}>Images ({result.images.length})</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.images.slice(0, 8).map((img, i) => <img key={i} src={img} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #27272a' }} />)}
              </div>
            </div>
          )}
          <div>
            <span style={{ fontSize: 12, color: '#52525b', display: 'block', marginBottom: 4 }}>Raw JSON</span>
            <pre style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 4, padding: 12, fontSize: 11, color: '#a1a1aa', overflow: 'auto', maxHeight: 200, margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
