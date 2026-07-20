import { useState } from 'react';
import { toast } from 'sonner';
import { Play, Download, Loader2, Globe, CheckSquare, Square } from 'lucide-react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

// Use service-role client to bypass RLS for inserts
const db = supabaseService || supabase;

const FORUM_URL = 'https://forum.z8games.com/categories/crossfire-announcements';

// Try multiple CORS proxies in order
const PROXY_LIST = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

interface ForumPost {
  title: string;
  titleAr: string;
  url: string;
  date: string;
  image: string;
  selected: boolean;
}

async function translateText(text: string): Promise<string> {
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 400))}&langpair=en|ar`);
    const d = await r.json();
    const t = d?.responseData?.translatedText || '';
    return t && t !== 'INVALID LANGUAGE PAIR' ? t : text;
  } catch {
    return text;
  }
}

async function fetchProxy(url: string): Promise<string> {
  for (const makeProxy of PROXY_LIST) {
    try {
      const proxyUrl = makeProxy(url);
      const r = await Promise.race([
        fetch(proxyUrl),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
      ]) as Response;
      if (!r.ok) continue;
      const j = await r.json().catch(() => null);
      if (j && (j.contents || j.data)) return j.contents || j.data;
      const text = await r.text().catch(() => '');
      if (text) return text;
    } catch { /* try next proxy */ }
  }
  throw new Error('Failed to reach forum — all proxies failed. Try again later.');
}

function parseAnnouncements(html: string): Omit<ForumPost, 'titleAr' | 'selected'>[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const results: Omit<ForumPost, 'titleAr' | 'selected'>[] = [];
  const seen = new Set<string>();

  const candidates = doc.querySelectorAll([
    'a[href*="thread"]',
    'a[href*="announcement"]',
    '.thread-title a',
    '.subject a',
    'h3 > a',
    'h2 > a',
    '.topic-title a',
    '[class*="title"] a',
    '[class*="thread"] a',
    '[class*="post"] a',
    '.thr-head a',
    '.forumtitle a',
    'td.alt1 a',
  ].join(', '));

  candidates.forEach((el) => {
    const title = el.textContent?.trim() || '';
    const href = el.getAttribute('href') || '';
    if (!title || title.length < 5 || seen.has(title)) return;
    if (href.includes('#') && !href.includes('thread')) return;

    const fullUrl = href.startsWith('http') ? href : href.startsWith('/') ? `https://forum.z8games.com${href}` : '';
    if (!fullUrl) return;
    seen.add(title);

    const row = el.closest('tr, li, article, [class*="thread"], [class*="post"], [class*="topic"]');
    const dateEl = row?.querySelector('time, [class*="date"], [class*="time"], abbr');
    const date = dateEl?.getAttribute('datetime') || dateEl?.textContent?.trim() || new Date().toISOString().slice(0, 10);
    const img = (row?.querySelector('img') as HTMLImageElement)?.src || '';

    results.push({ title, url: fullUrl, date, image: img });
  });

  return results.slice(0, 25);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column' as const, gap: 20, maxWidth: 1000 },
  card: { background: '#18181b', border: '1px solid #27272a', borderRadius: 6 },
  h1: { fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 },
  muted: { fontSize: 13, color: '#71717a', margin: 0 },
  link: { color: '#d4a017', textDecoration: 'none' as const },
  row: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, alignItems: 'center' },
  progress: { padding: '8px 14px', background: '#1c1917', border: '1px solid #292524', borderRadius: 4, fontSize: 12, color: '#a8a29e' },
  listHeader: { padding: '12px 16px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  listItem: (selected: boolean): React.CSSProperties => ({
    padding: '12px 16px', borderBottom: '1px solid #1a1a1e', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
    background: selected ? 'rgba(212,160,23,0.05)' : 'transparent', transition: 'background 0.15s',
  }),
};

function Btn({ onClick, disabled, children, color = '#d4a017', fg = '#09090b' }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
      background: disabled ? '#27272a' : color, border: 'none', borderRadius: 4,
      color: disabled ? '#52525b' : fg, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13,
    }}>
      {children}
    </button>
  );
}

