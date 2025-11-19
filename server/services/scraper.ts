import axios from 'axios';
import * as cheerio from 'cheerio';
import DOMPurify from 'isomorphic-dompurify';
import type { ScrapedEvent } from '@shared/types';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

function slugify(input: string) {
  if (!input) return '';
  return input
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let _localAssetList: string[] | null = null;
async function getLocalAssetList(): Promise<string[]> {
  if (_localAssetList) return _localAssetList;
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const assetsDir = path.resolve(currentDir, '..', 'attached_assets');
    const entries = await fs.readdir(assetsDir);
    _localAssetList = entries.filter((name) => {
      const ext = path.extname(name).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.jfif', '.bmp', '.svg'].includes(ext);
    });
    return _localAssetList;
  } catch (e) {
    _localAssetList = [];
    return _localAssetList;
  }
}

function findLocalAssetInList(name: string, list: string[]): string {
  if (!name) return '';
  const normalized = slugify(name);
  for (const file of list) {
    const n = file.toLowerCase();
    if (n.includes(normalized) || normalized.split('-').some((part) => part && n.includes(part))) {
      return `/assets/${file}`;
    }
  }
  // token fuzzy
  const tokens = normalized.split('-').filter(Boolean);
  for (const file of list) {
    const n = file.toLowerCase();
    for (const t of tokens) {
      if (t.length > 2 && n.includes(t)) return `/assets/${file}`;
    }
  }
  return '';
}

const FORUM_BASE_URL = 'https://forum.z8games.com';
const ANNOUNCEMENTS_URL = `${FORUM_BASE_URL}/categories/crossfire-announcements`;
const CF_BASE_URL = 'https://crossfire.z8games.com';

export interface ScrapedForumPost {
  url: string;
  title: string;
  date: string;
  discussionId: string;
}

