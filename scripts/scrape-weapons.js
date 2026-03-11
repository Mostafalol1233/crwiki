import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_BASE = 'https://crossfirefps.fandom.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'attached_assets', 'scraped_weapons');
const DATA_FILE = path.join(__dirname, '..', 'attached_assets', 'weapons_data.json');

const WEAPON_CATEGORIES = [
  { name: 'Assault Rifles', url: '/wiki/Category:Assault_Rifles' },
  { name: 'SMG', url: '/wiki/SMG' },
  { name: 'Sniper Rifles', url: '/wiki/Sniper_Rifle' },
  { name: 'Machine Guns', url: '/wiki/Machine_Gun' },
  { name: 'Shotguns', url: '/wiki/Shotgun' },
  { name: 'Pistols', url: '/wiki/Handgun' },
];

const SPECIFIC_WEAPONS = [
  { name: 'AK47', url: '/wiki/AK47', category: 'Assault Rifles' },
  { name: 'M4A1', url: '/wiki/M4A1', category: 'Assault Rifles' },
  { name: 'AWM', url: '/wiki/AWM', category: 'Sniper Rifles' },
  { name: 'Barrett M82A1', url: '/wiki/Barrett_M82A1', category: 'Sniper Rifles' },
  { name: 'Desert Eagle', url: '/wiki/Desert_Eagle', category: 'Pistols' },
  { name: 'P90', url: '/wiki/P90', category: 'SMG' },
  { name: 'M16', url: '/wiki/M16', category: 'Assault Rifles' },
  { name: 'AK74', url: '/wiki/AK74', category: 'Assault Rifles' },
  { name: 'M700', url: '/wiki/M700', category: 'Sniper Rifles' },
  { name: 'Glock-18', url: '/wiki/Glock-18', category: 'Pistols' },
  { name: 'USP', url: '/wiki/USP', category: 'Pistols' },
  { name: 'M249 Minimi', url: '/wiki/M249_Minimi', category: 'Machine Guns' },
  { name: 'XM1014', url: '/wiki/XM1014', category: 'Shotguns' },
  { name: 'SPAS-12', url: '/wiki/SPAS-12', category: 'Shotguns' },
  { name: 'MP5', url: '/wiki/MP5', category: 'SMG' },
  { name: 'UMP-45', url: '/wiki/UMP-45', category: 'SMG' },
  { name: 'Thompson', url: '/wiki/Thompson', category: 'SMG' },
  { name: 'Kriss Super V', url: '/wiki/Kriss_Super_V', category: 'SMG' },
  { name: 'Steyr AUG A1', url: '/wiki/Steyr_AUG_A1', category: 'Assault Rifles' },
  { name: 'FAMAS', url: '/wiki/FAMAS', category: 'Assault Rifles' },
  { name: 'G36K', url: '/wiki/G36K', category: 'Assault Rifles' },
  { name: 'SG552', url: '/wiki/SG552', category: 'Assault Rifles' },
  { name: 'SCAR Light', url: '/wiki/SCAR_Light', category: 'Assault Rifles' },
  { name: 'SCAR Heavy', url: '/wiki/SCAR_Heavy', category: 'Assault Rifles' },
  { name: 'Dragunov', url: '/wiki/Dragunov', category: 'Sniper Rifles' },
  { name: 'M14 EBR', url: '/wiki/M14_EBR', category: 'Assault Rifles' },
  { name: 'AN94', url: '/wiki/AN94', category: 'Assault Rifles' },
  { name: 'FN F2000', url: '/wiki/FN_F2000', category: 'Assault Rifles' },
  { name: 'TAR21', url: '/wiki/TAR21', category: 'Assault Rifles' },
  { name: 'QBZ-95', url: '/wiki/QBZ-95', category: 'Assault Rifles' },
  { name: 'QBZ-03', url: '/wiki/QBZ-03', category: 'Assault Rifles' },
  { name: 'Galil ACE', url: '/wiki/Galil_ACE', category: 'Assault Rifles' },
  { name: 'HK416C', url: '/wiki/HK416C', category: 'Assault Rifles' },
  { name: '9A-91', url: '/wiki/9A-91', category: 'Assault Rifles' },
  { name: 'AS Val', url: '/wiki/AS_Val', category: 'Assault Rifles' },
  { name: 'AK12', url: '/wiki/AK12', category: 'Assault Rifles' },
  { name: 'Colt Python', url: '/wiki/Colt_Python', category: 'Pistols' },
  { name: 'Ruger Bisley', url: '/wiki/Ruger_Bisley', category: 'Pistols' },
  { name: 'Beretta M9', url: '/wiki/M9', category: 'Pistols' },
  { name: 'Colt 1911', url: '/wiki/Colt_1911', category: 'Pistols' },
  { name: 'M60', url: '/wiki/M60', category: 'Machine Guns' },
  { name: 'RPK', url: '/wiki/RPK', category: 'Machine Guns' },
  { name: 'MG3', url: '/wiki/MG3', category: 'Machine Guns' },
  { name: 'AA-12', url: '/wiki/AA-12', category: 'Shotguns' },
  { name: 'Jackhammer', url: '/wiki/Jackhammer', category: 'Shotguns' },
  { name: 'Winchester', url: '/wiki/Winchester', category: 'Rifles' },
  { name: 'Uzi', url: '/wiki/Uzi', category: 'SMG' },
  { name: 'Dual Uzi', url: '/wiki/Dual_Uzi', category: 'SMG' },
  { name: 'PP-19 Bizon', url: '/wiki/PP-19_Bizon', category: 'SMG' },
  { name: 'Scorpion EVO3A1', url: '/wiki/Scorpion_EVO3A1', category: 'SMG' },
  { name: 'K1A', url: '/wiki/K1A', category: 'SMG' },
  { name: 'MAC-10', url: '/wiki/MAC-10', category: 'SMG' },
  { name: 'M200 Cheytac', url: '/wiki/M200', category: 'Sniper Rifles' },
  { name: 'DSR-1', url: '/wiki/DSR-1', category: 'Sniper Rifles' },
  { name: 'TRG-21', url: '/wiki/TRG-21', category: 'Sniper Rifles' },
  { name: 'L96A1', url: '/wiki/L96A1', category: 'Sniper Rifles' },
  { name: 'VSK-94', url: '/wiki/VSK-94', category: 'Sniper Rifles' },
  { name: 'MSG-90', url: '/wiki/MSG-90', category: 'Sniper Rifles' },
  { name: 'FR-F2', url: '/wiki/FR-F2', category: 'Sniper Rifles' },
  { name: 'PSG-1', url: '/wiki/PSG-1', category: 'Sniper Rifles' },
  { name: 'SL8', url: '/wiki/SL8', category: 'Sniper Rifles' },
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message);
    return null;
  }
}

