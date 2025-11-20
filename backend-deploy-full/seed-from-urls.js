/**
 * seed-from-urls.js
 * Seeds weapons, modes, ranks, mercenaries, and EVENTS directly into MongoDB
 * Scrapes announcements from forum.z8games.com and creates events
 * Uses actual full URLs - NOT template variables
 * No API required - writes directly to MongoDB
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Schema } from "mongoose";
import axios from "axios";
import * as cheerio from "cheerio";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crossfire-wiki";
const FORUM_BASE_URL = "https://forum.z8games.com";
const ANNOUNCEMENTS_URL = `${FORUM_BASE_URL}/categories/crossfire-announcements`;

// MERCENARIES - 10 unique mercenary characters with CATBOX URLS AND AUDIO
const mercenariesData = [
  {
    id: "1",
    name: "Wolf",
    image: "https://files.catbox.moe/6npa73.jpeg",
    role: "Assault",
    description: "Aggressive assault specialist with high damage output and tactical expertise in close combat situations.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/wolf-line1.mp3", "/merc-mp3/wolf-line2.mp3", "/merc-mp3/wolf-line3.mp3"],
    stats: { health: 85, speed: 70, attack: 90, defense: 75 }
  },
  {
    id: "2",
    name: "Vipers",
    image: "https://files.catbox.moe/4il6hi.jpeg",
    role: "Sniper",
    description: "Precision sniper expert capable of eliminating targets from extreme distances with deadly accuracy.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/vipers-line1.mp3", "/merc-mp3/vipers-line2.mp3"],
    stats: { health: 65, speed: 60, attack: 95, defense: 50 }
  },
  {
    id: "3",
    name: "Sisterhood",
    image: "https://files.catbox.moe/3o58nb.jpeg",
    role: "Medic",
    description: "Support and healing specialist ensuring team survival through medical expertise and tactical support.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/sisterhood-line1.mp3"],
    stats: { health: 75, speed: 75, attack: 60, defense: 70 }
  },
  {
    id: "4",
    name: "Black Mamba",
    image: "https://files.catbox.moe/r26ox6.jpeg",
    role: "Scout",
    description: "Fast reconnaissance scout with exceptional mobility and intelligence gathering capabilities.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/blackmamba-line1.mp3", "/merc-mp3/blackmamba-line2.mp3"],
    stats: { health: 70, speed: 95, attack: 70, defense: 55 }
  },
  {
    id: "5",
    name: "Arch Honorary",
    image: "https://files.catbox.moe/ctwnqz.jpeg",
    role: "Guardian",
    description: "Protective guardian role specializing in defensive positions and area denial tactics.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/archhonorary-line1.mp3"],
    stats: { health: 90, speed: 55, attack: 65, defense: 95 }
  },
  {
    id: "6",
    name: "Desperado",
    image: "https://files.catbox.moe/hh7h5u.jpeg",
    role: "Engineer",
    description: "Technical engineer specialist skilled in equipment deployment and tactical modifications.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/desperado-line1.mp3", "/merc-mp3/desperado-line2.mp3"],
    stats: { health: 75, speed: 65, attack: 70, defense: 80 }
  },
  {
    id: "7",
    name: "Ronin",
    image: "https://files.catbox.moe/eck3jc.jpeg",
    role: "Samurai",
    description: "Melee combat warrior with exceptional close-quarters combat skills and honor-bound tactics.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/ronin-line1.mp3"],
    stats: { health: 80, speed: 80, attack: 85, defense: 70 }
  },
  {
    id: "8",
    name: "Dean",
    image: "https://files.catbox.moe/t78mvu.jpeg",
    role: "Specialist",
    description: "Specialized tactics expert with versatile skills adapted to any combat scenario.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/dean-line1.mp3", "/merc-mp3/dean-line2.mp3", "/merc-mp3/dean-line3.mp3"],
    stats: { health: 75, speed: 75, attack: 75, defense: 75 }
  },
  {
    id: "9",
    name: "Thoth",
    image: "https://files.catbox.moe/g4zfzn.jpeg",
    role: "Guardian",
    description: "Protective guardian with ancient wisdom and defensive mastery in battlefield control.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/thoth-line1.mp3"],
    stats: { health: 85, speed: 60, attack: 70, defense: 90 }
  },
  {
    id: "10",
    name: "SFG",
    image: "https://files.catbox.moe/3bba2g.jpeg",
    role: "Special Forces",
    description: "Special forces operative with elite training and multi-role combat capabilities.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/sfg-line1.mp3", "/merc-mp3/sfg-line2.mp3"],
    stats: { health: 80, speed: 85, attack: 85, defense: 75 }
  },
];

// WEAPONS - 28 with CATBOX URLS + STATS (damage, recoil, etc)
const weaponsData = [
  { name: "Weapon 1", description: "C4410", category: "Weapon", image: "https://files.catbox.moe/oshs66.png", damage: 45, recoil: 12, rateOfFire: 750, accuracy: 78 },
  { name: "Weapon 2", description: "C4742", category: "Weapon", image: "https://files.catbox.moe/y5xyvh.png", damage: 48, recoil: 14, rateOfFire: 720, accuracy: 75 },
  { name: "Weapon 3", description: "C4936", category: "Weapon", image: "https://files.catbox.moe/dikemy.png", damage: 42, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "Weapon 4", description: "C4953", category: "Weapon", image: "https://files.catbox.moe/m7ii5b.png", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "Weapon 5", description: "C5154", category: "Weapon", image: "https://files.catbox.moe/2hx3cf.png", damage: 40, recoil: 8, rateOfFire: 850, accuracy: 82 },
  { name: "Weapon 6", description: "C5155", category: "Weapon", image: "https://files.catbox.moe/5r592p.png", damage: 46, recoil: 11, rateOfFire: 760, accuracy: 76 },
  { name: "Weapon 7", description: "C5156", category: "Weapon", image: "https://files.catbox.moe/obytvu.png", damage: 44, recoil: 13, rateOfFire: 780, accuracy: 79 },
  { name: "Weapon 8", description: "C5157", category: "Weapon", image: "https://files.catbox.moe/0dp3c2.png", damage: 47, recoil: 12, rateOfFire: 740, accuracy: 77 },
  { name: "Weapon 9", description: "C5303", category: "Weapon", image: "https://files.catbox.moe/7mo6zg.png", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "Weapon 10", description: "C5362", category: "Weapon", image: "https://files.catbox.moe/5wvixf.png", damage: 43, recoil: 9, rateOfFire: 820, accuracy: 81 },
  { name: "Weapon 11", description: "C5390", category: "Weapon", image: "https://files.catbox.moe/nd0e8l.png", damage: 51, recoil: 16, rateOfFire: 680, accuracy: 70 },
  { name: "Weapon 12", description: "C5473", category: "Weapon", image: "https://files.catbox.moe/z4auy7.png", damage: 45, recoil: 12, rateOfFire: 750, accuracy: 78 },
  { name: "Weapon 13", description: "C6411", category: "Weapon", image: "https://files.catbox.moe/8qkl0a.png", damage: 48, recoil: 13, rateOfFire: 740, accuracy: 76 },
  { name: "Weapon 14", description: "C6547", category: "Weapon", image: "https://files.catbox.moe/4o20pn.png", damage: 46, recoil: 11, rateOfFire: 760, accuracy: 79 },
  { name: "Weapon 15", description: "C6777", category: "Weapon", image: "https://files.catbox.moe/bpa85i.png", damage: 44, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "Weapon 16", description: "C7325", category: "Weapon", image: "https://files.catbox.moe/mx62ji.png", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "Weapon 17", description: "C7411", category: "Weapon", image: "https://files.catbox.moe/g1ng1o.png", damage: 47, recoil: 12, rateOfFire: 740, accuracy: 77 },
  { name: "Weapon 18", description: "C8017", category: "Weapon", image: "https://files.catbox.moe/t02svh.png", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "Weapon 19", description: "C8020", category: "Weapon", image: "https://files.catbox.moe/vf910w.png", damage: 43, recoil: 9, rateOfFire: 820, accuracy: 81 },
  { name: "Weapon 20", description: "C8053", category: "Weapon", image: "https://files.catbox.moe/jfuae1.png", damage: 45, recoil: 11, rateOfFire: 770, accuracy: 78 },
  { name: "Weapon 21", description: "C8663", category: "Weapon", image: "https://files.catbox.moe/avqjsd.png", damage: 48, recoil: 13, rateOfFire: 750, accuracy: 76 },
  { name: "Weapon 22", description: "C8665", category: "Weapon", image: "https://files.catbox.moe/9yfkfq.png", damage: 51, recoil: 16, rateOfFire: 680, accuracy: 70 },
  { name: "Weapon 23", description: "C9288", category: "Weapon", image: "https://files.catbox.moe/irpla6.png", damage: 46, recoil: 12, rateOfFire: 760, accuracy: 79 },
  { name: "Weapon 24", description: "C9482", category: "Weapon", image: "https://files.catbox.moe/outzzz.png", damage: 44, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "Weapon 25", description: "cff-bg-social", category: "Weapon", image: "https://files.catbox.moe/2catwt.jpeg", damage: 47, recoil: 11, rateOfFire: 770, accuracy: 77 },
  { name: "Weapon 26", description: "cfw-weaponbg-vip", category: "Weapon", image: "https://files.catbox.moe/f3esjq.png", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "Weapon 27", description: "csp-bg-header2", category: "Weapon", image: "https://files.catbox.moe/j7z531.jpeg", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "Weapon 28", description: "placeholder-weapons", category: "Weapon", image: "https://files.catbox.moe/xb2ftb.png", damage: 42, recoil: 8, rateOfFire: 850, accuracy: 82 },
];

// MODES - Mix of Catbox (13) and full GitHub URLs
const modesData = [
  // Catbox URLs
  { name: "Peak Pursuit Roadmap", image: "https://files.catbox.moe/wof38b.jpeg" },
  { name: "Aim Master", image: "https://files.catbox.moe/3cl95i.jpeg" },
  { name: "Shooting Center", image: "https://files.catbox.moe/0d2mzr.jpeg" },
  { name: "Christmas Mode 1", image: "https://files.catbox.moe/btbm4t.jpeg" },
  { name: "Christmas Mode 2", image: "https://files.catbox.moe/l2tnc8.jpeg" },
  { name: "Christmas Mode 3", image: "https://files.catbox.moe/mew1fr.jpeg" },
  { name: "Christmas Mode 4", image: "https://files.catbox.moe/e6le8o.jpeg" },
  { name: "Christmas Mode 5", image: "https://files.catbox.moe/na316m.jpeg" },
  { name: "Free For All Farm", image: "https://files.catbox.moe/hb85yf.jpeg" },
  { name: "Ghost Mode Laboratory", image: "https://files.catbox.moe/emnzo0.jpeg" },
  { name: "Dance Party", image: "https://files.catbox.moe/wuo5c0.jpeg" },
  { name: "Sky Building", image: "https://files.catbox.moe/c6r7in.jpeg" },
  { name: "Desktop Event", image: "https://files.catbox.moe/hllowv.jpeg" },
  
  // Full GitHub URLs
  { name: "Team Deathmatch - Air Force One", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_AirForceOne_01.jpg.jpeg" },
  { name: "Team Deathmatch - Alley Market", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_AlleyMarket_01.jpg.jpeg" },
  { name: "Team Deathmatch - Aquarium", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Aquarium_01.jpg.jpeg" },
  { name: "Team Deathmatch - Arena", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Arena_01.jpg.jpeg" },
  { name: "Team Deathmatch - Bank", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Bank_01.jpg.jpeg" },
  { name: "Team Deathmatch - Bridge", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Bridge_01.jpg.jpeg" },
  { name: "Team Deathmatch - Cairo", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Cairo_01.jpg.jpeg" },
  { name: "Team Deathmatch - China Town", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_ChinaTown_01.jpg.jpeg" },
  { name: "Team Deathmatch - City", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_City_01.jpg.jpeg" },
  { name: "Team Deathmatch - Docks", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Docks_01.jpg.jpeg" },
  { name: "Team Deathmatch - Factory", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Factory_01.jpg.jpeg" },
  { name: "Team Deathmatch - Favela", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Favela_01.jpg.jpeg" },
  { name: "Team Deathmatch - Fortress", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Fortress_01.jpg.jpeg" },
  { name: "Team Deathmatch - Harbor", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Harbor_01.jpg.jpeg" },
  { name: "Team Deathmatch - Mexico", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Mexico_01.jpg.jpeg" },
  { name: "Team Deathmatch - Prison", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Prison_01.jpg.jpeg" },
  { name: "Team Deathmatch - Red Square", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_RedSquare_01.jpg.jpeg" },
  { name: "Team Deathmatch - Sewers", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Sewers_01.jpg.jpeg" },
  { name: "Team Deathmatch - Ship", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Ship_01.jpg.jpeg" },
  { name: "Team Deathmatch - Stadium", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Stadium_01.jpg.jpeg" },
  { name: "Team Deathmatch - Riverside", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Riverside_01.jpg.jpeg" },
  { name: "Team Deathmatch - Gallery", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Gallery_01.jpg.jpeg" },
  { name: "Team Deathmatch - Egypt", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Egypt_01.jpg.jpeg" },
  { name: "Mutation - Twisted Mansion", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/MHMX_TwistedMansion_01.jpg.jpeg" },
  { name: "Mutation - Void", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/MHMX_Void2_01.jpg.jpeg" },
  { name: "Mutation - Colony", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/MHX_Colony_01.jpg.jpeg" },
  { name: "Ghost Mode - Laboratory", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/GM_Laboratory_04.jpg.jpeg" },
  { name: "Bomb Mode - Ankara", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/SND_Ankara3_01.jpg.jpeg" },
  { name: "Bomb Mode - Central Station", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/SND_CentralStation01.jpg.jpeg" },
  { name: "Bomb Mode - Port", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/SND_Port2_01.jpg.jpeg" },
  { name: "Elimination - Shooting Center", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ELM_ShootingCenter01.jpg.jpeg" },
  { name: "Free For All - Farm", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/FFA_Farm.jpg.jpeg" },
  { name: "Zombie Mode - Metal Rage", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_MetalRage_01.jpg.jpeg" },
  { name: "Zombie Mode - Evil Den", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/ZM1_EvilDen_01.jpg.jpeg" },
  { name: "Aim Master Game", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/AIM_AimMaster_01.jpg.jpeg" },
];

// Scrape ranks directly from CF website (fallback to local assets when possible)
const CF_BASE_URL = "https://crossfire.z8games.com";

async function scrapeRanks() {
  try {
    const response = await axios.get(`${CF_BASE_URL}/ranks.html`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 45000,
      responseType: "text",
      validateStatus: (status) => status < 600,
    });

    if (!response.data || typeof response.data !== "string") {
      const retry = await axios.get(`${CF_BASE_URL}/ranks.html`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        timeout: 45000,
        responseType: "text",
        validateStatus: (status) => status < 600,
      });
      if (!retry.data || typeof retry.data !== "string") {
        throw new Error("Invalid response from server");
      }
      response.data = retry.data;
    }

    const $ = cheerio.load(response.data);
    const ranks = [];

    const bonusMap = {
      "Brigadier General 4": { exp: 8964562, bonus: "AK-47-K-Yellow Fractal 60 days" },
      "Brigadier General 6": { exp: 10016212, bonus: "30 x 7th Anniversary Crates" },
      "Major General 2": { exp: 11186422, bonus: "G-Yellow Crystal perm" },
      "Major General 5": { exp: 13174012, bonus: "10 Color Blaze Crates" },
      "Major General 6": { exp: 13900762, bonus: "Slaughter Ticket Box" },
      "Lieutenant General 3": { exp: 16281652, bonus: "M4A1-S-Yellow Fractal perm" },
      "Lieutenant General 6": { exp: 18975472, bonus: "RPK-Infernal Dragon 30 days" },
      "General 2": { exp: 20952802, bonus: "AK-47-K-Yellow Fractal perm" },
      "General 4": { exp: 23080612, bonus: "AWM-Infernal Dragon 30 days" },
      "General 6": { exp: 25363462, bonus: "AK-47 Fury 30 days" },
      "Grand Marshall": { exp: 100000000, bonus: "30 Free Crate Tickets" },
    };

    const extractExp = (text) => {
      const match = text.replace(/[,"\s]/g, "").match(/(\d{6,})/);
      return match ? Number(match[1]) : undefined;
    };

    const rankSelectors = [
      ".rank-item",
      ".rank",
      "[class*=\"rank\"]",
      ".item",
      "li",
      "div[class*=\"rank\"]",
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
      let name =
        $el
          .find("h3, h4, .name, .title, [class*=name], [class*=title]")
          .first()
          .text()
          .trim() || $el.text().trim().split("\n")[0].trim();
      if (!name || name.length < 2) {
        const alt = $el.find("img").first().attr("alt") || "";
        const titleAttr = $el.find("img").first().attr("title") || "";
        const linkText = $el.find("a").first().text().trim() || "";
        name = (alt || titleAttr || linkText || name).trim();
      }
      if (!name || name.length < 2) return;

      let imageUrl = "";
      const img = $el.find("img").first();
      if (img.length > 0) {
        imageUrl = img.attr("src") || img.attr("data-src") || img.attr("data-lazy-src") || "";
        if (imageUrl && !imageUrl.startsWith("http")) {
          imageUrl = imageUrl.startsWith("//") ? `https:${imageUrl}` : `${CF_BASE_URL}${imageUrl}`;
        }
      }

      const description = $el.find(".description, .desc, p, [class*=desc]").first().text().trim();
      const rawText = $el.text().trim();
      const exp = extractExp(rawText);
      const mapped = bonusMap[name] || undefined;
      const parts = [];
      const finalExp = typeof exp === "number" ? exp : mapped && mapped.exp;
      if (typeof finalExp === "number") parts.push(`EXP Required: ${finalExp}`);
      if (mapped && mapped.bonus) parts.push(`Bonus: ${mapped.bonus}`);

      ranks.push({
        name,
        image: imageUrl || "",
        description: description || "",
        requirements: parts.join(" | ") || "",
      });
    });

    if (ranks.length === 0) {
      $("img").each((index, img) => {
        const $img = $(img);
        const src = $img.attr("src") || $img.attr("data-src") || "";
        if (!src || src.includes("logo") || src.includes("icon") || src.includes("button")) return;
        const fullSrc = src.startsWith("http") ? src : src.startsWith("//") ? `https:${src}` : `${CF_BASE_URL}${src}`;
        const parent = $img.parent();
        const name =
          parent.find("h3, h4, .name, .title").first().text().trim() ||
          parent.text().trim().split("\n")[0].trim() ||
          ($img.attr("alt") || "");

        if (name && name.length > 2) {
          const mapped = bonusMap[name] || undefined;
          const parts = [];
          if (mapped && mapped.exp) parts.push(`EXP Required: ${mapped.exp}`);
          if (mapped && mapped.bonus) parts.push(`Bonus: ${mapped.bonus}`);
          ranks.push({ name, image: fullSrc, description: "", requirements: parts.join(" | ") || "" });
        }
      });
    }

    // Limit for safety; seeding will clear previous and insert whatever we scraped
    return ranks.slice(0, 50);
  } catch (err) {
    console.error("❌ Failed to scrape ranks:", err.message);
    // Fallback to local assets if scraping fails: generate a small default set
    const fallback = Array.from({ length: 12 }, (_, i) => {
      const idx = i + 1;
      return {
        name: `Rank ${idx}`,
        image: `/assets/ranks/rank_${idx}.jpg.jpeg`,
        description: "",
        requirements: "",
      };
    });
    return fallback;
  }
}

// EVENT SCRAPER - Fetches announcements from forum and converts to events
async function scrapeForumEvents() {
  try {
    console.log("🔍 Scraping announcements from forum.z8games.com...");
    const response = await axios.get(ANNOUNCEMENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const events = [];

    // Find all discussion links
    $('a[href*="/discussion/"]').slice(0, 10).each((i, link) => {
      const href = $(link).attr('href');
      const text = $(link).text().trim();
      
      if (text && href) {
        events.push({
          title: text.substring(0, 150),
          date: new Date().toISOString().split('T')[0],
          type: 'announcement',
          image: 'https://files.catbox.moe/wof38b.jpeg',
          description: `Crossfire: ${text}`
        });
      }
    });

    console.log(`✅ Scraped ${events.length} events from forum`);
    return events.length > 0 ? events : null;
  } catch (error) {
    console.warn("⚠️  Forum scraping failed:", error.message);
    return null;
  }
}

async function seedDatabase(options = {}) {
  const { closeConnection = false } = options;
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Define minimal schemas for seeding
    const MercenarySchema = new Schema({
      id: String,
      name: String,
      image: String,
      role: String,
      description: String,
      audioUrl: String,
      voiceLines: [String],
      stats: {
        health: Number,
        speed: Number,
        attack: Number,
        defense: Number,
      }
    }, { collection: 'mercenaries' });

    const WeaponSchema = new Schema({
      name: String,
      description: String,
      category: String,
      image: String,
      damage: Number,
      recoil: Number,
      rateOfFire: Number,
      accuracy: Number,
    }, { collection: 'weapons' });

    const ModeSchema = new Schema({
      name: String,
      image: String,
    }, { collection: 'modes' });

    const RankSchema = new Schema({
      name: String,
      image: String,
      description: String,
      requirements: String,
    }, { collection: 'ranks' });

    const EventSchema = new Schema({
      title: String,
      date: String,
      type: String,
      image: String,
      description: String,
    }, { collection: 'events' });

    // Get or create models (handles if they're already compiled)
    const Mercenary = mongoose.models.Mercenary || mongoose.model('Mercenary', MercenarySchema);
    const Weapon = mongoose.models.Weapon || mongoose.model('Weapon', WeaponSchema);
    const Mode = mongoose.models.Mode || mongoose.model('Mode', ModeSchema);
    const Rank = mongoose.models.Rank || mongoose.model('Rank', RankSchema);
    const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

    console.log("\n🔄 Clearing existing data to prevent duplicates...");
    await Mercenary.deleteMany({});
    await Weapon.deleteMany({});
    await Mode.deleteMany({});
    await Rank.deleteMany({});
    // DO NOT delete events - let admin manage them manually

    // Seed mercenaries (10 total)
    console.log(`\n⚔️ Seeding ${mercenariesData.length} mercenaries...`);
    await Mercenary.insertMany(mercenariesData);
    console.log(`  ✅ Seeded: ${mercenariesData.length} mercenaries`);

    // Seed weapons
    console.log(`\n📦 Seeding ${weaponsData.length} weapons...`);
    await Weapon.insertMany(weaponsData);
    console.log(`  ✅ Seeded: ${weaponsData.length} weapons`);

    // Seed modes
    console.log(`\n🎮 Seeding ${modesData.length} game modes...`);
    await Mode.insertMany(modesData);
    console.log(`  ✅ Seeded: ${modesData.length} modes`);

    // Scrape and seed ranks
    const ranksData = await scrapeRanks();
    console.log(`\n🏅 Seeding ${ranksData.length} ranks...`);
    await Rank.insertMany(ranksData);
    console.log(`  ✅ Seeded: ${ranksData.length} ranks`);

    console.log("\n✅ SEEDING COMPLETE!");
    console.log(`   📊 Total: ${mercenariesData.length} mercenaries + ${weaponsData.length} weapons + ${modesData.length} modes + ${ranksData.length} ranks`);
    console.log("   📅 Events: Managed manually via admin panel\n");

    // Only close connection if requested (when run as standalone script)
    if (closeConnection) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    if (closeConnection) {
      await mongoose.connection.close();
    }
    throw error;
  }
}

// Export seedDatabase as default export for use as a module
export default seedDatabase;

// Run seeding if this script is executed directly (node seed-from-urls.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase({ closeConnection: true }).catch(console.error);
}
