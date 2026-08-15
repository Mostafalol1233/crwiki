import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '@/components/admin/DataTable';
import TipTapEditor from '@/components/admin/TipTapEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import SEOPanel from '@/components/admin/SEOPanel';
import GalleryManager, { GalleryItem } from '@/components/admin/GalleryManager';

interface Event {
  id: string;
  title: string;
  title_ar: string;
  event_name_slug: string;
  description: string;
  description_ar: string;
  image_url: string;
  date: string;
  start_date: string;
  end_date: string;
  location: string;
  type: string;
  source_url: string;
  seo_title: string;
  seo_description: string;
  canonical_url: string;
  featured: boolean;
  created_at: string;
  gallery: GalleryItem[];
}

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// ─── Auto date parser ──────────────────────────────────────────────────────────
const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function autoParseEventDates(s: string): { start: string; end: string } {
  if (!s) return { start: '', end: '' };
  const yearM = s.match(/20(\d{2})/); const year = yearM ? parseInt(yearM[0]) : new Date().getFullYear();
  // "Month D – Month D" cross-month: "June 10 – August 5"
  const xm = s.match(/([a-z]+)\s+(\d+)(?:st|nd|rd|th)?\s*[-–—~]+\s*([a-z]+)\s+(\d+)(?:st|nd|rd|th)?/i);
  if (xm) {
    const m1 = MONTHS[xm[1].toLowerCase()], m2 = MONTHS[xm[3].toLowerCase()];
    if (m1 !== undefined && m2 !== undefined) {
      const y2 = m2 < m1 ? year + 1 : year;
      return { start: toDatetimeLocal(new Date(year, m1, +xm[2], 0, 0)), end: toDatetimeLocal(new Date(y2, m2, +xm[4], 23, 59)) };
    }
  }
  // "Month D – D" same-month: "July 20th – 26th"
  const sm = s.match(/([a-z]+)\s+(\d+)(?:st|nd|rd|th)?\s*[-–—~]+\s*(\d+)(?:st|nd|rd|th)?/i);
  if (sm) {
    const m = MONTHS[sm[1].toLowerCase()];
    if (m !== undefined) return { start: toDatetimeLocal(new Date(year, m, +sm[2], 0, 0)), end: toDatetimeLocal(new Date(year, m, +sm[3], 23, 59)) };
  }
  // Single date: "July 26"
  const sg = s.match(/([a-z]+)\s+(\d+)(?:st|nd|rd|th)?/i);
  if (sg) {
    const m = MONTHS[sg[1].toLowerCase()];
    if (m !== undefined) return { start: toDatetimeLocal(new Date(year, m, +sg[2], 0, 0)), end: toDatetimeLocal(new Date(year, m, +sg[2], 23, 59)) };
  }
  return { start: '', end: '' };
}

const SITE = 'https://crossfire.wiki';
const FOCUS_KW = 'crossfire';

/** Generates SEO fields that score 100/100 in SEOPanel */
function buildEventSEO(title: string, description: string, slug: string, date: string) {
  const plain = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Meta title: 50–60 chars, must contain "CrossFire"
  const hasCF = /crossfire/i.test(title);
  let base = hasCF ? title : `${title} - CrossFire`;
  if (date && base.length < 47) base = `${base} ${date}`;
  let seoTitle = base.length <= 57 ? `${base} | CrossFire Wiki` : base.slice(0, 57).trimEnd() + '...';
  seoTitle = seoTitle.slice(0, 60);
  if (seoTitle.length < 50) seoTitle = `CrossFire Event: ${title}`.slice(0, 60);

  // Meta description: 140–160 chars, keyword-rich
  let seoDesc = '';
  if (plain.length >= 60) {
    seoDesc = hasCF ? plain : `CrossFire ${plain}`;
    if (date && !seoDesc.includes(date)) seoDesc += ` Dates: ${date}.`;
  }
  if (seoDesc.length > 160) seoDesc = seoDesc.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  if (seoDesc.length < 140) {
    const dateStr = date ? ` (${date})` : '';
    seoDesc = `CrossFire event: ${title}${dateStr}. Log in and complete missions to earn exclusive in-game rewards. Don't miss this limited-time CrossFire event!`;
    if (seoDesc.length > 160) seoDesc = seoDesc.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  }

  const canonicalUrl = `${SITE}/events/${slug}`;
  return { seo_title: seoTitle, seo_description: seoDesc, canonical_url: canonicalUrl };
}

const EMPTY: Partial<Event> = { title: '', title_ar: '', description: '', description_ar: '', image_url: '', date: '', start_date: '', end_date: '', location: '', type: 'announcement', source_url: '', seo_title: '', seo_description: '', canonical_url: '', featured: false, gallery: [] };

const col = createColumnHelper<Event>();

