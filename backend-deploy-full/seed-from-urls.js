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

// External URLs for mercenary images (point to your image host, CDN, or Vercel frontend)
const MERCENARY_IMAGE_BASE = process.env.MERCENARY_IMAGE_BASE || "https://crossfire.wiki/assets";

const weaponsData = [
  { name: "AK-47", description: "Assault rifle", category: "Rifle", image: `${MERCENARY_IMAGE_BASE}/merc-wolf.jpg` },
  { name: "M4A1", description: "Carbine", category: "Rifle", image: `${MERCENARY_IMAGE_BASE}/merc-vipers.jpg` },
  { name: "AWP Dragon Lore", description: "Sniper rifle", category: "Sniper", image: `${MERCENARY_IMAGE_BASE}/merc-sisterhood.jpg` },
];

const modesData = [
  { name: "Team Deathmatch", description: "Classic 5v5 battle", image: `${MERCENARY_IMAGE_BASE}/merc-blackmamba.jpg` },
  { name: "Mutation", description: "Infected vs humans", image: `${MERCENARY_IMAGE_BASE}/merc-desperado.jpg` },
  { name: "Ghost Mode", description: "Stealth gameplay", image: `${MERCENARY_IMAGE_BASE}/merc-ronin.jpg` },
];

const ranksData = [
  { name: "Private", tier: 1, emblem: `${MERCENARY_IMAGE_BASE}/merc-sfg.jpg` },
  { name: "Sergeant", tier: 5, emblem: `${MERCENARY_IMAGE_BASE}/merc-sisterhood.jpg` },
  { name: "Major", tier: 10, emblem: `${MERCENARY_IMAGE_BASE}/merc-thoth.jpg` },
  { name: "General", tier: 15, emblem: `${MERCENARY_IMAGE_BASE}/merc-dean.jpg` },
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
