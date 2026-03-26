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

  const toAbsoluteUrl = (raw) => {
    const candidate = String(raw || '').trim();
    if (!candidate) return '';
    if (candidate.startsWith('//')) return `https:${candidate}`;
    try {
      return new URL(candidate, url).toString();
    } catch {
      return candidate.startsWith('/') ? `${FORUM_BASE_URL}${candidate}` : candidate;
    }
  };

  const isPlaceholderImage = (raw) => {
    const candidate = String(raw || '').toLowerCase();
    if (!candidate) return true;
    return candidate.includes('wof38b') || candidate.includes('placeholder') || candidate.includes('default') || candidate.includes('/avatar') || candidate.includes('/emoji');
  };

  const hasValidImageExtension = (raw) => {
    const candidate = String(raw || '').toLowerCase().split('?')[0].split('#')[0];
    return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(candidate);
  };

  const isPreferredZ8Image = (raw) => {
    const candidate = String(raw || '').toLowerCase();
    return candidate.includes('z8games.com') || candidate.includes('akamaized.net');
  };

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

  // Find a main image (prioritize event-specific/custom images over defaults)
  const preferredImageCandidates = [
    $('meta[property="og:image"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[property="og:image:secure_url"]').attr('content'),
    $('meta[itemprop="image"]').attr('content'),
  ]
    .map(toAbsoluteUrl)
    .filter(Boolean);

  $('img').each((_, el) => {
    const src = toAbsoluteUrl($(el).attr('data-src') || $(el).attr('src') || $(el).attr('data-original') || '');
    if (!src) return;
    const cls = `${$(el).attr('class') || ''} ${$(el).attr('id') || ''}`.toLowerCase();
    const isLikelyDecorative = cls.includes('avatar') || cls.includes('icon') || cls.includes('logo') || cls.includes('emoji');
    if (isLikelyDecorative) return;
    preferredImageCandidates.push(src);
  });

  const imageUrl =
    preferredImageCandidates.find((candidate) => isPreferredZ8Image(candidate) && hasValidImageExtension(candidate) && !isPlaceholderImage(candidate)) ||
    preferredImageCandidates.find((candidate) => hasValidImageExtension(candidate) && !isPlaceholderImage(candidate)) ||
    preferredImageCandidates.find((candidate) => isPreferredZ8Image(candidate) && !isPlaceholderImage(candidate)) ||
    preferredImageCandidates.find((candidate) => !isPlaceholderImage(candidate)) ||
    '';

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
  const rawHtmlContent = contentEl?.html() || '';
  let content = rawHtmlContent;
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
  const matchedLocalAsset = !imageUrl ? findLocalAssetInList(title, localList) : '';
  const finalImage = imageUrl || matchedLocalAsset || '';

  // Preview text generation
  const preview = $(contentEl).text().trim().substring(0, 150) + "...";

  return {
    url,
    title,
    date,
    image: finalImage,
    content,
    rawHtmlContent,
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
  if (!urls || !Array.isArray(urls)) return [];
  const batchSize = 3;
  const results = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (u) => {
        try { return await scrapeEventDetails(u); } catch (e) { return null; }
      })
    );
    results.push(...batchResults.filter(Boolean));
    if (i + batchSize < urls.length) await new Promise(res => setTimeout(res, 1000));
  }
  return results;
}

export async function scrapeFirstFiveEvents() {
  const posts = await scrapeForumAnnouncements();
  return await scrapeMultipleEvents(posts.slice(0, 5).map(p => p.url));
}

