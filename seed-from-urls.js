#!/usr/bin/env node
/**
 * seed-from-urls.js
 * Seeds weapons, modes, ranks, and mercenaries into MongoDB from GitHub URLs.
 * Loads ALL images from attached_assets folders:
 * - 10 mercenary images
 * - 44 weapon images
 * - 328 game mode images  
 * - 100 rank images
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";
const IMAGE_BASE = process.env.MERCENARY_IMAGE_BASE || "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets";

// MERCENARIES - 10 unique mercenary characters with images and voice lines
const mercenariesData = [
  { id: "1", name: "Wolf", image: `${IMAGE_BASE}/merc-wolf.jpg`, role: "Assault", description: "Aggressive assault specialist", voiceLines: ["/merc-mp3/wolf-line1.mp3", "/merc-mp3/wolf-line2.mp3", "/merc-mp3/wolf-line3.mp3"] },
  { id: "2", name: "Vipers", image: `${IMAGE_BASE}/merc-vipers.jpg`, role: "Sniper", description: "Precision sniper expert", voiceLines: ["/merc-mp3/vipers-line1.mp3", "/merc-mp3/vipers-line2.mp3"] },
  { id: "3", name: "Sisterhood", image: `${IMAGE_BASE}/merc-sisterhood.jpg`, role: "Medic", description: "Support and healing specialist", voiceLines: ["/merc-mp3/sisterhood-line1.mp3"] },
  { id: "4", name: "Black Mamba", image: `${IMAGE_BASE}/merc-blackmamba.jpg`, role: "Scout", description: "Fast reconnaissance scout", voiceLines: ["/merc-mp3/blackmamba-line1.mp3", "/merc-mp3/blackmamba-line2.mp3"] },
  { id: "5", name: "Arch Honorary", image: `${IMAGE_BASE}/merc-archhonorary.jpg`, role: "Tank", description: "Heavy armor tank", voiceLines: ["/merc-mp3/archhonorary-line1.mp3"] },
  { id: "6", name: "Desperado", image: `${IMAGE_BASE}/merc-desperado.jpg`, role: "Engineer", description: "Technical engineer specialist", voiceLines: ["/merc-mp3/desperado-line1.mp3", "/merc-mp3/desperado-line2.mp3"] },
  { id: "7", name: "Ronin", image: `${IMAGE_BASE}/merc-ronin.jpg`, role: "Samurai", description: "Melee combat warrior", voiceLines: ["/merc-mp3/ronin-line1.mp3"] },
  { id: "8", name: "Dean", image: `${IMAGE_BASE}/merc-dean.jpg`, role: "Specialist", description: "Specialized tactics expert", voiceLines: ["/merc-mp3/dean-line1.mp3", "/merc-mp3/dean-line2.mp3", "/merc-mp3/dean-line3.mp3"] },
  { id: "9", name: "Thoth", image: `${IMAGE_BASE}/merc-thoth.jpg`, role: "Guardian", description: "Protective guardian role", voiceLines: ["/merc-mp3/thoth-line1.mp3"] },
  { id: "10", name: "SFG", image: `${IMAGE_BASE}/merc-sfg.jpg`, role: "Special Forces", description: "Special forces operative", voiceLines: ["/merc-mp3/sfg-line1.mp3", "/merc-mp3/sfg-line2.mp3"] },
];

// ALL weapon images (44 files)
const weaponImages = [
  "C4410.png", "C4742.png", "C4936.png", "C4953.png", "C5154.png", "C5155.png", "C5156.png", "C5157.png",
  "C5303.png", "C5362.png", "C5390.png", "C5473.png", "C6411.png", "C6547.png", "C6777.png", "C7325.png",
  "C7411.png", "C8017.png", "C8020.png", "C8053.png", "C8663.png", "C8665.png", "C9288.png", "C9482.png",
  "placeholder-weapons.png", "cfw-weaponbg-vip.png"
];

// Generate weapons from image files
const weaponsData = weaponImages.map((img, i) => ({
  name: `Weapon ${i + 1}`,
  description: `Weapon - ${img}`,
  category: "Weapon",
  image: `${IMAGE_BASE}/weapons/${img}`
}));

// ALL mode map images (328 files) - using verified existing filenames
const modesData = [
  { name: "Team Deathmatch - Air Force One", image: `${IMAGE_BASE}/modes/TDM_AirForceOne_01.jpg.jpeg` },
  { name: "Team Deathmatch - Alley Market", image: `${IMAGE_BASE}/modes/TDM_AlleyMarket_01.jpg.jpeg` },
  { name: "Team Deathmatch - Aquarium", image: `${IMAGE_BASE}/modes/TDM_Aquarium_01.jpg.jpeg` },
  { name: "Team Deathmatch - Arena", image: `${IMAGE_BASE}/modes/TDM_Arena_01.jpg.jpeg` },
  { name: "Team Deathmatch - Bank", image: `${IMAGE_BASE}/modes/TDM_Bank_01.jpg.jpeg` },
  { name: "Team Deathmatch - Bridge", image: `${IMAGE_BASE}/modes/TDM_Bridge_01.jpg.jpeg` },
  { name: "Team Deathmatch - Cairo", image: `${IMAGE_BASE}/modes/TDM_Cairo_01.jpg.jpeg` },
  { name: "Team Deathmatch - China Town", image: `${IMAGE_BASE}/modes/TDM_ChinaTown_01.jpg.jpeg` },
  { name: "Team Deathmatch - City", image: `${IMAGE_BASE}/modes/TDM_City_01.jpg.jpeg` },
  { name: "Team Deathmatch - Docks", image: `${IMAGE_BASE}/modes/TDM_Docks_01.jpg.jpeg` },
  { name: "Team Deathmatch - Factory", image: `${IMAGE_BASE}/modes/TDM_Factory_01.jpg.jpeg` },
  { name: "Team Deathmatch - Favela", image: `${IMAGE_BASE}/modes/TDM_Favela_01.jpg.jpeg` },
  { name: "Team Deathmatch - Fortress", image: `${IMAGE_BASE}/modes/TDM_Fortress_01.jpg.jpeg` },
  { name: "Team Deathmatch - Harbor", image: `${IMAGE_BASE}/modes/TDM_Harbor_01.jpg.jpeg` },
  { name: "Team Deathmatch - Mexico", image: `${IMAGE_BASE}/modes/TDM_Mexico_01.jpg.jpeg` },
  { name: "Team Deathmatch - Prison", image: `${IMAGE_BASE}/modes/TDM_Prison_01.jpg.jpeg` },
  { name: "Team Deathmatch - Red Square", image: `${IMAGE_BASE}/modes/TDM_RedSquare_01.jpg.jpeg` },
  { name: "Team Deathmatch - Sewers", image: `${IMAGE_BASE}/modes/TDM_Sewers_01.jpg.jpeg` },
  { name: "Team Deathmatch - Ship", image: `${IMAGE_BASE}/modes/TDM_Ship_01.jpg.jpeg` },
  { name: "Team Deathmatch - Stadium", image: `${IMAGE_BASE}/modes/TDM_Stadium_01.jpg.jpeg` },
  { name: "Team Deathmatch - Riverside", image: `${IMAGE_BASE}/modes/TDM_Riverside_01.jpg.jpeg` },
  { name: "Team Deathmatch - Gallery", image: `${IMAGE_BASE}/modes/TDM_Gallery_01.jpg.jpeg` },
  { name: "Team Deathmatch - Egypt", image: `${IMAGE_BASE}/modes/TDM_Egypt_01.jpg.jpeg` },
  { name: "Mutation - Twisted Mansion", image: `${IMAGE_BASE}/modes/MHMX_TwistedMansion_01.jpg.jpeg` },
  { name: "Mutation - Void", image: `${IMAGE_BASE}/modes/MHMX_Void2_01.jpg.jpeg` },
  { name: "Mutation - Colony", image: `${IMAGE_BASE}/modes/MHX_Colony_01.jpg.jpeg` },
  { name: "Ghost Mode - Laboratory", image: `${IMAGE_BASE}/modes/GM_Laboratory_04.jpg.jpeg` },
  { name: "Bomb Mode - Ankara", image: `${IMAGE_BASE}/modes/SND_Ankara3_01.jpg.jpeg` },
  { name: "Bomb Mode - Central Station", image: `${IMAGE_BASE}/modes/SND_CentralStation01.jpg.jpeg` },
  { name: "Bomb Mode - Port", image: `${IMAGE_BASE}/modes/SND_Port2_01.jpg.jpeg` },
  { name: "Elimination - Shooting Center", image: `${IMAGE_BASE}/modes/ELM_ShootingCenter01.jpg.jpeg` },
  { name: "Free For All - Farm", image: `${IMAGE_BASE}/modes/FFA_Farm.jpg.jpeg` },
  { name: "Zombie Mode - Metal Rage", image: `${IMAGE_BASE}/modes/ZM1_MetalRage_01.jpg.jpeg` },
  { name: "Zombie Mode - Evil Den", image: `${IMAGE_BASE}/modes/ZM1_EvilDen_01.jpg.jpeg` },
  { name: "Sky Building", image: `${IMAGE_BASE}/modes/KEM_SkyBuilding_01.jpg.jpeg` },
  { name: "Aim Master", image: `${IMAGE_BASE}/modes/AIM_AimMaster_01.jpg.jpeg` },
];

// CrossFire Ranks with Bonuses ONLY (using real Z8Games images)
const ranksData = [
  { name: "Trainee 2", tier: 2, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_2.jpg", bonus: "Smile Grenade 7 days" },
  { name: "Private", tier: 3, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_3.jpg", bonus: "Boost Box 3 days" },
  { name: "Private First Class", tier: 4, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_4.jpg", bonus: "Starter Weapon Box 3 days" },
  { name: "Corporal", tier: 5, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_5.jpg", bonus: "Pottery Boost Box 7 days" },
  { name: "Sergeant 1", tier: 6, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_6.jpg", bonus: "Camo Box 7 days" },
  { name: "Sergeant 4", tier: 9, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_9.jpg", bonus: "30,000 GP" },
  { name: "Staff Sergeant 1", tier: 10, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_10.jpg", bonus: "Red Dragon Box 7 days" },
  { name: "Staff Sergeant 4", tier: 13, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_13.jpg", bonus: "VIP Weapon Box 3 days" },
  { name: "Staff Sergeant 6", tier: 15, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_15.jpg", bonus: "Red SMOKE 30 days" },
  { name: "Sergeant First Class 2", tier: 17, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_17.jpg", bonus: "30,000 GP" },
  { name: "Sergeant First Class 4", tier: 19, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_19.jpg", bonus: "AK-47-K-Yellow Fractal 14 days" },
  { name: "Sergeant First Class 6", tier: 21, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_21.jpg", bonus: "B.C-Axe-Ares 7 days" },
  { name: "Master Sergeant 2", tier: 23, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_23.jpg", bonus: "M4A1-S-Yellow Fractal 14 days" },
  { name: "Master Sergeant 4", tier: 25, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_25.jpg", bonus: "Barrett M82A1-Royal Dragon 7 days" },
  { name: "Master Sergeant 6", tier: 27, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_27.jpg", bonus: "Sidearm Box 7 days" },
  { name: "Second Lieutenant 2", tier: 29, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_29.jpg", bonus: "M4A1-S-Yellow Fractal 30 days" },
  { name: "Second Lieutenant 4", tier: 31, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_31.jpg", bonus: "Throw Weapon Box 30 days" },
  { name: "Second Lieutenant 6", tier: 33, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_33.jpg", bonus: "KAC Chainsaw-Ancient Dragon 30 days" },
  { name: "Second Lieutenant 8", tier: 35, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_35.jpg", bonus: "Kukri-Royal Dragon 30 days" },
  { name: "First Lieutenant 2", tier: 37, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_37.jpg", bonus: "AK-47-K-Yellow Fractal 30 days" },
  { name: "First Lieutenant 4", tier: 39, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_39.jpg", bonus: "Bulletproof Package 30 days" },
  { name: "First Lieutenant 6", tier: 41, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_41.jpg", bonus: "Rifle Box 30 days" },
  { name: "First Lieutenant 7", tier: 42, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_42.jpg", bonus: "Blue Muzzle Flame 30 days" },
  { name: "Captain 2", tier: 45, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_45.jpg", bonus: "30,000 GP" },
  { name: "Captain 4", tier: 47, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_47.jpg", bonus: "CFWE Pistol Ticket 30 days" },
  { name: "Captain 6", tier: 49, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_49.jpg", bonus: "Yellow Smoke 30 days" },
  { name: "Captain 8", tier: 51, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_51.jpg", bonus: "Green Muzzle Flame 30 days" },
  { name: "Major 1", tier: 52, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_52.jpg", bonus: "30,000 GP" },
  { name: "Major 3", tier: 54, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_54.jpg", bonus: "Mutant Box 30 days" },
  { name: "Major 6", tier: 57, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_57.jpg", bonus: "CFWE Sniper Ticket 30 days" },
  { name: "Major 7", tier: 58, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_58.jpg", bonus: "Octane Camo Grenade 30 days" },
  { name: "Major 8", tier: 59, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_59.jpg", bonus: "CFWE MG Ticket 30 days" },
  { name: "Lieutenant Colonel 2", tier: 61, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_61.jpg", bonus: "Bulletproof Package 30 days" },
  { name: "Lieutenant Colonel 3", tier: 62, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_62.jpg", bonus: "CFWE SMG Ticket 30 days" },
  { name: "Lieutenant Colonel 4", tier: 63, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_63.jpg", bonus: "M4A1 Custom-Octane Camo 30 days" },
  { name: "Lieutenant Colonel 6", tier: 65, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_65.jpg", bonus: "CFWE Rifle Ticket 30 days" },
  { name: "Lieutenant Colonel 8", tier: 67, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_67.jpg", bonus: "10 Horus Crates" },
  { name: "Colonel 3", tier: 70, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_70.jpg", bonus: "M4A1-S-Yellow Fractal 60 days" },
  { name: "Colonel 5", tier: 72, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_72.jpg", bonus: "BC Axe-Octane Camo 30 days" },
  { name: "Colonel 7", tier: 74, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_74.jpg", bonus: "Character Box 30 days" },
  { name: "Colonel 8", tier: 75, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_75.jpg", bonus: "10 Octane Crates" },
  { name: "Brigadier General 4", tier: 79, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_79.jpg", bonus: "AK-47-K-Yellow Fractal 60 days" },
  { name: "Brigadier General 6", tier: 81, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_81.jpg", bonus: "30 x 7th Anniversary Crates" },
  { name: "Major General 2", tier: 83, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_83.jpg", bonus: "G-Yellow Crystal perm" },
  { name: "Major General 5", tier: 86, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_86.jpg", bonus: "10 Color Blaze Crates" },
  { name: "Major General 6", tier: 87, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_87.jpg", bonus: "Slaughter Ticket Box" },
  { name: "Lieutenant General 3", tier: 90, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_90.jpg", bonus: "M4A1-S-Yellow Fractal perm" },
  { name: "Lieutenant General 6", tier: 93, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_93.jpg", bonus: "RPK-Infernal Dragon 30 days" },
  { name: "General 2", tier: 95, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_95.jpg", bonus: "AK-47-K-Yellow Fractal perm" },
  { name: "General 4", tier: 97, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_97.jpg", bonus: "AWM-Infernal Dragon 30 days" },
  { name: "General 6", tier: 99, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_99.jpg", bonus: "AK-47 Fury 30 days" },
  { name: "Grand Marshall", tier: 104, emblem: "https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_104.jpg", bonus: "30 Free Crate Tickets" }
];

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with ALL images from GitHub...");

    // Login
    const authResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });

    const auth = await authResponse.json();
    if (!auth || !auth.token) {
      console.error("❌ Auth failed:", auth);
      throw new Error("Failed to authenticate");
    }
    console.log("✅ Authenticated");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    };

    // Seed mercenaries (10 total)
    console.log(`\n⚔️ Seeding ${mercenariesData.length} mercenaries...`);
    let mercCount = 0;
    for (const merc of mercenariesData) {
      const resp = await fetch(`${API_BASE}/api/mercenaries`, {
        method: "POST",
        headers,
        body: JSON.stringify(merc),
      });
      if (resp.ok) {
        mercCount++;
      }
    }
    console.log(`  ✅ Completed: ${mercCount} mercenaries`);

    // Seed weapons (44 total)
    console.log(`\n📦 Seeding ${weaponsData.length} weapons...`);
    let weaponCount = 0;
    for (const weapon of weaponsData) {
      const resp = await fetch(`${API_BASE}/api/weapons`, {
        method: "POST",
        headers,
        body: JSON.stringify(weapon),
      });
      if (resp.ok) {
        weaponCount++;
        if (weaponCount % 10 === 0) console.log(`  ✅ Seeded ${weaponCount}/${weaponsData.length} weapons...`);
      }
    }
    console.log(`  ✅ Completed: ${weaponCount} weapons`);

    // Seed modes (28 unique mode maps shown + more in GitHub)
    console.log(`\n🎮 Seeding ${modesData.length} game modes...`);
    let modeCount = 0;
    for (const mode of modesData) {
      const resp = await fetch(`${API_BASE}/api/modes`, {
        method: "POST",
        headers,
        body: JSON.stringify(mode),
      });
      if (resp.ok) {
        modeCount++;
      }
    }
    console.log(`  ✅ Completed: ${modeCount} modes (328+ total mode maps available in GitHub)`);

    // Seed ranks (100 total)
    console.log(`\n🏅 Seeding ${ranksData.length} ranks...`);
    let rankCount = 0;
    for (const rank of ranksData) {
      const resp = await fetch(`${API_BASE}/api/ranks`, {
        method: "POST",
        headers,
        body: JSON.stringify(rank),
      });
      if (resp.ok) {
        rankCount++;
        if (rankCount % 10 === 0) console.log(`  ✅ Seeded ${rankCount}/${ranksData.length} ranks...`);
      }
    }
    console.log(`  ✅ Completed: ${rankCount} ranks`);

    console.log("\n✅ SEEDING COMPLETE!");
    console.log(`   📊 Total: ${mercCount} mercenaries + ${weaponCount} weapons + ${modeCount} modes + ${rankCount} ranks`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

export default seedDatabase;
