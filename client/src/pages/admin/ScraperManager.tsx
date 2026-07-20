import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Play, Download, Loader2, Globe, CheckSquare, Square, ArrowLeft, ExternalLink, ChevronRight, Calendar } from 'lucide-react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

const db = supabaseService || supabase;
const FORUM_URL = 'https://forum.z8games.com/categories/crossfire-announcements';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Announcement {
  title: string;
  url: string;
  date: string;
  image: string;
}

interface EventItem {
  title: string;
  titleAr: string;
  image: string;
  date: string;
  startDate: string;
  endDate: string;
  description: string;
  sourceUrl: string;
  selected: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function translateText(text: string): Promise<string> {
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 400))}&langpair=en|ar`);
    const d = await r.json();
    const t = d?.responseData?.translatedText || '';
    return t && t !== 'INVALID LANGUAGE PAIR' ? t : text;
  } catch { return text; }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function serverFetch(endpoint: string, body: object): Promise<any> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = {
  wrap: { display: 'flex', flexDirection: 'column' as const, gap: 20, maxWidth: 1040 },
  card: { background: '#18181b', border: '1px solid #27272a', borderRadius: 8 },
  h1: { fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 },
  h2: { fontSize: 16, fontWeight: 600, color: '#fafafa', margin: 0 },
  muted: { fontSize: 13, color: '#71717a', margin: 0 },
  link: { color: '#d4a017', textDecoration: 'none' as const },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' },
  progress: {
    padding: '9px 14px', background: '#1c1917', border: '1px solid #292524',
    borderRadius: 4, fontSize: 12, color: '#a8a29e', display: 'flex', alignItems: 'center', gap: 8,
  },
  listHeader: {
    padding: '12px 16px', borderBottom: '1px solid #27272a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
};

function Btn({ onClick, disabled, children, color = '#d4a017', fg = '#09090b', size = 'md' }: any) {
  const pad = size === 'sm' ? '5px 12px' : '9px 18px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: pad,
      background: disabled ? '#27272a' : color, border: 'none', borderRadius: 4,
      color: disabled ? '#52525b' : fg, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', fontSize: fs, flexShrink: 0,
    }}>
      {children}
    </button>
  );
}

// ── Level 1: Announcement List ─────────────────────────────────────────────────

function AnnouncementList({
  onSelect,
}: {
  onSelect: (a: Announcement) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [progress, setProgress] = useState('');

  const scrape = async () => {
    setLoading(true); setAnnouncements([]); setProgress('Fetching CrossFire announcements...');
    try {
      const data = await serverFetch('/api/scrape/forum-list', { url: FORUM_URL });
      const posts: Announcement[] = (data.posts || []);
      if (posts.length === 0) {
        setProgress('No announcements found — forum structure may have changed.');
        toast.warning('No announcements parsed.');
        return;
      }
      setAnnouncements(posts);
      setProgress(`Found ${posts.length} announcements — click one to see its events`);
      toast.success(`Found ${posts.length} announcements`);
    } catch (e: any) {
      toast.error(e.message || 'Scrape failed'); setProgress('');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.wrap}>
      <div>
        <h1 style={S.h1}>Forum Event Scraper</h1>
        <p style={{ ...S.muted, marginTop: 5 }}>
          Fetch CrossFire announcements from{' '}
          <a href={FORUM_URL} target="_blank" rel="noopener noreferrer" style={S.link}>forum.z8games.com</a>.
          Click any announcement to view and select the events inside it.
        </p>
      </div>

      <div style={S.row}>
        <Btn onClick={scrape} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          {loading ? 'Loading...' : 'Load Announcements'}
        </Btn>
      </div>

      {progress && (
        <div style={S.progress}>
          {loading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
          {progress}
        </div>
      )}

      {announcements.length > 0 && (
        <div style={S.card}>
          <div style={S.listHeader}>
            <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>
              {announcements.length} announcements — click to view events inside
            </span>
          </div>
          {announcements.map((a, i) => (
            <div
              key={i}
              onClick={() => onSelect(a)}
              style={{
                padding: '14px 16px', borderBottom: '1px solid #1f1f22',
                cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,160,23,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Thumbnail */}
              <div style={{
                width: 80, height: 56, borderRadius: 4, overflow: 'hidden',
                background: '#27272a', border: '1px solid #3f3f46', flexShrink: 0,
              }}>
                {a.image ? (
                  <img src={a.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Globe size={20} style={{ color: '#52525b' }} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#fafafa', fontWeight: 500, lineHeight: 1.4 }}>
                  {a.title}
                </p>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {a.date && (
                    <span style={{ fontSize: 11, color: '#52525b', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {a.date}
                    </span>
                  )}
                  <a
                    href={a.url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <ExternalLink size={10} /> View thread
                  </a>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#d4a017', fontWeight: 500 }}>Open events</span>
                <ChevronRight size={16} style={{ color: '#d4a017' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {announcements.length === 0 && !loading && (
        <div style={{ ...S.card, padding: 48, textAlign: 'center' as const }}>
          <Play size={28} style={{ color: '#3f3f46', marginBottom: 12 }} />
          <p style={{ color: '#52525b', fontSize: 14, margin: 0 }}>
            Click <strong style={{ color: '#d4a017' }}>Load Announcements</strong> to fetch the latest threads from the CrossFire forum.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Level 2: Events inside an Announcement ─────────────────────────────────────

function EventList({
  announcement,
  onBack,
}: {
  announcement: Announcement;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [progress, setProgress] = useState('');

  const loadEvents = async () => {
    setLoading(true); setProgress(`Fetching events from: ${announcement.title.slice(0, 60)}...`);
    try {
      const data = await serverFetch('/api/scrape/forum-thread', { url: announcement.url });
      const raw: any[] = data.events || [];
      if (raw.length === 0) {
        setProgress('No individual events found — the whole thread was loaded as one item.');
        toast.info('No sub-events found; the thread has been added as a single event.');
      } else {
        setProgress(`Found ${raw.length} events in this announcement`);
        toast.success(`${raw.length} events found`);
      }
      setEvents(raw.map((e: any) => ({ ...e, titleAr: '', startDate: e.startDate || '', endDate: e.endDate || '', sourceUrl: e.sourceUrl || announcement.url })));
      setLoaded(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load events'); setProgress('');
    } finally { setLoading(false); }
  };

  // Auto-load on mount
  useEffect(() => { loadEvents(); }, []);

  const translateAll = async () => {
    setTranslating(true);
    const updated = [...events];
    for (let i = 0; i < updated.length; i++) {
      setProgress(`Translating ${i + 1}/${updated.length}: ${updated[i].title.slice(0, 45)}...`);
      updated[i].titleAr = await translateText(updated[i].title);
      setEvents([...updated]);
    }
    setProgress('Translation complete ✓');
    setTranslating(false);
    toast.success('All titles translated to Arabic!');
  };

  const importSelected = async () => {
    const sel = events.filter(e => e.selected);
    if (!sel.length) { toast.error('Select at least one event'); return; }
    setImporting(true);
    let ok = 0, fail = 0;
    for (const ev of sel) {
      setProgress(`Importing: ${ev.title.slice(0, 50)}...`);
      try {
        const slug = `${slugify(ev.title)}-${Date.now()}`;
        const seoTitle = ev.title.slice(0, 60);
        const plainText = (ev.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const seoDesc = (plainText || ev.titleAr || ev.title).slice(0, 160);
        // Build human-readable date range from parsed start/end, e.g. "June 11 - July 19"
        const dateRange = ev.startDate && ev.endDate && ev.startDate !== ev.endDate
          ? `${new Date(ev.startDate).toLocaleDateString('en-US',{month:'long',day:'numeric'})} - ${new Date(ev.endDate).toLocaleDateString('en-US',{month:'long',day:'numeric'})}`
          : ev.startDate
            ? new Date(ev.startDate).toLocaleDateString('en-US',{month:'long',day:'numeric'})
            : ev.date || '';
        const { error } = await db.from('events').insert({
          title: ev.title,
          title_ar: ev.titleAr || '',
          event_name_slug: slug,
          description: ev.description || ev.title,
          description_ar: ev.titleAr ? `إعلان كروس فاير — ${ev.titleAr}` : '',
          image_url: ev.image || announcement.image || '',
          type: 'announcement',
          date: dateRange,
          source_url: ev.sourceUrl || announcement.url,
          created_at: new Date().toISOString(),
          seo_title: seoTitle,
          seo_description: seoDesc,
        });
        if (error) { console.error(error); fail++; } else ok++;
      } catch (e) { fail++; }
    }
    setProgress(`Done — ${ok} imported${fail > 0 ? `, ${fail} failed` : ''}`);
    toast.success(`Imported ${ok} event${ok !== 1 ? 's' : ''}${fail > 0 ? ` (${fail} failed)` : ''}`);
    setImporting(false);
    if (ok > 0) setEvents(prev => prev.map(e => e.selected ? { ...e, selected: false } : e));
  };

  const toggleAll = (v: boolean) => setEvents(prev => prev.map(e => ({ ...e, selected: v })));
  const toggle = (i: number) => setEvents(prev => prev.map((e, idx) => idx === i ? { ...e, selected: !e.selected } : e));
  const selCount = events.filter(e => e.selected).length;

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: '#27272a', border: 'none', borderRadius: 4,
            color: '#a1a1aa', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginTop: 2, flexShrink: 0,
          }}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ ...S.h1, fontSize: 17, lineHeight: 1.35 }}>{announcement.title}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
            {announcement.date && (
              <span style={{ fontSize: 12, color: '#71717a', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={11} /> {announcement.date}
              </span>
            )}
            <a href={announcement.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              <ExternalLink size={11} /> View on forum
            </a>
          </div>
        </div>
      </div>

      {/* Actions */}
      {loaded && events.length > 0 && (
        <div style={S.row}>
          <Btn onClick={translateAll} disabled={translating} color="#3b82f6" fg="#fff">
            {translating ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
            {translating ? 'Translating...' : 'Translate All → Arabic'}
          </Btn>
          <Btn onClick={importSelected} disabled={importing || selCount === 0}>
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {importing ? 'Importing...' : `Import Selected (${selCount})`}
          </Btn>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div style={S.progress}>
          {(loading || translating || importing) && (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          )}
          {progress}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ ...S.card, padding: 40, textAlign: 'center' as const }}>
          <Loader2 size={24} style={{ color: '#d4a017', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>Fetching events from the forum thread...</p>
        </div>
      )}

      {/* Event grid */}
      {!loading && loaded && events.length > 0 && (
        <div style={S.card}>
          <div style={S.listHeader}>
            <span style={{ fontSize: 13, color: '#a1a1aa', fontWeight: 500 }}>
              {events.length} events found — select to import
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => toggleAll(true)}
                style={{ fontSize: 12, color: '#d4a017', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckSquare size={13} /> Select All
              </button>
              <button type="button" onClick={() => toggleAll(false)}
                style={{ fontSize: 12, color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Square size={13} /> None
              </button>
            </div>
          </div>

          {/* Two-column grid of event cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1, background: '#27272a' }}>
            {events.map((ev, i) => (
              <div
                key={i}
                onClick={() => toggle(i)}
                style={{
                  background: ev.selected ? 'rgba(212,160,23,0.06)' : '#18181b',
                  cursor: 'pointer', padding: 14, display: 'flex', flexDirection: 'column' as const, gap: 10,
                  outline: ev.selected ? '1px inset rgba(212,160,23,0.25)' : 'none',
                  transition: 'background 0.12s',
                  position: 'relative' as const,
                }}
              >
                {/* Selection badge */}
                <div style={{
                  position: 'absolute' as const, top: 10, right: 10,
                  background: ev.selected ? '#d4a017' : '#27272a',
                  borderRadius: '50%', width: 22, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${ev.selected ? '#d4a017' : '#3f3f46'}`,
                  transition: 'all 0.12s',
                }}>
                  {ev.selected
                    ? <CheckSquare size={13} style={{ color: '#09090b' }} />
                    : <Square size={13} style={{ color: '#52525b' }} />}
                </div>

                {/* Banner image */}
                {ev.image && (
                  <div style={{
                    width: '100%', aspectRatio: '16/7', borderRadius: 4, overflow: 'hidden',
                    background: '#27272a', border: '1px solid #3f3f46',
                  }}>
                    <img
                      src={ev.image} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Event info */}
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 13, color: '#fafafa', fontWeight: 600, lineHeight: 1.35, paddingRight: 28 }}>
                    {ev.title}
                  </p>
                  {ev.titleAr && (
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: '#d4a017', direction: 'rtl', fontWeight: 500, lineHeight: 1.35 }}>
                      {ev.titleAr}
                    </p>
                  )}
                  {(ev.startDate || ev.date) && (
                    <span style={{ fontSize: 11, color: '#71717a', display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <Calendar size={10} />
                      {ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ev.date}
                      {ev.endDate && ev.endDate !== ev.startDate && (
                        <> – {new Date(ev.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                      )}
                    </span>
                  )}
                  {ev.description && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#52525b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                      {ev.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────────────────

export default function ScraperManager() {
  const [selected, setSelected] = useState<Announcement | null>(null);

  if (selected) {
    return <EventList announcement={selected} onBack={() => setSelected(null)} />;
  }
  return <AnnouncementList onSelect={setSelected} />;
}
