#!/usr/bin/env node
/**
 * seed-from-urls.js
 * Seeds weapons, modes, and ranks into MongoDB from GitHub URLs.
 * Loads ALL actual game images from the attached_assets folders.
 * Usage: node seed-from-urls.js
 * Requires: ADMIN_PASSWORD and MONGODB_URI env vars.
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";
const IMAGE_BASE = process.env.MERCENARY_IMAGE_BASE || "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets";

// Weapon names mapped to actual image files
const weaponsData = [
  { name: "Pistol", description: "Reliable handgun", category: "Pistol", image: "" },
  { name: "SMG", description: "Submachine gun", category: "SMG", image: "" },
  { name: "Assault Rifle", description: "Balanced automatic rifle", category: "Rifle", image: "" },
  { name: "Shotgun", description: "Close-range powerhouse", category: "Shotgun", image: "" },
  { name: "Sniper Rifle", description: "Long-range precision", category: "Sniper", image: "" },
  { name: "Rocket Launcher", description: "Area damage weapon", category: "Heavy", image: "" },
  { name: "Knife", description: "Melee combat blade", category: "Melee", image: "" },
  { name: "Grenade", description: "Explosive throwable", category: "Equipment", image: "" },
  { name: "Sword", description: "Melee slashing weapon", category: "Melee", image: "" },
  { name: "Crossbow", description: "Silent ranged weapon", category: "Bow", image: "" },
];

// Game mode names - dynamically build from actual files
const modesData = [
  { name: "Team Deathmatch", description: "Classic 5v5 team battle", image: `${IMAGE_BASE}/modes/TDM_Arena_01.jpg.jpeg` },
  { name: "Mutation", description: "Infected vs Humans", image: `${IMAGE_BASE}/modes/MHMX_TwistedMansion_01.jpg.jpeg` },
  { name: "Ghost Mode", description: "Stealth gameplay", image: `${IMAGE_BASE}/modes/GM_Laboratory_04.jpg.jpeg` },
  { name: "Bomb Mode", description: "Plant and defend objective", image: `${IMAGE_BASE}/modes/SND_Laboratory_05.jpg.jpeg` },
  { name: "Elimination", description: "One life per round", image: `${IMAGE_BASE}/modes/ELM_ShootingCenter01.jpg.jpeg` },
  { name: "Free For All", description: "Every player for themselves", image: `${IMAGE_BASE}/modes/FFA_Farm.jpg.jpeg` },
  { name: "Zombie Mode", description: "Survive the undead", image: `${IMAGE_BASE}/modes/ZM1_MetalRage_01.jpg.jpeg` },
  { name: "Sky Building", description: "Build and battle in the sky", image: `${IMAGE_BASE}/modes/KEM_SkyBuilding_01.jpg.jpeg` },
];

// Ranks 1-100 with proper numbering
const ranksData = Array.from({ length: 100 }, (_, i) => {
  const rankNum = i + 1;
  return {
    name: `Rank ${rankNum}`,
    tier: rankNum,
    emblem: `${IMAGE_BASE}/ranks/rank_${rankNum}.jpg.jpeg`,
  };
});

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding from URLs...");

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

    // Seed weapons
    console.log("\n📦 Seeding weapons...");
    for (const weapon of weaponsData) {
      const resp = await fetch(`${API_BASE}/api/weapons`, {
        method: "POST",
        headers,
        body: JSON.stringify(weapon),
      });
      if (resp.ok) {
        console.log(`  ✅ ${weapon.name}`);
      } else {
        console.warn(`  ⚠️ Failed to create ${weapon.name}:`, resp.status);
      }
    }

    // Seed modes
    console.log("\n🎮 Seeding game modes...");
    for (const mode of modesData) {
      const resp = await fetch(`${API_BASE}/api/modes`, {
        method: "POST",
        headers,
        body: JSON.stringify(mode),
      });
      if (resp.ok) {
        console.log(`  ✅ ${mode.name}`);
      } else {
        console.warn(`  ⚠️ Failed to create ${mode.name}:`, resp.status);
      }
    }

    // Seed ranks
    console.log(`\n🏅 Seeding ${ranksData.length} ranks...`);
    let successCount = 0;
    for (const rank of ranksData) {
      const resp = await fetch(`${API_BASE}/api/ranks`, {
        method: "POST",
        headers,
        body: JSON.stringify(rank),
      });
      if (resp.ok) {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  ✅ Seeded ${successCount}/${ranksData.length} ranks...`);
        }
      } else {
        console.warn(`  ⚠️ Failed to create ${rank.name}:`, resp.status);
      }
    }
    console.log(`  ✅ Completed seeding ${successCount} ranks`);

    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

export default seedDatabase;
