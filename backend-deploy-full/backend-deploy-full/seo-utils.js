import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','then','than','to','of','in','on','at','for','with','by','from','is','are','was','were','be','been','being','as','it','this','that','these','those','we','you','they','he','she','them','his','her','our','your','their','i','me','my','mine','ours','yours','theirs','us'
]);

export function slugifySafe(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function extractKeywords(text, opts = {}) {
  const max = opts.max || 12;
  const words = String(text || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w) && w.length >= 3);
  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  const sorted = Array.from(freq.entries()).sort((a,b)=> b[1]-a[1]).map(([w])=> w);
  return sorted.slice(0, max);
}

export function generateSeoTitle(title, content) {
  const kws = extractKeywords(content, { max: 3 });
  const prefix = kws.length ? kws[0][0].toUpperCase() + kws[0].slice(1) : '';
  let out = title || '';
  if (prefix && !out.toLowerCase().includes(prefix.toLowerCase())) {
    out = `${prefix} — ${out}`;
  }
  if (out.length > 70) out = out.slice(0, 67) + '...';
  return out;
}

export function summarize(content) {
  const plain = String(content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return plain.slice(0, 155);
}

export function buildSeoImageSvg({ title, keywords }) {
  const safeTitle = (title || '').replace(/&/g, '&amp;');
  const kwText = (keywords || []).join(' • ').replace(/&/g, '&amp;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1f2937" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1200" height="630" fill="url(#g)" />
  <text x="60" y="200" font-family="Inter, Arial, sans-serif" font-size="64" fill="#ffffff" font-weight="800">${safeTitle}</text>
  <text x="60" y="560" font-family="Inter, Arial, sans-serif" font-size="28" fill="#93c5fd">${kwText}</text>
</svg>`;
}

export async function generateSeoImage({ baseDir, slug, title, keywords, type }) {
  const svg = buildSeoImageSvg({ title, keywords });
  const prefix = type || 'content';
  const fileBase = `${prefix}-${slugifySafe(slug || title || Date.now())}-seo`;
  const outPath = path.join(baseDir, `${fileBase}.webp`);
  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(outPath);
  return { path: outPath, url: `/images/${fileBase}.webp` };
}

const MONTHS = {
  '1':'January','01':'January','jan':'January','january':'January',
  '2':'February','02':'February','feb':'February','february':'February',
  '3':'March','03':'March','mar':'March','march':'March',
  '4':'April','04':'April','apr':'April','april':'April',
  '5':'May','05':'May','may':'May',
  '6':'June','06':'June','jun':'June','june':'June',
  '7':'July','07':'July','jul':'July','july':'July',
  '8':'August','08':'August','aug':'August','august':'August',
  '9':'September','09':'September','sep':'September','september':'September',
  '10':'October','oct':'October','october':'October',
  '11':'November','nov':'November','november':'November',
  '12':'December','dec':'December','december':'December'
};

export function parseFlexibleDate(input, fallbackDate) {
  const s = String(input || '').trim().toLowerCase();
  if (!s) {
    const d = fallbackDate ? new Date(fallbackDate) : new Date();
    return { month: d.toLocaleString('en-US',{ month: 'long' }), year: d.getFullYear(), day: d.getDate() };
  }
  // Formats: "dec", "12-2025", "12/2025", "dec 2025", "2025-12-15"
  let m, y, d;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [yy, mm, dd] = s.split('-').map(n=> parseInt(n,10));
    y = yy; m = mm; d = dd;
  } else if (/^\d{1,2}[\/-]\d{4}$/.test(s)) {
    const [mm, yy] = s.split(/[\/-]/).map(n=> parseInt(n,10));
    m = mm; y = yy;
  } else if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{4})?$/.test(s)) {
    const parts = s.split(/\s+/);
    m = Object.keys(MONTHS).find(k=> k===parts[0]) ? parts[0] : undefined;
    y = parts[1] ? parseInt(parts[1],10) : (new Date(fallbackDate || Date.now()).getFullYear());
  } else if (/^(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?$/.test(s)) {
    const parts = s.split(/\s+/);
    m = parts[0]; y = parts[1] ? parseInt(parts[1],10) : (new Date(fallbackDate || Date.now()).getFullYear());
  }
  let monthName = undefined;
  if (m !== undefined) {
    const key = String(m);
    monthName = MONTHS[key] || MONTHS[String(parseInt(key,10))];
  }
  if (!monthName) {
    const fd = new Date(fallbackDate || Date.now());
    return { month: fd.toLocaleString('en-US',{ month: 'long' }), year: fd.getFullYear(), day: fd.getDate() };
  }
  const yearVal = y || new Date(fallbackDate || Date.now()).getFullYear();
  return { month: monthName, year: yearVal, day: d };
}

export function formatEnglishDate({ month, year, day }) {
  if (day) return `${month} ${day}, ${year}`;
  return `${month} ${year}`;
}

export function validateDateRangeInput(s) {
  const ok = /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/-]\d{4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(\s+\d{4})?|([a-z]{3,9})(\s+\d{4})?)$/i.test(String(s || '').trim());
  return ok;
}
