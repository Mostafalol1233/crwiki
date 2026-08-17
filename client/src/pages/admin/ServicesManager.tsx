import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
import { DEFAULT_SERVICE_LISTINGS, SERVICE_CONTACT_FIELDS } from '../../../../shared/services-directory.js';

interface ServiceRow {
  id: string;
  seller_name: string;
  seller_slug: string;
  service_name: string;
  service_name_ar: string;
  profile_url: string;
  price_snapshot: string;
  price_snapshot_ar: string;
  observed_at_label: string;
  observed_at_label_ar: string;
  confidence: 'higher' | 'limited' | 'unverified';
  note: string;
  note_ar: string;
  media_url: string;
  gallery: string[];
  media_source: string;
  media_source_ar: string;
  contacts: Record<string, string>;
  published: boolean;
  featured: boolean;
  sort_order: number;
  source_url: string;
  source_checked_at: string;
}

type EditableService = Partial<ServiceRow>;

const EMPTY_CONTACTS = Object.fromEntries(SERVICE_CONTACT_FIELDS.map((field: { key: string; label: string }) => [field.key, '']));
const EMPTY: EditableService = {
  seller_name: '', seller_slug: '', service_name: '', service_name_ar: '', profile_url: '',
  price_snapshot: '', price_snapshot_ar: '', observed_at_label: '', observed_at_label_ar: '',
  confidence: 'unverified', note: '', note_ar: '', media_url: '', gallery: [], media_source: '', media_source_ar: '',
  contacts: EMPTY_CONTACTS, published: true, featured: false, sort_order: 9999, source_url: '', source_checked_at: '',
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeRow(row: any): ServiceRow {
  return {
    id: String(row.id), seller_name: row.seller_name || '', seller_slug: row.seller_slug || '', service_name: row.service_name || '',
    service_name_ar: row.service_name_ar || '', profile_url: row.profile_url || '', price_snapshot: row.price_snapshot || '', price_snapshot_ar: row.price_snapshot_ar || '',
    observed_at_label: row.observed_at_label || '', observed_at_label_ar: row.observed_at_label_ar || '', confidence: row.confidence || 'unverified',
    note: row.note || '', note_ar: row.note_ar || '', media_url: row.media_url || '', gallery: Array.isArray(row.gallery) ? row.gallery : [],
    media_source: row.media_source || '', media_source_ar: row.media_source_ar || '', contacts: { ...EMPTY_CONTACTS, ...(row.contacts || {}) },
    published: row.published !== false, featured: Boolean(row.featured), sort_order: Number(row.sort_order || 9999), source_url: row.source_url || '', source_checked_at: row.source_checked_at || '',
  };
}

const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const ta: React.CSSProperties = { ...inp, minHeight: 82, resize: 'vertical', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 5, display: 'block' };
const panel: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 };

