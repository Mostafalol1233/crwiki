import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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
const PAGE_SIZE = 50;
const col = createColumnHelper<Weapon>();

export default function WeaponsManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Weapon>>(EMPTY);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const fetchPage = useCallback(async (pageOverride?: number, searchOverride?: string) => {
    const currentPage = pageOverride ?? page;
    const term = searchOverride ?? search;
    setLoading(true);
    try {
      const result = await adminFetch<{ data?: Weapon[]; count?: number }>('/api/admin/rebuild', {
        method: 'POST',
        body: JSON.stringify({ action: 'admin-table', type: 'weapons', operation: 'list', page: currentPage, pageSize: PAGE_SIZE, search: term }),
      });
      setItems(Array.isArray(result.data) ? result.data : []);
      setTotal(Number(result.count || 0));
      setPage(currentPage);
    } catch (e: any) {
      toast.error(e?.message || 'Unable to load weapons');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchPage(1, search); }, 250);
    return () => window.clearTimeout(timer);
  }, [search, fetchPage]);

  const save = async () => {
    if (!editing.name?.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const { id, created_at, ...payload } = {
        ...editing,
        name: editing.name.trim(),
        background_url: '',
        stats: editing.stats || {},
      };
      if (id) {
        await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'admin-table', type: 'weapons', operation: 'update', id, row: payload }) });
        toast.success('Updated');
      } else {
        await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'admin-table', type: 'weapons', operation: 'create', row: { ...payload, created_at: new Date().toISOString() } }) });
        toast.success('Created');
      }
      setView('list');
      setEditing(EMPTY);
      await fetchPage(page, search);
    } catch (e: any) {
      toast.error(e?.message || 'Unable to save weapon');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this weapon?')) return;
    try {
      await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'admin-table', type: 'weapons', operation: 'delete', id }) });
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Unable to delete weapon');
      return;
    }
    const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
    await fetchPage(nextPage, search);
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };
  const editStats = (patch: Record<string, any>) => setEditing((current) => ({ ...current, stats: { ...(current.stats || {}), ...patch } }));
  const stats = editing.stats || {};
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
          <div><label style={lbl}>Description (English)</label><textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>الوصف بالعربية</label><textarea dir="rtl" value={stats.description_ar || ''} onChange={(e) => editStats({ description_ar: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.8, textAlign: 'right' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Acquisition method</label>
              <select value={stats.acquisition_kind || ''} onChange={(e) => editStats({ acquisition_kind: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Unverified</option>
                <option value="gp_shop">GP Shop</option>
                <option value="zp_shop">ZP Shop</option>
                <option value="mileage_shop">Mileage Shop</option>
                <option value="black_market">Black Market</option>
                <option value="event">Event / Pass / Reward</option>
                <option value="vvip">VIP / VVIP</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Arabic acquisition label</label>
              <input dir="rtl" type="text" value={stats.acquisition_label_ar || ''} onChange={(e) => editStats({ acquisition_label_ar: e.target.value })} placeholder="مثال: متجر GP" style={{ ...inp, textAlign: 'right' }} />
            </div>
          </div>
          <div><label style={lbl}>شرح الاقتناء بالعربية</label><textarea dir="rtl" value={stats.acquisition_details_ar || ''} onChange={(e) => editStats({ acquisition_details_ar: e.target.value })} rows={2} placeholder="مثال: يُشترى من متجر GP." style={{ ...inp, resize: 'vertical', lineHeight: 1.8, textAlign: 'right' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input id="acquisition-verified" type="checkbox" checked={Boolean(stats.acquisition_verified)} onChange={(e) => editStats({ acquisition_verified: e.target.checked })} /><label htmlFor="acquisition-verified" style={{ ...lbl, margin: 0 }}>Acquisition method verified by an editor</label></div>
          <div><label style={lbl}>Weapon image</label><ImageUpload label="" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url, background_url: '' })} /><p style={{ color: '#71717a', fontSize: 12, marginTop: 6 }}>Only use an image showing this weapon alone. Card backgrounds are controlled by the catalogue.</p></div>
          <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#b9c1cb', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div><h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Weapons</h1><p style={{ fontSize: 12, color: '#71717a', margin: '5px 0 0' }}>{total.toLocaleString()} records · 50 loaded per page</p></div>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#b9c1cb', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} />New Weapon
        </button>
      </div>
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search all weapons by name..." style={{ ...inp, maxWidth: 420 }} />
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Filter this page..." pageSize={PAGE_SIZE} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 2px', color: '#71717a', fontSize: 12 }}>
        <span>{total ? `${((page - 1) * PAGE_SIZE) + 1}-${Math.min(page * PAGE_SIZE, total)} of ${total}` : '0 records'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => void fetchPage(page - 1)} disabled={loading || page <= 1} style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: page > 1 ? '#fafafa' : '#52525b', cursor: page > 1 ? 'pointer' : 'not-allowed' }}><ChevronLeft size={14} /></button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" onClick={() => void fetchPage(page + 1)} disabled={loading || page >= pageCount} style={{ display: 'flex', alignItems: 'center', padding: '5px 8px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: page < pageCount ? '#fafafa' : '#52525b', cursor: page < pageCount ? 'pointer' : 'not-allowed' }}><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
