/**
 * CrossFire Maps Scraper — Fandom API Version (ESM)
 * يستخدم MediaWiki API الرسمي بدل HTML scraping لتجنب الـ 403
 */

import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import path from "path";

const OUTPUT_FILE = "cf_maps_data.json";
const DOWNLOAD_DIR = "cf_maps_images";

// ─── Fandom API Base ───────────────────────────────────────────────────────
const FANDOM_API = "https://crossfirefps.fandom.com/api.php";
const FANDOM_CONTENT_API = "https://crossfirefps.fandom.com/api/v1";

const HEADERS = {
  "User-Agent":
    "CrossFireWikiBot/1.0 (educational project; contact: wiki@example.com)",
  Accept: "application/json",
};

// ─── Helper ────────────────────────────────────────────────────────────────

async function apiGet(url, params = {}) {
  try {
    const res = await axios.get(url, {
      params: { ...params, format: "json" },
      headers: HEADERS,
      timeout: 20000,
    });
    return res.data;
  } catch (err) {
    console.error(`❌ API Error: ${url}\n   ${err.message}`);
    return null;
  }
}

function cleanImageUrl(url) {
  if (!url) return null;
  // إزالة /revision/latest... للحصول على الصورة الأصلية بأعلى جودة
  return url.replace(/\/revision\/latest(\/scale-to-width-down\/\d+)?.*$/, "");
}

// ─── Step 1: جلب كل صفحات الـ Maps Category ──────────────────────────────

async function getCategoryMembers(category) {
  console.log(`\n📂 جلب صفحات الفئة: ${category}`);
  const pages = [];
  let cmcontinue = undefined;

  do {
    const data = await apiGet(FANDOM_API, {
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmlimit: 500,
      cmtype: "page",
      ...(cmcontinue ? { cmcontinue } : {}),
    });

    if (!data?.query?.categorymembers) break;

    for (const page of data.query.categorymembers) {
      pages.push({ pageid: page.pageid, title: page.title });
    }

    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);

  console.log(`   ✅ وجدنا ${pages.length} صفحة`);
  return pages;
}

// ─── Step 2: جلب الصورة الرئيسية لكل صفحة ────────────────────────────────

async function getPageImage(title) {
  const data = await apiGet(FANDOM_API, {
    action: "query",
    titles: title,
    prop: "pageimages|revisions",
    pithumbsize: 1000, // نطلب صورة كبيرة
    piprop: "thumbnail|original",
    rvprop: "content",
    rvslots: "main",
  });

  if (!data?.query?.pages) return null;

  const page = Object.values(data.query.pages)[0];

  const thumbnail = page?.thumbnail?.source
    ? cleanImageUrl(page.thumbnail.source)
    : null;
  const original = page?.original?.source
    ? cleanImageUrl(page.original.source)
    : null;

  return { thumbnail, original: original || thumbnail };
}

// ─── Entry Point ───────────────────────────────────────────────────────────

