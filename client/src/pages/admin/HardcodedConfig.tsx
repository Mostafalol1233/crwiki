import { useState } from 'react';
import { Code2, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { SiDiscord, SiFacebook, SiX, SiYoutube, SiWhatsapp, SiInstagram, SiTwitch } from 'react-icons/si';

/* ─── types ──────────────────────────────────────────────────── */
interface HardcodedEntry {
  label: string;
  value: string;
  file: string;
  description?: string;
  isUrl?: boolean;
  icon?: React.ReactNode;
}

interface HardcodedSection {
  title: string;
  subtitle: string;
  color: string;
  entries: HardcodedEntry[];
}

/* ─── data ───────────────────────────────────────────────────── */
const SECTIONS: HardcodedSection[] = [
  {
    title: 'Social Links',
    subtitle: 'Shown in Footer, Contact, About, and Home pages. Duplicated across multiple files.',
    color: '#5865f2',
    entries: [
      { label: 'Discord', value: 'https://discord.gg/7AbuDrNNJM', file: 'Footer.tsx · Contact.tsx · About.tsx · Home.tsx', isUrl: true, icon: <SiDiscord /> },
      { label: 'Facebook', value: 'https://www.facebook.com/crossfireonline', file: 'Footer.tsx · Contact.tsx · About.tsx', isUrl: true, icon: <SiFacebook /> },
      { label: 'Twitter / X', value: 'https://x.com/CrossFireOnline', file: 'Footer.tsx · Contact.tsx · About.tsx', isUrl: true, icon: <SiX /> },
      { label: 'YouTube', value: 'https://www.youtube.com/c/CrossFireWest', file: 'Footer.tsx · About.tsx', isUrl: true, icon: <SiYoutube /> },
      { label: 'WhatsApp Channel', value: 'https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o', file: 'Footer.tsx · Contact.tsx', isUrl: true, icon: <SiWhatsapp /> },
      { label: 'Instagram', value: 'https://www.instagram.com/crossfirewest/', file: 'Footer.tsx', isUrl: true, icon: <SiInstagram /> },
      { label: 'Twitch', value: 'https://www.twitch.tv/cfonline/', file: 'Footer.tsx', isUrl: true, icon: <SiTwitch /> },
    ],
  },
  {
    title: 'Site Identity',
    subtitle: 'Brand name, copyright, and canonical URL baked into source files.',
    color: '#d4a017',
    entries: [
      { label: 'Copyright (EN)', value: '© 2025 Bimora Gaming — All Rights Reserved', file: 'LanguageProvider.tsx line 43', description: 'Also appears on Privacy and Terms pages (2026 variant).' },
      { label: 'Copyright (AR)', value: '© 2025 Bimora Gaming — جميع الحقوق محفوظة', file: 'LanguageProvider.tsx line 509' },
      { label: 'Privacy / Terms copyright', value: '© 2026 CrossFire Wiki by Bimora Gaming. All rights reserved.', file: 'LanguageProvider.tsx lines 416, 455' },
      { label: 'About page title', value: 'CrossFire Game Overview — Wiki | Bimora Gaming', file: 'About.tsx line 148' },
      { label: 'Canonical site URL', value: 'https://crossfire.wiki/', file: 'App.tsx lines 323, 327, 334–369', description: 'Used in JSON-LD org/website schema and hreflang links.', isUrl: true },
      { label: 'Logo URL (schema)', value: 'https://crossfire.wiki/logo-new.png', file: 'App.tsx line 341', isUrl: true },
    ],
  },
  {
    title: 'Contact Info',
    subtitle: 'Hard-wired in the Contact page component.',
    color: '#22c55e',
    entries: [
      { label: 'Support email', value: 'contact@crossfire.wiki', file: 'Contact.tsx line 19', description: 'The Site Settings "Contact Email" field is separate and not wired to this page yet.' },
    ],
  },
  {
    title: 'Category Portal Images (defaults)',
    subtitle: 'Default fallback images for the 6 homepage category cards. These are used when no override has been saved via Admin → Portal Images. To change them without a code edit, go to Admin → Portal Images.',
    color: '#06b6d4',
    entries: [
      {
        label: 'Weapons (default)',
        value: 'https://z8games.akamaized.net/cfna/web/main/carousel/260715_cfwe_sniperweek_carouselm.jpg',
        file: 'Home.tsx — PORTALS[0].img',
        description: '⚡ Override without code: Admin → Portal Images → Weapons',
        isUrl: true,
      },
      {
        label: 'Maps (default)',
        value: 'https://static.wikia.nocookie.net/crossfirefps/images/2/24/CrossFire_2.0_EGYPT_(New_Design_2.0)_Map_Review_%26_Comparison/revision/latest?cb=20141207050018',
        file: 'Home.tsx — PORTALS[1].img',
        description: '⚡ Override without code: Admin → Portal Images → Maps',
        isUrl: true,
      },
      {
        label: 'Mercenaries (default)',
        value: 'https://z8games.akamaized.net/cfna/templates/assets/images/feature-cf-left.jpg',
        file: 'Home.tsx — PORTALS[2].img',
        description: '⚡ Override without code: Admin → Portal Images → Mercenaries',
        isUrl: true,
      },
      {
        label: 'Game Modes (default)',
        value: 'https://z8games.akamaized.net/cfna/web/main/carousel/260702_cfwe_mutation_zmplay_carouselm.jpg',
        file: 'Home.tsx — PORTALS[3].img',
        description: '⚡ Override without code: Admin → Portal Images → Game Modes',
        isUrl: true,
      },
      {
        label: 'Ranks (default)',
        value: 'https://static.wikia.nocookie.net/crossfirefps/images/0/0f/NA_class_1.png',
        file: 'Home.tsx — PORTALS[4].img',
        description: '⚡ Override without code: Admin → Portal Images → Ranks',
        isUrl: true,
      },
      {
        label: 'Events (default)',
        value: 'https://cdnr.escharts.com/uploads/public/68a/d91/360/68ad913604b0e066419134.jpg?width=1140&height=570&quality=90&extension=jpg',
        file: 'Home.tsx — PORTALS[5].img',
        description: '⚡ Override without code: Admin → Portal Images → Events',
        isUrl: true,
      },
    ],
  },
  {
    title: 'OG / Social Images',
    subtitle: 'Per-page Open Graph images passed as props — changing them requires editing each page file.',
    color: '#f97316',
    entries: [
      { label: 'Home (default OG)', value: '/feature-crossfire.jpg', file: 'App.tsx line 318 (passed to PageSEO)', isUrl: false },
      { label: 'Ranks page OG', value: 'https://static.wikia.nocookie.net/crossfire/images/…rank-badge.jpg', file: 'Ranks.tsx — ogImage prop', isUrl: false },
      { label: 'Modes page OG', value: 'Zombie / Mutation carousel image URL', file: 'Modes.tsx — ogImage prop', isUrl: false },
      { label: 'Maps page OG', value: 'Z8Games maps carousel image URL', file: 'Maps.tsx — ogImage prop', isUrl: false },
      { label: 'Weapons page OG', value: 'Sniper week carousel image URL', file: 'Weapons.tsx — ogImage prop', isUrl: false },
      { label: 'Mercenaries page OG', value: 'Mercenary feature image URL', file: 'Mercenaries.tsx — ogImage prop', isUrl: false },
      { label: 'News page OG', value: 'Z8Games news banner URL', file: 'News.tsx — ogImage prop', isUrl: false },
      { label: 'Events page OG', value: 'ESCharts esports tournament photo URL', file: 'EventsList.tsx — ogImage prop', isUrl: false },
    ],
  },
  {
    title: 'Admin UI Defaults',
    subtitle: 'Default values used in Admin.tsx if the database has no record yet.',
    color: '#a855f7',
    entries: [
      { label: 'Seller fee (default)', value: '30%', file: 'Admin.tsx line 826', description: 'Monetization default — overridden once saved to DB.' },
      { label: 'Boosting fee (default)', value: '12%', file: 'Admin.tsx line 829' },
      { label: 'Affiliate fee (default)', value: '4%', file: 'Admin.tsx line 832' },
      { label: 'Premium price (default)', value: '$2 / month', file: 'Admin.tsx line 830' },
      { label: 'Site name fallback', value: 'CrossFire Wiki', file: 'App.tsx lines 314, 327, 335 + SiteSettings DEFAULTS' },
    ],
  },
  {
    title: 'API & External URLs',
    subtitle: 'Third-party endpoints and service URLs referenced directly in code.',
    color: '#38bdf8',
    entries: [
      { label: 'CF player stats API', value: '/rest/userprofile.json?usn=', file: 'api/player/lookup.ts', description: 'Uses undici to bypass Akamai. Base domain is the CF regional endpoint.', isUrl: false },
      { label: 'OpenRouter model', value: 'openai/gpt-oss-20b:free', file: 'api/ai/chat.ts (or similar)', description: 'Only this model works reliably; nemotron/deepseek/gemma hit guardrail or rate-limit errors.' },
      { label: 'Supabase project URL', value: 'VITE_SUPABASE_URL (env var)', file: 'client/src/lib/supabaseAdmin.ts', description: 'Stored as env var — NOT hardcoded, listed here for completeness.' },
    ],
  },
];

/* ─── sub-components ─────────────────────────────────────────── */
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy value"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, background: 'transparent', border: '1px solid #3f3f46',
        borderRadius: 4, cursor: 'pointer', color: copied ? '#22c55e' : '#52525b',
        flexShrink: 0, transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.borderColor = '#71717a'; }}
      onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.borderColor = '#3f3f46'; }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function Entry({ entry }: { entry: HardcodedEntry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '11px 14px', borderBottom: '1px solid #27272a',
    }}>
      {/* Icon or placeholder */}
      {entry.icon && (
        <span style={{ fontSize: 15, color: '#71717a', marginTop: 1, flexShrink: 0 }}>{entry.icon}</span>
      )}

      {/* Label + file */}
      <div style={{ flex: '0 0 180px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#e4e4e7' }}>{entry.label}</div>
        <div style={{ fontSize: 11, color: '#52525b', marginTop: 2, wordBreak: 'break-all' }}>{entry.file}</div>
      </div>

      {/* Value */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <code style={{
          display: 'block', fontSize: 12, color: '#a1a1aa',
          background: '#09090b', border: '1px solid #27272a',
          borderRadius: 4, padding: '5px 9px', wordBreak: 'break-all',
          lineHeight: 1.6, fontFamily: 'ui-monospace, monospace',
        }}>
          {entry.value}
        </code>
        {entry.description && (
          <div style={{ fontSize: 11, color: '#52525b', marginTop: 5, lineHeight: 1.5 }}>{entry.description}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <CopyButton value={entry.value} />
        {entry.isUrl && (
          <a href={entry.value} target="_blank" rel="noopener noreferrer"
            title="Open link"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, background: 'transparent', border: '1px solid #3f3f46',
              borderRadius: 4, color: '#52525b', textDecoration: 'none',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#fafafa'; el.style.borderColor = '#71717a'; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#52525b'; el.style.borderColor = '#3f3f46'; }}
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

function Section({ section }: { section: HardcodedSection }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, overflow: 'hidden' }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '13px 16px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: section.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', flex: 1 }}>{section.title}</span>
        <span style={{ fontSize: 11, color: '#52525b', marginRight: 8 }}>{section.entries.length} item{section.entries.length !== 1 ? 's' : ''}</span>
        <span style={{ fontSize: 11, color: '#3f3f46' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div style={{ padding: '0 16px 10px', fontSize: 12, color: '#52525b', borderTop: '1px solid #27272a', paddingTop: 10 }}>
            {section.subtitle}
          </div>
          <div>
            {section.entries.map((e) => <Entry key={e.label} entry={e} />)}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────── */
export default function HardcodedConfig() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 960 }}>

      {/* Page header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Code2 size={18} style={{ color: '#d4a017' }} />
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>Hardcoded Configuration</h1>
        </div>
        <p style={{ fontSize: 13, color: '#52525b', margin: 0, lineHeight: 1.6 }}>
          These values are baked into the source code and <strong style={{ color: '#71717a' }}>cannot be changed from the admin UI</strong>.
          To update them you need to edit the listed file and redeploy.
        </p>
      </div>

      {/* Warning banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)',
        borderRadius: 6, padding: '12px 16px',
      }}>
        <AlertTriangle size={15} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.6 }}>
          <strong style={{ color: '#eab308' }}>Social links are duplicated</strong> — Discord, Facebook, Twitter/X, and YouTube each appear in 2–4 separate files.
          When updating them, search the codebase for the URL string to find every occurrence.
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((s) => <Section key={s.title} section={s} />)}

      {/* Footer note */}
      <div style={{
        fontSize: 11, color: '#3f3f46', textAlign: 'center', paddingBottom: 8, lineHeight: 1.6,
      }}>
        This page is read-only. It reflects the state of the codebase at the time of the last deployment.
      </div>
    </div>
  );
}
