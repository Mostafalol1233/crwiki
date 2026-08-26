import { useState, useEffect } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

interface Settings {
  site_name: string;
  site_description_en: string;
  site_description_ar: string;
  hero_bg_url: string;
  hero_title_en: string;
  hero_title_ar: string;
  hero_subtitle_en: string;
  hero_subtitle_ar: string;
  hero_cta_text: string;
  hero_cta_url: string;
  logo_url: string;
  favicon_url: string;
  contact_email: string;
  ga_id: string;
  gsc_id: string;
  default_og_image: string;
  announcements_enabled: boolean;
  review_verification_enabled: boolean;
}

const DEFAULTS: Settings = {
  site_name: 'CrossFire Wiki', site_description_en: '', site_description_ar: '',
  hero_bg_url: '', hero_title_en: '', hero_title_ar: '', hero_subtitle_en: '', hero_subtitle_ar: '',
  hero_cta_text: '', hero_cta_url: '', logo_url: '', favicon_url: '', contact_email: '',
  ga_id: '', gsc_id: '', default_og_image: '',
  announcements_enabled: true, review_verification_enabled: false,
};

async function getSettings(client: any): Promise<Settings> {
  const { data, error } = await client.from('site_settings').select('*').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  const row = data || {};
  return {
    ...DEFAULTS,
    site_name: row.seo_title || row.site_name || DEFAULTS.site_name,
    site_description_en: row.seo_description || row.site_description_en || '',
    hero_bg_url: row.hero_image || row.hero_bg_url || '',
    default_og_image: row.seo_og_image_url || row.default_og_image || '',
    announcements_enabled: row.announcements_enabled ?? DEFAULTS.announcements_enabled,
    review_verification_enabled: row.review_verification_enabled ?? DEFAULTS.review_verification_enabled,
  };
}

async function saveSettings(client: any, settings: Settings): Promise<number> {
  const { data: existing, error: readError } = await client.from('site_settings').select('*').limit(1).maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!existing?.id) throw new Error('Site settings row not found');

  const patch: Record<string, unknown> = {};
  const setIfPresent = (column: string, value: unknown) => {
    if (Object.prototype.hasOwnProperty.call(existing, column)) patch[column] = value;
  };
  setIfPresent('seo_title', settings.site_name.trim());
  setIfPresent('seo_description', settings.site_description_en.trim());
  setIfPresent('hero_image', settings.hero_bg_url.trim());
  setIfPresent('seo_og_image_url', settings.default_og_image.trim());
  setIfPresent('announcements_enabled', settings.announcements_enabled);
  setIfPresent('review_verification_enabled', settings.review_verification_enabled);
  setIfPresent('public_base_url', (existing.public_base_url || '').trim());
  if (!Object.keys(patch).length) throw new Error('No supported site settings columns are available');
  const { error } = await client.from('site_settings').update(patch).eq('id', existing.id);
  if (error) throw new Error(error.message);
  return Object.keys(patch).length;
}

export default function SiteSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const client = supabaseService;

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    getSettings(client).then(setSettings).catch(console.error).finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, val: any) => setSettings((s) => ({ ...s, [key]: val }));

  const save = async () => {
    if (!client) { toast.error('No admin client available'); return; }
    setSaving(true);
    try {
      const savedCount = await saveSettings(client, settings);
      toast.success(`Settings saved (${savedCount} supported fields)`);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };
  const section: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '18px 20px' };
  const sectionTitle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #27272a' };

  if (loading) return <div style={{ color: '#52525b', padding: 40, textAlign: 'center' }}>Loading settings...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Site Settings</h1>
        <button type="button" onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          <Save size={13} />{saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* General */}
      <div style={section}>
        <div style={sectionTitle}>General</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Site Name</label><input type="text" value={settings.site_name} onChange={(e) => set('site_name', e.target.value)} style={inp} /></div>
          <div><label style={lbl}>Description (EN)</label><textarea value={settings.site_description_en} onChange={(e) => set('site_description_en', e.target.value)} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>Description (AR)</label><textarea value={settings.site_description_ar} onChange={(e) => set('site_description_ar', e.target.value)} rows={2} style={{ ...inp, direction: 'rtl', resize: 'vertical', lineHeight: 1.6 }} /></div>
          <div><label style={lbl}>Contact Email</label><input type="email" value={settings.contact_email} onChange={(e) => set('contact_email', e.target.value)} style={inp} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ImageUpload label="Site Logo" value={settings.logo_url} onChange={(url) => set('logo_url', url)} hint="SVG or PNG, transparent bg" />
            <ImageUpload label="Favicon" value={settings.favicon_url} onChange={(url) => set('favicon_url', url)} hint="32x32 or 64x64 PNG" />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={section}>
        <div style={sectionTitle}>Hero Section</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ImageUpload label="Hero Background" value={settings.hero_bg_url} onChange={(url) => set('hero_bg_url', url)} hint="1920x1080 recommended" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Hero Title (EN)</label><input type="text" value={settings.hero_title_en} onChange={(e) => set('hero_title_en', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Hero Title (AR)</label><input type="text" value={settings.hero_title_ar} onChange={(e) => set('hero_title_ar', e.target.value)} style={{ ...inp, direction: 'rtl' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Subtitle (EN)</label><input type="text" value={settings.hero_subtitle_en} onChange={(e) => set('hero_subtitle_en', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Subtitle (AR)</label><input type="text" value={settings.hero_subtitle_ar} onChange={(e) => set('hero_subtitle_ar', e.target.value)} style={{ ...inp, direction: 'rtl' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>CTA Button Text</label><input type="text" value={settings.hero_cta_text} onChange={(e) => set('hero_cta_text', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>CTA URL</label><input type="url" value={settings.hero_cta_url} onChange={(e) => set('hero_cta_url', e.target.value)} style={inp} /></div>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div style={section}>
        <div style={sectionTitle}>SEO Defaults</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Google Analytics ID</label><input type="text" value={settings.ga_id} onChange={(e) => set('ga_id', e.target.value)} style={inp} placeholder="G-XXXXXXXXXX" /></div>
            <div><label style={lbl}>Google Search Console</label><input type="text" value={settings.gsc_id} onChange={(e) => set('gsc_id', e.target.value)} style={inp} /></div>
          </div>
          <ImageUpload label="Default OG Image" value={settings.default_og_image} onChange={(url) => set('default_og_image', url)} hint="1200x630px" />
        </div>
      </div>

      {/* Feature Flags */}
      <div style={section}>
        <div style={sectionTitle}>Feature Flags</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {([
            ['announcements_enabled', 'Enable Announcements'],
            ['review_verification_enabled', 'Enable Review Verification'],
          ] as const).map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <div style={{ position: 'relative', width: 36, height: 20 }}>
                <input type="checkbox" checked={settings[key] as boolean} onChange={(e) => set(key, e.target.checked)} style={{ display: 'none' }} />
                <div onClick={() => set(key, !(settings[key] as boolean))}
                  style={{ position: 'absolute', inset: 0, background: settings[key] ? '#d4a017' : '#27272a', borderRadius: 10, border: '1px solid #3f3f46', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <div style={{ position: 'absolute', top: 2, left: settings[key] ? 18 : 2, width: 14, height: 14, background: '#fafafa', borderRadius: '50%', transition: 'left 0.15s' }} />
                </div>
              </div>
              <span style={{ fontSize: 13, color: '#a1a1aa' }}>{label}</span>
              {settings[key] && <span style={{ fontSize: 11, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '1px 6px', borderRadius: 3 }}>ACTIVE</span>}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