async function scrapeFandomMaps() {
  console.log("\n🚀 CrossFire Fandom API Scraper — بدء التشغيل");
  console.log("=".repeat(55));

  const categoriesToTry = ["Maps", "CrossFire_Maps", "Map", "Arenas", "Locations"];
  let allPages = [];

  for (const cat of categoriesToTry) {
    const pages = await getCategoryMembers(cat);
    if (pages.length > 0) {
      allPages = [...allPages, ...pages];
    }
  }

  if (allPages.length === 0) {
    console.log("\n🔄 محاولة بديلة: جلب الـ links من صفحة Maps مباشرة...");
    const data = await apiGet(FANDOM_API, {
      action: "query",
      titles: "Maps",
      prop: "links",
      pllimit: 500,
    });

    if (data?.query?.pages) {
      const page = Object.values(data.query.pages)[0];
      allPages = (page?.links || []).map((l) => ({
        pageid: null,
        title: l.title,
      }));
    }
  }

  const uniquePages = [
    ...new Map(allPages.map((p) => [p.title, p])).values(),
  ];

  console.log(`\n📊 إجمالي الصفحات: ${uniquePages.length}`);

  const maps = [];
  for (let i = 0; i < uniquePages.length; i++) {
    const { title, pageid } = uniquePages[i];
    process.stdout.write(
      `\r   جاري معالجة [${i + 1}/${uniquePages.length}]: ${title.substring(0, 40).padEnd(40)}`
    );

    const imgData = await getPageImage(title);
    if (!imgData?.original && !imgData?.thumbnail) continue;

    const wikiUrl = `https://crossfirefps.fandom.com/wiki/${encodeURIComponent(
      title.replace(/ /g, "_")
    )}`;

    maps.push({
      id: pageid,
      name: title,
      image_url: imgData.original || imgData.thumbnail,
      thumbnail_url: imgData.thumbnail,
      wiki_url: wikiUrl,
      description: "",
      source: "fandom_api",
      type: "map"
    });

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n\n✅ مابات مع صور: ${maps.length}`);
  return maps;
}

async function downloadImage(url, filepath) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "CrossFireWikiBot/1.0",
        Referer: "https://crossfirefps.fandom.com/",
      },
    });
    await fs.outputFile(filepath, res.data);
    return true;
  } catch (err) {
    return false;
  }
}

async function downloadAllImages(maps) {
  await fs.ensureDir(DOWNLOAD_DIR);
  console.log(`\n📥 تحميل الصور إلى مجلد "${DOWNLOAD_DIR}"...`);

  let success = 0;
  for (let i = 0; i < maps.length; i++) {
    const map = maps[i];
    if (!map.image_url) continue;

    let ext = ".jpg";
    try {
      const urlPath = new URL(map.image_url).pathname;
      const parsedExt = path.extname(urlPath);
      if (parsedExt) ext = parsedExt;
    } catch {}

    const safeName = map.name
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 80);

    const filename = path.join(DOWNLOAD_DIR, `${safeName}${ext}`);
    map.local_image = filename;

    process.stdout.write(`\r   [${i + 1}/${maps.length}] ${safeName.substring(0, 45).padEnd(45)}`);

    const ok = await downloadImage(map.image_url, filename);
    if (ok) success++;
    await new Promise((r) => setTimeout(r, 50));
  }
  console.log(`\n   ✅ نجح تحميل: ${success} صورة`);
}

async function scrapeOfficialModes() {
  console.log("\n🔍 جاري سحب بيانات المودات من الموقع الرسمي...");
  const html = await apiGet("https://crossfire.z8games.com/modes.html"); 
  if (!html || typeof html !== 'string') {
    console.log("⚠️ فشل جلب المودات من الموقع الرسمي، استخدام البيانات الاحتياطية...");
    return [
      { name: "Team Deathmatch", type: "mode", description: "Standard TDM", source: "fallback" },
      { name: "Search and Destroy", type: "mode", description: "Standard S&D", source: "fallback" },
      { name: "Ghost Mode", type: "mode", description: "Standard Ghost Mode", source: "fallback" },
      { name: "Zombie Mode", type: "mode", description: "Standard Zombie Mode", source: "fallback" }
    ];
  }

  const $ = cheerio.load(html);
  const modes = [];
  $('.mode_item, .mode-card, .mode_list li').each((_, el) => {
    const name = cleanText($(el).find('h2, h3, .name, .title, strong').first().text());
    if (name) {
      modes.push({
        name,
        type: "mode",
        description: cleanText($(el).find('p, .desc').first().text()),
        source: "official"
      });
    }
  });
  return modes;
}

async function main() {
  const maps = await scrapeFandomMaps();
  const modes = await scrapeOfficialModes();
  
  const allItems = [...maps, ...modes];

  if (allItems.length > 0) {
    await downloadAllImages(allItems);
  }

  const output = {
    scraped_at: new Date().toISOString(),
    total: allItems.length,
    items: allItems,
  };

  await fs.writeJson(OUTPUT_FILE, output, { spaces: 2 });
  console.log(`\n💾 تم الحفظ في: ${OUTPUT_FILE}`);
  console.log("✅ اكتمل!");
}

main().catch(console.error);
