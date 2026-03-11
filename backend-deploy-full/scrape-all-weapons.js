/**
 * scrape-all-weapons.js
 * Comprehensive CrossFire Wiki Weapon Scraper
 * Scrapes ALL weapons from crossfirefps.fandom.com (3900+ weapons)
 * Extracts weapon names and image URLs
 * 
 * Run: node scrape-all-weapons.js
 */
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const BASE_URL = "https://crossfirefps.fandom.com";
const CATEGORY_WEAPONS_URL = `${BASE_URL}/wiki/Category:Weapons`;
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/USER/REPO/main/weapons/";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const allWeapons = [];
const processedPages = new Set();

const WEAPON_SET_PAGES = [
  "/wiki/Noble_Gold_WS",
  "/wiki/Weapon_Sets/VVIP",
  "/wiki/Weapon_Sets/Casual",
  "/wiki/Weapon_Sets/ZM_Rewards",
  "/wiki/Born_Beast_WS",
  "/wiki/Infernal_Dragon_WS",
  "/wiki/Iron_Beast_WS",
  "/wiki/Prism_Beast_WS",
  "/wiki/Transformers_WS",
  "/wiki/Jewelry_WS",
  "/wiki/5th_Anniversary_WS",
  "/wiki/10th_Anniversary_WS",
  "/wiki/Black_Gold_WS",
  "/wiki/Blue_Diamond_WS",
  "/wiki/Camo_WS",
  "/wiki/Carbon_WS",
  "/wiki/Dragon_WS",
  "/wiki/Halloween_WS",
  "/wiki/Gold_WS",
  "/wiki/Silver_WS",
  "/wiki/Neon_WS",
  "/wiki/Fury_Beast_WS",
  "/wiki/Armoured_Beast_WS",
  "/wiki/Born_Beast_2_WS",
  "/wiki/Dominator_WS",
  "/wiki/G_Spirit_WS",
  "/wiki/Reactive_Armour_WS",
  "/wiki/Sky_God_WS",
  "/wiki/Transformers_2_WS",
  "/wiki/Valor_Beast_WS",
  "/wiki/Cloud_Dragon_WS",
  "/wiki/Gaming_Glory_WS",
  "/wiki/Black_Panther_WS",
  "/wiki/Xmas_WS",
  "/wiki/Solar_Wolf_WS",
];

const WEAPON_CATEGORIES = [
  "Assault Rifle",
  "Sniper Rifle", 
  "SMG",
  "Machine Gun",
  "Shotgun",
  "Pistol",
  "Melee",
  "Grenade",
  "Special",
  "Rifle"
];

function cleanImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("data:")) return null;
  let cleanUrl = url.split("/revision/")[0];
  cleanUrl = cleanUrl.replace("/scale-to-width-down/", "/").replace(/\/\d+\?/, "?");
  if (cleanUrl.includes("static.wikia.nocookie.net")) {
    return cleanUrl;
  }
  return url;
}

function extractWeaponName(text) {
  if (!text) return null;
  let name = text.trim();
  name = name.replace(/\s*\([^)]*KB\)/gi, "");
  name = name.replace(/\s*\([^)]*bytes\)/gi, "");
  name = name.replace(/\.png$/i, "").replace(/\.jpg$/i, "").replace(/\.jpeg$/i, "");
  name = name.replace(/^(BI_|BUYWEAPON_INFO_|BIGITEMICON_)/i, "");
  name = name.replace(/_/g, " ").replace(/-/g, "-");
  return name.trim();
}

