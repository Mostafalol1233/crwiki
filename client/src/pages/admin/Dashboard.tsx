import { useEffect, useState, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { FileText, Calendar, Newspaper, Ticket, Plus, Database, X, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Stats {
  posts: number;
  events: number;
  news: number;
  tickets: number;
}

const CARD_COLORS = {
  posts: '#3b82f6',
  events: '#d4a017',
  news: '#22c55e',
  tickets: '#f59e0b',
};

function StatCard({ label, value, icon, color, href }: { label: string; value: number; icon: React.ReactNode; color: string; href: string }) {
  return (
    <div
      onClick={() => { window.history.pushState(null, '', href); window.dispatchEvent(new PopStateEvent('popstate')); }}
      style={{ display: 'block', textDecoration: 'none', background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = color; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#27272a'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: '#52525b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#fafafa', lineHeight: 1 }}>{value.toLocaleString()}</div>
        </div>
        <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const MOCK_VIEWS = Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1}`, views: 0 }));

const QUICK_ACTIONS = [
  { label: 'New Post', href: '/admin/posts?new=1', icon: <Plus size={14} /> },
  { label: 'New Event', href: '/admin/events?new=1', icon: <Plus size={14} /> },
  { label: 'New News', href: '/admin/news?new=1', icon: <Plus size={14} /> },
  { label: 'Upload Media', href: '/admin/media', icon: <Plus size={14} /> },
];

// The full SQL users need to run once
const SETUP_SQL = `-- ================================================================
-- CROSSFIRE WIKI — COMPLETE DATABASE SETUP
-- Run ONCE in Supabase SQL Editor → https://supabase.com/dashboard
-- ================================================================

-- 1. ADD MISSING COLUMNS TO EXISTING TABLES

ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery        JSONB    DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date     TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date       TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags           TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_url     TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS canonical_url  TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_title      TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured       BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_ar       TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description_ar TEXT;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS gallery         JSONB    DEFAULT '[]';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image        TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url   TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS focus_keyword   TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title_ar        TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_ar      TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title       TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS summary         TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS tags            TEXT[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured        BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS language        TEXT    DEFAULT 'en';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS preview_on_home BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT now();

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS title         TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now();
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url      TEXT;

-- 2. CREATE MISSING TABLES

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  message TEXT NOT NULL, is_internal BOOLEAN DEFAULT false,
  sender_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, month INTEGER, year INTEGER,
  media_type TEXT DEFAULT 'image', url TEXT,
  sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT, title_ar TEXT, content_en TEXT, content_ar TEXT,
  type TEXT DEFAULT 'info', target TEXT DEFAULT 'all',
  display TEXT DEFAULT 'banner', starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true, dismissible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, title_en TEXT, title_ar TEXT,
  content_en TEXT, content_ar TEXT, template TEXT DEFAULT 'default',
  status TEXT DEFAULT 'draft', show_in_nav BOOLEAN DEFAULT false,
  seo_title TEXT, seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, title_ar TEXT, slug TEXT UNIQUE,
  content TEXT, content_ar TEXT, image_url TEXT,
  difficulty TEXT DEFAULT 'beginner', video_url TEXT,
  youtube_url TEXT, youtube_id TEXT, category TEXT DEFAULT 'tutorial',
  order_index INTEGER DEFAULT 0, seo_title TEXT, seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, name_ar TEXT,
  sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faq_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT, question_en TEXT, question_ar TEXT,
  answer_en TEXT, answer_ar TEXT, title TEXT, title_ar TEXT,
  body TEXT, body_ar TEXT, order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, name_ar TEXT,
  description TEXT, description_ar TEXT, icon TEXT DEFAULT '💬',
  color TEXT DEFAULT '#f5a623', thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT, author_id TEXT,
  author_name TEXT DEFAULT 'Anonymous', author_avatar TEXT,
  is_pinned BOOLEAN DEFAULT false, is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0, reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT now(), created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  body TEXT, author_id TEXT, author_name TEXT DEFAULT 'Anonymous',
  author_avatar TEXT, is_op BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id TEXT NOT NULL, target_type TEXT NOT NULL,
  user_identifier TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(target_id, target_type, user_identifier)
);

CREATE TABLE IF NOT EXISTS video_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL, user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(video_id, user_identifier)
);

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id TEXT NOT NULL, user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(), UNIQUE(comment_id, user_identifier)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT,
  type TEXT DEFAULT 'direct', participants TEXT[],
  last_message TEXT, avatar TEXT, created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_username TEXT, content TEXT, type TEXT DEFAULT 'text',
  reply_to_id UUID, reply_to_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS — enable read for all + write for user-content tables

DO $$
DECLARE tbl TEXT;
  read_tbls TEXT[] := ARRAY['ticket_messages','site_highlights','announcements',
    'custom_pages','tutorials','faq_categories','faq_articles',
    'forum_categories','forum_threads','forum_posts',
    'likes','video_likes','comment_likes','conversations','messages'];
  write_tbls TEXT[] := ARRAY['forum_threads','forum_posts',
    'likes','video_likes','comment_likes','ticket_messages','messages'];
BEGIN
  FOREACH tbl IN ARRAY read_tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_select_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_select_%1$s" ON %1$I FOR SELECT USING (true)', tbl);
  END LOOP;
  FOREACH tbl IN ARRAY write_tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_insert_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_insert_%1$s" ON %1$I FOR INSERT WITH CHECK (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_delete_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_delete_%1$s" ON %1$I FOR DELETE USING (true)', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "public_update_%1$s" ON %1$I', tbl);
    EXECUTE format('CREATE POLICY "public_update_%1$s" ON %1$I FOR UPDATE USING (true)', tbl);
  END LOOP;
END $$;`;

// Checks to detect missing features
const FEATURE_CHECKS = [
  { key: 'gallery',          table: 'events',          col: 'gallery',          label: 'Gallery (events & posts)' },
  { key: 'countdown',        table: 'events',          col: 'start_date',       label: 'Event countdown timer' },
  { key: 'ticket_messages',  table: 'ticket_messages', col: 'id',               label: 'Ticket reply threads' },
  { key: 'site_highlights',  table: 'site_highlights', col: 'id',               label: 'Site highlights' },
  { key: 'announcements',    table: 'announcements',   col: 'id',               label: 'Announcements' },
  { key: 'forum',            table: 'forum_categories',col: 'id',               label: 'Forum' },
  { key: 'likes',            table: 'likes',           col: 'id',               label: 'Likes system' },
  { key: 'custom_pages',     table: 'custom_pages',    col: 'id',               label: 'Custom pages' },
];

function SetupPanel() {
  const [missing, setMissing] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('db_setup_dismissed') === '1');
  const client = supabaseService;

  const checkFeatures = useCallback(async () => {
    if (!client) return;
    const results: string[] = [];
    await Promise.all(
      FEATURE_CHECKS.map(async ({ key, table, col }) => {
        try {
          const { error } = await client.from(table).select(col).limit(0);
          if (error) results.push(key);
        } catch {
          results.push(key);
        }
      })
    );
    setMissing(results);
  }, [client]);

  useEffect(() => { checkFeatures(); }, [checkFeatures]);

  const copy = () => {
    navigator.clipboard.writeText(SETUP_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (missing.length === 0 || dismissed) return null;

  return (
    <div style={{ background: 'rgba(212,160,23,0.05)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 6, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
        <Database size={15} color="#d4a017" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#d4a017' }}>Database Setup Required</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
            {missing.length} feature{missing.length > 1 ? 's' : ''} need a one-time SQL migration:&nbsp;
            {missing.map((k) => FEATURE_CHECKS.find(f => f.key === k)?.label).filter(Boolean).join(', ')}
          </span>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 6px' }}
        >
          {expanded ? 'Hide SQL' : 'Show SQL'}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('db_setup_dismissed', '1'); }}
          style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: 2 }}
        >
          <X size={14} />
        </button>
      </div>

      {/* SQL Block */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(212,160,23,0.15)', padding: '0 16px 16px' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: '12px 0 8px', lineHeight: 1.5 }}>
            Copy this SQL and paste it into your{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#d4a017' }}>
              Supabase SQL Editor
            </a>{' '}
            → Run. This creates all missing tables and columns at once.
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{
              background: '#09090b', border: '1px solid #27272a', borderRadius: 4,
              padding: '12px 14px', fontSize: 11, color: '#a1a1aa', margin: 0,
              whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 320, overflowY: 'auto',
              userSelect: 'all',
            }}>
              {SETUP_SQL}
            </pre>
            <button
              onClick={copy}
              style={{
                position: 'absolute', top: 8, right: 8,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', background: '#27272a', border: '1px solid #3f3f46',
                borderRadius: 4, color: copied ? '#22c55e' : '#a1a1aa', cursor: 'pointer',
                fontSize: 12, transition: 'color 0.15s',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', background: '#d4a017', borderRadius: 4,
                color: '#09090b', fontWeight: 600, fontSize: 12, textDecoration: 'none',
              }}
            >
              Open Supabase SQL Editor ↗
            </a>
            <button
              onClick={() => { setDismissed(true); localStorage.setItem('db_setup_dismissed', '1'); }}
              style={{ padding: '7px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ posts: 0, events: 0, news: 0, tickets: 0 });
  const [loading, setLoading] = useState(true);
  const client = supabaseService;

  useEffect(() => {
    if (!client) { setLoading(false); return; }
    Promise.all([
      client.from('posts').select('id', { count: 'exact', head: true }),
      client.from('events').select('id', { count: 'exact', head: true }),
      client.from('news').select('id', { count: 'exact', head: true }),
      client.from('tickets').select('id', { count: 'exact', head: true }),
    ]).then(([posts, events, news, tickets]) => {
      setStats({
        posts: posts.count || 0,
        events: events.count || 0,
        news: news.count || 0,
        tickets: tickets.count || 0,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const h2: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#fafafa', marginBottom: 14 };
  const section: React.CSSProperties = { background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '18px 20px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#52525b', margin: '4px 0 0' }}>Overview of your CrossFire Wiki</p>
      </div>

      {/* Smart setup panel — only shows if features are missing */}
      <SetupPanel />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Published Posts" value={stats.posts} icon={<FileText size={18} />} color={CARD_COLORS.posts} href="/admin/posts" />
        <StatCard label="Events" value={stats.events} icon={<Calendar size={18} />} color={CARD_COLORS.events} href="/admin/events" />
        <StatCard label="News Articles" value={stats.news} icon={<Newspaper size={18} />} color={CARD_COLORS.news} href="/admin/news" />
        <StatCard label="Open Tickets" value={stats.tickets} icon={<Ticket size={18} />} color={CARD_COLORS.tickets} href="/admin/tickets" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        <div style={section}>
          <h2 style={h2}>Page Views — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_VIEWS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 13 }} />
              <Line type="monotone" dataKey="views" stroke="#d4a017" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={section}>
          <h2 style={h2}>Content Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Posts', value: stats.posts },
              { name: 'Events', value: stats.events },
              { name: 'News', value: stats.news },
              { name: 'Tickets', value: stats.tickets },
            ]} barSize={28}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 4, fontSize: 13 }} />
              <Bar dataKey="value" fill="#d4a017" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={section}>
        <h2 style={h2}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {QUICK_ACTIONS.map((a) => (
            <a key={a.href} href={a.href}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', textDecoration: 'none', fontSize: 13, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#d4a017'; (e.currentTarget as HTMLAnchorElement).style.color = '#d4a017'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLAnchorElement).style.color = '#fafafa'; }}>
              {a.icon}
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
