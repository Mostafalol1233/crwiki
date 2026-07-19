import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import ImageUpload from '@/components/admin/ImageUpload';

interface Seller {
  id: string;
  name: string;
  seller_name_slug: string;
  description: string;
  promotion_text: string;
  images: string[];       // jsonb array of image URLs
  prices: { item: string; price: number }[];  // jsonb
  email: string;
  phone: string;
  whatsapp: string;
  discord: string;
  website: string;
  telegram: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  featured: boolean;
  average_rating: number;
  total_reviews: number;
  rank: number;
  created_at: string;
}

const EMPTY: Partial<Seller> = {
  name: '', seller_name_slug: '', description: '', promotion_text: '',
  images: [], prices: [],
  email: '', phone: '', whatsapp: '', discord: '', website: '', telegram: '',
  facebook: '', twitter: '', instagram: '', youtube: '', tiktok: '',
  featured: false, average_rating: 0, total_reviews: 0, rank: 9999,
};

const col = createColumnHelper<Seller>();

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Parse raw prices textarea (one per line: "Item Name: 50") into array */
function parsePrices(raw: string): { item: string; price: number }[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.lastIndexOf(':');
      if (colonIdx === -1) return { item: line, price: 0 };
      return {
        item: line.slice(0, colonIdx).trim(),
        price: parseFloat(line.slice(colonIdx + 1).trim()) || 0,
      };
    });
}

function serializePrices(prices: { item: string; price: string | number }[]): string {
  return prices.map((p) => `${p.item}: ${p.price}`).join('\n');
}