export async function scrapeForumAnnouncements(): Promise<ScrapedForumPost[]> {
  try {
    const response = await axios.get(ANNOUNCEMENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const posts: ScrapedForumPost[] = [];

    $('td.DiscussionName, .DiscussionName').each((_, element) => {
      const $el = $(element);

      const titleLink = $el.find('a[href*="/discussion/"]').first();
      const title = titleLink.text().trim();
      const href = titleLink.attr('href');

      if (!title || !href) return;

      const fullUrl = href.startsWith('http') ? href : `${FORUM_BASE_URL}${href}`;
      const discussionId = href.match(/\/discussion\/(\d+)/)?.[1] || '';

      // Try to find date in the same row or nearby
      const $row = $el.closest('tr');
      const dateEl = $row.find('time, .DateCreated, .LastCommentDate, [class*="date"]').first();
      const date = dateEl.attr('datetime') || dateEl.attr('title') || dateEl.text().trim() || new Date().toLocaleDateString();

      posts.push({
        url: fullUrl,
        title,
        date,
        discussionId
      });
    });

    return posts.slice(0, 20);
  } catch (error: any) {
    console.error('Error scraping forum announcements:', error.message);
    throw new Error(`Failed to scrape forum: ${error.message}`);
  }
}

export async function scrapeEventDetails(url: string): Promise<ScrapedEvent> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);

    // Updated title selectors for current forum structure
    const titleSelectors = [
      'h1.DiscussionName',
      'h1.PageTitle',
      'h1',
      '.DiscussionHeader h1',
      '.Title h1',
      '[class*="discussion"] h1',
      '.DiscussionName h1',
      'td.DiscussionName a'
    ];

    let title = '';
    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        title = element.text().trim();
        if (title) break;
      }
    }
    title = title || 'Untitled Event';

    // Updated date selectors
    const dateSelectors = [
      '.DateCreated time',
      '.MItem-LastCommentDate time',
      'time[datetime]',
      '.CommentInfo time',
      '[class*="date"] time',
      '.DiscussionDate',
      '.LastCommentDate',
      'time'
    ];

    let date = '';
    for (const selector of dateSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        date = element.attr('datetime') || element.attr('title') || element.text().trim();
        if (date) break;
      }
    }
    date = date || new Date().toLocaleDateString();
    
    const contentSelectors = [
      '.Message.userContent',
      '.MessageList .Message',
      '.CommentList .Message',
      '.ItemComment .Message',
      '.UserContent',
      'article .Message',
      '.MessageContent',
      '[class*="message"][class*="body"]',
      '.Comment-Body',
      '.Item-BodyWrap'
    ];
    
    let contentDiv = null;
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        contentDiv = element;
        break;
      }
    }
    
    if (!contentDiv) {
      contentDiv = $('.ItemDiscussion, .Discussion, [class*="discussion"]').first();
    }

    contentDiv?.find('script, style, iframe, .Signature, .Options, .CommentInfo, .Meta, .ReactionButton').remove();
    
    contentDiv?.find('img').each((_, img) => {
      const $img = $(img);
      const src = $img.attr('src') || '';
      if (src && !src.startsWith('http')) {
        const fullSrc = src.startsWith('//') ? `https:${src}` : `${FORUM_BASE_URL}${src}`;
        $img.attr('src', fullSrc);
      }
    });
    
    contentDiv?.find('a').each((_, link) => {
      const $link = $(link);
      const href = $link.attr('href') || '';
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        const fullHref = href.startsWith('//') ? `https:${href}` : `${FORUM_BASE_URL}${href}`;
        $link.attr('href', fullHref);
      }
    });
    
    contentDiv?.find('*').each((_, el) => {
      const $el = $(el);
      const style = $el.attr('style') || '';
      if (style) {
        $el.attr('style', style.trim());
      }
    });
    
    let content = contentDiv?.html()?.trim() || '';
    
    if (content) {
      content = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'a', 'img',
          'blockquote', 'pre', 'code',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span',
          'hr'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title',
          'style', 'class',
          'width', 'height',
          'target', 'rel'
        ],
        ALLOW_DATA_ATTR: false,
        KEEP_CONTENT: true
      });
    }
    
    const imageSelectors = [
      '.Message img',
      '.UserContent img',
      'article img',
      '.MessageContent img',
      '.Comment-Body img',
      '[class*="message"] img',
      '.ItemComment img'
    ];
    
    let imageUrl = '';
    for (const selector of imageSelectors) {
      const img = $(selector).first();
      if (img.length > 0) {
        const src = img.attr('src') || img.attr('data-src');
        if (src && !src.includes('emoji') && !src.includes('icon') && !src.includes('avatar')) {
          imageUrl = src;
          break;
        }
      }
    }
    
    if (!imageUrl) {
      const allImages = $('img');
      allImages.each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src') || '';
        if (src && !src.includes('emoji') && !src.includes('icon') && !src.includes('avatar') && !src.includes('logo')) {
          imageUrl = src;
          return false;
        }
      });
    }
    
    const fullImageUrl = imageUrl && !imageUrl.startsWith('http') 
      ? (imageUrl.startsWith('//') ? `https:${imageUrl}` : `${FORUM_BASE_URL}${imageUrl}`)
      : imageUrl;
    
    if (!content || content.length < 50) {
      const textContent = contentDiv?.text()?.trim() || '';
      if (textContent) {
        content = `<p>${textContent}</p>`;
      } else {
        content = `<p>${title}</p>`;
      }
    }
    
    const categoryMatch = url.match(/categories\/([^\/]+)/);
    const category = categoryMatch ? categoryMatch[1].replace(/-/g, ' ') : 'Announcement';

    console.log(`Scraped ${url}:`, {
      title: title.substring(0, 50),
      hasContent: content.length > 0,
      contentLength: content.length,
      hasImage: !!fullImageUrl,
      imageUrl: fullImageUrl.substring(0, 100)
    });

    return {
      url,
      title,
      date,
      image: fullImageUrl,
      content,
      category: category.charAt(0).toUpperCase() + category.slice(1)
    };
  } catch (error: any) {
    console.error(`Error scraping event details from ${url}:`, error.message);
    throw new Error(`Failed to scrape event details: ${error.message}`);
  }
}

