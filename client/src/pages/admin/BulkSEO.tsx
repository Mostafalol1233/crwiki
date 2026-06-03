import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type ContentType = 'posts' | 'news' | 'events' | 'tutorials';

interface SEORow {
  id: string;
  title: string;
  slug: string;
  seo_title: string;
  seo_description: string;
}

function seoScore(row: SEORow): number {
  let s = 0;
  if (row.seo_title?.length >= 50 && row.seo_title?.length <= 60) s += 50;
  else if (row.seo_title?.length > 0) s += 20;
  if (row.seo_description?.length >= 140 && row.seo_description?.length <= 160) s += 50;
  else if (row.seo_description?.length > 0) s += 20;
  return s;
}

function scoreColor(s: number) {
  return s >= 80 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444';
}

const TABLE_MAP: Record<ContentType, string> = { posts: 'posts', news: 'news', events: 'events', tutorials: 'tutorials' };
const SLUG_MAP: Record<ContentType, string> = { posts: 'post_slug', news: 'news_slug', events: 'event_name_slug', tutorials: 'slug' };

export default function BulkSEO() {
  const [type, setType] = useState<ContentType>('posts');
  const [rows, setRows] = useState<SEORow[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<SEORow>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const table = TABLE_MAP[type];
    const slugField = SLUG_MAP[type];
    const { data } = await client.from(table).select(`id, title, ${slugField}, seo_title, seo_description`).order('created_at', { ascending: false });
    setRows((data || []).map((r: any) => ({ id: String(r.id), title: String(r.title || ''), slug: String(r[slugField] || ''), seo_title: String(r.seo_title || ''), seo_description: String(r.seo_description || '') })));
    setEdits({});
    setLoading(false);
  }, [client, type]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = (id: string, field: 'seo_title' | 'seo_description', val: string) => {
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: val } }));
  };

  const saveAll = async () => {
    if (!client || Object.keys(edits).length === 0) { toast.info('No changes to save'); return; }
    setSaving(true);
    try {
      const table = TABLE_MAP[type];
      for (const [id, changes] of Object.entries(edits)) {
        await client.from(table).update(changes).eq('id', id);
      }
      toast.success(`Saved ${Object.keys(edits).length} records`);
      await fetch();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const getRow = (row: SEORow) => ({ ...row, ...(edits[row.id] || {}) });

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 13, border: '1px solid',
    borderColor: active ? '#d4a017' : '#27272a',
    background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
    color: active ? '#d4a017' : '#52525b', cursor: 'pointer', borderRadius: 4,
  });

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 3, color: '#fafafa', padding: '5px 8px', fontSize: 12, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Bulk SEO Editor</h1>
        <button type="button" onClick={saveAll} disabled={saving || Object.keys(edits).length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: Object.keys(edits).length > 0 ? '#d4a017' : '#27272a', border: 'none', borderRadius: 4, color: Object.keys(edits).length > 0 ? '#09090b' : '#52525b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          <Save size={13} />{saving ? 'Saving...' : `Save ${Object.keys(edits).length > 0 ? Object.keys(edits).length : ''} Changes`}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        {(['posts', 'news', 'events', 'tutorials'] as ContentType[]).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)} style={tabStyle(type === t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#52525b', textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#09090b' }}>
                {['Title', 'Meta Title (0/60)', 'Meta Description (0/160)', 'Score'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #27272a', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const r = getRow(row);
                const score = seoScore(r);
                const changed = edits[row.id];
                return (
                  <tr key={row.id} style={{ background: changed ? 'rgba(212,160,23,0.03)' : 'transparent', borderBottom: '1px solid #1f1f22' }}>
                    <td style={{ padding: '8px 14px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: 13, color: '#fafafa', fontWeight: 500 }}>{row.title || '—'}</div>
                      <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>{row.slug}</div>
                    </td>
                    <td style={{ padding: '8px 14px', verticalAlign: 'top' }}>
                      <input type="text" value={r.seo_title} onChange={(e) => update(row.id, 'seo_title', e.target.value)} style={inp} maxLength={80} />
                      <span style={{ fontSize: 10, color: r.seo_title?.length > 60 ? '#ef4444' : '#52525b' }}>{r.seo_title?.length || 0}/60</span>
                    </td>
                    <td style={{ padding: '8px 14px', verticalAlign: 'top' }}>
                      <textarea value={r.seo_description} onChange={(e) => update(row.id, 'seo_description', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} maxLength={200} />
                      <span style={{ fontSize: 10, color: r.seo_description?.length > 160 ? '#ef4444' : '#52525b' }}>{r.seo_description?.length || 0}/160</span>
                    </td>
                    <td style={{ padding: '8px 14px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: scoreColor(score) }}>{score}</span>
                        <div style={{ width: 40, height: 3, background: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score) }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#52525b', fontSize: 14 }}>No content found</div>}
        </div>
      )}
    </div>
  );
}
