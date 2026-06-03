import { useMemo } from 'react';
import ImageUpload from './ImageUpload';

interface SEOData {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  focusKeyword: string;
}

interface SEOPanelProps {
  seo: SEOData;
  onChange: (key: keyof SEOData, value: string) => void;
  content?: string;
  wordCount?: number;
}

function calcSEOScore(seo: SEOData, content: string): { score: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];
  const titleLen = seo.metaTitle.length;
  const descLen = seo.metaDescription.length;
  const kw = seo.focusKeyword.toLowerCase();
  const words = content.split(/\s+/).filter(Boolean).length;

  if (titleLen >= 50 && titleLen <= 60) score += 20;
  else if (titleLen > 0) { score += 8; tips.push('Title should be 50–60 characters'); }
  else tips.push('Add a meta title');

  if (descLen >= 140 && descLen <= 160) score += 20;
  else if (descLen > 0) { score += 8; tips.push('Description should be 140–160 characters'); }
  else tips.push('Add a meta description');

  if (kw && seo.metaTitle.toLowerCase().includes(kw)) score += 15;
  else if (kw) tips.push('Add focus keyword to title');

  if (kw && content) {
    const kwCount = (content.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
    const density = (kwCount / (words || 1)) * 100;
    if (density >= 1 && density <= 3) score += 15;
    else if (kwCount > 0) { score += 7; tips.push('Keyword density should be 1–3%'); }
    else tips.push('Use focus keyword in content');
  }

  if (seo.ogImage) score += 10; else tips.push('Add an OG image');
  if (words >= 300) score += 10; else tips.push(`Content is ${words} words — aim for 300+`);
  if (seo.canonicalUrl) score += 10;

  return { score: Math.min(score, 100), tips };
}

export default function SEOPanel({ seo, onChange, content = '', wordCount }: SEOPanelProps) {
  const { score, tips } = useMemo(() => calcSEOScore(seo, content), [seo, content]);

  const scoreColor = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 75 ? 'Good' : score >= 50 ? 'Needs improvement' : 'Poor';

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#a1a1aa', marginBottom: 4, display: 'block' };
  const inputStyle: React.CSSProperties = { width: '100%', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#fafafa', padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'Inter,sans-serif', boxSizing: 'border-box' };
  const counterStyle = (val: string, max: number): React.CSSProperties => ({ fontSize: 11, color: val.length > max ? '#ef4444' : '#52525b', textAlign: 'right', display: 'block', marginTop: 2 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* SEO Score */}
      <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEO Score</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor }}>{score}/100 · {scoreLabel}</span>
        </div>
        <div style={{ height: 4, background: '#27272a', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
        {tips.length > 0 && (
          <ul style={{ margin: '8px 0 0', padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {tips.slice(0, 3).map((t, i) => (
              <li key={i} style={{ fontSize: 11, color: '#52525b' }}>{t}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Meta Title */}
      <div>
        <label style={labelStyle}>Meta Title</label>
        <input type="text" value={seo.metaTitle} onChange={(e) => onChange('metaTitle', e.target.value)} placeholder="Page title for search engines..." style={inputStyle} maxLength={80} />
        <span style={counterStyle(seo.metaTitle, 60)}>{seo.metaTitle.length}/60</span>
      </div>

      {/* Meta Description */}
      <div>
        <label style={labelStyle}>Meta Description</label>
        <textarea value={seo.metaDescription} onChange={(e) => onChange('metaDescription', e.target.value)} placeholder="Brief description for search results..." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} maxLength={200} />
        <span style={counterStyle(seo.metaDescription, 160)}>{seo.metaDescription.length}/160</span>
      </div>

      {/* Focus Keyword */}
      <div>
        <label style={labelStyle}>Focus Keyword</label>
        <input type="text" value={seo.focusKeyword} onChange={(e) => onChange('focusKeyword', e.target.value)} placeholder="main keyword..." style={inputStyle} />
      </div>

      {/* OG Image */}
      <ImageUpload
        label="OG Image"
        value={seo.ogImage}
        onChange={(url) => onChange('ogImage', url)}
        hint="1200x630px recommended"
      />

      {/* Canonical URL */}
      <div>
        <label style={labelStyle}>Canonical URL</label>
        <input type="url" value={seo.canonicalUrl} onChange={(e) => onChange('canonicalUrl', e.target.value)} placeholder="https://crossfire.wiki/..." style={inputStyle} />
      </div>

      {/* Google Preview */}
      {(seo.metaTitle || seo.metaDescription) && (
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, padding: '12px 14px' }}>
          <span style={{ fontSize: 11, color: '#52525b', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Google Preview</span>
          <div style={{ fontSize: 18, color: '#4285f4', marginBottom: 2, fontWeight: 400, lineHeight: 1.3 }}>
            {seo.metaTitle || 'Page Title'}
          </div>
          <div style={{ fontSize: 13, color: '#22c55e', marginBottom: 4 }}>
            {seo.canonicalUrl || 'https://crossfire.wiki/...'}
          </div>
          <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>
            {seo.metaDescription || 'No description'}
          </div>
        </div>
      )}
    </div>
  );
}
