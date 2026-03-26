import mongoose from 'mongoose';
import dotenv from 'dotenv/config';

const WIKI_API = 'https://crossfirefps.fandom.com/api.php';

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  summary: String,
  category: String,
  image: String,
  author: String,
  source: String,
  slug: String,
  tags: [String],
  featured: Boolean,
  previewOnHome: Boolean,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

let PostModel;
try {
  PostModel = mongoose.model('Post');
} catch {
  PostModel = mongoose.model('Post', postSchema);
}

async function fetchWikiPage(title) {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', title);
  url.searchParams.set('prop', 'revisions|pageimages');
  url.searchParams.set('rvprop', 'content');
  url.searchParams.set('rvslots', 'main');
  url.searchParams.set('pithumbsize', '500');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url.toString());
  const data = await res.json();
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;

  const content = page?.revisions?.[0]?.slots?.main?.['*'] || '';
  const image = page?.thumbnail?.source || '';
  return { title: page.title, content, image, pageId: page.pageid };
}

async function fetchCategoryMembers(category, limit = 30) {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'categorymembers');
  url.searchParams.set('cmtitle', `Category:${category}`);
  url.searchParams.set('cmlimit', String(limit));
  url.searchParams.set('cmtype', 'page');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url.toString());
  const data = await res.json();
  return (data?.query?.categorymembers || []).map(m => m.title);
}

function cleanWikiMarkup(text) {
  if (!text) return '';
  return text
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/[^\s\]]*(?:\s+([^\]]*))?\]/g, '$1')
    .replace(/={2,6}([^=]+)={2,6}/g, '\n$1\n')
    .replace(/<ref[^>]*>.*?<\/ref>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/'{2,3}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function extractSummary(content, maxLength = 200) {
  const cleaned = cleanWikiMarkup(content);
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 2).join('. ').trim();
  return summary.length > maxLength ? summary.substring(0, maxLength) + '...' : summary;
}

async function importCategory(category, postCategory, tags = []) {
  console.log(`\nFetching category: ${category}...`);
  const titles = await fetchCategoryMembers(category, 25);
  console.log(`Found ${titles.length} articles in ${category}`);

  let imported = 0;
  let skipped = 0;

  for (const title of titles) {
    try {
      const slug = makeSlug(title);
      const existing = await PostModel.findOne({ slug }).lean();
      if (existing) {
        skipped++;
        continue;
      }

      const page = await fetchWikiPage(title);
      if (!page) { skipped++; continue; }

      const cleanContent = cleanWikiMarkup(page.content);
      if (cleanContent.length < 100) { skipped++; continue; }

      const summary = extractSummary(page.content);

      await PostModel.create({
        title: page.title,
        content: cleanContent,
        summary: summary || `${page.title} - CrossFire Wiki article`,
        category: postCategory,
        image: page.image || '',
        author: 'CrossFire Wiki',
        source: `https://crossfirefps.fandom.com/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
        slug,
        tags: [postCategory.toLowerCase(), ...tags, 'wiki', 'crossfire'],
        featured: false,
        previewOnHome: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      imported++;
      console.log(`  ✅ Imported: ${page.title}`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`  ⚠️ Failed: ${title} - ${err.message}`);
    }
  }

  console.log(`Category ${category}: ${imported} imported, ${skipped} skipped`);
  return imported;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!\n');

  let total = 0;

  const categories = [
    { wiki: 'Weapons', post: 'Weapons', tags: ['gun', 'weapon', 'arsenal'] },
    { wiki: 'Rifles', post: 'Weapons', tags: ['rifle', 'assault'] },
    { wiki: 'Sniper_rifles', post: 'Weapons', tags: ['sniper', 'long-range'] },
    { wiki: 'Pistols', post: 'Weapons', tags: ['pistol', 'sidearm'] },
    { wiki: 'Maps', post: 'Maps', tags: ['map', 'battlefield'] },
    { wiki: 'Game_modes', post: 'Modes', tags: ['mode', 'gameplay'] },
    { wiki: 'Characters', post: 'Mercenaries', tags: ['character', 'mercenary'] },
  ];

  for (const cat of categories) {
    try {
      const count = await importCategory(cat.wiki, cat.post, cat.tags);
      total += count;
    } catch (err) {
      console.warn(`Failed category ${cat.wiki}: ${err.message}`);
    }
  }

  console.log(`\n✅ Total imported: ${total} articles`);
  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
