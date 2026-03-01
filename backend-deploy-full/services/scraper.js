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

function normalizeForumHtml(html) {
  const $ = cheerio.load(html);
  // Convert <font color="..."> to <span style="color: ...">
  $('font[color]').each((_, el) => {
    const color = ($(el).attr('color') || '').trim();
    if (color) {
      const span = $('<span></span>');
      span.attr('style', `color: ${color}`);
      span.html($(el).html() || '');
      $(el).replaceWith(span);
    }
  });
  // Convert <font face="..." size="..."> attributes to styles
  $('font[face], font[size]').each((_, el) => {
    const $el = $(el);
    const face = ($el.attr('face') || '').trim();
    const size = ($el.attr('size') || '').trim();
    const existing = ($el.attr('style') || '').trim();
    const parts = [];
    if (existing) parts.push(existing.replace(/;$/, ''));
    if (face) parts.push(`font-family: ${face}`);
    if (size) {
      const sizeMap = { '1': '10px', '2': '13px', '3': '16px', '4': '18px', '5': '24px', '6': '32px', '7': '48px' };
      parts.push(`font-size: ${sizeMap[size] || size + 'px'}`);
    }
    if (parts.length) {
      const span = $('<span></span>');
      span.attr('style', parts.join('; '));
      span.html($el.html() || '');
      $el.replaceWith(span);
    }
  });
  // Clean bbcode classes
  $('[class*="bbcode"], [class*="BBCode"]').each((_, el) => {
    const $el = $(el);
    const style = ($el.attr('style') || '').trim();
    const cls = ($el.attr('class') || '').trim();
    if (!style && cls) {
      $el.attr('class', cls.replace(/bbcode[_-]?/ig, '').trim());
    }
  });
  return $.html();
}

// Extract unique colors from HTML content
function extractColorsFromHtml(html) {
  const $ = cheerio.load(html);
  const colorSet = new Set();
  // From inline style="color: ..."
  $('[style]').each((_, el) => {
    const style = ($(el).attr('style') || '');
    const colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    if (colorMatch) colorSet.add(colorMatch[1].trim());
    const bgMatch = style.match(/background(?:-color)?\s*:\s*([^;]+)/i);
    if (bgMatch) colorSet.add(bgMatch[1].trim());
  });
  // From <font color="...">
  $('font[color]').each((_, el) => {
    const c = ($(el).attr('color') || '').trim();
    if (c) colorSet.add(c);
  });
  return [...colorSet].filter(Boolean);
}

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
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      timeout: 45000,
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: (s) => s < 600
    });
    if (!response.data || typeof response.data !== 'string') {
      const retry = await axios.get(`${CF_BASE_URL}/ranks.html`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        timeout: 45000,
        responseType: 'text',
        maxRedirects: 5,
        validateStatus: (s) => s < 600
      });
      if (!retry.data || typeof retry.data !== 'string') throw new Error('Invalid response');
      response.data = retry.data;
    }
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

export async function scrapePage(url) {
  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 20000
    });

    const $ = cheerio.load(response.data);
    
    // CrossFire specific patches page often has content in #patch_notes or similar
    const title = $('h1').first().text().trim() || 
                  $('.title').first().text().trim() || 
                  $('title').text().trim() || 
                  'CrossFire Patch Notes';
    
    // Try to find the main content area
    const selectors = [
      '#patch_notes', 
      '.patch_notes', 
      '.content_area', 
      '.article-content', 
      'article', 
      '.post-content',
      '#main-content'
    ];
    
    let contentEl = null;
    for (const s of selectors) {
      if ($(s).length > 0) {
        contentEl = $(s).first();
        break;
      }
    }
    
    if (!contentEl) {
      // Fallback: find the div with the most paragraphs
      let maxP = 0;
      $('div').each((_, el) => {
        const pCount = $(el).find('p').length;
        if (pCount > maxP) {
          maxP = pCount;
          contentEl = $(el);
        }
      });
    }

    let content = contentEl?.html() || $('body').html() || '';
    
    // Clean up content
    const $content = cheerio.load(content);
    $content('script, style, iframe, nav, footer, header, .ads, .sidebar').remove();
    
    // Resolve image URLs
    $content('img').each((_, el) => {
      let src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        try {
          $(el).attr('src', new URL(src, url).toString());
        } catch (e) {}
      }
    });
    
    content = $content.html();
    
    const sanitized = DOMPurify.sanitize(content, {
      ADD_TAGS: ['style', 'script', 'iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'style', 'class'],
      FORCE_BODY: true,
      ALLOW_UNKNOWN_PROTOCOLS: true,
    });

    // Find main image
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') || '';
    
    if (!image) {
      const firstImg = $content('img').first();
      image = firstImg.attr('src') || '';
    }

    const summary = $('meta[name="description"]').attr('content') || 
                    $('meta[property="og:description"]').attr('content') || 
                    $(contentEl).text().trim().substring(0, 200) + '...';

    return {
      title,
      content: sanitized,
      summary,
      image,
      url
    };
  } catch (error) {
    console.error(`Scrape error for ${url}:`, error.message);
    return null;
  }
}

