import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Save, LayoutGrid, Search, X, RefreshCw, ExternalLink } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

const PORTALS = [
  { key: 'portal_img_weapons',     label: 'Weapons',     desc: 'Rifles, pistols, snipers & melee',    defaultImg: '/portal/weapons.jpg',     href: '/weapons',     searchCategory: 'weapons' },
  { key: 'portal_img_maps',        label: 'Maps',        desc: 'Battle arenas and layouts',            defaultImg: '/portal/maps.jpg',        href: '/maps',        searchCategory: 'maps' },
  { key: 'portal_img_mercenaries', label: 'Mercenaries', desc: 'Elite playable operators',             defaultImg: '/portal/mercenaries.jpg', href: '/mercenaries', searchCategory: 'mercenaries' },
  { key: 'portal_img_modes',       label: 'Game Modes',  desc: 'Every mode with strategies',           defaultImg: '/portal/modes.jpg',       href: '/modes',       searchCategory: 'modes' },
  { key: 'portal_img_ranks',       label: 'Ranks',       desc: 'Rank tiers, EXP & progression',       defaultImg: '/portal/ranks.jpg',       href: '/ranks',       searchCategory: 'ranks' },
  { key: 'portal_img_events',      label: 'Events',      desc: 'Tournaments & limited-time ops',       defaultImg: '/portal/events.jpg',      href: '/events',      searchCategory: 'events' },
];

interface ImageResult { url: string; label: string; thumb?: string }

// ── Image Search Modal ─────────────────────────────────────────────────────────
function ImageSearchModal({
  category, label, onSelect, onClose,
}: { category: string; label: string; onSelect: (url: string) => void; onClose: () => void }) {
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/portal-images/search?category=${encodeURIComponent(category)}`);
      const d = await r.json();
      setResults(d.images || []);
    } catch { toast.error('Failed to fetch images'); }
    finally { setLoading(false); }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 10, width: '100%', maxWidth: 780, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} color="#d4a017" />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#fafafa' }}>Real Images — {label}</span>
            <span style={{ fontSize: 11, color: '#52525b', marginLeft: 4 }}>from crossfire.z8games.com</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button" onClick={load} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>
              <RefreshCw size={11} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} /> Refresh
            </button>
            <button type="button" onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', padding: 5, background: 'transparent', border: '1px solid #3f3f46', borderRadius: 4, color: '#71717a', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Custom URL input */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid #27272a', display: 'flex', gap: 8 }}>
          <input type="url" placeholder="Or paste any image URL directly..." value={customUrl} onChange={e => setCustomUrl(e.target.value)} style={{ ...inp, flex: 1 }} />
          <button type="button" onClick={() => { if (customUrl.trim()) { onSelect(customUrl.trim()); onClose(); } }}
            disabled={!customUrl.trim()}
            style={{ padding: '8px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
            Use This URL
          </button>
        </div>

        {/* Image grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#52525b' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #d4a017', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              Fetching official CrossFire images…
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: 40 }}>No images found. Try refreshing or paste a URL above.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {results.map((img, i) => (
                <div key={i} onClick={() => { onSelect(img.url); onClose(); }}
                  style={{ cursor: 'pointer', border: '2px solid #27272a', borderRadius: 6, overflow: 'hidden', background: '#0a0a0a', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#d4a017')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272a')}
                >
                  <div style={{ position: 'relative', height: 110, overflow: 'hidden' }}>
                    <img src={img.thumb || img.url} alt={img.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                      onError={e => { (e.target as HTMLImageElement).src = img.url; }}
                    />
                    <a href={img.url} target="_blank" rel="noreferrer" onClick={ev => ev.stopPropagation()}
                      style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.7)', borderRadius: 3, padding: 3, display: 'flex', color: '#fff' }}>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div style={{ padding: '5px 8px', fontSize: 10, color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {img.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PortalsManager() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchModal, setSearchModal] = useState<{ key: string; category: string; label: string } | null>(null);
  const client = supabaseService;

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await client.from('site_settings').select('*').limit(1).maybeSingle();
        const map: Record<string, string> = {};
        if (data) {
          for (const [k, v] of Object.entries(data)) {
            if (v && typeof v === 'string' && k.startsWith('portal_img_')) map[k] = v;
          }
        }
        setImages(map);
      } catch (e) {
        console.error('Failed to load portal images:', e instanceof Error ? e.message : String(e));
      } finally { setLoading(false); }
    })();
  }, []);

  const setImg = (key: string, url: string) => setImages(prev => ({ ...prev, [key]: url }));

  const save = async () => {
    if (!client) { toast.error('No admin client'); return; }
    setSaving(true);
    try {
      const { data: existing } = await client.from('site_settings').select('id').limit(1).maybeSingle();
      if (!existing?.id) { toast.error('Site settings row not found'); return; }
      const { error } = await client.from('site_settings').update({ ...images, updated_at: new Date().toISOString() }).eq('id', existing.id);
      if (error) throw error;
      toast.success('Portal images saved — live on homepage!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save portal images');
    } finally { setSaving(false); }
  };

  const card: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' };

  if (loading) return <div style={{ color: '#52525b', padding: 40, textAlign: 'center' }}>Loading portal settings...</div>;

  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {searchModal && (
        <ImageSearchModal
          category={searchModal.category}
          label={searchModal.label}
          onSelect={(url) => setImg(searchModal.key, url)}
          onClose={() => setSearchModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <LayoutGrid size={18} color="#d4a017" />
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Category Portal Images</h1>
          </div>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
            Upload, paste a URL, or click <strong style={{ color: '#a1a1aa' }}>Find Real Images</strong> to pull official CrossFire art for any portal.
          </p>
        </div>
        <button type="button" onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          <Save size={14} />{saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Portal grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {PORTALS.map(portal => {
          const currentImg = images[portal.key] || '';
          const previewImg = currentImg || portal.defaultImg;
          return (
            <div key={portal.key} style={card}>
              {/* Preview thumbnail */}
              <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: '#0a0a0a' }}>
                <img src={previewImg} alt={portal.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)' }} />
                <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{portal.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>{portal.desc}</div>
                </div>
                <div style={{ position: 'absolute', top: 8, right: 8, background: currentImg ? 'rgba(39,195,85,0.9)' : 'rgba(82,82,91,0.9)', borderRadius: 3, padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#fff' }}>
                  {currentImg ? 'Custom' : 'Default'}
                </div>
              </div>

              {/* Controls */}
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {/* Find Real Images button */}
                <button type="button"
                  onClick={() => setSearchModal({ key: portal.key, category: portal.searchCategory, label: portal.label })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 12px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.35)', borderRadius: 4, color: '#d4a017', cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%' }}>
                  <Search size={12} /> Find Real Images
                </button>

                <ImageUpload label="" value={currentImg} onChange={url => setImg(portal.key, url)} bucket="media" hint="Or drop / click to upload your own" />

                {currentImg && (
                  <button type="button" onClick={() => setImg(portal.key, '')}
                    style={{ padding: '5px 10px', background: 'transparent', border: '1px solid #3f3f46', borderRadius: 4, color: '#71717a', cursor: 'pointer', fontSize: 12 }}>
                    ↩ Reset to default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #27272a' }}>
        <button type="button" onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          <Save size={14} />{saving ? 'Saving...' : 'Save Portal Images'}
        </button>
      </div>
    </div>
  );
}