export async function scrapeModes() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/modes.html`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    });
    const $ = cheerio.load(response.data);
    const modes = [];
    
    // Check for specific CrossFire site classes
    $('.mode_item, .mode-card, .mode_list li, div[class*="mode"]').each((i, el) => {
      const $el = $(el);
      const name = $el.find('h2, h3, .name, .title, strong').first().text().trim();
      if (!name || name.length < 2) return;
      
      const description = $el.find('p, .desc, .description').first().text().trim();
      let image = $el.find('img').first().attr('src') || '';
      if (image && !image.startsWith('http')) {
        image = image.startsWith('//') ? `https:${image}` : `${CF_BASE_URL}${image}`;
      }
      
      modes.push({
        id: `mode-${i}`,
        name,
        description,
        image,
        category: 'Standard'
      });
    });

    // Fallback: search for mode names in the page text
    if (modes.length === 0) {
      const pageText = $('body').text();
      const commonModes = ['Team Deathmatch', 'Search and Destroy', 'Ghost Mode', 'Zombie Mode', 'Elimination', 'Free for All', 'Mutation Mode', 'Hero Mode'];
      commonModes.forEach((m, idx) => {
        if (pageText.includes(m)) {
          modes.push({
            id: `mode-manual-${idx}`,
            name: m,
            description: `Official CrossFire ${m} gameplay.`,
            image: '',
            category: m.includes('Zombie') ? 'Zombie Mode' : (m.includes('Ghost') ? 'Ghost Mode' : 'Standard')
          });
        }
      });
    }

    return modes;
  } catch (err) {
    console.error('scrapeModes error:', err.message);
    return [];
  }
}

export async function scrapeWeapons() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/weapons.html`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    });
    const $ = cheerio.load(response.data);
    const weapons = [];
    
    $('.weapon_item, .weapon-card, div[class*="weapon"]').each((i, el) => {
      const $el = $(el);
      const name = $el.find('h2, h3, .name, .title').first().text().trim();
      if (!name) return;
      
      const description = $el.find('p, .desc, .description').first().text().trim();
      let image = $el.find('img').first().attr('src') || '';
      if (image && !image.startsWith('http')) {
        image = image.startsWith('//') ? `https:${image}` : `${CF_BASE_URL}${image}`;
      }
      
      weapons.push({
        id: `weapon-${i}`,
        name,
        description,
        image,
        category: 'Weapon'
      });
    });

    return weapons;
  } catch (err) {
    console.error('scrapeWeapons error:', err.message);
    return [];
  }
}

export async function scrapeSingleUrl(url) {
  if (!url || !url.startsWith('http')) throw new Error('Invalid URL');

  const isFandom = url.includes('fandom.com') || url.includes('wikia.com');
  if (isFandom) return scrapeFandomWikiPage(url);
  return scrapeGenericArticlePage(url);
}