function categorizeWeapon(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("m4a1") || lowerName.includes("ak47") || lowerName.includes("ak-47") || 
      lowerName.includes("m16") || lowerName.includes("scar") || lowerName.includes("famas") ||
      lowerName.includes("aug") || lowerName.includes("g36") || lowerName.includes("qbz") ||
      lowerName.includes("an94") || lowerName.includes("hk417") || lowerName.includes("ak12") ||
      lowerName.includes("galil") || lowerName.includes("tar") || lowerName.includes("xm8")) {
    return "Assault Rifle";
  }
  if (lowerName.includes("awm") || lowerName.includes("m200") || lowerName.includes("cheytac") ||
      lowerName.includes("barrett") || lowerName.includes("m82") || lowerName.includes("kar98") ||
      lowerName.includes("dragunov") || lowerName.includes("msg90") || lowerName.includes("psg") ||
      lowerName.includes("dsr") || lowerName.includes("m14 ebr") || lowerName.includes("m14-ebr")) {
    return "Sniper Rifle";
  }
  if (lowerName.includes("p90") || lowerName.includes("mp5") || lowerName.includes("mp7") ||
      lowerName.includes("ump") || lowerName.includes("kriss") || lowerName.includes("uzi") ||
      lowerName.includes("tmp") || lowerName.includes("smg") || lowerName.includes("thompson")) {
    return "SMG";
  }
  if (lowerName.includes("m249") || lowerName.includes("m60") || lowerName.includes("rpk") ||
      lowerName.includes("gatling") || lowerName.includes("minigun") || lowerName.includes("mg3") ||
      lowerName.includes("m240") || lowerName.includes("negev") || lowerName.includes("lmg")) {
    return "Machine Gun";
  }
  if (lowerName.includes("shotgun") || lowerName.includes("spas") || lowerName.includes("aa-12") ||
      lowerName.includes("remington") || lowerName.includes("benelli") || lowerName.includes("xm1014") ||
      lowerName.includes("687") || lowerName.includes("ks-23") || lowerName.includes("jackhammer")) {
    return "Shotgun";
  }
  if (lowerName.includes("desert eagle") || lowerName.includes("deagle") || lowerName.includes("glock") ||
      lowerName.includes("colt") || lowerName.includes("beretta") || lowerName.includes("mauser") ||
      lowerName.includes("m1911") || lowerName.includes("usp") || lowerName.includes("p226") ||
      lowerName.includes("raging bull") || lowerName.includes("anaconda") || lowerName.includes("pistol")) {
    return "Pistol";
  }
  if (lowerName.includes("knife") || lowerName.includes("axe") || lowerName.includes("sword") ||
      lowerName.includes("katana") || lowerName.includes("blade") || lowerName.includes("machete") ||
      lowerName.includes("hammer") || lowerName.includes("shovel") || lowerName.includes("bat")) {
    return "Melee";
  }
  if (lowerName.includes("grenade") || lowerName.includes("flash") || lowerName.includes("smoke") ||
      lowerName.includes("bomb") || lowerName.includes("molotov") || lowerName.includes("c4")) {
    return "Grenade";
  }
  return "Assault Rifle";
}

async function scrapeWeaponSetPage(pageUrl) {
  try {
    console.log(`Scraping weapon set: ${pageUrl}`);
    const response = await axios.get(`${BASE_URL}${pageUrl}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 30000,
    });
    const $ = cheerio.load(response.data);
    const weapons = [];

    $(".wikia-gallery-item, .gallery-item, .image-gallery-item").each((_, el) => {
      const $el = $(el);
      const img = $el.find("img").first();
      const link = $el.find("a").first();
      
      let name = link.attr("title") || link.text() || img.attr("alt");
      let imageUrl = img.attr("src") || img.attr("data-src");
      
      name = extractWeaponName(name);
      imageUrl = cleanImageUrl(imageUrl);
      
      if (name && imageUrl && !processedPages.has(name)) {
        processedPages.add(name);
        weapons.push({
          name,
          image: imageUrl,
          category: categorizeWeapon(name),
          description: `${name} weapon from CrossFire.`,
        });
      }
    });

    $("a.image").each((_, el) => {
      const $el = $(el);
      const img = $el.find("img");
      let name = $el.attr("title") || img.attr("alt");
      let imageUrl = img.attr("src") || img.attr("data-src");
      
      name = extractWeaponName(name);
      imageUrl = cleanImageUrl(imageUrl);
      
      if (name && imageUrl && !processedPages.has(name)) {
        processedPages.add(name);
        weapons.push({
          name,
          image: imageUrl,
          category: categorizeWeapon(name),
          description: `${name} weapon from CrossFire.`,
        });
      }
    });

    $("figure.thumb, .thumbinner").each((_, el) => {
      const $el = $(el);
      const img = $el.find("img").first();
      const caption = $el.find(".thumbcaption, figcaption").text();
      
      let name = caption || img.attr("alt") || img.attr("title");
      let imageUrl = img.attr("src") || img.attr("data-src");
      
      name = extractWeaponName(name);
      imageUrl = cleanImageUrl(imageUrl);
      
      if (name && imageUrl && name.length > 2 && !processedPages.has(name)) {
        processedPages.add(name);
        weapons.push({
          name,
          image: imageUrl,
          category: categorizeWeapon(name),
          description: `${name} weapon from CrossFire.`,
        });
      }
    });

    console.log(`  Found ${weapons.length} weapons on ${pageUrl}`);
    return weapons;
  } catch (error) {
    console.error(`Error scraping ${pageUrl}:`, error.message);
    return [];
  }
}

async function scrapeCategoryPage(url, pageNum = 1) {
  try {
    console.log(`Scraping category page ${pageNum}: ${url}`);
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 30000,
    });
    const $ = cheerio.load(response.data);
    const weapons = [];

    $(".category-page__member, .category-page__members a").each((_, el) => {
      const $el = $(el);
      const link = $el.is("a") ? $el : $el.find("a").first();
      const name = link.attr("title") || link.text();
      const href = link.attr("href");
      
      if (name && href && !href.includes("Category:") && !processedPages.has(name)) {
        const cleanName = extractWeaponName(name);
        if (cleanName && cleanName.length > 1) {
          processedPages.add(cleanName);
          weapons.push({
            name: cleanName,
            pageUrl: href,
            category: categorizeWeapon(cleanName),
          });
        }
      }
    });

    const nextPageLink = $(".category-page__pagination-next").attr("href") ||
                         $("a.category-page__pagination-next").attr("href") ||
                         $('a:contains("Next")').attr("href");

    console.log(`  Found ${weapons.length} weapon entries on page ${pageNum}`);
    
    return { weapons, nextPageUrl: nextPageLink };
  } catch (error) {
    console.error(`Error scraping category page:`, error.message);
    return { weapons: [], nextPageUrl: null };
  }
}

async function scrapeIndividualWeaponPage(pageUrl) {
  try {
    const response = await axios.get(`${BASE_URL}${pageUrl}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 15000,
    });
    const $ = cheerio.load(response.data);

    const infoboxImg = $(".pi-image img, .infobox img, .portable-infobox img").first();
    let imageUrl = infoboxImg.attr("src") || infoboxImg.attr("data-src");
    
    if (!imageUrl) {
      const firstContentImg = $(".mw-parser-output img").first();
      imageUrl = firstContentImg.attr("src") || firstContentImg.attr("data-src");
    }

    return cleanImageUrl(imageUrl);
  } catch (error) {
    return null;
  }
}

