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
    voiceLines: ["https://files.catbox.moe/kadbfb.mp3"],
    stats: { health: 85, speed: 70, attack: 90, defense: 75 }
  },
  {
    id: "2",
    name: "Viper",
    image: "https://files.catbox.moe/4il6hi.jpeg",
    role: "Sniper",
    description: "Precision sniper expert capable of eliminating targets from extreme distances with deadly accuracy.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["https://files.catbox.moe/yynni6.mp3"],
    stats: { health: 65, speed: 60, attack: 95, defense: 50 }
  },
  {
    id: "3",
    name: "Sisterhood",
    image: "https://files.catbox.moe/3o58nb.jpeg",
    role: "Medic",
    description: "Support and healing specialist ensuring team survival through medical expertise and tactical support.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["https://files.catbox.moe/t8wtb5.mp3"],
    stats: { health: 75, speed: 75, attack: 60, defense: 70 }
  },
  {
    id: "4",
    name: "Black Mamba",
    image: "https://files.catbox.moe/r26ox6.jpeg",
    role: "Scout",
    description: "Fast reconnaissance scout with exceptional mobility and intelligence gathering capabilities.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["https://files.catbox.moe/r8a9u6.mp3"],
    stats: { health: 70, speed: 95, attack: 70, defense: 55 }
  },
  {
    id: "5",
    name: "Arch Honorary",
    image: "https://files.catbox.moe/ctwnqz.jpeg",
    role: "Guardian",
    description: "Protective guardian role specializing in defensive positions and area denial tactics.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["https://files.catbox.moe/s4yfnm.mp3"],
    stats: { health: 90, speed: 55, attack: 65, defense: 95 }
  },
  {
    id: "6",
    name: "Desperado",
    image: "https://files.catbox.moe/hh7h5u.jpeg",
    role: "Engineer",
    description: "Technical engineer specialist skilled in equipment deployment and tactical modifications.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["https://files.catbox.moe/mlt3yr.mp3"],
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
    voiceLines: ["https://files.catbox.moe/zbha6p.mp3"],
    stats: { health: 75, speed: 75, attack: 75, defense: 75 }
  },
  {
    id: "9",
    name: "Thoth",
    image: "https://files.catbox.moe/g4zfzn.jpeg",
    role: "Guardian",
    description: "Protective guardian with ancient wisdom and defensive mastery in battlefield control.",
    audioUrl: "https://files.catbox.moe/zj1nl4.mp3",
    voiceLines: ["https://files.catbox.moe/zj1nl4.mp3"],
    stats: { health: 85, speed: 60, attack: 70, defense: 90 }
  },
  {
    id: "10",
    name: "SFG",
    image: "https://files.catbox.moe/3bba2g.jpeg",
    role: "Special Forces",
    description: "Special forces operative with elite training and multi-role combat capabilities.",
    audioUrl: "https://files.catbox.moe/kadbfb.mp3",
    voiceLines: ["https://files.catbox.moe/abgtcf.mp3", "/merc-mp3/sfg-line2.mp3"],
    stats: { health: 80, speed: 85, attack: 85, defense: 75 }
  },
];