export async function scrapeEventDetails(url) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000
  });

  const $ = cheerio.load(response.data);
  const title = $('h1').first().text().trim() || $('title').first().text().trim() || 'Untitled Event';
  const date = $('time').attr('datetime') || $('time').text().trim() || new Date().toLocaleDateString();

  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogType = $('meta[property="og:type"]').attr('content') || '';
  const ogUrl = $('meta[property="og:url"]').attr('content') || url;
  const metaDescription = $('meta[name="description"]').attr('content') || ogDescription || '';
  const metaKeywordsRaw = $('meta[name="keywords"]').attr('content') || '';
  const metaKeywords = metaKeywordsRaw ? metaKeywordsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Color scheme extraction - comprehensive
  const colorContentEl = $('.Message.userContent, .MessageList .Message, .UserContent').first();
  const rawContentForColors = colorContentEl?.html() || '';
  const colors = extractColorsFromHtml(rawContentForColors);
  // Also check body background
  const bodyBg = $('body').css('background-color');
  if (bodyBg && !colors.includes(bodyBg)) colors.push(bodyBg);

  // Find a main image
  let imageUrl = '';
  // Try to find large images or og:image first
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    imageUrl = ogImage;
  } else {
    const img = $('img').filter((i, el) => {
      const w = $(el).attr('width');
      const h = $(el).attr('height');
      return (!w || parseInt(w) > 200) && (!h || parseInt(h) > 100);
    }).first();

    if (img.length > 0) {
      imageUrl = img.attr('src') || img.attr('data-src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${FORUM_BASE_URL}${imageUrl}`;
      }
    }
  }

  // Logo extraction (try to find logo-like images)
  let logoUrl = '';
  const logoImg = $('img[src*="logo"], img[class*="logo"], img[alt*="logo"]').first();
  if (logoImg.length > 0) {
    logoUrl = logoImg.attr('src') || '';
    if (logoUrl && !logoUrl.startsWith('http')) {
      logoUrl = logoUrl.startsWith('//') ? `https:${logoUrl}` : `${FORUM_BASE_URL}${logoUrl}`;
    }
  }

  const contentEl = $('.Message.userContent, .MessageList .Message, .UserContent').first();
  let content = contentEl?.html() || '';
  if (content) {
    const normalized = normalizeForumHtml(content);
    content = DOMPurify.sanitize(normalized, {
      KEEP_CONTENT: true,
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height', 'target', 'rel'],
      ALLOW_DATA_ATTR: false
    });
  }

  // fallback to text-only
  if (!content) {
    content = `<p>${$('body').text().trim().split('\n').slice(0, 3).join(' ')}</p>`;
  }

  const localList = await getLocalAssetList();
  const finalImage = imageUrl || findLocalAssetInList(title, localList);

  // Preview text generation
  const preview = $(contentEl).text().trim().substring(0, 150) + "...";

  return {
    url,
    title,
    date,
    image: finalImage,
    content,
    category: 'Announcement',
    colors,
    logo: logoUrl,
    preview,
    seoTitle: ogTitle || title,
    seoDescription: metaDescription,
    seoKeywords: metaKeywords,
    ogTitle,
    ogDescription,
    ogType,
    ogUrl
  };
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
