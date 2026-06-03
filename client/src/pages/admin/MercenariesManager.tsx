import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import TipTapEditor from '@/components/admin/TipTapEditor';
import ImageUpload from '@/components/admin/ImageUpload';

interface Merc {
  id: string;
  name: string;
  name_ar: string;
  role: string;
  rarity: string;
  image_url: string;
  description: string;
  description_ar: string;
  sounds: string[];
  order_index: number;
  available_in: string;
  status: string;
}

const EMPTY: Partial<Merc> = { name: '', name_ar: '', role: 'Attacker', rarity: 'Common', image_url: '', description: '', description_ar: '', sounds: [], order_index: 0, available_in: 'Both', status: 'Active' };
const col = createColumnHelper<Merc>();

export default function MercenariesManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Merc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Merc>>(EMPTY);
  const [newSound, setNewSound] = useState('');
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('mercenaries').select('*').order('order_index', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        const { error } = await client.from('mercenaries').update(editing).eq('id', editing.id);
        if (error) throw error; toast.success('Updated');
      } else {
        const { error } = await client.from('mercenaries').insert({ ...editing, created_at: new Date().toISOString() });
        if (error) throw error; toast.success('Created');
      }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete?')) return;
    await client.from('mercenaries').delete().eq('id', id);
    toast.success('Deleted'); await fetch();
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

  const rarityColor: Record<string, string> = { Common: '#a1a1aa', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b', VVIP: '#ef4444' };

  const columns = [
    col.accessor('image_url', { header: '', cell: (i) => i.getValue() ? <img src={i.getValue()} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', border: '1px solid #27272a' }} /> : <div style={{ width: 36, height: 36, background: '#27272a', borderRadius: 4 }} /> }),
    col.accessor('name', { header: 'Name', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('role', { header: 'Role', cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa' }}>{i.getValue()}</span> }),
    col.accessor('rarity', { header: 'Rarity', cell: (i) => <span style={{ fontSize: 12, color: rarityColor[i.getValue()] || '#a1a1aa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('status', { header: 'Status', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() === 'Active' ? '#22c55e' : '#52525b' }}>{i.getValue()}</span> }),
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
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Mercenary' : 'New Mercenary'}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Name (EN) *</label><input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inp} /></div>
              <div><label style={lbl}>Name (AR)</label><input type="text" value={editing.name_ar || ''} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label style={lbl}>Role</label>
                <select value={editing.role || 'Attacker'} onChange={(e) => setEditing({ ...editing, role: e.target.value })} style={sel}>
                  <option>Attacker</option><option>Defender</option><option>Support</option><option>Special</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Rarity</label>
                <select value={editing.rarity || 'Common'} onChange={(e) => setEditing({ ...editing, rarity: e.target.value })} style={sel}>
                  <option>Common</option><option>Rare</option><option>Epic</option><option>Legendary</option><option>VVIP</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Available In</label>
                <select value={editing.available_in || 'Both'} onChange={(e) => setEditing({ ...editing, available_in: e.target.value })} style={sel}>
                  <option>BL</option><option>GR</option><option>Both</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Status</label>
                <select value={editing.status || 'Active'} onChange={(e) => setEditing({ ...editing, status: e.target.value })} style={sel}>
                  <option>Active</option><option>Retired</option><option>Limited</option>
                </select>
              </div>
              <div><label style={lbl}>Order Index</label><input type="number" value={editing.order_index ?? 0} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} style={inp} /></div>
            </div>
            <div><label style={lbl}>Background Story (EN)</label><TipTapEditor content={editing.description || ''} onChange={(h) => setEditing({ ...editing, description: h })} placeholder="Character background story..." /></div>
            <div><label style={lbl}>Background Story (AR)</label><TipTapEditor content={editing.description_ar || ''} onChange={(h) => setEditing({ ...editing, description_ar: h })} dir="rtl" placeholder="قصة الكاركتر..." /></div>

            {/* Voice Lines */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Voice Lines</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(editing.sounds || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <audio controls src={s} style={{ flex: 1, height: 32 }} />
                    <button type="button" onClick={() => setEditing({ ...editing, sounds: (editing.sounds || []).filter((_, idx) => idx !== i) })} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="url" value={newSound} onChange={(e) => setNewSound(e.target.value)} placeholder="Audio URL (MP3)..." style={{ flex: 1, background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '6px 10px', fontSize: 13, outline: 'none' }} />
                  <button type="button" onClick={() => { if (newSound) { setEditing({ ...editing, sounds: [...(editing.sounds || []), newSound] }); setNewSound(''); } }} style={{ padding: '6px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Add</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <ImageUpload label="Portrait Image" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url })} hint="Square preferred" />
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
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Mercenaries</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} />New Mercenary
        </button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search mercenaries..." />
    </div>
  );
}