// WEAPONS - 28 with CATBOX URLS + STATS (damage, recoil, etc) - UPDATED WITH CORRECT NAMES
const weaponsData = [
  // Assault Rifles
  { name: "M4A1-S-Prism Beast", description: "M4A1-S with a colorful Prism Beast skin.", category: "Assault Rifle", image: "https://files.catbox.moe/oshs66.png", damage: 45, recoil: 12, rateOfFire: 750, accuracy: 78 },
  { name: "AK-47-Knife-Born Beast", description: "AK-47 with a knife attachment and Born Beast skin.", category: "Assault Rifle", image: "https://files.catbox.moe/y5xyvh.png", damage: 48, recoil: 14, rateOfFire: 720, accuracy: 75 },
  { name: "M4A1-S-Iron Beast", description: "M4A1-S with the Iron Beast skin.", category: "Assault Rifle", image: "https://files.catbox.moe/dikemy.png", damage: 42, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "AK-47-Knife-Infernal Dragon", description: "AK-47 with a knife attachment and Infernal Dragon skin.", category: "Assault Rifle", image: "https://files.catbox.moe/m7ii5b.png", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "M4A1-S-Born Beast", description: "M4A1-S with the Born Beast skin.", category: "Assault Rifle", image: "https://files.catbox.moe/2hx3cf.png", damage: 40, recoil: 8, rateOfFire: 850, accuracy: 82 },
  { name: "M4A1-S-Blue Pottery", description: "M4A1-S with a Blue Pottery skin.", category: "Assault Rifle", image: "https://files.catbox.moe/5r592p.png", damage: 46, recoil: 11, rateOfFire: 760, accuracy: 76 },
  { name: "AK-47-A-Camo", description: "AK-47 with a camouflage skin and scope.", category: "Assault Rifle", image: "https://files.catbox.moe/obytvu.png", damage: 44, recoil: 13, rateOfFire: 780, accuracy: 79 },
  { name: "M4A1-S-Jewelry", description: "M4A1-S with a Jewelry skin.", category: "Assault Rifle", image: "https://files.catbox.moe/0dp3c2.png", damage: 47, recoil: 12, rateOfFire: 740, accuracy: 77 },
  { name: "M4A1-S-Blue Crystal", description: "M4A1-S with a Blue Crystal skin.", category: "Assault Rifle", image: "https://files.catbox.moe/7mo6zg.png", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "AK-47-S-Red Dragon", description: "AK-47 with a Red Dragon skin and scope.", category: "Assault Rifle", image: "https://files.catbox.moe/5wvixf.png", damage: 43, recoil: 9, rateOfFire: 820, accuracy: 81 },
  { name: "M4A1-S-Gold", description: "M4A1-S with a Gold skin.", category: "Assault Rifle", image: "https://files.catbox.moe/nd0e8l.png", damage: 51, recoil: 16, rateOfFire: 680, accuracy: 70 },
  { name: "AK-47-S-Silver", description: "AK-47 with a Silver skin and scope.", category: "Assault Rifle", image: "https://files.catbox.moe/z4auy7.png", damage: 45, recoil: 12, rateOfFire: 750, accuracy: 78 },
  // Sniper Rifles
  { name: "AWM-Infernal Dragon", description: "AWM with the Infernal Dragon skin.", category: "Sniper Rifle", image: "https://files.catbox.moe/8qkl0a.png", damage: 48, recoil: 13, rateOfFire: 740, accuracy: 76 },
  { name: "AWM-Blue Pottery", description: "AWM with a Blue Pottery skin.", category: "Sniper Rifle", image: "https://files.catbox.moe/4o20pn.png", damage: 46, recoil: 11, rateOfFire: 760, accuracy: 79 },
  { name: "AWM-S-Red Dragon", description: "AWM-S with a Red Dragon skin.", category: "Sniper Rifle", image: "https://files.catbox.moe/bpa85i.png", damage: 44, recoil: 10, rateOfFire: 800, accuracy: 80 },
  { name: "Barrett M82A1-Iron Beast", description: "Barrett M82A1 with the Iron Beast skin.", category: "Sniper Rifle", image: "https://files.catbox.moe/mx62ji.png", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  { name: "AWM-S-Gold", description: "AWM-S with a Gold skin.", category: "Sniper Rifle", image: "https://files.catbox.moe/g1ng1o.png", damage: 47, recoil: 12, rateOfFire: 740, accuracy: 77 },
  // Machine Guns
  { name: "Gatling Gun-Gold", description: "Gatling Gun with a Gold skin.", category: "Machine Gun", image: "https://files.catbox.moe/t02svh.png", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "M60-S-Camo", description: "M60-S with a camouflage skin.", category: "Machine Gun", image: "https://files.catbox.moe/vf910w.png", damage: 43, recoil: 9, rateOfFire: 820, accuracy: 81 },
  // SMGs
  { name: "Thompson-Infernal Dragon", description: "Thompson with the Infernal Dragon skin.", category: "SMG", image: "https://files.catbox.moe/jfuae1.png", damage: 45, recoil: 11, rateOfFire: 770, accuracy: 78 },
  { name: "P90-Camo", description: "P90 with a camouflage skin.", category: "SMG", image: "https://files.catbox.moe/avqjsd.png", damage: 48, recoil: 13, rateOfFire: 750, accuracy: 76 },
  // Shotguns
  { name: "Remington 870-Born Beast", description: "Remington 870 with the Born Beast skin.", category: "Shotgun", image: "https://files.catbox.moe/9yfkfq.png", damage: 51, recoil: 16, rateOfFire: 680, accuracy: 70 },
  // Pistols
  { name: "Desert Eagle-S-Red Dragon", description: "Desert Eagle-S with a Red Dragon skin.", category: "Pistol", image: "https://files.catbox.moe/irpla6.png", damage: 46, recoil: 12, rateOfFire: 760, accuracy: 79 },
  { name: "Anaconda-S-Gold", description: "Anaconda-S with a Gold skin.", category: "Pistol", image: "https://files.catbox.moe/outzzz.png", damage: 44, recoil: 10, rateOfFire: 800, accuracy: 80 },
  // Melee
  { name: "Axe-Gold", description: "Axe with a Gold skin.", category: "Melee", image: "https://files.catbox.moe/2catwt.jpeg", damage: 47, recoil: 11, rateOfFire: 770, accuracy: 77 },
  { name: "Katana-Infernal Dragon", description: "Katana with the Infernal Dragon skin.", category: "Melee", image: "https://files.catbox.moe/f3esjq.png", damage: 49, recoil: 14, rateOfFire: 730, accuracy: 74 },
  { name: "Kukri-Red Dragon", description: "Kukri with a Red Dragon skin.", category: "Melee", image: "https://files.catbox.moe/j7z531.jpeg", damage: 50, recoil: 15, rateOfFire: 700, accuracy: 72 },
  // Grenade
  { name: "Flashbang-Born Beast", description: "Flashbang with the Born Beast skin.", category: "Grenade", image: "https://files.catbox.moe/xb2ftb.png", damage: 42, recoil: 8, rateOfFire: 850, accuracy: 82 },
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

// RANKS - 45 Complete Progression System with Catbox URLs
const ranksData = [
  { name: "Brigadier General 1", tier: 1, image: "https://files.catbox.moe/s7cki2.jpeg", emblem: "https://files.catbox.moe/s7cki2.jpeg", expRequired: 7578037, bonus: "", description: "First rank in progression" },
  { name: "Brigadier General 2", tier: 2, image: "https://files.catbox.moe/ysfqm5.jpeg", emblem: "https://files.catbox.moe/ysfqm5.jpeg", expRequired: 8026912, bonus: "AK-47-K-Yellow Fractal 60 days", description: "Second brigadier rank" },
  { name: "Brigadier General 3", tier: 3, image: "https://files.catbox.moe/b28ove.jpeg", emblem: "https://files.catbox.moe/b28ove.jpeg", expRequired: 8481772, bonus: "", description: "Third brigadier rank" },
  { name: "Brigadier General 4", tier: 4, image: "https://files.catbox.moe/5kqiv0.jpeg", emblem: "https://files.catbox.moe/5kqiv0.jpeg", expRequired: 8964562, bonus: "", description: "Fourth brigadier rank" },
  { name: "Brigadier General 5", tier: 5, image: "https://files.catbox.moe/dxp982.jpeg", emblem: "https://files.catbox.moe/dxp982.jpeg", expRequired: 9475852, bonus: "", description: "Fifth brigadier rank" },
  { name: "Brigadier General 6", tier: 6, image: "https://files.catbox.moe/znkwhf.jpeg", emblem: "https://files.catbox.moe/znkwhf.jpeg", expRequired: 10016212, bonus: "30 x 7th Anniversary Crates", description: "Sixth brigadier rank" },
  { name: "Major General 1", tier: 7, image: "https://files.catbox.moe/0z7arw.jpeg", emblem: "https://files.catbox.moe/0z7arw.jpeg", expRequired: 10586212, bonus: "", description: "First major general rank" },
  { name: "Major General 2", tier: 8, image: "https://files.catbox.moe/r5bv00.jpeg", emblem: "https://files.catbox.moe/r5bv00.jpeg", expRequired: 11186422, bonus: "G-Yellow Crystal perm", description: "Second major general rank" },
  { name: "Major General 3", tier: 9, image: "https://files.catbox.moe/u1u353.jpeg", emblem: "https://files.catbox.moe/u1u353.jpeg", expRequired: 11817412, bonus: "", description: "Third major general rank" },
  { name: "Major General 4", tier: 10, image: "https://files.catbox.moe/zvmosb.jpeg", emblem: "https://files.catbox.moe/zvmosb.jpeg", expRequired: 12479752, bonus: "", description: "Fourth major general rank" },
  { name: "Major General 5", tier: 11, image: "https://files.catbox.moe/r732ah.jpeg", emblem: "https://files.catbox.moe/r732ah.jpeg", expRequired: 13174012, bonus: "10 Color Blaze Crates", description: "Fifth major general rank" },
  { name: "Major General 6", tier: 12, image: "https://files.catbox.moe/8n9syh.jpeg", emblem: "https://files.catbox.moe/8n9syh.jpeg", expRequired: 13900762, bonus: "Slaughter Ticket Box", description: "Sixth major general rank" },
  { name: "Lieutenant General 1", tier: 13, image: "https://files.catbox.moe/a5m2o4.jpeg", emblem: "https://files.catbox.moe/a5m2o4.jpeg", expRequired: 14660572, bonus: "", description: "First lieutenant general rank" },
  { name: "Lieutenant General 2", tier: 14, image: "https://files.catbox.moe/9cz5b0.jpeg", emblem: "https://files.catbox.moe/9cz5b0.jpeg", expRequired: 15454012, bonus: "", description: "Second lieutenant general rank" },
  { name: "Lieutenant General 3", tier: 15, image: "https://files.catbox.moe/pn404m.jpeg", emblem: "https://files.catbox.moe/pn404m.jpeg", expRequired: 16281652, bonus: "M4A1-S-Yellow Fractal perm", description: "Third lieutenant general rank" },
  { name: "Lieutenant General 4", tier: 16, image: "https://files.catbox.moe/k4xaa3.jpeg", emblem: "https://files.catbox.moe/k4xaa3.jpeg", expRequired: 17144062, bonus: "", description: "Fourth lieutenant general rank" },
  { name: "Lieutenant General 5", tier: 17, image: "https://files.catbox.moe/pq4ung.jpeg", emblem: "https://files.catbox.moe/pq4ung.jpeg", expRequired: 18041812, bonus: "", description: "Fifth lieutenant general rank" },
  { name: "Lieutenant General 6", tier: 18, image: "https://files.catbox.moe/34w8kx.jpeg", emblem: "https://files.catbox.moe/34w8kx.jpeg", expRequired: 18975472, bonus: "RPK-Infernal Dragon 30 days", description: "Sixth lieutenant general rank" },
  { name: "General 1", tier: 19, image: "https://files.catbox.moe/sy65bu.jpeg", emblem: "https://files.catbox.moe/sy65bu.jpeg", expRequired: 19945612, bonus: "", description: "First general rank" },
  { name: "General 2", tier: 20, image: "https://files.catbox.moe/ehamvu.jpeg", emblem: "https://files.catbox.moe/ehamvu.jpeg", expRequired: 20952802, bonus: "AK-47-K-Yellow Fractal perm", description: "Second general rank" },
  { name: "General 3", tier: 21, image: "https://files.catbox.moe/136e14.jpeg", emblem: "https://files.catbox.moe/136e14.jpeg", expRequired: 21997612, bonus: "", description: "Third general rank" },
  { name: "General 4", tier: 22, image: "https://files.catbox.moe/3xzm6i.jpeg", emblem: "https://files.catbox.moe/3xzm6i.jpeg", expRequired: 23080612, bonus: "AWM-Infernal Dragon 30 days", description: "Fourth general rank" },
  { name: "General 5", tier: 23, image: "https://files.catbox.moe/q4itad.jpeg", emblem: "https://files.catbox.moe/q4itad.jpeg", expRequired: 24202372, bonus: "", description: "Fifth general rank" },
  { name: "General 6", tier: 24, image: "https://files.catbox.moe/ibwcla.jpeg", emblem: "https://files.catbox.moe/ibwcla.jpeg", expRequired: 25363462, bonus: "AK-47 Fury 30 days", description: "Sixth general rank" },
  { name: "Marshall", tier: 25, image: "https://files.catbox.moe/ibwcla.jpeg", emblem: "https://files.catbox.moe/ibwcla.jpeg", expRequired: 26564452, bonus: "", description: "Marshall rank" },
  { name: "Grand Marshall", tier: 26, image: "https://files.catbox.moe/eu1zph.jpeg", emblem: "https://files.catbox.moe/eu1zph.jpeg", expRequired: 100000000, bonus: "30 Free Crate Tickets", description: "Highest rank achievable" },
  { name: "Major 1", tier: 27, image: "https://files.catbox.moe/p0s9sk.jpeg", emblem: "https://files.catbox.moe/p0s9sk.jpeg", expRequired: 2057701, bonus: "30,000 GP", description: "Major rank tier 1" },
  { name: "Major 2", tier: 28, image: "https://files.catbox.moe/8nlk6e.jpeg", emblem: "https://files.catbox.moe/8nlk6e.jpeg", expRequired: 2107237, bonus: "", description: "Major rank tier 2" },
  { name: "Major 3", tier: 29, image: "https://files.catbox.moe/1ke9re.jpeg", emblem: "https://files.catbox.moe/1ke9re.jpeg", expRequired: 2339509, bonus: "Mutant Box 30 days", description: "Major rank tier 3" },
  { name: "Major 4", tier: 30, image: "https://files.catbox.moe/q9q8a4.jpeg", emblem: "https://files.catbox.moe/q9q8a4.jpeg", expRequired: 2484517, bonus: "", description: "Major rank tier 4" },
  { name: "Major 5", tier: 31, image: "https://files.catbox.moe/dy1ycr.jpeg", emblem: "https://files.catbox.moe/dy1ycr.jpeg", expRequired: 2632261, bonus: "", description: "Major rank tier 5" },
  { name: "Major 6", tier: 32, image: "https://files.catbox.moe/u7d8n8.jpeg", emblem: "https://files.catbox.moe/u7d8n8.jpeg", expRequired: 2782741, bonus: "CFWE Sniper Ticket 30 days", description: "Major rank tier 6" },
  { name: "Major 7", tier: 33, image: "https://files.catbox.moe/0at6e0.jpeg", emblem: "https://files.catbox.moe/0at6e0.jpeg", expRequired: 2935957, bonus: "Octane Camo Grenade 30 days", description: "Major rank tier 7" },
  { name: "Major 8", tier: 34, image: "https://files.catbox.moe/21np4h.jpeg", emblem: "https://files.catbox.moe/21np4h.jpeg", expRequired: 3091909, bonus: "CFWE MG Ticket 30 days", description: "Major rank tier 8" },
  { name: "Lieutenant Colonel 1", tier: 35, image: "https://files.catbox.moe/wj32gi.jpeg", emblem: "https://files.catbox.moe/wj32gi.jpeg", expRequired: 3277045, bonus: "", description: "Lieutenant Colonel rank tier 1" },
  { name: "Lieutenant Colonel 2", tier: 36, image: "https://files.catbox.moe/3upe2i.jpeg", emblem: "https://files.catbox.moe/3upe2i.jpeg", expRequired: 3465373, bonus: "Bulletproof Package 30 days", description: "Lieutenant Colonel rank tier 2" },
  { name: "Lieutenant Colonel 3", tier: 37, image: "https://files.catbox.moe/pxlhng.jpeg", emblem: "https://files.catbox.moe/pxlhng.jpeg", expRequired: 3673537, bonus: "CFWE SMG Ticket 30 days", description: "Lieutenant Colonel rank tier 3" },
  { name: "Lieutenant Colonel 4", tier: 38, image: "https://files.catbox.moe/vvf1ob.jpeg", emblem: "https://files.catbox.moe/vvf1ob.jpeg", expRequired: 3885178, bonus: "M4A1 Custom-Octane Camo 30 days", description: "Lieutenant Colonel rank tier 4" },
  { name: "Lieutenant Colonel 5", tier: 39, image: "https://files.catbox.moe/j48qds.jpeg", emblem: "https://files.catbox.moe/j48qds.jpeg", expRequired: 4100296, bonus: "", description: "Lieutenant Colonel rank tier 5" },
  { name: "Lieutenant Colonel 6", tier: 40, image: "https://files.catbox.moe/of7bjg.jpeg", emblem: "https://files.catbox.moe/of7bjg.jpeg", expRequired: 4318891, bonus: "CFWE Rifle Ticket 30 days", description: "Lieutenant Colonel rank tier 6" },
  { name: "Lieutenant Colonel 7", tier: 41, image: "https://files.catbox.moe/fc3xd3.jpeg", emblem: "https://files.catbox.moe/fc3xd3.jpeg", expRequired: 4540963, bonus: "", description: "Lieutenant Colonel rank tier 7" },
  { name: "Lieutenant Colonel 8", tier: 42, image: "https://files.catbox.moe/gry5a6.jpeg", emblem: "https://files.catbox.moe/gry5a6.jpeg", expRequired: 4766512, bonus: "10 Horus Crates", description: "Lieutenant Colonel rank tier 8" },
  { name: "Colonel 1", tier: 43, image: "https://files.catbox.moe/36u4e0.jpeg", emblem: "https://files.catbox.moe/36u4e0.jpeg", expRequired: 5028199, bonus: "", description: "Colonel rank tier 1" },
  { name: "Colonel 2", tier: 44, image: "https://files.catbox.moe/irep2l.jpeg", emblem: "https://files.catbox.moe/irep2l.jpeg", expRequired: 5319184, bonus: "", description: "Colonel rank tier 2" },
  { name: "Colonel 3", tier: 45, image: "https://files.catbox.moe/n21tw4.jpeg", emblem: "https://files.catbox.moe/n21tw4.jpeg", expRequired: 5614501, bonus: "M4A1-S-Yellow Fractal 60 days", description: "Colonel rank tier 3" },
  { name: "Colonel 4", tier: 46, image: "https://files.catbox.moe/qp8njf.jpeg", emblem: "https://files.catbox.moe/qp8njf.jpeg", expRequired: 5914150, bonus: "", description: "Colonel rank tier 4" },
  { name: "Colonel 5", tier: 47, image: "https://files.catbox.moe/1qv6ts.jpeg", emblem: "https://files.catbox.moe/1qv6ts.jpeg", expRequired: 6218131, bonus: "BC Axe-Octane Camo 30 days", description: "Colonel rank tier 5" }
];

// Scrape ranks directly from CF website (fallback to local assets when possible)
// NOTE: The original scraping function is replaced with a static data set for accuracy.
async function scrapeRanks() {
  console.log("ðŸ”„ Using static, verified ranks data instead of scraping.");
  // The original scraping logic is commented out or removed to use the static data above.
  // This ensures the correct rank images and names are used as requested by the user.
  return ranksData;
}

// EVENT SCRAPER - Fetches announcements from forum and converts to events
async function scrapeForumEvents() {
  try {
    console.log("ðŸ” Scraping announcements from forum.z8games.com...");
    const response = await axios.get(ANNOUNCEMENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const events = [];

    // Find all discussion links
    $('.DiscussionList .Item .Title a').each((index, link) => {
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

    console.log(`âœ… Scraped ${events.length} events from forum`);
    return events.length > 0 ? events : null;
  } catch (error) {
    console.warn("âš ï¸  Forum scraping failed:", error.message);
    return null;
  }
}

async function seedDatabase(options = {}) {
  const { closeConnection = false } = options;
  try {
    console.log("ðŸ”„ Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("âœ… Connected to MongoDB\n");

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
      tier: Number,
      emblem: String,
      expRequired: Number,
      bonus: String,
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

    console.log("\nðŸ”„ Clearing existing data to prevent duplicates...");
    await Mercenary.deleteMany({});
    await Weapon.deleteMany({});
    await Mode.deleteMany({});
    await Rank.deleteMany({});
    // DO NOT delete events - let admin manage them manually

    // Seed mercenaries (10 total)
    console.log(`\nâš”ï¸ Seeding ${mercenariesData.length} mercenaries...`);
    await Mercenary.insertMany(mercenariesData);
    console.log(`  âœ… Seeded: ${mercenariesData.length} mercenaries`);

    // Seed weapons
    console.log(`\nðŸ“¦ Seeding ${weaponsData.length} weapons...`);
    await Weapon.insertMany(weaponsData);
    console.log(`  âœ… Seeded: ${weaponsData.length} weapons`);

    // Seed modes
    console.log(`\nðŸŽ® Seeding ${modesData.length} game modes...`);
    await Mode.insertMany(modesData);
    console.log(`  âœ… Seeded: ${modesData.length} modes`);

    // Scrape and seed ranks
    // NOTE: scrapeRanks now returns the static ranksData array
    const finalRanksData = await scrapeRanks();
    console.log(`\nðŸ… Seeding ${finalRanksData.length} ranks...`);
    await Rank.insertMany(finalRanksData);
    console.log(`  âœ… Seeded: ${finalRanksData.length} ranks`);

    console.log("\nâœ… SEEDING COMPLETE!");
    console.log(`   ðŸ“Š Total: ${mercenariesData.length} mercenaries + ${weaponsData.length} weapons + ${modesData.length} modes + ${finalRanksData.length} ranks`);
    console.log("   ðŸ“… Events: Managed manually via admin panel\n");

    // Only close connection if requested (when run as standalone script)
    if (closeConnection) {
      await mongoose.connection.close();
      console.log("âœ… MongoDB connection closed");
    }
  } catch (error) {
    console.error("âŒ Seeding failed:", error.message);
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