async function downloadImage(imageUrl, filename) {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to download image: ${imageUrl}`);
      return null;
    }
    
    const buffer = await response.buffer();
    const ext = imageUrl.toLowerCase().includes('.png') ? '.png' : '.jpg';
    const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const outputPath = path.join(OUTPUT_DIR, `${safeName}${ext}`);
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`Downloaded: ${safeName}${ext}`);
    return outputPath;
  } catch (err) {
    console.error(`Image download failed for ${filename}:`, err.message);
    return null;
  }
}

async function scrapeWeaponPage(weaponInfo) {
  const url = WIKI_BASE + weaponInfo.url;
  console.log(`Scraping: ${weaponInfo.name} from ${url}`);
  
  const html = await fetchPage(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  let imageUrl = null;
  let description = '';
  
  const infoboxImg = $('aside.portable-infobox img').first();
  if (infoboxImg.length) {
    imageUrl = infoboxImg.attr('src') || infoboxImg.attr('data-src');
  }
  
  if (!imageUrl) {
    const mainImg = $('figure.pi-image img, .image img, .thumb img').first();
    if (mainImg.length) {
      imageUrl = mainImg.attr('src') || mainImg.attr('data-src');
    }
  }
  
  if (!imageUrl) {
    const anyImg = $('img[src*="static.wikia.nocookie.net"]').first();
    if (anyImg.length) {
      imageUrl = anyImg.attr('src');
    }
  }
  
  if (imageUrl) {
    imageUrl = imageUrl.split('/revision/')[0];
    if (!imageUrl.startsWith('http')) {
      imageUrl = 'https:' + imageUrl;
    }
  }
  
  const firstParagraph = $('#mw-content-text p').first();
  if (firstParagraph.length) {
    description = firstParagraph.text().trim().substring(0, 500);
  }
  
  return {
    name: weaponInfo.name,
    category: weaponInfo.category,
    wikiUrl: url,
    imageUrl: imageUrl,
    description: description
  };
}

async function main() {
  console.log('Starting CrossFire Wiki Weapon Scraper...');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const weapons = [];
  const failedWeapons = [];
  
  for (const weapon of SPECIFIC_WEAPONS) {
    try {
      const data = await scrapeWeaponPage(weapon);
      if (data && data.imageUrl) {
        const localPath = await downloadImage(data.imageUrl, data.name);
        if (localPath) {
          data.localImagePath = localPath;
          data.image = `/attached_assets/scraped_weapons/${path.basename(localPath)}`;
        }
        weapons.push(data);
      } else if (data) {
        weapons.push(data);
        console.warn(`No image found for: ${weapon.name}`);
      } else {
        failedWeapons.push(weapon.name);
      }
      await delay(500);
    } catch (err) {
      console.error(`Error scraping ${weapon.name}:`, err.message);
      failedWeapons.push(weapon.name);
    }
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    scrapedAt: new Date().toISOString(),
    totalWeapons: weapons.length,
    failed: failedWeapons.length,
    weapons: weapons,
    failedWeapons: failedWeapons
  }, null, 2));
  
  console.log('\n=== Scraping Complete ===');
  console.log(`Total weapons scraped: ${weapons.length}`);
  console.log(`Failed: ${failedWeapons.length}`);
  console.log(`Data saved to: ${DATA_FILE}`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
  
  return weapons;
}

main().catch(console.error);
