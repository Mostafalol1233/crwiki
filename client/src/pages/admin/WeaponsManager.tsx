import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import ImageUpload from '@/components/admin/ImageUpload';

interface Weapon {
  id: string;
  name: string;
  category: string;
  image_url: string;
  background_url: string;
  description: string;
  stats: Record<string, any>;
  created_at: string;
}

const CATEGORIES = ['Assault Rifles', 'Sniper Rifles', 'SMG', 'Machine Guns', 'Shotguns', 'Pistols', 'Rifles', 'Melee', 'Grenade'];
const EMPTY: Partial<Weapon> = { name: '', category: 'Assault Rifles', image_url: '', background_url: '', description: '', stats: {} };
const col = createColumnHelper<Weapon>();

export default function WeaponsManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Weapon>>(EMPTY);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('weapons').select('*').order('name');
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        const { error } = await client.from('weapons').update(editing).eq('id', editing.id);
        if (error) throw error; toast.success('Updated');
      } else {
        const { error } = await client.from('weapons').insert({ ...editing, created_at: new Date().toISOString() });
        if (error) throw error; toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete?')) return;
    await client.from('weapons').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('image_url', { header: '', cell: (i) => i.getValue() ? <img src={i.getValue()} alt="" style={{ width: 40, height: 30, objectFit: 'contain', background: '#09090b', borderRadius: 4, border: '1px solid #27272a', padding: 2 }} /> : <div style={{ width: 40, height: 30, background: '#27272a', borderRadius: 4 }} /> }),
    col.accessor('name', { header: 'Name', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('category', { header: 'Category', cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa' }}>{i.getValue()}</span> }),
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
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Weapon' : 'New Weapon'}</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Name *</label><input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inp} /></div>
            <div>
              <label style={lbl}>Category</label>
              <select value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Description</label><textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ImageUpload label="Weapon Image" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url })} />
            <ImageUpload label="Background Image" value={editing.background_url || ''} onChange={(url) => setEditing({ ...editing, background_url: url })} />
          </div>
          <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Weapons</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} />New Weapon
        </button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search weapons..." />
    </div>
  );
}