async function scrapeAllWeapons() {
  console.log("Starting comprehensive CrossFire Wiki weapon scraping...\n");

  console.log("=== Phase 1: Scraping Weapon Set Pages ===\n");
  for (const setPage of WEAPON_SET_PAGES) {
    const weapons = await scrapeWeaponSetPage(setPage);
    allWeapons.push(...weapons);
    await delay(500);
  }

  console.log(`\nTotal from weapon sets: ${allWeapons.length}\n`);

  console.log("=== Phase 2: Scraping Category:Weapons ===\n");
  let currentUrl = CATEGORY_WEAPONS_URL;
  let pageNum = 1;
  const categoryWeaponEntries = [];

  while (currentUrl && pageNum <= 100) {
    const { weapons, nextPageUrl } = await scrapeCategoryPage(currentUrl, pageNum);
    categoryWeaponEntries.push(...weapons);
    
    if (nextPageUrl) {
      currentUrl = nextPageUrl.startsWith("http") ? nextPageUrl : `${BASE_URL}${nextPageUrl}`;
      pageNum++;
      await delay(300);
    } else {
      break;
    }
  }

  console.log(`\nTotal category entries: ${categoryWeaponEntries.length}\n`);

  console.log("=== Phase 3: Fetching Individual Weapon Images ===\n");
  let fetchedCount = 0;
  const batchSize = 10;

  for (let i = 0; i < categoryWeaponEntries.length; i += batchSize) {
    const batch = categoryWeaponEntries.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (entry) => {
      if (entry.pageUrl && !allWeapons.find(w => w.name === entry.name)) {
        const imageUrl = await scrapeIndividualWeaponPage(entry.pageUrl);
        if (imageUrl) {
          allWeapons.push({
            name: entry.name,
            image: imageUrl,
            category: entry.category,
            description: `${entry.name} weapon from CrossFire.`,
          });
          fetchedCount++;
        }
      }
    }));

    if (i % 100 === 0) {
      console.log(`  Processed ${i + batchSize} / ${categoryWeaponEntries.length} entries...`);
    }
    
    await delay(200);
  }

  console.log(`\nFetched images for ${fetchedCount} additional weapons\n`);
  console.log(`\n=== TOTAL WEAPONS SCRAPED: ${allWeapons.length} ===\n`);

  return allWeapons;
}

function generateSeedFile(weapons) {
  const seedContent = `/**
 * weapons-scraped-seed.js
 * Auto-generated weapon seed data from CrossFire Wiki
 * Total weapons: ${weapons.length}
 * Generated: ${new Date().toISOString()}
 */

export const scrapedWeaponsData = [
${weapons.map((w, i) => `  {
    name: "${w.name.replace(/"/g, '\\"')}",
    image: "${w.image}",
    category: "${w.category}",
    description: "${w.description.replace(/"/g, '\\"')}",
    damage: ${30 + (i % 40)},
    recoil: ${5 + (i % 15)},
    rateOfFire: ${600 + (i % 300)},
    accuracy: ${65 + (i % 25)}
  }`).join(",\n")}
];

export default scrapedWeaponsData;
`;

  fs.writeFileSync("./weapons-scraped-seed.js", seedContent);
  console.log(`Generated weapons-scraped-seed.js with ${weapons.length} weapons`);

  const jsonData = JSON.stringify(weapons, null, 2);
  fs.writeFileSync("./weapons-scraped-data.json", jsonData);
  console.log(`Generated weapons-scraped-data.json`);
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║    CrossFire Wiki Comprehensive Weapon Scraper             ║");
  console.log("║    Scraping ALL weapons from crossfirefps.fandom.com       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const weapons = await scrapeAllWeapons();
  
  generateSeedFile(weapons);
  
  console.log("\n✅ Scraping complete!");
  console.log(`📊 Total unique weapons: ${weapons.length}`);
  console.log("📁 Output files:");
  console.log("   - weapons-scraped-seed.js (importable JS)");
  console.log("   - weapons-scraped-data.json (JSON data)");
}

main().catch(console.error);
