import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import TipTapEditor from '@/components/admin/TipTapEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import SEOPanel from '@/components/admin/SEOPanel';

interface Tutorial {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  content: string;
  content_ar: string;
  image_url: string;
  difficulty: string;
  video_url: string;
  category: string;
  seo_title: string;
  seo_description: string;
  created_at: string;
}

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
const EMPTY: Partial<Tutorial> = { title: '', title_ar: '', slug: '', content: '', content_ar: '', image_url: '', difficulty: 'Beginner', video_url: '', category: '', seo_title: '', seo_description: '' };
const col = createColumnHelper<Tutorial>();

export default function TutorialsManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Tutorial>>(EMPTY);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('tutorials').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const payload = { ...editing, slug: editing.slug || slugify(editing.title || '') };
      if (editing.id) {
        const { error } = await client.from('tutorials').update(payload).eq('id', editing.id);
        if (error) throw error; toast.success('Updated');
      } else {
        const { error } = await client.from('tutorials').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error; toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete?')) return;
    await client.from('tutorials').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('title', { header: 'Title', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('difficulty', { header: 'Difficulty', cell: (i) => { const c = i.getValue() === 'Beginner' ? '#22c55e' : i.getValue() === 'Intermediate' ? '#f59e0b' : '#ef4444'; return <span style={{ fontSize: 12, color: c }}>{i.getValue()}</span>; } }),
    col.accessor('category', { header: 'Category', cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa' }}>{i.getValue() || '—'}</span> }),
    col.accessor('created_at', { header: 'Date', cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{i.getValue() ? new Date(i.getValue()).toLocaleDateString() : '—'}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => { setEditing(i.row.original); setView('form'); }} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}><Edit2 size={12} /></button>
          <button type="button" onClick={() => remove(i.row.original.id)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Tutorial' : 'New Tutorial'}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>Title (EN) *</label><input type="text" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Title (AR)</label><input type="text" value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Difficulty</label>
                <select value={editing.difficulty || 'Beginner'} onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
              </div>
              <div><label style={lbl}>Category</label><input type="text" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={inp} /></div>
            </div>
            <div><label style={lbl}>Video URL (YouTube)</label><input type="url" value={editing.video_url || ''} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} style={inp} placeholder="https://youtube.com/watch?v=..." /></div>
            <div><label style={lbl}>Content (EN)</label><TipTapEditor content={editing.content || ''} onChange={(h) => setEditing({ ...editing, content: h })} /></div>
            <div><label style={lbl}>Content (AR)</label><TipTapEditor content={editing.content_ar || ''} onChange={(h) => setEditing({ ...editing, content_ar: h })} dir="rtl" /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <ImageUpload label="Thumbnail" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url })} />
            </div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>SEO</div>
              <SEOPanel seo={{ metaTitle: editing.seo_title || '', metaDescription: editing.seo_description || '', ogImage: '', canonicalUrl: '', focusKeyword: '' }} onChange={(key, val) => { const m: any = { metaTitle: 'seo_title', metaDescription: 'seo_description' }; setEditing({ ...editing, [m[key] || key]: val }); }} content={editing.content || ''} />
            </div>
            <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Tutorials</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} />New Tutorial
        </button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search tutorials..." />
    </div>
  );
}
