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
