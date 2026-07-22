import { useState, useEffect } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Save, LayoutGrid } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

const PORTALS = [
  { key: 'portal_img_weapons',     label: 'Weapons',     desc: 'Rifles, pistols, snipers & melee',    defaultImg: '/portal/weapons.png',     href: '/weapons' },
  { key: 'portal_img_maps',        label: 'Maps',        desc: 'Battle arenas and layouts',            defaultImg: '/portal/maps.jpg',        href: '/maps' },
  { key: 'portal_img_mercenaries', label: 'Mercenaries', desc: 'Elite playable operators',             defaultImg: '/portal/mercenaries.png', href: '/mercenaries' },
  { key: 'portal_img_modes',       label: 'Game Modes',  desc: 'Every mode with strategies',           defaultImg: '/portal/modes.png',       href: '/modes' },
  { key: 'portal_img_ranks',       label: 'Ranks',       desc: 'Rank tiers, EXP & progression',       defaultImg: '/portal/ranks.png',       href: '/ranks' },
  { key: 'portal_img_events',      label: 'Events',      desc: 'Tournaments & limited-time ops',       defaultImg: '/portal/events.jpg',      href: '/events' },
];

export default function PortalsManager() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const client = supabaseService;

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await client
          .from('site_settings')
          .select('portal_img_weapons, portal_img_maps, portal_img_mercenaries, portal_img_modes, portal_img_ranks, portal_img_events')
          .limit(1)
          .single();
        const map: Record<string, string> = {};
        if (data) {
          for (const [k, v] of Object.entries(data)) {
            if (v && typeof v === 'string' && k.startsWith('portal_img_')) map[k] = v;
          }
        }
        setImages(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setImg = (key: string, url: string) =>
    setImages(prev => ({ ...prev, [key]: url }));

  const save = async () => {
    if (!client) { toast.error('No admin client'); return; }
    setSaving(true);
    try {
      const { data: existing } = await client.from('site_settings').select('id').limit(1).single();
      if (!existing?.id) { toast.error('Site settings row not found'); return; }
      const { error } = await client
        .from('site_settings')
        .update({ ...images, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
      toast.success('Portal images saved — live on homepage!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save portal images');
    } finally {
      setSaving(false);
    }
  };

  const card: React.CSSProperties = {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  if (loading) {
    return <div style={{ color: '#52525b', padding: 40, textAlign: 'center' }}>Loading portal settings...</div>;
  }

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <LayoutGrid size={18} color="#d4a017" />
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Category Portal Images</h1>
          </div>
          <p style={{ fontSize: 13, color: '#52525b', margin: 0 }}>
            Upload or paste a URL for each category card on the homepage.
            Leave blank to use the default local image.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', background: '#d4a017', border: 'none',
            borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save All'}
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
              <div style={{ position: 'relative', height: 130, overflow: 'hidden', background: '#0a0a0a' }}>
                <img
                  src={previewImg}
                  alt={portal.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)',
                }} />
                <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                    {portal.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>
                    {portal.desc}
                  </div>
                </div>
                {currentImg && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(39,195,85,0.9)', borderRadius: 3,
                    padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#fff',
                  }}>
                    Custom
                  </div>
                )}
                {!currentImg && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(82,82,91,0.9)', borderRadius: 3,
                    padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#fff',
                  }}>
                    Default
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <ImageUpload
                  label=""
                  value={currentImg}
                  onChange={(url) => setImg(portal.key, url)}
                  bucket="media"
                  hint="Drop or click to upload"
                />
                {currentImg && (
                  <button
                    type="button"
                    onClick={() => setImg(portal.key, '')}
                    style={{
                      padding: '5px 10px', background: 'transparent',
                      border: '1px solid #3f3f46', borderRadius: 4,
                      color: '#71717a', cursor: 'pointer', fontSize: 12,
                    }}
                  >
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
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', background: '#d4a017', border: 'none',
            borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Portal Images'}
        </button>
      </div>
    </div>
  );
}