export async function scrapeMultipleEvents(urls: string[]): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  for (const url of urls) {
    try {
      const event = await scrapeEventDetails(url);
      events.push(event);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`Skipping ${url}: ${error.message}`);
    }
  }

  return events;
}

export async function scrapeFirstFiveEvents(): Promise<ScrapedEvent[]> {
  try {
    const posts = await scrapeForumAnnouncements();
    const firstFive = posts.slice(0, 5);
    const urls = firstFive.map(post => post.url);
    return await scrapeMultipleEvents(urls);
  } catch (error: any) {
    console.error('Error in scrapeFirstFiveEvents:', error.message);
    throw new Error(`Failed to scrape first five events: ${error.message}`);
  }
}

export interface ScrapedRank {
  id: string;
  name: string;
  image: string;
  description?: string;
  requirements?: string;
}

export interface ScrapedMode {
  id: string;
  name: string;
  image: string;
  description?: string;
  type?: string;
}

export interface ScrapedWeapon {
  id: string;
  name: string;
  image: string;
  category?: string;
  description?: string;
  stats?: Record<string, any>;
}

export async function scrapeRanks(): Promise<ScrapedRank[]> {
  try {
    const response = await axios.get(`${CF_BASE_URL}/ranks.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 45000,
      responseType: 'text',
      validateStatus: (status) => status < 600
    });

    if (!response.data || typeof response.data !== 'string') {
      const retry = await axios.get(`${CF_BASE_URL}/ranks.html`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 45000,
        responseType: 'text',
        validateStatus: (status) => status < 600
      });
      if (!retry.data || typeof retry.data !== 'string') {
        throw new Error('Invalid response from server');
      }
      (response as any).data = retry.data;
    }

  const $ = cheerio.load(response.data);
  const ranks: ScrapedRank[] = [];
  const bonusMap: Record<string, { exp?: number; bonus?: string }> = {
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

  const extractExp = (text: string): number | undefined => {
    const match = text.replace(/[,\s]/g, '').match(/(\d{6,})/);
    return match ? Number(match[1]) : undefined;
  };
  const localList = await getLocalAssetList();

    // Try multiple selectors for rank items
    const rankSelectors = [
      '.rank-item',
      '.rank',
      '[class*="rank"]',
      '.item',
      'li',
      'div[class*="rank"]'
    ];

    let rankElements = $();
    for (const selector of rankSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        rankElements = elements;
        break;
      }
    }

    rankElements.each((index, element) => {
      const $el = $(element);
      
      // Try to find rank name
      let name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() ||
                   $el.text().trim().split('\n')[0].trim();
      // fallback to alt/title attributes on images or anchors
      if (!name || name.length < 2) {
        const alt = $el.find('img').first().attr('alt') || '';
        const titleAttr = $el.find('img').first().attr('title') || '';
        const linkText = $el.find('a').first().text().trim() || '';
        name = (alt || titleAttr || linkText || name).trim();
      }
      
      if (!name || name.length < 2) return;

      // Try to find image
      let imageUrl = '';
      const img = $el.find('img').first();
      if (img.length > 0) {
        imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }

      // Try to find description
      const description = $el.find('.description, .desc, p, [class*="desc"]').first().text().trim();
      const rawText = $el.text().trim();
      const exp = extractExp(rawText);
      const mapped = bonusMap[name] || undefined;
      const parts: string[] = [];
      const finalExp = exp ?? mapped?.exp;
      if (typeof finalExp === 'number') parts.push(`EXP Required: ${finalExp}`);
      if (mapped?.bonus) parts.push(`Bonus: ${mapped.bonus}`);

      const id = `rank-${slugify(name) || index}`;
      const finalImage = imageUrl || findLocalAssetInList(name, localList);
      ranks.push({
        id,
        name,
        image: finalImage,
        description: description || undefined,
        requirements: parts.join(' | ') || undefined,
      });
    });

    // If no ranks found with specific selectors, try to find all images with text nearby
    if (ranks.length === 0) {
      $('img').each((index, img) => {
        const $img = $(img);
        const src = $img.attr('src') || $img.attr('data-src') || '';
        if (!src || src.includes('logo') || src.includes('icon') || src.includes('button')) return;

  const fullSrc = src.startsWith('http') ? src : (src.startsWith('//') ? `https:${src}` : `${CF_BASE_URL}${src}`);
        const parent = $img.parent();
        const name = parent.find('h3, h4, .name, .title').first().text().trim() ||
                     parent.text().trim().split('\n')[0].trim() ||
                     $img.attr('alt') || '';

        if (name && name.length > 2) {
          const id = `rank-${slugify(name) || index}`;
          const finalImage = fullSrc || findLocalAssetInList(name, localList);
          const mapped = bonusMap[name] || undefined;
          const parts: string[] = [];
          if (mapped?.exp) parts.push(`EXP Required: ${mapped.exp}`);
          if (mapped?.bonus) parts.push(`Bonus: ${mapped.bonus}`);
          ranks.push({ id, name, image: finalImage, requirements: parts.join(' | ') || undefined });
        }
      });
    }

    return ranks.slice(0, 50); // Limit to 50 ranks
  } catch (error: any) {
    console.error('Error scraping ranks:', error.message);
    throw new Error(`Failed to scrape ranks: ${error.message}`);
  }
}

export async function scrapeModes(): Promise<ScrapedMode[]> {
  try {
    const response = await axios.get(`${CF_BASE_URL}/modes.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      responseType: 'text',
      validateStatus: (status) => status < 500
    });

    if (!response.data || typeof response.data !== 'string') {
      throw new Error('Invalid response from server');
    }

  const $ = cheerio.load(response.data);
  const modes: ScrapedMode[] = [];
  const localList = await getLocalAssetList();

    // Try multiple selectors for mode items
    const modeSelectors = [
      '.mode-item',
      '.mode',
      '[class*="mode"]',
      '.item',
      'li',
      'div[class*="mode"]'
    ];

    let modeElements = $();
    for (const selector of modeSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        modeElements = elements;
        break;
      }
    }

    modeElements.each((index, element) => {
      const $el = $(element);
      
      let name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() ||
                   $el.text().trim().split('\n')[0].trim();
      if (!name || name.length < 2) {
        const alt = $el.find('img').first().attr('alt') || '';
        const titleAttr = $el.find('img').first().attr('title') || '';
        const linkText = $el.find('a').first().text().trim() || '';
        name = (alt || titleAttr || linkText || name).trim();
      }
      
      if (!name || name.length < 2) return;

      let imageUrl = '';
      const img = $el.find('img').first();
      if (img.length > 0) {
        imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }

      const description = $el.find('.description, .desc, p, [class*="desc"]').first().text().trim();

      const id = `mode-${slugify(name) || index}`;
      const finalImage = imageUrl || findLocalAssetInList(name, localList);
      modes.push({ id, name, image: finalImage, description: description || undefined });
    });

    // Fallback: find all images with text nearby
    if (modes.length === 0) {
      $('img').each((index, img) => {
        const $img = $(img);
        const src = $img.attr('src') || $img.attr('data-src') || '';
        if (!src || src.includes('logo') || src.includes('icon') || src.includes('button')) return;

        const fullSrc = src.startsWith('http') ? src : (src.startsWith('//') ? `https:${src}` : `${CF_BASE_URL}${src}`);
        const parent = $img.parent();
        const name = parent.find('h3, h4, .name, .title').first().text().trim() ||
                     parent.text().trim().split('\n')[0].trim() ||
                     $img.attr('alt') || '';

        if (name && name.length > 2) {
          const id = `mode-${slugify(name) || index}`;
          const finalImage = fullSrc || findLocalAssetInList(name, localList);
          modes.push({ id, name, image: finalImage });
        }
      });
    }

    return modes.slice(0, 50);
  } catch (error: any) {
    console.error('Error scraping modes:', error.message);
    throw new Error(`Failed to scrape modes: ${error.message}`);
  }
}