export default function SellersManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Seller>>(EMPTY);
  const [pricesText, setPricesText] = useState('');
  const [imagesText, setImagesText] = useState('');
  const client = supabaseService;

  const fetchSellers = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data, error } = await client.from('sellers').select('*').order('rank', { ascending: true });
    if (error) toast.error(error.message);
    setItems(data || []);
    setLoading(false);
  }, [client]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const openForm = (seller?: Seller) => {
    const s = seller || EMPTY;
    setEditing(s);
    setPricesText(Array.isArray(s.prices) ? serializePrices(s.prices) : '');
    setImagesText(Array.isArray(s.images) ? s.images.join('\n') : '');
    setView('form');
  };

  const addImage = (url: string) => {
    const current = imagesText.trim();
    setImagesText(current ? `${current}\n${url}` : url);
  };

  const save = async () => {
    if (!client || !editing.name) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      const images = imagesText.split('\n').map(u => u.trim()).filter(Boolean);
      const prices = parsePrices(pricesText);
      const slug = editing.seller_name_slug || slugify(editing.name || '');
      const payload = {
        ...editing,
        seller_name_slug: slug,
        images,
        prices,
        updated_at: new Date().toISOString(),
      };
      delete (payload as any).id;
      delete (payload as any).created_at;

      if (editing.id) {
        const { error } = await client.from('sellers').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Seller updated');
      } else {
        const { error } = await client.from('sellers').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
        toast.success('Seller created');
      }
      await fetchSellers();
      setView('list');
      setEditing(EMPTY);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!client || !confirm('Delete this seller?')) return;
    const { error } = await client.from('sellers').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); await fetchSellers(); }
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const ta: React.CSSProperties = { ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };

  const columns = [
    col.accessor('images', {
      header: '',
      cell: (i) => {
        const imgs = i.getValue();
        const src = Array.isArray(imgs) ? imgs[0] : '';
        return src
          ? <img src={src} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid #27272a' }} />
          : <div style={{ width: 40, height: 40, background: '#27272a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🖼️</div>;
      }
    }),
    col.accessor('name', { header: 'Name', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('seller_name_slug', { header: 'Slug', cell: (i) => <span style={{ fontSize: 12, color: '#71717a' }}>{i.getValue()}</span> }),
    col.accessor('featured', { header: 'Featured', cell: (i) => <span style={{ fontSize: 12, color: i.getValue() ? '#d4a017' : '#52525b' }}>{i.getValue() ? '⭐ Yes' : 'No'}</span> }),
    col.accessor('rank', { header: 'Rank', cell: (i) => <span style={{ fontSize: 12, color: '#71717a' }}>{i.getValue() || '—'}</span> }),
    col.accessor('average_rating', { header: 'Rating', cell: (i) => <span style={{ fontSize: 12, color: '#d4a017' }}>{i.getValue() ? Number(i.getValue()).toFixed(1) : '—'}</span> }),
    col.display({
      id: 'actions', header: 'Actions',
      cell: (i) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => openForm(i.row.original)} style={{ padding: '4px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer' }}><Edit2 size={12} /></button>
          <button type="button" onClick={() => remove(i.row.original.id)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #27272a', borderRadius: 4, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
        </div>
      ),
    }),
  ];

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>← Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Seller' : 'New Seller'}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Basic Info */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Display Name *</label>
                  <input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value, seller_name_slug: editing.seller_name_slug || slugify(e.target.value) })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Slug (URL)</label>
                  <input type="text" value={editing.seller_name_slug || ''} onChange={(e) => setEditing({ ...editing, seller_name_slug: e.target.value })} style={inp} placeholder="auto-generated from name" />
                </div>
              </div>
              <div>
                <label style={lbl}>Short Description</label>
                <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} style={ta} rows={3} placeholder="Describe this seller..." />
              </div>
              <div>
                <label style={lbl}>Promotion Text</label>
                <input type="text" value={editing.promotion_text || ''} onChange={(e) => setEditing({ ...editing, promotion_text: e.target.value })} style={inp} placeholder="🔥 Special offer text..." />
              </div>
            </div>

            {/* Prices */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 Price List</div>
              <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>One per line — format: <code style={{ color: '#a1a1aa' }}>Item Name: Price</code></p>
              <textarea
                value={pricesText}
                onChange={(e) => setPricesText(e.target.value)}
                style={{ ...ta, minHeight: 120, fontFamily: 'monospace' }}
                placeholder={"GP 10000: 50\nVIP Account: 200\nZP 5000: 100"}
              />
            </div>

            {/* Contact */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>📞 Contact Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>WhatsApp</label><input type="text" value={editing.whatsapp || ''} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} style={inp} placeholder="https://wa.me/..." /></div>
                <div><label style={lbl}>Discord</label><input type="text" value={editing.discord || ''} onChange={(e) => setEditing({ ...editing, discord: e.target.value })} style={inp} placeholder="https://discord.gg/..." /></div>
                <div><label style={lbl}>Telegram</label><input type="text" value={editing.telegram || ''} onChange={(e) => setEditing({ ...editing, telegram: e.target.value })} style={inp} placeholder="https://t.me/..." /></div>
                <div><label style={lbl}>Email</label><input type="email" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Phone</label><input type="text" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Website</label><input type="text" value={editing.website || ''} onChange={(e) => setEditing({ ...editing, website: e.target.value })} style={inp} placeholder="https://..." /></div>
              </div>
            </div>

            {/* Social Media */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>🌐 Social Media</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Facebook</label><input type="text" value={editing.facebook || ''} onChange={(e) => setEditing({ ...editing, facebook: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Instagram</label><input type="text" value={editing.instagram || ''} onChange={(e) => setEditing({ ...editing, instagram: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Twitter / X</label><input type="text" value={editing.twitter || ''} onChange={(e) => setEditing({ ...editing, twitter: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>YouTube</label><input type="text" value={editing.youtube || ''} onChange={(e) => setEditing({ ...editing, youtube: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>TikTok</label><input type="text" value={editing.tiktok || ''} onChange={(e) => setEditing({ ...editing, tiktok: e.target.value })} style={inp} /></div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Images */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🖼️ Images</div>
              <ImageUpload label="Upload Image" value="" onChange={addImage} hint="Click to upload, then it's added below" />
              {imagesText.split('\n').filter(Boolean).map((url, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #27272a' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
                  <span style={{ flex: 1, fontSize: 11, color: '#52525b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                  <button type="button" onClick={() => setImagesText(imagesText.split('\n').filter((_, idx) => idx !== i).join('\n'))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><X size={12} /></button>
                </div>
              ))}
              <div>
                <label style={lbl}>Or paste image URLs (one per line)</label>
                <textarea value={imagesText} onChange={(e) => setImagesText(e.target.value)} style={{ ...ta, minHeight: 80 }} placeholder="https://..." />
              </div>
            </div>

            {/* Settings */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Settings</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Rank Order</label>
                  <input type="number" value={editing.rank ?? 9999} onChange={(e) => setEditing({ ...editing, rank: parseInt(e.target.value) || 9999 })} style={inp} min={1} />
                </div>
                <div>
                  <label style={lbl}>Avg Rating</label>
                  <input type="number" value={editing.average_rating ?? 0} onChange={(e) => setEditing({ ...editing, average_rating: parseFloat(e.target.value) || 0 })} style={inp} min={0} max={5} step={0.1} />
                </div>
              </div>
              <div>
                <label style={lbl}>Total Reviews</label>
                <input type="number" value={editing.total_reviews ?? 0} onChange={(e) => setEditing({ ...editing, total_reviews: parseInt(e.target.value) || 0 })} style={inp} min={0} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.featured || false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>⭐ Featured Seller</span>
              </label>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              style={{ padding: 12, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              {saving ? 'Saving...' : editing.id ? '✓ Update Seller' : '+ Create Seller'}
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
        <button type="button" onClick={() => openForm()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} /> New Seller
        </button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search sellers..." />
    </div>
  );
}
