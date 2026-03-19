#!/usr/bin/env node
/**
 * EASY CATBOX INTEGRATION GUIDE
 * 
 * Step 1: Upload your images to catbox.moe (one at a time or batch)
 *   - Go to https://catbox.moe
 *   - Upload each image - it will give you a URL like: https://files.catbox.moe/abcd1234.jpg
 *   
 * Step 2: Replace the URLs below
 *   - Find each category section (Mercenaries, Weapons, Modes, Ranks)
 *   - Replace the placeholder URLs with your actual catbox URLs
 *   
 * Step 3: Save and run
 *   - AUTO_SEED=true npm run dev (on Katabump) or normal seeding
 */

import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

// ============================================
// 🎯 MERCENARIES - 10 characters
// ============================================
const mercenariesData = [
  { 
    id: "1", 
    name: "Wolf", 
    image: "https://files.catbox.moe/REPLACE_WOLF_URL.jpg", 
    role: "Assault", 
    description: "Aggressive assault specialist" 
  },
  { 
    id: "2", 
    name: "Vipers", 
    image: "https://files.catbox.moe/REPLACE_VIPERS_URL.jpg", 
    role: "Sniper", 
    description: "Precision sniper expert" 
  },
  { 
    id: "3", 
    name: "Sisterhood", 
    image: "https://files.catbox.moe/REPLACE_SISTERHOOD_URL.jpg", 
    role: "Medic", 
    description: "Support and healing specialist" 
  },
  { 
    id: "4", 
    name: "Black Mamba", 
    image: "https://files.catbox.moe/REPLACE_BLACKMAMBA_URL.jpg", 
    role: "Scout", 
    description: "Fast reconnaissance scout" 
  },
  { 
    id: "5", 
    name: "Arch Honorary", 
    image: "https://files.catbox.moe/REPLACE_ARCHHONORARY_URL.jpg", 
    role: "Tank", 
    description: "Heavy armor tank" 
  },
  { 
    id: "6", 
    name: "Desperado", 
    image: "https://files.catbox.moe/REPLACE_DESPERADO_URL.jpg", 
    role: "Engineer", 
    description: "Technical engineer specialist" 
  },
  { 
    id: "7", 
    name: "Ronin", 
    image: "https://files.catbox.moe/REPLACE_RONIN_URL.jpg", 
    role: "Samurai", 
    description: "Melee combat warrior" 
  },
  { 
    id: "8", 
    name: "Dean", 
    image: "https://files.catbox.moe/REPLACE_DEAN_URL.jpg", 
    role: "Specialist", 
    description: "Specialized tactics expert" 
  },
  { 
    id: "9", 
    name: "Thoth", 
    image: "https://files.catbox.moe/REPLACE_THOTH_URL.jpg", 
    role: "Guardian", 
    description: "Protective guardian role" 
  },
  { 
    id: "10", 
    name: "SFG", 
    image: "https://files.catbox.moe/REPLACE_SFG_URL.jpg", 
    role: "Special Forces", 
    description: "Special forces operative" 
  },
];

