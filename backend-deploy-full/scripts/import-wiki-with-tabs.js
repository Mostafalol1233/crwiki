import { PostModel } from '../shared/mongodb-schema.js';
import mongoose from 'mongoose';
import * as cheerio from 'cheerio';

const WIKI_API = 'https://crossfirefps.fandom.com/api.php';
const HEADERS = { 'User-Agent': 'Bimora-CFWiki/1.0 (crossfire wiki importer)' };

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getCategoryPages(category, limit = 15) {
  const url = `${WIKI_API}?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(category)}&cmlimit=${limit}&cmtype=page&format=json&origin=*`;
  const r = await fetch(url, { headers: HEADERS });
  const d = await r.json();
  return (d?.query?.categorymembers || []).map(p => p.title);
}

async function getImageUrl(filename) {
  if (!filename) return '';
  const url = `${WIKI_API}?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return '';
  const d = await r.json();
  return Object.values(d?.query?.pages || {})[0]?.imageinfo?.[0]?.url || '';
}

async function fetchPageWithTabs(title) {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(title)}&prop=text|images|displaytitle&disablelimitreport=1&disabletoc=1&format=json&origin=*`;
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.error) return null;

  const rawHtml = d?.parse?.text?.['*'] || '';
  const displayTitle = (d?.parse?.displaytitle || title).replace(/<[^>]+>/g, '');
  const allImages = d?.parse?.images || [];

  const $ = cheerio.load(rawHtml);

  $('script, .noprint, .mw-editsection, .reference, .reflist, sup.reference, .toc, #toc').remove();

  const tabs = [];
  const tabberEls = $('.tabber, .tabber__tab-strip, .portable-tabber');

  if (tabberEls.length > 0) {
    tabberEls.each((_, tabberEl) => {
      const tabEl = $(tabberEl);
      const tabItems = tabEl.find('.tabbertab, [data-tab-body], .wds-tab__content');
      if (tabItems.length > 0) {
        tabItems.each((_, tabItem) => {
          const $tab = $(tabItem);
          const tabTitle = $tab.attr('title') || $tab.find('.wds-tab__content-header').text().trim() || `Variant ${tabs.length + 1}`;
          const tabImg = $tab.find('img').first();
          const tabImgSrc = tabImg.attr('src') || tabImg.attr('data-src') || '';
          const tabContentHtml = $tab.html() || '';
          const tabContentText = $tab.text().replace(/\s+/g, ' ').trim();
          if (tabContentText.length > 10) {
            tabs.push({
              title: tabTitle,
              content: tabContentHtml.substring(0, 3000),
              image: tabImgSrc,
            });
          }
        });
      }
    });
    tabberEls.remove();
  }

  const mainHtml = $('.mw-parser-output').html() || '';
  const mainText = $('.mw-parser-output').text().replace(/\s+/g, ' ').trim();

  let mainImage = '';
  if (allImages[0]) {
    mainImage = await getImageUrl(allImages[0]);
    await delay(200);
  }

  for (const tab of tabs) {
    if (tab.image && !tab.image.startsWith('http')) {
      const filename = tab.image.split('/').pop()?.split('?')[0] || '';
      if (filename) {
        tab.image = await getImageUrl(decodeURIComponent(filename));
        await delay(200);
      }
    }
  }

  return {
    title: displayTitle,
    content: mainHtml.substring(0, 5000),
    summary: mainText.substring(0, 200),
    image: mainImage,
    wikiTabs: tabs,
  };
}

async function runImport() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const categories = [
    { cat: 'Weapons', postCat: 'Weapons', tags: ['weapon', 'crossfire'] },
    { cat: 'Maps', postCat: 'Maps', tags: ['map', 'crossfire'] },
    { cat: 'Game_modes', postCat: 'Modes', tags: ['mode', 'crossfire'] },
    { cat: 'Characters', postCat: 'Mercenaries', tags: ['character', 'crossfire'] },
    { cat: 'Events', postCat: 'Events', tags: ['event', 'crossfire'] },
  ];

  let totalImported = 0;
  let totalUpdated = 0;

  for (const { cat, postCat, tags } of categories) {
    const pages = await getCategoryPages(cat, 15);
    console.log(`\n📂 ${cat}: found ${pages.length} pages`);

    for (const title of pages) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const existing = await PostModel.findOne({ post_slug: slug }).lean();

      const page = await fetchPageWithTabs(title);
      if (!page || page.summary.length < 20) {
        console.log(`  ⏭ Skip (empty): ${title}`);
        await delay(300);
        continue;
      }

      const docData = {
        title: page.title,
        content: page.content,
        summary: page.summary,
        post_slug: slug,
        category: postCat,
        image: page.image || '',
        imageUrl: page.image || '',
        author: 'CrossFire Wiki',
        tags: ['wiki', ...tags],
        readingTime: Math.max(1, Math.ceil(page.summary.split(/\s+/).length / 50)),
        featured: false,
        previewOnHome: true,
        sourceUrl: '',
        wikiTabs: page.wikiTabs || [],
      };

      if (existing) {
        await PostModel.updateOne({ _id: existing._id }, { $set: { ...docData, updatedAt: new Date() } });
        console.log(`  🔄 Updated: ${page.title} (${page.wikiTabs.length} tabs)`);
        totalUpdated++;
      } else {
        await PostModel.create(docData);
        console.log(`  ✅ Imported: ${page.title} (${page.wikiTabs.length} tabs)`);
        totalImported++;
      }

      await delay(500);
    }
  }

  console.log(`\n✅ Done! Imported: ${totalImported}, Updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

runImport().catch(e => {
  console.error('Import failed:', e.message);
  process.exit(1);
});