export default function ServicesManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditableService>(EMPTY);
  const [galleryText, setGalleryText] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminFetch<{ data?: any[] }>('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'service-listings', operation: 'list' }) });
      setItems((response.data || []).map(normalizeRow));
    } catch (error: any) {
      toast.error(error.message);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openForm = (row?: ServiceRow) => {
    const value = row ? normalizeRow(row) : { ...EMPTY, contacts: { ...EMPTY_CONTACTS } };
    setEditing(value);
    setGalleryText((value.gallery || []).join('\n'));
    setView('form');
  };

  const update = (key: keyof EditableService, value: unknown) => setEditing((current) => ({ ...current, [key]: value }));
  const updateContact = (key: string, value: string) => setEditing((current) => ({ ...current, contacts: { ...EMPTY_CONTACTS, ...(current.contacts || {}), [key]: value } }));

  const save = async () => {
    if (!editing.seller_name?.trim() || !editing.service_name?.trim()) { toast.error('Seller and service names are required'); return; }
    setSaving(true);
    try {
      const gallery = galleryText.split('\n').map((url) => url.trim()).filter(Boolean);
      const contacts = { ...EMPTY_CONTACTS, ...(editing.contacts || {}) };
      const profileUrl = String(editing.profile_url || contacts.funpay || '').trim();
      if (profileUrl && !contacts.funpay) contacts.funpay = profileUrl;
      const payload = {
        seller_name: editing.seller_name.trim(), seller_slug: editing.seller_slug || slugify(editing.seller_name), service_name: editing.service_name.trim(),
        service_name_ar: editing.service_name_ar || '', profile_url: profileUrl, price_snapshot: editing.price_snapshot || '', price_snapshot_ar: editing.price_snapshot_ar || '',
        observed_at_label: editing.observed_at_label || '', observed_at_label_ar: editing.observed_at_label_ar || '', confidence: editing.confidence || 'unverified',
        note: editing.note || '', note_ar: editing.note_ar || '', media_url: editing.media_url || '', gallery, media_source: editing.media_source || '', media_source_ar: editing.media_source_ar || '',
        contacts, published: editing.published !== false, featured: Boolean(editing.featured), sort_order: Number(editing.sort_order || 9999), source_url: editing.source_url || profileUrl || '',
        source_checked_at: editing.source_checked_at || new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      if (editing.id) {
        await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'service-listings', operation: 'update', id: editing.id, row: payload }) });
        toast.success('Service listing updated');
      } else {
        await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'service-listings', operation: 'create', row: payload }) });
        toast.success('Service listing created');
      }
      await fetchItems(); setView('list'); setEditing(EMPTY); setGalleryText('');
    } catch (error: any) {
      toast.error(error.message || 'Save failed. Apply the service-listings migration first if the table is missing.');
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this service listing?')) return;
    try {
      await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'service-listings', operation: 'delete', id }) });
      toast.success('Service listing deleted');
      await fetchItems();
    } catch (error: any) { toast.error(error.message); }
  };

  const importDefaults = async () => {
    if (!confirm('Import the curated service directory into the editable table? Existing rows will remain.')) return;
    setSaving(true);
    try {
      const rows = DEFAULT_SERVICE_LISTINGS.map((item: any) => ({
        seller_name: item.seller, seller_slug: item.sellerSlug, service_name: item.service, service_name_ar: item.serviceAr,
        profile_url: item.profileUrl, price_snapshot: item.price, price_snapshot_ar: item.priceAr, observed_at_label: item.age, observed_at_label_ar: item.ageAr,
        confidence: item.confidence, note: item.note, note_ar: item.noteAr, media_url: item.mediaUrl, gallery: item.gallery, media_source: item.mediaSource, media_source_ar: item.mediaSourceAr,
        contacts: item.contacts, published: item.published !== false, featured: Boolean(item.featured), sort_order: item.sortOrder, source_url: item.profileUrl, source_checked_at: new Date().toISOString(),
      }));
      await adminFetch('/api/admin/rebuild', { method: 'POST', body: JSON.stringify({ action: 'service-listings', operation: 'bulk-import', rows }) });
      toast.success(`${rows.length} service listings imported`); await fetchItems();
    } catch (error: any) { toast.error(error.message || 'Import failed'); }
    finally { setSaving(false); }
  };

  if (view === 'form') {
    return <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}><button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '7px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}><ArrowLeft size={13} /></button><h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Service Listing' : 'New Service Listing'}</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section style={panel}><div style={{ color: '#d4a017', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Service copy</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><label style={lbl}>Seller name *</label><input value={editing.seller_name || ''} onChange={(e) => update('seller_name', e.target.value)} style={inp} /></div><div><label style={lbl}>Seller slug</label><input value={editing.seller_slug || ''} onChange={(e) => update('seller_slug', e.target.value)} style={inp} placeholder="auto-generated" /></div><div><label style={lbl}>Service name *</label><input value={editing.service_name || ''} onChange={(e) => update('service_name', e.target.value)} style={inp} /></div><div><label style={lbl}>Service name in Arabic</label><input value={editing.service_name_ar || ''} onChange={(e) => update('service_name_ar', e.target.value)} style={inp} dir="rtl" /></div></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><label style={lbl}>English note</label><textarea value={editing.note || ''} onChange={(e) => update('note', e.target.value)} style={ta} /></div><div><label style={lbl}>Arabic note</label><textarea value={editing.note_ar || ''} onChange={(e) => update('note_ar', e.target.value)} style={ta} dir="rtl" /></div></div></section>
          <section style={panel}><div style={{ color: '#d4a017', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Price and source snapshot</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><div><label style={lbl}>English price snapshot</label><input value={editing.price_snapshot || ''} onChange={(e) => update('price_snapshot', e.target.value)} style={inp} /></div><div><label style={lbl}>Arabic price snapshot</label><input value={editing.price_snapshot_ar || ''} onChange={(e) => update('price_snapshot_ar', e.target.value)} style={inp} dir="rtl" /></div><div><label style={lbl}>English observed label</label><input value={editing.observed_at_label || ''} onChange={(e) => update('observed_at_label', e.target.value)} style={inp} /></div><div><label style={lbl}>Arabic observed label</label><input value={editing.observed_at_label_ar || ''} onChange={(e) => update('observed_at_label_ar', e.target.value)} style={inp} dir="rtl" /></div><div><label style={lbl}>Confidence</label><select value={editing.confidence || 'unverified'} onChange={(e) => update('confidence', e.target.value)} style={inp}><option value="higher">Higher</option><option value="limited">Limited</option><option value="unverified">Unverified</option></select></div><div><label style={lbl}>Sort order</label><input type="number" value={editing.sort_order || 9999} onChange={(e) => update('sort_order', Number(e.target.value))} style={inp} /></div></div><div><label style={lbl}>Source URL</label><input value={editing.source_url || ''} onChange={(e) => update('source_url', e.target.value)} style={inp} placeholder="https://..." /></div></section>
          <section style={panel}><div style={{ color: '#d4a017', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>All contact and social channels</div><p style={{ margin: 0, color: '#71717a', fontSize: 12 }}>Keep the FunPay profile and add every verified channel supplied by the seller. Blank fields are not shown publicly.</p><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{SERVICE_CONTACT_FIELDS.map((field: { key: string; label: string }) => <div key={field.key}><label style={lbl}>{field.label}</label><input type={field.key === 'email' ? 'email' : 'text'} value={editing.contacts?.[field.key] || ''} onChange={(e) => updateContact(field.key, e.target.value)} style={inp} placeholder={field.key === 'email' ? 'seller@example.com' : 'https://...'} /></div>)}</div></section>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section style={panel}><div style={{ color: '#d4a017', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Media and gallery</div><div><label style={lbl}>Hero image URL</label><input value={editing.media_url || ''} onChange={(e) => update('media_url', e.target.value)} style={inp} placeholder="https://... or /portal/..." /></div><div><label style={lbl}>Gallery URLs, one per line</label><textarea value={galleryText} onChange={(e) => setGalleryText(e.target.value)} style={{ ...ta, minHeight: 140 }} placeholder="https://..." /></div><div><label style={lbl}>English media note</label><textarea value={editing.media_source || ''} onChange={(e) => update('media_source', e.target.value)} style={ta} /></div><div><label style={lbl}>Arabic media note</label><textarea value={editing.media_source_ar || ''} onChange={(e) => update('media_source_ar', e.target.value)} style={ta} dir="rtl" /></div>{editing.media_url && <img src={editing.media_url} alt="Service hero preview" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 5, background: '#09090b', padding: 8 }} />}</section>
          <section style={panel}><div style={{ color: '#d4a017', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Publishing</div><label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#d4d4d8', fontSize: 13 }}><input type="checkbox" checked={editing.published !== false} onChange={(e) => update('published', e.target.checked)} />Visible on public services page</label><label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#d4d4d8', fontSize: 13 }}><input type="checkbox" checked={Boolean(editing.featured)} onChange={(e) => update('featured', e.target.checked)} />Featured in directory</label><button type="button" disabled={saving} onClick={save} style={{ marginTop: 8, padding: '10px 14px', background: '#d4a017', border: 0, borderRadius: 4, color: '#18181b', cursor: saving ? 'wait' : 'pointer', fontWeight: 700 }}>{saving ? 'Saving...' : editing.id ? 'Update service listing' : 'Create service listing'}</button></section>
        </div>
      </div>
    </div>;
  }

  return <div style={{ maxWidth: 1200 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}><div><h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Service Listings</h1><p style={{ color: '#71717a', fontSize: 13, margin: '6px 0 0' }}>Edit service copy, images, prices, FunPay profiles, and every additional social/contact channel.</p></div><div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={importDefaults} disabled={saving} style={{ padding: '8px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#d4d4d8', cursor: 'pointer' }}>Import curated defaults</button><button type="button" onClick={() => openForm()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#d4a017', border: 0, borderRadius: 4, color: '#18181b', cursor: 'pointer', fontWeight: 700 }}><Plus size={14} /> New service</button></div></div>{loading ? <p style={{ color: '#71717a' }}>Loading service listings...</p> : items.length === 0 ? <div style={{ ...panel, alignItems: 'flex-start' }}><p style={{ color: '#a1a1aa', margin: 0 }}>No editable service rows are present yet. Apply the service-listings migration, then import the curated defaults or create a listing manually.</p></div> : <div style={{ overflowX: 'auto', border: '1px solid #27272a', borderRadius: 6 }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ background: '#18181b', color: '#71717a', textAlign: 'left' }}><th style={{ padding: 12 }}>Seller</th><th style={{ padding: 12 }}>Service</th><th style={{ padding: 12 }}>Contacts</th><th style={{ padding: 12 }}>Status</th><th style={{ padding: 12 }}>Actions</th></tr></thead><tbody>{items.map((item) => { const contactCount = Object.values(item.contacts || {}).filter(Boolean).length; return <tr key={item.id} style={{ borderTop: '1px solid #27272a', color: '#d4d4d8' }}><td style={{ padding: 12, fontWeight: 600 }}>{item.seller_name}</td><td style={{ padding: 12 }}><div>{item.service_name}</div><span style={{ color: '#71717a', fontSize: 11 }}>{item.service_name_ar || 'Arabic title missing'}</span></td><td style={{ padding: 12, color: '#a1a1aa' }}>{contactCount} channel{contactCount === 1 ? '' : 's'}</td><td style={{ padding: 12 }}><span style={{ color: item.published ? '#86efac' : '#71717a' }}>{item.published ? 'Published' : 'Hidden'}</span></td><td style={{ padding: 12 }}><div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => openForm(item)} style={{ padding: '5px 9px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#d4d4d8', cursor: 'pointer' }}><Edit2 size={13} /></button>{item.profile_url && <a href={item.profile_url} target="_blank" rel="noreferrer" style={{ padding: '5px 9px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#d4d4d8' }}><ExternalLink size={13} /></a>}<button type="button" onClick={() => remove(item.id)} style={{ padding: '5px 9px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button></div></td></tr>; })}</tbody></table></div>}</div>;
}
