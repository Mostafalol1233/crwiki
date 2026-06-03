import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import ImageUpload from '@/components/admin/ImageUpload';

interface Rank {
  id: string;
  name: string;
  tier: number;
  image_url: string;
  description: string;
  exp_required: number;
  requirements: string;
  bonus: string;
}

const EMPTY: Partial<Rank> = { name: '', tier: 1, image_url: '', description: '', exp_required: 0, requirements: '', bonus: '' };
const col = createColumnHelper<Rank>();

export default function RanksManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Rank>>(EMPTY);
  const client = supabaseService;

  const fetch = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data } = await client.from('ranks').select('*').order('tier', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!client || !editing.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing.id) { await client.from('ranks').update(editing).eq('id', editing.id); toast.success('Updated'); }
      else { await client.from('ranks').insert(editing); toast.success('Created'); }
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('image_url', { header: '', cell: (i) => i.getValue() ? <img src={i.getValue()} alt="" style={{ width: 36, height: 36, objectFit: 'contain', background: '#09090b', borderRadius: 4, border: '1px solid #27272a', padding: 2 }} /> : <div style={{ width: 36, height: 36, background: '#27272a', borderRadius: 4 }} /> }),
    col.accessor('tier', { header: 'Tier', cell: (i) => <span style={{ fontSize: 13, color: '#d4a017', fontWeight: 600 }}>{i.getValue()}</span> }),
    col.accessor('name', { header: 'Name', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('exp_required', { header: 'EXP Required', cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{(i.getValue() || 0).toLocaleString()}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => { setEditing(i.row.original); setView('form'); }} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}><Edit2 size={12} /></button>
          <button type="button" onClick={async () => { if (client && confirm('Delete?')) { await client.from('ranks').delete().eq('id', i.row.original.id); toast.success('Deleted'); await fetch(); } }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Rank' : 'New Rank'}</h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
            <div><label style={lbl}>Name *</label><input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Tier</label><input type="number" value={editing.tier || 1} onChange={(e) => setEditing({ ...editing, tier: Number(e.target.value) })} style={inp} min={1} /></div>
          </div>
          <div><label style={lbl}>EXP Required</label><input type="number" value={editing.exp_required || 0} onChange={(e) => setEditing({ ...editing, exp_required: Number(e.target.value) })} style={inp} /></div>
          <div><label style={lbl}>Description</label><textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>Requirements</label><textarea value={editing.requirements || ''} onChange={(e) => setEditing({ ...editing, requirements: e.target.value })} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>Bonus</label><input type="text" value={editing.bonus || ''} onChange={(e) => setEditing({ ...editing, bonus: e.target.value })} style={inp} /></div>
          <ImageUpload label="Rank Emblem" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url })} hint="Square image recommended" />
          <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Ranks</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}><Plus size={14} />New Rank</button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search ranks..." />
    </div>
  );
}