// ============================================
// 🎯 WEAPONS - 44 total
// ============================================
const weaponsData = [
  { name: "Weapon 1", description: "C4410", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_1_URL.png" },
  { name: "Weapon 2", description: "C4742", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_2_URL.png" },
  { name: "Weapon 3", description: "C4936", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_3_URL.png" },
  { name: "Weapon 4", description: "C4953", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_4_URL.png" },
  { name: "Weapon 5", description: "C5154", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_5_URL.png" },
  { name: "Weapon 6", description: "C5155", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_6_URL.png" },
  { name: "Weapon 7", description: "C5156", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_7_URL.png" },
  { name: "Weapon 8", description: "C5157", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_8_URL.png" },
  { name: "Weapon 9", description: "C5303", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_9_URL.png" },
  { name: "Weapon 10", description: "C5362", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_10_URL.png" },
  { name: "Weapon 11", description: "C5390", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_11_URL.png" },
  { name: "Weapon 12", description: "C5473", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_12_URL.png" },
  { name: "Weapon 13", description: "C6411", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_13_URL.png" },
  { name: "Weapon 14", description: "C6547", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_14_URL.png" },
  { name: "Weapon 15", description: "C6777", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_15_URL.png" },
  { name: "Weapon 16", description: "C7325", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_16_URL.png" },
  { name: "Weapon 17", description: "C7411", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_17_URL.png" },
  { name: "Weapon 18", description: "C8017", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_18_URL.png" },
  { name: "Weapon 19", description: "C8020", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_19_URL.png" },
  { name: "Weapon 20", description: "C8053", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_20_URL.png" },
  { name: "Weapon 21", description: "C8663", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_21_URL.png" },
  { name: "Weapon 22", description: "C8665", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_22_URL.png" },
  { name: "Weapon 23", description: "C9288", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_23_URL.png" },
  { name: "Weapon 24", description: "C9482", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_24_URL.png" },
  { name: "Weapon 25", description: "placeholder-weapons", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_25_URL.png" },
  { name: "Weapon 26", description: "cfw-weaponbg-vip", category: "Weapon", image: "https://files.catbox.moe/REPLACE_WEAPON_26_URL.png" },
  // Add remaining 18 weapons (27-44) with similar format...
];

// ============================================
// 🎯 GAME MODES - 36+ sample modes
// ============================================
const modesData = [
  { name: "Team Deathmatch - Air Force One", image: "https://files.catbox.moe/REPLACE_TDM_AIRFORCEONE_URL.jpeg" },
  { name: "Team Deathmatch - Alley Market", image: "https://files.catbox.moe/REPLACE_TDM_ALLEYMARKET_URL.jpeg" },
  { name: "Team Deathmatch - Aquarium", image: "https://files.catbox.moe/REPLACE_TDM_AQUARIUM_URL.jpeg" },
  { name: "Team Deathmatch - Arena", image: "https://files.catbox.moe/REPLACE_TDM_ARENA_URL.jpeg" },
  { name: "Team Deathmatch - Bank", image: "https://files.catbox.moe/REPLACE_TDM_BANK_URL.jpeg" },
  { name: "Team Deathmatch - Bridge", image: "https://files.catbox.moe/REPLACE_TDM_BRIDGE_URL.jpeg" },
  { name: "Team Deathmatch - Cairo", image: "https://files.catbox.moe/REPLACE_TDM_CAIRO_URL.jpeg" },
  { name: "Team Deathmatch - China Town", image: "https://files.catbox.moe/REPLACE_TDM_CHINATOWN_URL.jpeg" },
  { name: "Team Deathmatch - City", image: "https://files.catbox.moe/REPLACE_TDM_CITY_URL.jpeg" },
  { name: "Team Deathmatch - Docks", image: "https://files.catbox.moe/REPLACE_TDM_DOCKS_URL.jpeg" },
  { name: "Team Deathmatch - Factory", image: "https://files.catbox.moe/REPLACE_TDM_FACTORY_URL.jpeg" },
  { name: "Team Deathmatch - Favela", image: "https://files.catbox.moe/REPLACE_TDM_FAVELA_URL.jpeg" },
  { name: "Team Deathmatch - Fortress", image: "https://files.catbox.moe/REPLACE_TDM_FORTRESS_URL.jpeg" },
  { name: "Team Deathmatch - Harbor", image: "https://files.catbox.moe/REPLACE_TDM_HARBOR_URL.jpeg" },
  { name: "Team Deathmatch - Mexico", image: "https://files.catbox.moe/REPLACE_TDM_MEXICO_URL.jpeg" },
  { name: "Team Deathmatch - Prison", image: "https://files.catbox.moe/REPLACE_TDM_PRISON_URL.jpeg" },
  { name: "Team Deathmatch - Red Square", image: "https://files.catbox.moe/REPLACE_TDM_REDSQUARE_URL.jpeg" },
  { name: "Team Deathmatch - Sewers", image: "https://files.catbox.moe/REPLACE_TDM_SEWERS_URL.jpeg" },
  { name: "Team Deathmatch - Ship", image: "https://files.catbox.moe/REPLACE_TDM_SHIP_URL.jpeg" },
  { name: "Team Deathmatch - Stadium", image: "https://files.catbox.moe/REPLACE_TDM_STADIUM_URL.jpeg" },
  { name: "Mutation - Twisted Mansion", image: "https://files.catbox.moe/REPLACE_MUTATION_MANSION_URL.jpeg" },
  { name: "Mutation - Void", image: "https://files.catbox.moe/REPLACE_MUTATION_VOID_URL.jpeg" },
  { name: "Ghost Mode - Laboratory", image: "https://files.catbox.moe/REPLACE_GHOST_LAB_URL.jpeg" },
  { name: "Bomb Mode - Ankara", image: "https://files.catbox.moe/REPLACE_BOMB_ANKARA_URL.jpeg" },
  { name: "Elimination - Shooting Center", image: "https://files.catbox.moe/REPLACE_ELIM_SHOOTING_URL.jpeg" },
  { name: "Free For All - Farm", image: "https://files.catbox.moe/REPLACE_FFA_FARM_URL.jpeg" },
  { name: "Zombie Mode - Metal Rage", image: "https://files.catbox.moe/REPLACE_ZOMBIE_METALRAGE_URL.jpeg" },
  { name: "Zombie Mode - Evil Den", image: "https://files.catbox.moe/REPLACE_ZOMBIE_EVILDEN_URL.jpeg" },
  { name: "Sky Building", image: "https://files.catbox.moe/REPLACE_SKYBUILDING_URL.jpeg" },
  { name: "Aim Master", image: "https://files.catbox.moe/REPLACE_AIMMASTER_URL.jpeg" },
];

// ============================================
// 🎯 RANKS - 100 total
// ============================================
const ranksData = Array.from({ length: 100 }, (_, i) => {
  const rankNum = i + 1;
  return {
    name: `Rank ${rankNum}`,
    tier: rankNum,
    emblem: `https://files.catbox.moe/REPLACE_RANK_${rankNum}_URL.jpeg`,
  };
});

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with Catbox URLs...");

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

    // Seed mercenaries
    console.log(`\n⚔️ Seeding ${mercenariesData.length} mercenaries...`);
    let mercCount = 0;
    for (const merc of mercenariesData) {
      const resp = await fetch(`${API_BASE}/api/mercenaries`, {
        method: "POST",
        headers,
        body: JSON.stringify(merc),
      });
      if (resp.ok) mercCount++;
    }
    console.log(`  ✅ Completed: ${mercCount} mercenaries`);

    // Seed weapons
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

    // Seed modes
    console.log(`\n🎮 Seeding ${modesData.length} modes...`);
    let modeCount = 0;
    for (const mode of modesData) {
      const resp = await fetch(`${API_BASE}/api/modes`, {
        method: "POST",
        headers,
        body: JSON.stringify(mode),
      });
      if (resp.ok) modeCount++;
    }
    console.log(`  ✅ Completed: ${modeCount} modes`);

    // Seed ranks
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
