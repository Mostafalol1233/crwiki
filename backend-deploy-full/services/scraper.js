import axios from 'axios';
import * as cheerio from 'cheerio';
import DOMPurify from 'isomorphic-dompurify';
import fs from 'fs/promises';
import path from 'path';

function slugify(input) {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let _localAssetList = null;
async function getLocalAssetList() {
  if (_localAssetList) return _localAssetList;
  try {
    const assetsDir = path.resolve(process.cwd(), 'attached_assets');
    const entries = await fs.readdir(assetsDir);
    _localAssetList = entries.filter((name) => {
      const ext = path.extname(name).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.jfif', '.bmp', '.svg'].includes(ext);
    });
  } catch (e) {
    _localAssetList = [];
  }
  return _localAssetList;
}

function findLocalAssetInList(name, list) {
  if (!name) return '';
  const normalized = slugify(name);
  for (const file of list) {
    const n = file.toLowerCase();
    if (n.includes(normalized) || normalized.split('-').some((part) => part && n.includes(part))) {
      return `/assets/${file}`;
    }
  }
  return '';
}

const FORUM_BASE_URL = 'https://forum.z8games.com';
const CF_BASE_URL = 'https://crossfire.z8games.com';

export async function scrapeForumAnnouncements() {
  const response = await axios.get(`${FORUM_BASE_URL}/categories/crossfire-announcements`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000
  });

  const $ = cheerio.load(response.data);
  const posts = [];
  $('.ItemDiscussion, .DiscussionRow, .Item-Discussion, .Discussion').each((_, element) => {
    const $el = $(element);
    const titleLink = $el.find('a.Title, .Title a, .DiscussionName a, a[href*="/discussion/"]').first();
    const title = titleLink.text().trim();
    const href = titleLink.attr('href');
    if (!title || !href) return;
    const fullUrl = href.startsWith('http') ? href : `${FORUM_BASE_URL}${href}`;
    posts.push({ url: fullUrl, title });
  });
  return posts.slice(0, 20);
}

export async function scrapeRanks() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/ranks.html`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const $ = cheerio.load(response.data);
    const ranks = [];
    const bonusMap = {
      'Brigadier General 4': { exp: 8964562, bonus: 'AK-47-K-Yellow Fractal 60 days' },
      'Brigadier General 6': { exp: 10016212, bonus: '30 x 7th Anniversary Crates' },
      'Major General 2': { exp: 11186422, bonus: 'G-Yellow Crystal perm' },
      'Major General 5': { exp: 13174012, bonus: '10 Color Blaze Crates' },
      'Major General 6': { exp: 13900762, bonus: 'Slaughter Ticket Box' },
      'Lieutenant General 3': { exp: 16281652, bonus: 'M4A1-S-Yellow Fractal perm' },
      'Lieutenant General 6': { exp: 18975472, bonus: 'RPK-Infernal Dragon 30 days' },
      'General 2': { exp: 20952802, bonus: 'AK-47-K-Yellow Fractal perm' },
      'General 4': { exp: 23080612, bonus: 'AWM-Infernal Dragon 30 days' },
      'General 6': { exp: 25363462, bonus: 'AK-47 Fury 30 days' },
      'Grand Marshall': { exp: 100000000, bonus: '30 Free Crate Tickets' },
    };
    const extractExp = (text) => {
      const cleaned = (text || '').replace(/[\,\s]/g, '');
      const m = cleaned.match(/(\d{6,})/);
      return m ? Number(m[1]) : undefined;
    };

    $('li, .rank, .rank-item, div[class*="rank"]').each((i, el) => {
      const $el = $(el);
      const name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() || $el.text().trim().split('\n')[0].trim();
      if (!name || name.length < 2) return;
      let image = '';
      const img = $el.find('img').first();
      if (img.length) {
        image = img.attr('src') || img.attr('data-src') || '';
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? `https:${image}` : `${CF_BASE_URL}${image}`;
        }
      }
      const rawText = $el.text().trim();
      const exp = extractExp(rawText);
      const mapped = bonusMap[name] || {};
      const parts = [];
      const finalExp = exp || mapped.exp;
      if (finalExp) parts.push(`EXP Required: ${finalExp}`);
      if (mapped.bonus) parts.push(`Bonus: ${mapped.bonus}`);
      ranks.push({ id: `rank-${i}`, name, image, requirements: parts.join(' | ') });
    });

    return ranks;
  } catch (err) {
    throw new Error(err.message || 'Failed to scrape ranks');
  }
}

export async function scrapeEventDetails(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const title = $('h1').first().text().trim() || 'Untitled Event';
  const date = $('time').attr('datetime') || $('time').text().trim() || new Date().toLocaleDateString();

  // Find a main image
  let imageUrl = '';
  const img = $('img').first();
  if (img.length > 0) {
    imageUrl = img.attr('src') || img.attr('data-src') || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${FORUM_BASE_URL}${imageUrl}`;
    }
  }

  const contentEl = $('.Message.userContent, .MessageList .Message, .UserContent').first();
  let content = contentEl?.html() || ''; 
  if (content) {
    content = DOMPurify.sanitize(content, { KEEP_CONTENT: true });
  }

  // fallback to text-only
  if (!content) {
    content = `<p>${$('body').text().trim().split('\n').slice(0,3).join(' ')}</p>`;
  }

  const localList = await getLocalAssetList();
  const finalImage = imageUrl || findLocalAssetInList(title, localList);

  return { url, title, date, image: finalImage, content, category: 'Announcement' };
}

export async function scrapeMultipleEvents(urls) {
  const results = [];
  for (const u of urls) {
    try {
      const ev = await scrapeEventDetails(u);
      results.push(ev);
      await new Promise(res => setTimeout(res, 500));
    } catch (e) {
      console.error('Skipping scrape for', u, e?.message || e);
    }
  }
  return results;
}