export default function ScraperManager() {
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [progress, setProgress] = useState('');

  const scrape = async () => {
    setLoading(true); setPosts([]); setProgress('Connecting to CrossFire forum...');
    try {
      const html = await fetchProxy(FORUM_URL);
      if (!html) throw new Error('Empty response from proxy');
      const parsed = parseAnnouncements(html);
      if (parsed.length === 0) {
        setProgress('No posts found — forum structure may have changed');
        toast.warning('No posts parsed. Try the direct forum URL.');
        return;
      }
      setPosts(parsed.map(p => ({ ...p, titleAr: '', selected: true })));
      setProgress(`Found ${parsed.length} announcements`);
      toast.success(`Found ${parsed.length} CrossFire announcements!`);
    } catch (e: any) {
      toast.error(e.message || 'Scrape failed'); setProgress('');
    } finally { setLoading(false); }
  };

  const translateAll = async () => {
    setTranslating(true);
    const updated = [...posts];
    for (let i = 0; i < updated.length; i++) {
      setProgress(`Translating ${i + 1}/${updated.length}: ${updated[i].title.slice(0, 45)}...`);
      updated[i].titleAr = await translateText(updated[i].title);
      setPosts([...updated]);
    }
    setProgress('All titles translated to Arabic ✓');
    setTranslating(false);
    toast.success('Translation complete!');
  };

  const importSelected = async () => {
    const sel = posts.filter(p => p.selected);
    if (!sel.length) { toast.error('Select at least one announcement'); return; }
    setImporting(true);
    let ok = 0, fail = 0;
    for (const post of sel) {
      setProgress(`Importing: ${post.title.slice(0, 50)}...`);
      try {
        const slug = `${slugify(post.title)}-${Date.now()}`;
        const description = `CrossFire Forum Announcement. Source: ${post.url}`;
        // Auto SEO
        const seoTitle = post.title.slice(0, 60);
        const seoDesc = (post.titleAr || post.title).slice(0, 160);
        const { error } = await db.from('events').insert({
          title: post.title,
          title_ar: post.titleAr || null,
          event_name_slug: slug,
          description,
          description_ar: post.titleAr ? `إعلان من منتدى كروس فاير. المصدر: ${post.url}` : null,
          image_url: post.image || null,
          type: 'announcement',
          source_url: post.url,
          date: post.date,
          created_at: new Date().toISOString(),
          seo_title: seoTitle,
          seo_description: seoDesc,
        });
        if (error) { console.error(error); fail++; } else ok++;
      } catch (e) { fail++; }
    }
    setProgress(`Done — ${ok} imported, ${fail} failed`);
    toast.success(`Imported ${ok} events${fail > 0 ? `, ${fail} failed` : ''}`);
    setImporting(false);
    if (ok > 0) setPosts(posts.map(p => ({ ...p, selected: false })));
  };

  const toggleAll = (v: boolean) => setPosts(posts.map(p => ({ ...p, selected: v })));
  const toggle = (i: number) => setPosts(posts.map((p, idx) => idx === i ? { ...p, selected: !p.selected } : p));
  const selCount = posts.filter(p => p.selected).length;

  return (
    <div style={S.wrap}>
      <div>
        <h1 style={S.h1}>Forum Event Scraper</h1>
        <p style={{ ...S.muted, marginTop: 6 }}>
          Scrapes live announcements from{' '}
          <a href={FORUM_URL} target="_blank" rel="noopener noreferrer" style={S.link}>forum.z8games.com</a>
          , translates titles to Arabic, and saves to Supabase.
        </p>
      </div>

      <div style={S.row}>
        <Btn onClick={scrape} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          {loading ? 'Scraping...' : 'Scrape CrossFire Forum'}
        </Btn>

        {posts.length > 0 && (
          <>
            <Btn onClick={translateAll} disabled={translating} color="#3b82f6" fg="#fff">
              {translating ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
              {translating ? 'Translating...' : 'Translate All → Arabic'}
            </Btn>
            <Btn onClick={importSelected} disabled={importing} color="#22c55e">
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {importing ? 'Importing...' : `Import Selected (${selCount})`}
            </Btn>
          </>
        )}
      </div>

      {progress && <div style={S.progress}>{progress}</div>}

      {posts.length > 0 && (
        <div style={S.card}>
          <div style={S.listHeader}>
            <span style={{ fontSize: 13, color: '#fafafa', fontWeight: 500 }}>
              {posts.length} announcements found
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => toggleAll(true)} style={{ fontSize: 12, color: '#d4a017', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckSquare size={13} /> Select All
              </button>
              <button onClick={() => toggleAll(false)} style={{ fontSize: 12, color: '#71717a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Square size={13} /> Deselect
              </button>
            </div>
          </div>

          {posts.map((post, i) => (
            <div key={i} style={S.listItem(post.selected)} onClick={() => toggle(i)}>
              <div style={{ paddingTop: 2, flexShrink: 0 }}>
                {post.selected
                  ? <CheckSquare size={16} style={{ color: '#d4a017' }} />
                  : <Square size={16} style={{ color: '#52525b' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 3px', fontSize: 13, color: '#fafafa', fontWeight: 500, lineHeight: 1.4 }}>
                  {post.title}
                </p>
                {post.titleAr && (
                  <p style={{ margin: '0 0 4px', fontSize: 13, color: '#d4a017', direction: 'rtl', fontWeight: 500 }}>
                    {post.titleAr}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: '#52525b' }}>{post.date}</span>
                  <a href={post.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                    View on forum ↗
                  </a>
                </div>
              </div>
              {post.image && (
                <img src={post.image} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 3, flexShrink: 0, border: '1px solid #27272a' }} />
              )}
            </div>
          ))}
        </div>
      )}

      {posts.length === 0 && !loading && (
        <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#52525b', fontSize: 14, margin: 0 }}>
            Click <strong style={{ color: '#d4a017' }}>Scrape CrossFire Forum</strong> to fetch the latest announcements.
          </p>
        </div>
      )}
    </div>
  );
}
