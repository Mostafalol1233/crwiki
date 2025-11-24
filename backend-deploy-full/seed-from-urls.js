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
    image: "/attached_assets/merc-wolf.jpg",
    role: "Assault",
    description: "Aggressive assault specialist with high damage output and tactical expertise in close combat situations.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/wolf-line1.mp3", "/merc-mp3/wolf-line2.mp3", "/merc-mp3/wolf-line3.mp3"],
    stats: { health: 85, speed: 70, attack: 90, defense: 75 }
  },
  {
    id: "2",
    name: "Vipers",
    image: "/attached_assets/merc-vipers.jpg",
    role: "Sniper",
    description: "Precision sniper expert capable of eliminating targets from extreme distances with deadly accuracy.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/vipers-line1.mp3", "/merc-mp3/vipers-line2.mp3"],
    stats: { health: 65, speed: 60, attack: 95, defense: 50 }
  },
  {
    id: "3",
    name: "Sisterhood",
    image: "/attached_assets/merc-sisterhood.jpg",
    role: "Medic",
    description: "Support and healing specialist ensuring team survival through medical expertise and tactical support.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/sisterhood-line1.mp3"],
    stats: { health: 75, speed: 75, attack: 60, defense: 70 }
  },
  {
    id: "4",
    name: "Black Mamba",
    image: "/attached_assets/merc-blackmamba.jpg",
    role: "Scout",
    description: "Fast reconnaissance scout with exceptional mobility and intelligence gathering capabilities.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/blackmamba-line1.mp3", "/merc-mp3/blackmamba-line2.mp3"],
    stats: { health: 70, speed: 95, attack: 70, defense: 55 }
  },
  {
    id: "5",
    name: "Arch Honorary",
    image: "/attached_assets/merc-archhonorary.jpg",
    role: "Guardian",
    description: "Protective guardian role specializing in defensive positions and area denial tactics.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/archhonorary-line1.mp3"],
    stats: { health: 90, speed: 55, attack: 65, defense: 95 }
  },
  {
    id: "6",
    name: "Desperado",
    image: "/attached_assets/merc-desperado.jpg",
    role: "Engineer",
    description: "Technical engineer specialist skilled in equipment deployment and tactical modifications.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/desperado-line1.mp3", "/merc-mp3/desperado-line2.mp3"],
    stats: { health: 75, speed: 65, attack: 70, defense: 80 }
  },
  {
    id: "7",
    name: "Ronin",
    image: "/attached_assets/merc-ronin.jpg",
    role: "Samurai",
    description: "Melee combat warrior with exceptional close-quarters combat skills and honor-bound tactics.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/ronin-line1.mp3"],
    stats: { health: 80, speed: 80, attack: 85, defense: 70 }
  },
  {
    id: "8",
    name: "Dean",
    image: "/attached_assets/merc-dean.jpg",
    role: "Specialist",
    description: "Specialized tactics expert with versatile skills adapted to any combat scenario.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/dean-line1.mp3", "/merc-mp3/dean-line2.mp3", "/merc-mp3/dean-line3.mp3"],
    stats: { health: 75, speed: 75, attack: 75, defense: 75 }
  },
  {
    id: "9",
    name: "Thoth",
    image: "/attached_assets/merc-thoth.jpg",
    role: "Guardian",
    description: "Protective guardian with ancient wisdom and defensive mastery in battlefield control.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/thoth-line1.mp3"],
    stats: { health: 85, speed: 60, attack: 70, defense: 90 }
  },
  {
    id: "10",
    name: "SFG",
    image: "/attached_assets/merc-sfg.jpg",
    role: "Special Forces",
    description: "Special forces operative with elite training and multi-role combat capabilities.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/sfg-line1.mp3", "/merc-mp3/sfg-line2.mp3"],
    stats: { health: 80, speed: 85, attack: 85, defense: 75 }
  },
];