export async function scrapeFandomWikiPage(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 25000,
  });

  const $ = cheerio.load(response.data);

  const toAbs = (src) => {
    if (!src) return '';
    src = String(src).trim();
    if (src.startsWith('//')) return 'https:' + src;
    try { return new URL(src, url).toString(); } catch { return src; }
  };

  const title =
    $('h1.page-header__title').text().trim() ||
    $('h1#firstHeading').text().trim() ||
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().replace(' | CrossFire Wiki', '').trim() ||
    'Untitled';

  const mainImage =
    toAbs($('meta[property="og:image"]').attr('content')) ||
    toAbs($('.infobox img, .portable-infobox img, .pi-image-thumbnail, figure.pi-item img').first().attr('src')) ||
    '';

  const metaDesc =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') || '';

  const contentEl = $('.mw-parser-output').first();

  if (!contentEl.length) {
    throw new Error('Could not find wiki article content (.mw-parser-output)');
  }

  contentEl.find('script, style, .mw-editsection, .navbox, .noprint, .reflist, #toc, .toc, .catlinks, .hatnote, .mw-references-wrap').remove();

  contentEl.find('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const resolved = toAbs(src);
    if (resolved) $(el).attr('src', resolved);
    $(el).removeAttr('srcset');
    $(el).removeAttr('data-src');
  });

  contentEl.find('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('/')) {
      const base = new URL(url);
      $(el).attr('href', `${base.origin}${href}`);
    }
    $(el).attr('target', '_blank').attr('rel', 'noopener noreferrer');
  });

  // Handle fandom tabber (tabs inside wiki pages)
  const tabSections = [];
  contentEl.find('.tabber, .wds-tabs__wrapper').each((_, tabberEl) => {
    const tabItems = [];
    $(tabberEl).find('.tabbertab, .wds-tab__content').each((_, tab) => {
      const tabTitle = $(tab).attr('title') || $(tab).find('[data-tab-body]').attr('data-tab-body') || `Tab ${tabItems.length + 1}`;
      const tabContent = $(tab).html() || '';
      if (tabContent.trim()) {
        tabItems.push({ title: tabTitle, content: tabContent });
      }
    });
    if (tabItems.length > 0) {
      tabSections.push(tabItems);
      // Replace tabber with a structured HTML representation
      let tabHtml = `<div class="wiki-tabber" style="border:1px solid #444;border-radius:6px;overflow:hidden;margin:16px 0;">`;
      tabHtml += `<div class="wiki-tab-buttons" style="display:flex;flex-wrap:wrap;background:#222;gap:2px;padding:4px;">`;
      tabItems.forEach((t, i) => {
        tabHtml += `<button onclick="(function(btn){var p=btn.closest('.wiki-tabber');p.querySelectorAll('.wiki-tab-panel').forEach(function(x){x.style.display='none'});p.querySelectorAll('.wiki-tab-btn').forEach(function(x){x.style.opacity='0.5'});btn.style.opacity='1';p.querySelector('[data-tab-index=\\'${i}\\']').style.display='block'})(this)" class="wiki-tab-btn" style="background:#333;color:#fff;border:none;padding:6px 14px;cursor:pointer;border-radius:4px;font-size:13px;opacity:${i === 0 ? '1' : '0.5'}">${t.title}</button>`;
      });
      tabHtml += `</div>`;
      tabItems.forEach((t, i) => {
        tabHtml += `<div class="wiki-tab-panel" data-tab-index="${i}" style="padding:12px;display:${i === 0 ? 'block' : 'none'}">${t.content}</div>`;
      });
      tabHtml += `</div>`;
      $(tabberEl).replaceWith(tabHtml);
    }
  });

  // Handle portable infoboxes - keep them as styled tables
  contentEl.find('.portable-infobox, .infobox').each((_, el) => {
    $(el).attr('style', ($(el).attr('style') || '') + ';float:right;margin:0 0 16px 16px;max-width:300px;background:#1a1a2e;border:1px solid #444;border-radius:6px;padding:8px;');
  });

  const rawHtml = contentEl.html() || '';

  const sanitized = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['style', 'iframe', 'button'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'style', 'class', 'onclick', 'data-tab-index', 'data-tab-body', 'rel'],
    FORCE_BODY: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true,
  });

  const excerpt = contentEl.find('p').first().text().trim().substring(0, 200) + '...';

  return {
    url,
    sourceUrl: url,
    title,
    content: sanitized,
    excerpt,
    mainImage,
    image: mainImage,
    keywords: [],
    seoTitle: title,
    seoDescription: metaDesc || excerpt,
    contentLength: sanitized.length,
    status: 'success',
    isWiki: true,
    tabSections: tabSections.length,
  };
}

