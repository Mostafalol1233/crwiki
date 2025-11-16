#!/usr/bin/env node
/**
 * seed-from-urls.js
 * Seeds weapons, modes, and ranks into MongoDB from external URLs.
 * Usage: node seed-from-urls.js
 * Requires: ADMIN_PASSWORD and MONGODB_URI env vars.
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

// Weapon data - NO IMAGES (to be added separately)
const weaponsData = [
  { name: "AK-47", description: "Automatic Rifle", category: "Rifle", image: "" },
  { name: "M4A1", description: "Carbine Rifle", category: "Rifle", image: "" },
  { name: "AWP Dragon Lore", description: "Sniper Rifle", category: "Sniper", image: "" },
  { name: "Combat Knife", description: "Melee Weapon", category: "Melee", image: "" },
  { name: "USP 45", description: "Pistol", category: "Pistol", image: "" },
  { name: "Grenade", description: "Explosive", category: "Equipment", image: "" },
];

// Game modes data - NO IMAGES (to be added separately)
const modesData = [
  { name: "Team Deathmatch", description: "Classic 5v5 battle", image: "" },
  { name: "Mutation", description: "Infected vs humans", image: "" },
  { name: "Ghost Mode", description: "Stealth vs Ghost", image: "" },
  { name: "Elimination", description: "One life per round", image: "" },
  { name: "Bomb Mode", description: "Plant and defend", image: "" },
  { name: "Training", description: "Solo practice mode", image: "" },
];

// Ranks data - NO EMBLEMS (to be added separately)
const ranksData = [
  { name: "Private", tier: 1, emblem: "" },
  { name: "Corporal", tier: 2, emblem: "" },
  { name: "Sergeant", tier: 3, emblem: "" },
  { name: "Staff Sergeant", tier: 4, emblem: "" },
  { name: "Sergeant Major", tier: 5, emblem: "" },
  { name: "Lieutenant", tier: 6, emblem: "" },
  { name: "Captain", tier: 7, emblem: "" },
  { name: "Major", tier: 8, emblem: "" },
  { name: "Colonel", tier: 9, emblem: "" },
  { name: "General", tier: 10, emblem: "" },
];

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
        const result = await resp.json();
        console.log(`  ✅ ${weapon.name} (${weapon.image})`);
      } else {
        console.warn(`  ⚠️ Failed to create ${weapon.name}:`, resp.status);
      }
    }

    // Seed modes
    console.log("\n🎮 Seeding modes...");
    for (const mode of modesData) {
      const resp = await fetch(`${API_BASE}/api/modes`, {
        method: "POST",
        headers,
        body: JSON.stringify(mode),
      });
      if (resp.ok) {
        const result = await resp.json();
        console.log(`  ✅ ${mode.name}`);
      } else {
        console.warn(`  ⚠️ Failed to create ${mode.name}:`, resp.status);
      }
    }

    // Seed ranks
    console.log("\n🏅 Seeding ranks...");
    for (const rank of ranksData) {
      const resp = await fetch(`${API_BASE}/api/ranks`, {
        method: "POST",
        headers,
        body: JSON.stringify(rank),
      });
      if (resp.ok) {
        const result = await resp.json();
        console.log(`  ✅ ${rank.name}`);
      } else {
        console.warn(`  ⚠️ Failed to create ${rank.name}:`, resp.status);
      }
    }

    console.log("\n✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

export default seedDatabase;