// WEAPONS - 28 with real names and stats
const weaponsData = [
  { name: "AK-47", description: "Assault Rifle", category: "Assault Rifle", image: "/attached_assets/feature-weap.jpg", damage: 45, recoil: 12, rateOfFire: 750, accuracy: 78 },
  { name: "M16A4", description: "Assault Rifle", category: "Assault Rifle", image: "/attached_assets/feature-weap.jpg", damage: 48, recoil: 14, rateOfFire: 720, accuracy: 75 },
  { name: "M4A1", description: "Carbine", category: "Assault Rifle", image: "/attached_assets/feature-weap.jpg", damage: 42, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "G36", description: "Assault Rifle", category: "Assault Rifle", image: "/attached_assets/feature-weap.jpg", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "M249", description: "Light Machine Gun", category: "Machine Gun", image: "/attached_assets/feature-weap.jpg", damage: 40, recoil: 8, rateOfFire: 850, accuracy: 82 },
  { name: "MP5", description: "Submachine Gun", category: "SMG", image: "/attached_assets/feature-weap.jpg", damage: 46, recoil: 11, rateOfFire: 760, accuracy: 76 },
  { name: "UMP45", description: "Submachine Gun", category: "SMG", image: "/attached_assets/feature-weap.jpg", damage: 44, recoil: 13, rateOfFire: 780, accuracy: 79 },
  { name: "P90", description: "Submachine Gun", category: "SMG", image: "/attached_assets/feature-weap.jpg", damage: 47, recoil: 12, rateOfFire: 740, accuracy: 77 },
  { name: "AWM", description: "Sniper Rifle", category: "Sniper", image: "/attached_assets/feature-weap.jpg", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "DSR-50", description: "Sniper Rifle", category: "Sniper", image: "/attached_assets/feature-weap.jpg", damage: 43, recoil: 9, rateOfFire: 820, accuracy: 81 },
  { name: "M24", description: "Sniper Rifle", category: "Sniper", image: "/attached_assets/feature-weap.jpg", damage: 51, recoil: 16, rateOfFire: 680, accuracy: 70 },
  { name: "Dragunov", description: "Marksman Rifle", category: "Sniper", image: "/attached_assets/feature-weap.jpg", damage: 45, recoil: 12, rateOfFire: 750, accuracy: 78 },
  { name: "M870", description: "Shotgun", category: "Shotgun", image: "/attached_assets/feature-weap.jpg", damage: 48, recoil: 13, rateOfFire: 740, accuracy: 76 },
  { name: "SPAS-12", description: "Combat Shotgun", category: "Shotgun", image: "/attached_assets/feature-weap.jpg", damage: 46, recoil: 11, rateOfFire: 760, accuracy: 79 },
  { name: "Winchester", description: "Pump Shotgun", category: "Shotgun", image: "/attached_assets/feature-weap.jpg", damage: 44, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "Deagle", description: "Hand Cannon", category: "Pistol", image: "/attached_assets/feature-weap.jpg", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "Glock", description: "Semi-Auto Pistol", category: "Pistol", image: "/attached_assets/feature-weap.jpg", damage: 47, recoil: 12, rateOfFire: 740, accuracy: 77 },
  { name: "M9", description: "Service Pistol", category: "Pistol", image: "/attached_assets/feature-weap.jpg", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "Knife", description: "Melee Weapon", category: "Melee", image: "/attached_assets/feature-weap.jpg", damage: 43, recoil: 9, rateOfFire: 820, accuracy: 81 },
  { name: "Hammer", description: "Melee Weapon", category: "Melee", image: "/attached_assets/feature-weap.jpg", damage: 45, recoil: 11, rateOfFire: 770, accuracy: 78 },
  { name: "Sword", description: "Melee Weapon", category: "Melee", image: "/attached_assets/feature-weap.jpg", damage: 48, recoil: 13, rateOfFire: 750, accuracy: 76 },
  { name: "Grenade", description: "Explosive", category: "Grenade", image: "/attached_assets/feature-weap.jpg", damage: 51, recoil: 16, rateOfFire: 680, accuracy: 70 },
  { name: "C4", description: "Explosive", category: "Grenade", image: "/attached_assets/feature-weap.jpg", damage: 46, recoil: 12, rateOfFire: 760, accuracy: 79 },
  { name: "Molotov", description: "Incendiary", category: "Grenade", image: "/attached_assets/feature-weap.jpg", damage: 44, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "Radar", description: "Support Item", category: "Support", image: "/attached_assets/feature-weap.jpg", damage: 0, recoil: 0, rateOfFire: 0, accuracy: 100 },
  { name: "Armor", description: "Protection Item", category: "Support", image: "/attached_assets/feature-weap.jpg", damage: 0, recoil: 0, rateOfFire: 0, accuracy: 100 },
  { name: "Airstrike", description: "Tactical Support", category: "Support", image: "/attached_assets/feature-weap.jpg", damage: 55, recoil: 20, rateOfFire: 600, accuracy: 65 },
  { name: "Helicopter", description: "Air Support", category: "Support", image: "/attached_assets/feature-weap.jpg", damage: 60, recoil: 25, rateOfFire: 500, accuracy: 60 },
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
  { name: "Free For /**
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
    image: "/attached_assets/merc-wolf.jpg",
    role: "Assault",
    description: "Aggressive assault specialist with high damage output and tactical expertise in close combat situations.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/wolf-line1.mp3", "/merc-mp3/wolf-line2.mp3", "/merc-mp3/wolf-line3.mp3"],
    stats: { health: 85, speed: 70, attack: 90, defense: 75 }
  },
  {
    id: "2",
    name: "Vipers",
    image: "/attached_assets/merc-vipers.jpg",
    role: "Sniper",
    description: "Precision sniper expert capable of eliminating targets from extreme distances with deadly accuracy.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["/merc-mp3/vipers-line1.mp3", "/merc-mp3/vipers-line2.mp3"],
 Farm", image: "https://files.catbox.moe/hb85yf.jpeg" },
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
    // Fallback to local assets - use attached_assets images
    const fallback = [
      { name: "Recruit", emblem: "/attached_assets/crossfire_images/01fdc72b-6213-43d3-b2b6-e23b6006d7a5.svg", description: "Starting rank", requirements: "" },
      { name: "Private", emblem: "/attached_assets/crossfire_images/033c4c73-e425-4825-b9a1-cacaee201bf1.svg", description: "Basic rank", requirements: "" },
      { name: "Corporal", emblem: "/attached_assets/crossfire_images/3af56917-a66e-4759-a703-0f44b57ba25d.svg", description: "Intermediate rank", requirements: "" },
      { name: "Sergeant", emblem: "/attached_assets/crossfire_images/5388e53b-c456-45a4-8727-82fafe6eafc2.svg", description: "Advanced rank", requirements: "" },
      { name: "Lieutenant", emblem: "/attached_assets/feature-comp.jpg", description: "Officer rank", requirements: "" },
      { name: "Captain", emblem: "/attached_assets/feature-coop.jpg", description: "Senior officer", requirements: "" },
      { name: "Major", emblem: "/attached_assets/feature-crossfire.jpg", description: "High rank", requirements: "" },
      { name: "Colonel", emblem: "/attached_assets/feature-weap.jpg", description: "Elite rank", requirements: "" },
      { name: "Brigadier General", emblem: "/attached_assets/highway_1762245049147.jfif", description: "Top rank", requirements: "" },
      { name: "General", emblem: "/attached_assets/image_1761955590373.png", description: "Ultimate rank", requirements: "" },
      { name: "Grand Marshal", emblem: "/attached_assets/image_1762045365663.png", description: "Legendary rank", requirements: "" },
      { name: "Supreme Commander", emblem: "/attached_assets/crossfire-hero-bg.jpg", description: "Supreme rank", requirements: "" },
    ];
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