export async function scrapeWeapons(): Promise<ScrapedWeapon[]> {
  try {
    const response = await axios.get(`${CF_BASE_URL}/weapons.html`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      responseType: 'text',
      validateStatus: (status) => status < 500
    });

    if (!response.data || typeof response.data !== 'string') {
      throw new Error('Invalid response from server');
    }

  const $ = cheerio.load(response.data);
  const weapons: ScrapedWeapon[] = [];
  const localList = await getLocalAssetList();

    // Try multiple selectors for weapon items
    const weaponSelectors = [
      '.weapon-item',
      '.weapon',
      '[class*="weapon"]',
      '.item',
      'li',
      'div[class*="weapon"]'
    ];

    let weaponElements = $();
    for (const selector of weaponSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        weaponElements = elements;
        break;
      }
    }

    weaponElements.each((index, element) => {
      const $el = $(element);
      
      let name = $el.find('h3, h4, .name, .title, [class*="name"], [class*="title"]').first().text().trim() ||
                   $el.text().trim().split('\n')[0].trim();
      if (!name || name.length < 2) {
        const alt = $el.find('img').first().attr('alt') || '';
        const titleAttr = $el.find('img').first().attr('title') || '';
        const linkText = $el.find('a').first().text().trim() || '';
        name = (alt || titleAttr || linkText || name).trim();
      }
      
      if (!name || name.length < 2) return;

      let imageUrl = '';
      const img = $el.find('img').first();
      if (img.length > 0) {
        imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }

      const description = $el.find('.description, .desc, p, [class*="desc"]').first().text().trim();
      const category = $el.find('.category, [class*="category"]').first().text().trim();

      // Try to extract stats from tables or lists
      const stats: Record<string, any> = {};
      $el.find('table tr, .stat, [class*="stat"]').each((_, statEl) => {
        const $stat = $(statEl);
        const label = $stat.find('td:first-child, .label, [class*="label"]').first().text().trim();
        const value = $stat.find('td:last-child, .value, [class*="value"]').first().text().trim();
        if (label && value) {
          stats[label] = value;
        }
      });

      const id = `weapon-${slugify(name) || index}`;
      const finalImage = imageUrl || findLocalAssetInList(name, localList);
      weapons.push({
        id,
        name,
        image: finalImage,
        category: category || undefined,
        description: description || undefined,
        stats: Object.keys(stats).length > 0 ? stats : undefined
      });
    });

    // Fallback: find all images with text nearby
    if (weapons.length === 0) {
      $('img').each((index, img) => {
        const $img = $(img);
        const src = $img.attr('src') || $img.attr('data-src') || '';
        if (!src || src.includes('logo') || src.includes('icon') || src.includes('button')) return;

        const fullSrc = src.startsWith('http') ? src : (src.startsWith('//') ? `https:${src}` : `${CF_BASE_URL}${src}`);
        const parent = $img.parent();
        const name = parent.find('h3, h4, .name, .title').first().text().trim() ||
                     parent.text().trim().split('\n')[0].trim() ||
                     $img.attr('alt') || '';

        if (name && name.length > 2) {
          const id = `weapon-${slugify(name) || index}`;
          const finalImage = fullSrc || findLocalAssetInList(name, localList);
          weapons.push({ id, name, image: finalImage });
        }
      });
    }

    return weapons.slice(0, 100); // Limit to 100 weapons
  } catch (error: any) {
    console.error('Error scraping weapons:', error.message);
    throw new Error(`Failed to scrape weapons: ${error.message}`);
  }
}


