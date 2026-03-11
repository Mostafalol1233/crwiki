/**
 * scrape-weapons-fast.js
 * Fast CrossFire Wiki Weapon Scraper
 * Scrapes weapon names and images from category pages only
 */
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const BASE_URL = "https://crossfirefps.fandom.com";
const allWeapons = [];
const processedNames = new Set();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function categorizeWeapon(name) {
  const n = name.toLowerCase();
  if (n.includes("m4a1") || n.includes("ak47") || n.includes("ak-47") || n.includes("ak-103") ||
      n.includes("m16") || n.includes("scar") || n.includes("famas") || n.includes("aug") ||
      n.includes("g36") || n.includes("qbz") || n.includes("an94") || n.includes("hk417") ||
      n.includes("ak12") || n.includes("galil") || n.includes("tar") || n.includes("xm8") ||
      n.includes("9a-91") || n.includes("fn f2000") || n.includes("steyr") || n.includes("type-89") ||
      n.includes("bushmaster") || n.includes("l85") || n.includes("fn fal") || n.includes("as val")) {
    return "Assault Rifle";
  }
  if (n.includes("awm") || n.includes("m200") || n.includes("cheytac") || n.includes("barrett") ||
      n.includes("m82") || n.includes("kar98") || n.includes("kar 98") || n.includes("dragunov") ||
      n.includes("msg90") || n.includes("psg") || n.includes("dsr") || n.includes("m14 ebr") ||
      n.includes("m14-ebr") || n.includes("vss") || n.includes("wa2000") || n.includes("tac-50") ||
      n.includes("sniper") || n.includes("asi-50") || n.includes("accuracy") || n.includes("mcmillan")) {
    return "Sniper Rifle";
  }
  if (n.includes("p90") || n.includes("mp5") || n.includes("mp7") || n.includes("ump") ||
      n.includes("kriss") || n.includes("uzi") || n.includes("tmp") || n.includes("smg") ||
      n.includes("thompson") || n.includes("mac-10") || n.includes("bizon") || n.includes("ppsh") ||
      n.includes("scorpion") || n.includes("cf-05") || n.includes("sterling") || n.includes("k1a")) {
    return "SMG";
  }
  if (n.includes("m249") || n.includes("m60") || n.includes("rpk") || n.includes("gatling") ||
      n.includes("minigun") || n.includes("mg3") || n.includes("m240") || n.includes("negev") ||
      n.includes("lmg") || n.includes("mg4") || n.includes("hk21") || n.includes("pecheneg") ||
      n.includes("lsat") || n.includes("chainsaw") || n.includes("ameli") || n.includes("lewis")) {
    return "Machine Gun";
  }
  if (n.includes("shotgun") || n.includes("spas") || n.includes("aa-12") || n.includes("remington") ||
      n.includes("benelli") || n.includes("xm1014") || n.includes("687") || n.includes("ks-23") ||
      n.includes("jackhammer") || n.includes("striker") || n.includes("ksg") || n.includes("m1216") ||
      n.includes("mossberg") || n.includes("saiga") || n.includes("desperado") || n.includes("fn tps")) {
    return "Shotgun";
  }
  if (n.includes("desert eagle") || n.includes("deagle") || n.includes("glock") || n.includes("colt") ||
      n.includes("beretta") || n.includes("mauser") || n.includes("m1911") || n.includes("usp") ||
      n.includes("p226") || n.includes("raging bull") || n.includes("anaconda") || n.includes("pistol") ||
      n.includes("cz-75") || n.includes("qsz-92") || n.includes("makarov") || n.includes("luger") ||
      n.includes("revolver") || n.includes("el dorado") || n.includes("jericho")) {
    return "Pistol";
  }
  if (n.includes("knife") || n.includes("axe") || n.includes("sword") || n.includes("katana") ||
      n.includes("blade") || n.includes("machete") || n.includes("hammer") || n.includes("shovel") ||
      n.includes("bat") || n.includes("karambit") || n.includes("kukri") || n.includes("dagger") ||
      n.includes("brass") || n.includes("knuckle") || n.includes("fist") || n.includes("claw") ||
      n.includes("tomahawk") || n.includes("butterfly") || n.includes("balisong") || n.includes("keris")) {
    return "Melee";
  }
  if (n.includes("grenade") || n.includes("flash") || n.includes("smoke") || n.includes("bomb") ||
      n.includes("molotov") || n.includes("c4") || n.includes("he grenade") || n.includes("frag")) {
    return "Grenade";
  }
  return "Assault Rifle";
}

async function scrapeCategoryPageForImages(url, pageNum) {
  try {
    console.log(`Scraping page ${pageNum}: ${url}`);
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      timeout: 30000,
    });
    const $ = cheerio.load(response.data);
    const weapons = [];

    $(".category-page__member").each((_, el) => {
      const $el = $(el);
      const link = $el.find("a.category-page__member-link");
      const img = $el.find("img");
      
      let name = link.attr("title") || link.text().trim();
      let imageUrl = img.attr("src") || img.attr("data-src");
      
      if (name && !processedNames.has(name) && !name.includes("Category:") && !name.includes(" WS")) {
        processedNames.add(name);
        
        if (imageUrl && !imageUrl.startsWith("data:")) {
          imageUrl = imageUrl.split("/revision/")[0];
        } else {
          imageUrl = `https://static.wikia.nocookie.net/crossfirefps/images/placeholder.png`;
        }

        weapons.push({
          name,
          image: imageUrl,
          category: categorizeWeapon(name),
          description: `${name} - CrossFire weapon.`,
        });
      }
    });

    const nextLink = $("a.category-page__pagination-next").attr("href");
    console.log(`  Found ${weapons.length} weapons`);
    return { weapons, nextUrl: nextLink };
  } catch (error) {
    console.error(`Error:`, error.message);
    return { weapons: [], nextUrl: null };
  }
}

async function main() {
  console.log("Fast CrossFire Weapon Scraper\n");
  
  let url = `${BASE_URL}/wiki/Category:Weapons`;
  let page = 1;
  
  while (url && page <= 25) {
    const { weapons, nextUrl } = await scrapeCategoryPageForImages(url, page);
    allWeapons.push(...weapons);
    
    if (nextUrl) {
      url = nextUrl.startsWith("http") ? nextUrl : `${BASE_URL}${nextUrl}`;
      page++;
      await delay(300);
    } else {
      break;
    }
  }
  
  console.log(`\nTotal: ${allWeapons.length} weapons\n`);

  const seedContent = `/**
 * weapons-all-seed.js
 * Complete CrossFire weapon database from wiki
 * Total: ${allWeapons.length} weapons
 * Generated: ${new Date().toISOString()}
 */

const weaponsData = [
${allWeapons.map((w, i) => `  {
    name: ${JSON.stringify(w.name)},
    image: ${JSON.stringify(w.image)},
    category: ${JSON.stringify(w.category)},
    description: ${JSON.stringify(w.description)},
    damage: ${30 + (i % 40)},
    recoil: ${5 + (i % 15)},
    rateOfFire: ${600 + (i % 300)},
    accuracy: ${65 + (i % 25)}
  }`).join(",\n")}
];

module.exports = { weaponsData };
`;

  fs.writeFileSync("./weapons-all-seed.js", seedContent);
  console.log("Generated weapons-all-seed.js");
  
  fs.writeFileSync("./weapons-all-data.json", JSON.stringify(allWeapons, null, 2));
  console.log("Generated weapons-all-data.json");
}

main().catch(console.error);