export default function EventsManager() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Event>>(EMPTY);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminFetch<{ data?: Event[] }>('/api/admin/events');
      setItems(result.data || []);
    } catch (error: any) {
      setItems([]);
      toast.error(error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async () => {
    if (!editing.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const slug = editing.event_name_slug || slugify(editing.title || '');
      // Auto-generate SEO if fields are missing or short — ensures score 100
      const needsSEO = !editing.seo_title || editing.seo_title.length < 50 || !editing.seo_description || editing.seo_description.length < 140;
      const autoSEO = needsSEO ? buildEventSEO(editing.title || '', editing.description || '', slug, editing.date || '') : {};
      const payload = {
        ...editing,
        event_name_slug: slug,
        ...(needsSEO ? autoSEO : {}),
        // Always keep canonical in sync with slug
        canonical_url: editing.canonical_url || `${SITE}/events/${slug}`,
        // gallery: normalize to JSON-serializable array
        gallery: Array.isArray(editing.gallery) ? editing.gallery : [],
      };
      // Try saving; gracefully strip missing columns if DB schema lags behind
      const doSave = async (p: any) => {
        try {
          if (editing.id) {
            await adminFetch('/api/admin/events', {
              method: 'PATCH',
              body: JSON.stringify({ id: editing.id, values: p }),
            });
          } else {
            await adminFetch('/api/admin/events', {
              method: 'POST',
              body: JSON.stringify({ ...p, created_at: new Date().toISOString() }),
            });
          }
          return null;
        } catch (error: any) {
          return error;
        }
      };
      let err = await doSave(payload);
      // Strip gallery if column missing
      if (err && (err.message?.includes('gallery') || err.code === '42703')) {
        const { gallery: _g, ...noGallery } = payload;
        err = await doSave(noGallery);
        if (!err) toast.warning('Gallery not saved — run this SQL in Supabase: ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT \'[]\';');
      }
      // Strip date columns if missing
      if (err && (err.message?.includes('start_date') || err.message?.includes('end_date') || err.code === '42703')) {
        const { start_date: _s, end_date: _e, gallery: _g2, ...payloadMin } = payload;
        err = await doSave(payloadMin);
        if (!err) toast.warning('Saved without countdown dates. Run the SQL migration to enable countdown.');
      }
      if (err) throw err;
      toast.success(editing.id ? 'Event updated' : 'Event created');
      await fetch(); setView('list'); setEditing(EMPTY);
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete event?')) return;
    try {
      await adminFetch('/api/admin/events', { method: 'DELETE', body: JSON.stringify({ id }) });
      toast.success('Deleted');
      await fetch();
    } catch (error: any) {
      toast.error(error?.message || 'Delete failed');
    }
  };

  const columns = [
    col.accessor('title', { header: 'Title', cell: (i) => <span style={{ color: '#fafafa', fontWeight: 500 }}>{i.getValue()}</span> }),
    col.accessor('type', { header: 'Type', cell: (i) => <span style={{ fontSize: 12, color: '#a1a1aa' }}>{i.getValue()}</span> }),
    col.accessor('date', { header: 'Date', cell: (i) => <span style={{ fontSize: 12, color: '#52525b' }}>{i.getValue() || '—'}</span> }),
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

  const inp: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };
  const sel: React.CSSProperties = { ...inp, cursor: 'pointer' };

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setView('list'); setEditing(EMPTY); }} style={{ padding: '6px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Back</button>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: 0 }}>{editing.id ? 'Edit Event' : 'New Event'}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Title (EN) *</label>
              <input
                type="text"
                value={editing.title || ''}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  // For new events, auto-generate slug from title; for existing, leave slug alone
                  if (!editing.id) {
                    const newSlug = slugify(newTitle);
                    setEditing(prev => ({
                      ...prev,
                      title: newTitle,
                      event_name_slug: newSlug,
                      canonical_url: newSlug ? `${SITE}/events/${newSlug}` : '',
                    }));
                  } else {
                    setEditing(prev => ({ ...prev, title: newTitle }));
                  }
                }}
                style={inp}
              />
            </div>
            {/* Page URL / Slug */}
            <div>
              <label style={lbl}>
                Page URL
                <span style={{ color: '#52525b', fontWeight: 400, marginLeft: 6 }}>— controls the link to this event</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, overflow: 'hidden' }}>
                <span style={{ padding: '8px 10px', fontSize: 13, color: '#52525b', whiteSpace: 'nowrap', borderRight: '1px solid #3f3f46', userSelect: 'none' }}>
                  crossfire.wiki/events/
                </span>
                <input
                  type="text"
                  value={editing.event_name_slug || ''}
                  placeholder="auto-generated-from-title"
                  onChange={(e) => {
                    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
                    setEditing(prev => ({
                      ...prev,
                      event_name_slug: newSlug,
                      canonical_url: newSlug ? `${SITE}/events/${newSlug}` : '',
                    }));
                  }}
                  style={{ ...inp, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }}
                />
              </div>
              {editing.event_name_slug && (
                <span style={{ fontSize: 11, color: '#52525b', marginTop: 4, display: 'block' }}>
                  Live at: <a href={`https://crossfire.wiki/events/${editing.event_name_slug}`} target="_blank" rel="noreferrer" style={{ color: '#d4a017' }}>crossfire.wiki/events/{editing.event_name_slug}</a>
                </span>
              )}
            </div>
            <div><label style={lbl}>Title (AR)</label><input type="text" value={editing.title_ar || ''} onChange={(e) => setEditing({ ...editing, title_ar: e.target.value })} style={{ ...inp, direction: 'rtl' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>
                  Display Date / Date Range
                  {editing.date && !editing.start_date && !editing.end_date && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#d4a017', fontWeight: 400, cursor: 'pointer' }}
                      onClick={() => {
                        const p = autoParseEventDates(editing.date || '');
                        if (p.start || p.end) setEditing(prev => ({ ...prev, start_date: p.start, end_date: p.end }));
                      }}>
                      ⚡ Auto-fill countdown dates
                    </span>
                  )}
                </label>
                <input type="text" placeholder="e.g. June 11 - July 19, 2026" value={editing.date || ''}
                  onChange={(e) => {
                    const dateVal = e.target.value;
                    const parsed = autoParseEventDates(dateVal);
                    setEditing(prev => ({
                      ...prev,
                      date: dateVal,
                      // Auto-fill start/end only if they haven't been manually set
                      start_date: prev.start_date || parsed.start,
                      end_date: prev.end_date || parsed.end,
                    }));
                  }}
                  style={inp} />
              </div>
              <div>
                <label style={lbl}>Type</label>
                <select value={editing.type || 'announcement'} onChange={(e) => setEditing({ ...editing, type: e.target.value })} style={sel}>
                  <option value="announcement">Announcement</option>
                  <option value="tournament">Tournament</option>
                  <option value="community">Community</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Start Date &amp; Time <span style={{ color: '#52525b', fontWeight: 400 }}>(for countdown)</span></label>
                <input type="datetime-local" value={editing.start_date || ''} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} style={{ ...inp, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={lbl}>End Date &amp; Time <span style={{ color: '#52525b', fontWeight: 400 }}>(for countdown)</span></label>
                <input type="datetime-local" value={editing.end_date || ''} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} style={{ ...inp, colorScheme: 'dark' }} />
              </div>
            </div>
            <div><label style={lbl}>Location</label><input type="text" value={editing.location || ''} onChange={(e) => setEditing({ ...editing, location: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Source URL</label><input type="url" value={editing.source_url || ''} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} style={inp} /></div>
            <div><label style={lbl}>Description (EN)</label><TipTapEditor content={editing.description || ''} onChange={(h) => setEditing({ ...editing, description: h })} /></div>
            <div><label style={lbl}>Description (AR)</label><TipTapEditor content={editing.description_ar || ''} onChange={(h) => setEditing({ ...editing, description_ar: h })} dir="rtl" /></div>

            {/* Gallery */}
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <GalleryManager
                value={editing.gallery || []}
                onChange={(items) => setEditing({ ...editing, gallery: items })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <ImageUpload label="Event Image" value={editing.image_url || ''} onChange={(url) => setEditing({ ...editing, image_url: url })} searchQuery={editing.title ? `CrossFire ${editing.title} event` : 'CrossFire event'} />
            </div>
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>SEO</div>
              <SEOPanel
                seo={{
                  metaTitle: editing.seo_title || '',
                  metaDescription: editing.seo_description || '',
                  ogImage: editing.image_url || '',
                  canonicalUrl: editing.canonical_url || (editing.event_name_slug ? `${SITE}/events/${editing.event_name_slug}` : ''),
                  focusKeyword: FOCUS_KW,
                }}
                onChange={(key, val) => {
                  const fieldMap: Record<string, string> = {
                    metaTitle: 'seo_title',
                    metaDescription: 'seo_description',
                    ogImage: 'image_url',
                    canonicalUrl: 'canonical_url',
                  };
                  setEditing({ ...editing, [fieldMap[key] || key]: val });
                }}
                content={editing.description || ''}
              />
            </div>
            <button type="button" onClick={save} disabled={saving} style={{ padding: 10, background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              {saving ? 'Saving...' : editing.id ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Events</h1>
        <button type="button" onClick={() => { setEditing(EMPTY); setView('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#d4a017', border: 'none', borderRadius: 4, color: '#09090b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          <Plus size={14} />New Event
        </button>
      </div>
      <DataTable data={items} columns={columns} loading={loading} searchPlaceholder="Search events..." />
    </div>
  );
}
