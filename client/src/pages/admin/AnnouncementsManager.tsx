import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';

interface Announcement {
  id: string;
  title_en: string;
  title_ar: string;
  content_en: string;
  content_ar: string;
  type: string;
  target: string;
  display: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
  dismissible: boolean;
  created_at: string;
}

const EMPTY: Partial<Announcement> = { title_en: '', title_ar: '', content_en: '', content_ar: '', type: 'info', target: 'all', display: 'banner', starts_at: '', ends_at: '', active: true, dismissible: true };
const col = createColumnHelper<Announcement>();

export default function AnnouncementsManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Announcement>>(EMPTY);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await adminFetch<{ data?: Announcement[] }>('/api/admin/events?resource=announcements');
      setItems(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!editing.title_en) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        await adminFetch('/api/admin/events?resource=announcements', {
          method: 'PATCH',
          body: JSON.stringify({ id: editing.id, values: { ...editing, id: undefined } }),
        });
        toast.success('Updated');
      } else {
        await adminFetch('/api/admin/events?resource=announcements', {
          method: 'POST',
          body: JSON.stringify({ ...editing, created_at: new Date().toISOString() }),
        });
        toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      await adminFetch(`/api/admin/events?resource=announcements&id=${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ id }) });
      toast.success('Deleted');
      await fetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const typeColor: Record<string, string> = { info: '#3b82f6', warning: '#f59e0b', promo: '#22c55e', maintenance: '#ef4444' };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('title_en', { header: 'Title', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('type', { header: 'Type', cell: (i) => <span style={{ fontSize: 12, color: typeColor[i.getValue()] || '#a1a1aa', fontWeight: 500, textTransform: 'capitalize' }}>{i.getValue()}</span> }),
    col.accessor('target', { header: 'Target', cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa', textTransform: 'capitalize' }}>{i.getValue()}</span> }),
    col.accessor('active', { header: 'Active', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() ? '#22c55e' : '#52525b' }}>{i.getValue() ? 'Active' : 'Inactive'}</span> }),
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
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Announcement' : 'New Announcement'}</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Title (EN) *</label><input type="text" value={editing.title_en || ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Title (AR)</label><input type="text" value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
          </div>
          <div><label style={lbl}>Content (EN)</label><textarea value={editing.content_en || ''} onChange={(e) => setEditing({ ...editing, content_en: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>Content (AR)</label><textarea value={editing.content_ar || ''} onChange={(e) => setEditing({ ...editing, content_ar: e.target.value })} rows={3} style={{ ...inp, direction: 'rtl', resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Type</label>
              <select value={editing.type || 'info'} onChange={(e) => setEditing({ ...editing, type: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="info">Info</option><option value="warning">Warning</option><option value="promo">Promo</option><option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Target</label>
              <select value={editing.target || 'all'} onChange={(e) => setEditing({ ...editing, target: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="all">All Users</option><option value="sellers">Sellers Only</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Display</label>
              <select value={editing.display || 'banner'} onChange={(e) => setEditing({ ...editing, display: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="banner">Banner</option><option value="modal">Modal</option><option value="toast">Toast</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Start Date</label><input type="datetime-local" value={editing.starts_at || ''} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>End Date</label><input type="datetime-local" value={editing.ends_at || ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} style={inp} /></div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>Active</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.dismissible !== false} onChange={(e) => setEditing({ ...editing, dismissible: e.target.checked })} />
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>Dismissible</span>
            </label>
          </div>
          <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Announcements</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}><Plus size={14} />New Announcement</button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search announcements..." />
    </div>
  );
}
