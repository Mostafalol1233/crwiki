import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import TipTapEditor from '@/components/admin/TipTapEditor';
import ImageUpload from '@/components/admin/ImageUpload';

interface Seller {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  description_ar: string;
  logo_url: string;
  cover_url: string;
  whatsapp: string;
  telegram: string;
  discord: string;
  email: string;
  status: string;
  verified: boolean;
  premium: boolean;
  rating: number;
  created_at: string;
}

const EMPTY: Partial<Seller> = { name: '', name_ar: '', slug: '', description: '', description_ar: '', logo_url: '', cover_url: '', whatsapp: '', telegram: '', discord: '', email: '', status: 'Active', verified: false, premium: false };
const col = createColumnHelper<Seller>();

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function SellersManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Seller>>(EMPTY);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('sellers').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const payload = { ...editing, slug: editing.slug || slugify(editing.name || '') };
      if (editing.id) {
        const { error } = await client.from('sellers').update(payload).eq('id', editing.id);
        if (error) throw error; toast.success('Updated');
      } else {
        const { error } = await client.from('sellers').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error; toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete seller?')) return;
    await client.from('sellers').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('logo_url', { header: '', cell: (i) => i.getValue() ? <img src={i.getValue()} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #27272a' }} /> : <div style={{ width: 36, height: 36, background: '#27272a', borderRadius: '50%' }} /> }),
    col.accessor('name', { header: 'Name', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('status', { header: 'Status', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() === 'Active' ? '#22c55e' : i.getValue() === 'Suspended' ? '#ef4444' : '#f59e0b' }}>{i.getValue()}</span> }),
    col.accessor('verified', { header: 'Verified', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() ? '#d4a017' : '#52525b' }}>{i.getValue() ? 'Yes' : 'No'}</span> }),
    col.accessor('premium', { header: 'Premium', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() ? '#a855f7' : '#52525b' }}>{i.getValue() ? 'Yes' : 'No'}</span> }),
    col.accessor('rating', { header: 'Rating', cell: (i) => <span style={{ fontSize: 12, color: '#d4a017' }}>{i.getValue() ? Number(i.getValue()).toFixed(1) : '—'}</span> }),
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
      <div style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Seller' : 'New Seller'}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Display Name (EN) *</label><input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Display Name (AR)</label><input type="text" value={editing.name_ar || ''} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
            </div>
            <div><label style={lbl}>Slug</label><input type="text" value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} style={inp} placeholder="auto-generated from name" /></div>
            <div><label style={lbl}>Description (EN)</label><TipTapEditor content={editing.description || ''} onChange={(h) => setEditing({ ...editing, description: h })} /></div>
            <div><label style={lbl}>Description (AR)</label><TipTapEditor content={editing.description_ar || ''} onChange={(h) => setEditing({ ...editing, description_ar: h })} dir="rtl" /></div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Contact Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>WhatsApp</label><input type="text" value={editing.whatsapp || ''} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Telegram</label><input type="text" value={editing.telegram || ''} onChange={(e) => setEditing({ ...editing, telegram: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Discord</label><input type="text" value={editing.discord || ''} onChange={(e) => setEditing({ ...editing, discord: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Email</label><input type="email" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} style={inp} /></div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ImageUpload label="Logo" value={editing.logo_url || ''} onChange={(url) => setEditing({ ...editing, logo_url: url })} hint="Square, 200x200px" />
              <ImageUpload label="Cover Image" value={editing.cover_url || ''} onChange={(url) => setEditing({ ...editing, cover_url: url })} hint="16:9 recommended" />
            </div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Settings</div>
              <div>
                <label style={lbl}>Status</label>
                <select value={editing.status || 'Active'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                  <option>Active</option><option>Pending</option><option>Suspended</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.verified || false} onChange={(e) => setEditing({ ...editing, verified: e.target.checked })} />
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>Verified Badge</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.premium || false} onChange={(e) => setEditing({ ...editing, premium: e.target.checked })} />
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>Premium</span>
              </label>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Sellers</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}><Plus size={14} />New Seller</button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search sellers..." />
    </div>
  );
}
