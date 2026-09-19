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
  acquisition_methods?: any[];
  acquisition_summary_ar?: string;
  acquisition_summary_en?: string;
  release_date?: string;
  is_permanent?: boolean;
  verification_status?: string;
  source_url?: string;
  source_type?: string;
  last_verified_at?: string;
  created_at: string;
}

const CATEGORIES = ['Assault Rifle', 'Assault Rifles', 'Sniper Rifle', 'Sniper Rifles', 'SMG', 'Machine Gun', 'Machine Guns', 'Shotgun', 'Shotguns', 'Pistol', 'Pistols', 'Rifle', 'Rifles', 'Melee', 'Grenade'];
const EMPTY: Partial<Weapon> = { name: '', category: 'Assault Rifles', image_url: '', background_url: '', description: '', stats: {}, acquisition_methods: [], release_date: '', is_permanent: true, verification_status: 'unknown', source_url: '', source_type: '' };
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
    col.accessor('image_url', { header: '', cell: (i) => i.getValue() ? <img src={i.getValue()} alt="" loading="lazy" decoding="async" style={{ width: 40, height: 30, objectFit: 'contain', background: '#09090b', borderRadius: 4, border: '1px solid #27272a', padding: 2 }} /> : <div style={{ width: 40, height: 30, background: '#27272a', borderRadius: 4 }} /> }),
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
          <div><label style={lbl}>Description (English)</label><textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>الوصف بالعربية</label><textarea dir="rtl" value={stats.description_ar || ''} onChange={(e) => editStats({ description_ar: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.8, textAlign: 'right' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Release date</label><input type="date" value={editing.release_date || ''} onChange={(e) => setEditing({ ...editing, release_date: e.target.value })} style={inp} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}><input id="is-permanent" type="checkbox" checked={editing.is_permanent !== false} onChange={(e) => setEditing({ ...editing, is_permanent: e.target.checked })} /><label htmlFor="is-permanent" style={{ ...lbl, margin: 0 }}>Permanent (not temporary)</label></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Verification status</label>
              <select value={editing.verification_status || 'unknown'} onChange={(e) => setEditing({ ...editing, verification_status: e.target.value })} style={{ ...inp, cursor: 'pointer' }}>
                <option value="unknown">Unknown</option>
                <option value="verified">Verified</option>
                <option value="needs_review">Needs review</option>
                <option value="conflicting">Conflicting</option>
              </select>
            </div>
            <div><label style={lbl}>Source URL</label><input type="text" value={editing.source_url || ''} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} placeholder="https://..." style={inp} /></div>
          </div>
          <div style={{ border: '1px solid #27272a', borderRadius: 6, padding: 12, background: '#18181b' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ ...lbl, margin: 0 }}>Acquisition methods (structured) — Egyptian Arabic will be generated</label>
              <button type="button" onClick={() => {
                const cur = Array.isArray(editing.acquisition_methods) ? editing.acquisition_methods : [];
                setEditing({ ...editing, acquisition_methods: [...cur, { type: 'direct_purchase', title: '', currency: 'ZP', price: '', permanent: true, region: 'West', status: 'available', verified: false }] });
              }} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', cursor: 'pointer', fontSize: 12 }}>+ Add method</button>
            </div>
            {(Array.isArray(editing.acquisition_methods) ? editing.acquisition_methods : []).map((m: any, idx: number) => (
              <div key={idx} style={{ border: '1px solid #3f3f46', borderRadius: 4, padding: 10, marginBottom: 8, background: '#27272a' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <select value={m.type || 'other'} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], type: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                  }} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="direct_purchase">Direct purchase</option>
                    <option value="crate">Crate / Box</option>
                    <option value="event">Event</option>
                    <option value="zp">ZP Shop</option>
                    <option value="gp">GP Shop</option>
                    <option value="bundle">Bundle</option>
                    <option value="battle_pass">Battle Pass</option>
                    <option value="exchange">Exchange</option>
                    <option value="other">Other</option>
                  </select>
                  <select value={m.status || 'unknown'} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], status: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                  }} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="available">Available now</option>
                    <option value="limited">Limited-time</option>
                    <option value="historical">Historical</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <input type="text" value={m.title || ''} onChange={(e) => {
                  const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], title: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                }} placeholder="Title (e.g. Black Market Crate 2024)" style={{ ...inp, marginBottom: 6 }} />
                <input dir="rtl" type="text" value={m.titleAr || m.title_ar || ''} onChange={(e) => {
                  const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], titleAr: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                }} placeholder="العنوان بالعربية" style={{ ...inp, marginBottom: 6, textAlign: 'right' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
                  <input type="text" value={m.currency || ''} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], currency: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                  }} placeholder="Currency (ZP/GP)" style={inp} />
                  <input type="text" value={m.price || ''} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], price: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                  }} placeholder="Price" style={inp} />
                  <input type="text" value={m.region || ''} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], region: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                  }} placeholder="Region (West/China...)" style={inp} />
                </div>
                <textarea dir="rtl" value={m.descriptionAr || m.description_ar || ''} onChange={(e) => {
                  const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], descriptionAr: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                }} rows={2} placeholder="الشرح بالعامية المصرية — سيتم توليده تلقائياً إذا تركته فارغاً" style={{ ...inp, resize: 'vertical', textAlign: 'right', marginBottom: 6 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#a1a1aa' }}><input type="checkbox" checked={m.permanent !== false} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], permanent: e.target.checked }; setEditing({ ...editing, acquisition_methods: cur });
                  }} /> Permanent</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#a1a1aa' }}><input type="checkbox" checked={Boolean(m.verified)} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], verified: e.target.checked }; setEditing({ ...editing, acquisition_methods: cur });
                  }} /> Verified</label>
                  <input type="text" value={m.sourceUrl || m.source_url || ''} onChange={(e) => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur[idx] = { ...cur[idx], sourceUrl: e.target.value }; setEditing({ ...editing, acquisition_methods: cur });
                  }} placeholder="Source URL" style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={() => {
                    const cur = [...(editing.acquisition_methods as any[])]; cur.splice(idx, 1); setEditing({ ...editing, acquisition_methods: cur });
                  }} style={{ padding: '4px 8px', background: '#7f1d1d', border: 'none', borderRadius: 4, color: '#fecaca', cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ))}
            {(!editing.acquisition_methods || editing.acquisition_methods.length === 0) && <p style={{ color: '#71717a', fontSize: 12, margin: 0 }}>No structured methods yet — add one or leave empty for "unknown". The page will show "مفيش طريقة مؤكدة حاليًا" until verified.</p>}
          </div>
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
