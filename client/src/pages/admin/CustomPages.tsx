import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import TipTapEditor from '@/components/admin/TipTapEditor';
import SEOPanel from '@/components/admin/SEOPanel';

interface CustomPage {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  template: string;
  status: string;
  show_in_nav: boolean;
  seo_title: string;
  seo_description: string;
  created_at: string;
}

const EMPTY: Partial<CustomPage> = { slug: '', title_en: '', title_ar: '', content_en: '', content_ar: '', template: 'default', status: 'published', show_in_nav: false, seo_title: '', seo_description: '' };
const col = createColumnHelper<CustomPage>();

export default function CustomPages() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<CustomPage>>(EMPTY);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const { data } = await client.from('custom_pages').select('*').order('created_at', { ascending: false });
      setItems((data as any) || []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.slug || !editing.title_en) { toast.error('Slug and title required'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        const { error } = await (client as any).from('custom_pages').update(editing).eq('id', editing.id);
        if (error) throw error; toast.success('Updated');
      } else {
        const { error } = await (client as any).from('custom_pages').insert({ ...editing, created_at: new Date().toISOString() });
        if (error) throw error; toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('slug', { header: 'Slug', cell: (i) => <span style={{ color: '#d4a017', fontFamily: 'monospace', fontSize: 13 }}>/{i.getValue()}</span> }),
    col.accessor('title_en', { header: 'Title', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('template', { header: 'Template', cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa', textTransform: 'capitalize' }}>{i.getValue()}</span> }),
    col.accessor('status', { header: 'Status', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() === 'published' ? '#22c55e' : '#52525b' }}>{i.getValue()}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => { setEditing(i.row.original); setView('form'); }} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}><Edit2 size={12} /></button>
          <button type="button" onClick={async () => { if (client && confirm('Delete?')) { await (client as any).from('custom_pages').delete().eq('id', i.row.original.id); toast.success('Deleted'); await fetch(); } }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Page' : 'New Page'}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>Slug *</label><input type="text" value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} style={inp} placeholder="about, advertise, ..." /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Title (EN) *</label><input type="text" value={editing.title_en || ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Title (AR)</label><input type="text" value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
            </div>
            <div><label style={lbl}>Content (EN)</label><TipTapEditor content={editing.content_en || ''} onChange={(h) => setEditing({ ...editing, content_en: h })} /></div>
            <div><label style={lbl}>Content (AR)</label><TipTapEditor content={editing.content_ar || ''} onChange={(h) => setEditing({ ...editing, content_ar: h })} dir="rtl" /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lbl}>Template</label>
                <select value={editing.template || 'default'} onChange={(e) => setEditing({ ...editing, template: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="default">Default</option><option value="landing">Landing</option><option value="minimal">Minimal</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select value={editing.status || 'published'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="published">Published</option><option value="draft">Draft</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.show_in_nav || false} onChange={(e) => setEditing({ ...editing, show_in_nav: e.target.checked })} />
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>Show in Navigation</span>
              </label>
            </div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>SEO</div>
              <SEOPanel seo={{ metaTitle: editing.seo_title || '', metaDescription: editing.seo_description || '', ogImage: '', canonicalUrl: '', focusKeyword: '' }} onChange={(key, val) => { const m: any = { metaTitle: 'seo_title', metaDescription: 'seo_description' }; setEditing({ ...editing, [m[key] || key]: val }); }} content={editing.content_en || ''} />
            </div>
            <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Custom Pages</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}><Plus size={14} />New Page</button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search pages..." />
    </div>
  );
}
