import axios from 'axios';
import * as cheerio from 'cheerio';

const SOURCES = [
  { name: 'west', url: 'https://www.z8games.com/news' },
  { name: 'china', url: 'https://cf.qq.com/' },
  { name: 'cfhd', url: 'https://cfhd.cf.qq.com/' },
  { name: 'vietnam', url: 'https://cf.vtcgame.vn/' },
  { name: 'brazil', url: 'https://crossfire.lat/' },
  { name: 'fandom', url: 'https://crossfire.fandom.com/wiki/CrossFire_Wiki' },
];

function buildFallbackItems() {
  return SOURCES.map((source) => ({
    region: source.name,
    title: `${source.name.toUpperCase()} feed ready`,
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

export async function scrapeGlobalRegions() {
  const items = [];

  for (const source of SOURCES) {
    try {
      const markdown = await scrapeWithFirecrawl(source.url);
      if (markdown) {
        const title = markdown.split(/\n+/).find((line) => line.trim()) || source.name;
        items.push({ region: source.name, title: title.replace(/^#+\s*/, '').slice(0, 100), link: source.url, image: '', source: source.url });
        continue;
      }

      const { data } = await axios.get(source.url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(data);
      const title = $('title').first().text().trim() || source.name;
      items.push({ region: source.name, title, link: source.url, image: '', source: source.url });
    } catch (error) {
      items.push({ region: source.name, title: `${source.name} feed synced from fallback data`, link: source.url, image: '', source: source.url });
    }
  }

  return items.length ? items : buildFallbackItems();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeGlobalRegions().then((items) => {
    console.log(JSON.stringify(items, null, 2));
  });
}