export async function scrapeGenericArticlePage(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 25000,
  });

  const $ = cheerio.load(response.data);

  const toAbs = (src) => {
    if (!src) return '';
    src = String(src).trim();
    if (src.startsWith('//')) return 'https:' + src;
    try { return new URL(src, url).toString(); } catch { return src; }
  };

  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    'Untitled';

  const mainImage =
    toAbs($('meta[property="og:image"]').attr('content')) ||
    toAbs($('meta[name="twitter:image"]').attr('content')) || '';

  const metaDesc =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') || '';

  const metaKeywordsRaw = $('meta[name="keywords"]').attr('content') || '';
  const keywords = metaKeywordsRaw ? metaKeywordsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Find main content area
  const contentSelectors = [
    'article .entry-content', 'article', '.post-content', '.article-content',
    '.mw-parser-output', '.content-body', '#content', 'main',
    '[role="main"]', '.page-content'
  ];

  let contentEl = null;
  for (const sel of contentSelectors) {
    if ($(sel).length) { contentEl = $(sel).first(); break; }
  }

  if (!contentEl) {
    let maxP = 0;
    $('div').each((_, el) => {
      const cnt = $(el).find('p').length;
      if (cnt > maxP) { maxP = cnt; contentEl = $(el); }
    });
  }

  if (!contentEl) contentEl = $('body');

  contentEl.find('script, style, nav, footer, header, .ads, .sidebar, .ad, [class*="ad-"], [id*="ad-"], .cookie-banner, .newsletter-popup').remove();

  contentEl.find('img').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src') || '';
    const resolved = toAbs(src);
    if (resolved) $(el).attr('src', resolved);
    $(el).removeAttr('srcset').removeAttr('data-src').removeAttr('data-srcset');
  });

  contentEl.find('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.startsWith('/')) {
      try { $(el).attr('href', new URL(href, url).toString()); } catch {}
    }
    $(el).attr('target', '_blank').attr('rel', 'noopener noreferrer');
  });

  const rawHtml = contentEl.html() || '';

  const sanitized = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['style', 'iframe', 'figure', 'figcaption'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'style', 'class', 'rel', 'width', 'height'],
    FORCE_BODY: false,
    KEEP_CONTENT: true,
  });

  const excerpt = (contentEl.find('p').first().text().trim() || metaDesc).substring(0, 200) + '...';

  return {
    url,
    sourceUrl: url,
    title,
    content: sanitized,
    excerpt,
    mainImage,
    image: mainImage,
    keywords,
    seoTitle: title,
    seoDescription: metaDesc || excerpt,
    contentLength: sanitized.length,
    status: 'success',
    isWiki: false,
  };
}

export async function scrapeMaps() {
  try {
    // Try Z8Games first for maps as it's more reliable
    const response = await axios.get(`${CF_BASE_URL}/modes.html`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000
    });
    const $ = cheerio.load(response.data);
    const maps = [];
    
    // In modes.html, maps are often listed under each mode
    $('.mode_item, .mode-card, .mode_list li').each((i, el) => {
      const modeName = $(el).find('h2, h3, .name, .title, strong').first().text().trim();
      $(el).find('.map_list li, .maps li, span, a').each((j, mapEl) => {
        const mapName = $(mapEl).text().trim();
        if (mapName && mapName.length > 2 && mapName.length < 50 && !mapName.includes(' ') && !['Win', 'Loss', 'Limit'].some(word => mapName.includes(word))) {
          if (!maps.find(m => m.name === mapName)) {
            maps.push({
              id: `map-z8-${maps.length}`,
              name: mapName,
              image: '',
              mode: modeName,
              category: 'Official'
            });
          }
        }
      });
    });

    // Fallback list of iconic CF maps if scraping fails to get enough
    const iconicMaps = [
      { name: 'Ship', mode: 'Team Deathmatch' },
      { name: 'Mexico', mode: 'Team Deathmatch' },
      { name: 'Black Widow', mode: 'Search and Destroy' },
      { name: 'Eagle Eye', mode: 'Search and Destroy' },
      { name: 'Port', mode: 'Search and Destroy' },
      { name: 'Ankara', mode: 'Search and Destroy' },
      { name: 'Laboratory', mode: 'Ghost Mode' },
      { name: 'Lost City', mode: 'Zombie Mode' },
      { name: 'Crater', mode: 'Zombie Mode' },
      { name: 'Valletta', mode: 'Zombie Mode' }
    ];

    iconicMaps.forEach(m => {
      if (!maps.find(existing => existing.name === m.name)) {
        maps.push({
          id: `map-iconic-${maps.length}`,
          name: m.name,
          image: '',
          mode: m.mode,
          category: 'Official'
        });
      }
    });

    return maps;
  } catch (err) {
    console.error('scrapeMaps error:', err.message);
    return [];
  }
}
