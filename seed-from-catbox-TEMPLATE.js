#!/usr/bin/env node
/**
 * seed-from-catbox.js
 * Seeds weapons, modes, ranks, and mercenaries into MongoDB using Catbox.moe URLs
 * 
 * To use: Upload images to catbox.moe manually or via API, then replace URLs below
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

// MERCENARIES - 10 unique mercenary characters with Catbox URLs
const mercenariesData = [
  { id: "1", name: "Wolf", image: "https://files.catbox.moe/YOUR_WOLF_ID.jpg", role: "Assault", description: "Aggressive assault specialist" },
  { id: "2", name: "Vipers", image: "https://files.catbox.moe/YOUR_VIPERS_ID.jpg", role: "Sniper", description: "Precision sniper expert" },
  { id: "3", name: "Sisterhood", image: "https://files.catbox.moe/YOUR_SISTERHOOD_ID.jpg", role: "Medic", description: "Support and healing specialist" },
  { id: "4", name: "Black Mamba", image: "https://files.catbox.moe/YOUR_BLACKMAMBA_ID.jpg", role: "Scout", description: "Fast reconnaissance scout" },
  { id: "5", name: "Arch Honorary", image: "https://files.catbox.moe/YOUR_ARCHHONORARY_ID.jpg", role: "Tank", description: "Heavy armor tank" },
  { id: "6", name: "Desperado", image: "https://files.catbox.moe/YOUR_DESPERADO_ID.jpg", role: "Engineer", description: "Technical engineer specialist" },
  { id: "7", name: "Ronin", image: "https://files.catbox.moe/YOUR_RONIN_ID.jpg", role: "Samurai", description: "Melee combat warrior" },
  { id: "8", name: "Dean", image: "https://files.catbox.moe/YOUR_DEAN_ID.jpg", role: "Specialist", description: "Specialized tactics expert" },
  { id: "9", name: "Thoth", image: "https://files.catbox.moe/YOUR_THOTH_ID.jpg", role: "Guardian", description: "Protective guardian role" },
  { id: "10", name: "SFG", image: "https://files.catbox.moe/YOUR_SFG_ID.jpg", role: "Special Forces", description: "Special forces operative" },
];

// ALL weapon images (44 files) - Replace with actual Catbox URLs
const weaponsData = [
  { name: "Weapon 1", description: "C4410", category: "Weapon", image: "https://files.catbox.moe/WEAPON_1_ID.png" },
  { name: "Weapon 2", description: "C4742", category: "Weapon", image: "https://files.catbox.moe/WEAPON_2_ID.png" },
  { name: "Weapon 3", description: "C4936", category: "Weapon", image: "https://files.catbox.moe/WEAPON_3_ID.png" },
  { name: "Weapon 4", description: "C4953", category: "Weapon", image: "https://files.catbox.moe/WEAPON_4_ID.png" },
  { name: "Weapon 5", description: "C5154", category: "Weapon", image: "https://files.catbox.moe/WEAPON_5_ID.png" },
  // ... Add remaining 39 weapons with Catbox URLs
];

// Game modes (36 sample modes) - Replace with actual Catbox URLs
const modesData = [
  { name: "Team Deathmatch - Air Force One", image: "https://files.catbox.moe/TDM_AIRFORCEONE_ID.jpeg" },
  { name: "Team Deathmatch - Alley Market", image: "https://files.catbox.moe/TDM_ALLEYMARKET_ID.jpeg" },
  { name: "Team Deathmatch - Aquarium", image: "https://files.catbox.moe/TDM_AQUARIUM_ID.jpeg" },
  // ... Add remaining 33 modes with Catbox URLs
];

// ALL 100 Ranks with Catbox URLs
const ranksData = Array.from({ length: 100 }, (_, i) => {
  const rankNum = i + 1;
  return {
    name: `Rank ${rankNum}`,
    tier: rankNum,
    emblem: `https://files.catbox.moe/RANK_${rankNum}_ID.jpeg`,
  };
});

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with Catbox.moe URLs...");

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

    // Seed modes (36 shown, 328+ available)
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
    console.log(`  ✅ Completed: ${modeCount} modes (328+ total mode maps available)`);

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
