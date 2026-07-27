import axios from 'axios';
import * as cheerio from 'cheerio';
import { REGIONS } from '../shared/crossfire-regions.js';

const REGION_SOURCES = [
  { slug: 'west', name: 'CrossFire West', url: 'https://www.z8games.com/news' },
  { slug: 'china', name: 'CrossFire China', url: 'https://cf.qq.com/' },
  { slug: 'vietnam', name: 'CrossFire Vietnam', url: 'https://cf.vtcgame.vn/' },
  { slug: 'brazil', name: 'CrossFire Brazil', url: 'https://crossfire.lat/' },
  { slug: 'philippines', name: 'CrossFire Philippines', url: 'https://crossfire.ph/' },
  { slug: 'korea', name: 'CrossFire Korea', url: 'https://crossfire.co.kr/' },
  { slug: 'russia', name: 'CrossFire Russia', url: 'https://crossfire.rus/' },
];

function buildFallbackItems() {
  return REGION_SOURCES.map((source) => ({
    region: source.slug,
    title: `${source.name} feed ready`,
    link: source.url,
    image: '',
    source: source.url,
  }));
}

async function scrapeWithFirecrawl(url) {
  const key = process.env.FIRECRAWL_API_KEY || process.env.VITE_FIRECRAWL_API_KEY || '';
  if (!key) return null;

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, formats: ['markdown'] }),
  });

  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.data?.markdown || payload?.markdown || '';
}

export async function scrapeRegion(regionConfig) {
  try {
    const markdown = await scrapeWithFirecrawl(regionConfig.url);
    if (markdown) {
      const title = markdown.split(/\n+/).find((line) => line.trim()) || regionConfig.name;
      return {
        region: regionConfig.slug,
        title: title.replace(/^#+\s*/, '').slice(0, 120),
        link: regionConfig.url,
        image: '',
        source: regionConfig.url,
        sourceName: regionConfig.name,
        fetchedAt: new Date().toISOString(),
      };
    }

    const { data } = await axios.get(regionConfig.url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const title = $('title').first().text().trim() || regionConfig.name;
    return {
      region: regionConfig.slug,
      title,
      link: regionConfig.url,
      image: '',
      source: regionConfig.url,
      sourceName: regionConfig.name,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      region: regionConfig.slug,
      title: `${regionConfig.name} feed synced from fallback data`,
      link: regionConfig.url,
      image: '',
      source: regionConfig.url,
      sourceName: regionConfig.name,
      fetchedAt: new Date().toISOString(),
    };
  }
}

export async function scrapeGlobalRegions() {
  const items = [];

  for (const source of REGION_SOURCES) {
    items.push(await scrapeRegion(source));
  }

  return items.length ? items : buildFallbackItems();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeGlobalRegions().then((items) => {
    console.log(JSON.stringify(items, null, 2));
  });
}
