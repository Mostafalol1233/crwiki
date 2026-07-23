// Scrape Z8Games forum to find correct banner images for 3 events
const KEY = process.env.FIRECRAWL_API_KEY;
const BASE = 'https://api.firecrawl.dev/v1/scrape';

async function scrape(url) {
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['html'], onlyMainContent: false }),
  });
  const d = await r.json();
  return d?.data?.html || '';
}

function extractImgs(html) {
  return [...html.matchAll(/https?:\/\/[^\s"'<>]+(?:jpg|jpeg|png|webp)/gi)]
    .map(m => m[0])
    .filter(u => u.includes('akamaized') || u.includes('z8games') || u.includes('cloudfront'))
    .filter(u => !u.includes('icon') && !u.includes('logo') && !u.includes('avatar'))
    .filter((v, i, a) => a.indexOf(v) === i);
}

console.log('Scraping Z8Games forum announcements...');
const html = await scrape('https://forum.z8games.com/categories/crossfire-announcements');

// Find post links
const postLinks = [...html.matchAll(/href="(\/discussion\/\d+[^"]*)"/gi)]
  .map(m => 'https://forum.z8games.com' + m[1])
  .filter((v, i, a) => a.indexOf(v) === i)
  .slice(0, 30);

console.log('Forum post links found:', postLinks.length);

// Extract images from forum page
const pageImgs = extractImgs(html);
console.log('Images on forum page:', pageImgs);

// Search for specific posts related to CFOL and Ranked Season
const keywords = { cfol: [], ranked: [], seamasters: [] };

for (const link of postLinks) {
  const postHtml = await scrape(link);
  const title = (postHtml.match(/<title>([^<]+)/i)?.[1] || '').toLowerCase();
  console.log('Post:', title.slice(0, 80), link);
  
  if (/cfol|online league|qualif/i.test(title)) {
    keywords.cfol.push({ link, imgs: extractImgs(postHtml) });
    console.log('  -> CFOL images:', extractImgs(postHtml));
  }
  if (/ranked|map pool|season.*map|map.*season/i.test(title)) {
    keywords.ranked.push({ link, imgs: extractImgs(postHtml) });
    console.log('  -> RANKED images:', extractImgs(postHtml));
  }
  if (/sea masters|seamasters|cf stars.*sea|sea.*cf stars/i.test(title)) {
    keywords.seamasters.push({ link, imgs: extractImgs(postHtml) });
    console.log('  -> SEA MASTERS images:', extractImgs(postHtml));
  }
}

console.log('\nFINAL RESULTS:', JSON.stringify(keywords, null, 2));
