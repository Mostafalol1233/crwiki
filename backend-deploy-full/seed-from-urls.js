#!/usr/bin/env node
/**
 * seed-from-urls.js - HYBRID CATBOX + GITHUB URLS
 * Updated: November 16, 2025
 * Using Catbox URLs for mercenaries + weapons
 * GitHub fallback for modes and ranks
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";
const GH_BASE = "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets";

// MERCENARIES - CATBOX URLS (All 10)
const mercenariesData = [
  { id: "1", name: "Wolf", image: "https://files.catbox.moe/6npa73.jpeg", role: "Assault", description: "Aggressive assault specialist" },
  { id: "2", name: "Vipers", image: "https://files.catbox.moe/4il6hi.jpeg", role: "Sniper", description: "Precision sniper expert" },
  { id: "3", name: "Sisterhood", image: "https://files.catbox.moe/3o58nb.jpeg", role: "Medic", description: "Support and healing specialist" },
  { id: "4", name: "Black Mamba", image: "https://files.catbox.moe/r26ox6.jpeg", role: "Scout", description: "Fast reconnaissance scout" },
  { id: "5", name: "Desperado", image: "https://files.catbox.moe/hh7h5u.jpeg", role: "Tank", description: "Heavy armor tank" },
  { id: "6", name: "Ronin", image: "https://files.catbox.moe/eck3jc.jpeg", role: "Engineer", description: "Technical engineer specialist" },
  { id: "7", name: "SFG", image: "https://files.catbox.moe/3bba2g.jpeg", role: "Samurai", description: "Melee combat warrior" },
  { id: "8", name: "Thoth", image: "https://files.catbox.moe/g4zfzn.jpeg", role: "Specialist", description: "Specialized tactics expert" },
  { id: "9", name: "Arch Honorary", image: "https://files.catbox.moe/ctwnqz.jpeg", role: "Guardian", description: "Protective guardian role" },
  { id: "10", name: "Dean", image: "https://files.catbox.moe/t78mvu.jpeg", role: "Special Forces", description: "Special forces operative" },
];

// WEAPONS - CATBOX URLS (28 uploaded successfully)
const weaponsData = [
  { name: "Weapon 1", description: "C4410.png", category: "Weapon", image: "https://files.catbox.moe/oshs66.png" },
  { name: "Weapon 2", description: "C4742.png", category: "Weapon", image: "https://files.catbox.moe/y5xyvh.png" },
  { name: "Weapon 3", description: "C4936.png", category: "Weapon", image: "https://files.catbox.moe/dikemy.png" },
  { name: "Weapon 4", description: "C4953.png", category: "Weapon", image: "https://files.catbox.moe/m7ii5b.png" },
  { name: "Weapon 5", description: "C5154.png", category: "Weapon", image: "https://files.catbox.moe/2hx3cf.png" },
  { name: "Weapon 6", description: "C5155.png", category: "Weapon", image: "https://files.catbox.moe/5r592p.png" },
  { name: "Weapon 7", description: "C5156.png", category: "Weapon", image: "https://files.catbox.moe/obytvu.png" },
  { name: "Weapon 8", description: "C5157.png", category: "Weapon", image: "https://files.catbox.moe/0dp3c2.png" },
  { name: "Weapon 9", description: "C5303.png", category: "Weapon", image: "https://files.catbox.moe/7mo6zg.png" },
  { name: "Weapon 10", description: "C5362.png", category: "Weapon", image: "https://files.catbox.moe/5wvixf.png" },
  { name: "Weapon 11", description: "C5390.png", category: "Weapon", image: "https://files.catbox.moe/nd0e8l.png" },
  { name: "Weapon 12", description: "C5473.png", category: "Weapon", image: "https://files.catbox.moe/z4auy7.png" },
  { name: "Weapon 13", description: "C6411.png", category: "Weapon", image: "https://files.catbox.moe/8qkl0a.png" },
  { name: "Weapon 14", description: "C6547.png", category: "Weapon", image: "https://files.catbox.moe/4o20pn.png" },
  { name: "Weapon 15", description: "C6777.png", category: "Weapon", image: "https://files.catbox.moe/bpa85i.png" },
  { name: "Weapon 16", description: "C7325.png", category: "Weapon", image: "https://files.catbox.moe/mx62ji.png" },
  { name: "Weapon 17", description: "C7411.png", category: "Weapon", image: "https://files.catbox.moe/g1ng1o.png" },
  { name: "Weapon 18", description: "C8017.png", category: "Weapon", image: "https://files.catbox.moe/t02svh.png" },
  { name: "Weapon 19", description: "C8020.png", category: "Weapon", image: "https://files.catbox.moe/vf910w.png" },
  { name: "Weapon 20", description: "C8053.png", category: "Weapon", image: "https://files.catbox.moe/jfuae1.png" },
  { name: "Weapon 21", description: "C8663.png", category: "Weapon", image: "https://files.catbox.moe/avqjsd.png" },
  { name: "Weapon 22", description: "C8665.png", category: "Weapon", image: "https://files.catbox.moe/9yfkfq.png" },
  { name: "Weapon 23", description: "C9288.png", category: "Weapon", image: "https://files.catbox.moe/irpla6.png" },
  { name: "Weapon 24", description: "C9482.png", category: "Weapon", image: "https://files.catbox.moe/outzzz.png" },
  { name: "Weapon 25", description: "cff-bg-social.jpg.jpeg", category: "Weapon", image: "https://files.catbox.moe/2catwt.jpeg" },
  { name: "Weapon 26", description: "cfw-weaponbg-vip.png", category: "Weapon", image: "https://files.catbox.moe/f3esjq.png" },
  { name: "Weapon 27", description: "csp-bg-header2.jpg.jpeg", category: "Weapon", image: "https://files.catbox.moe/j7z531.jpeg" },
  { name: "Weapon 28", description: "placeholder-weapons.png", category: "Weapon", image: "https://files.catbox.moe/xb2ftb.png" },
];

// MODES - Mix of Catbox and GitHub URLs
const modesData = [
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
  { name: "Team Deathmatch - Air Force One", image: `${GH_BASE}/modes/TDM_AirForceOne_01.jpg.jpeg` },
  { name: "Team Deathmatch - Alley Market", image: `${GH_BASE}/modes/TDM_AlleyMarket_01.jpg.jpeg` },
  { name: "Team Deathmatch - Aquarium", image: `${GH_BASE}/modes/TDM_Aquarium_01.jpg.jpeg` },
  { name: "Team Deathmatch - Arena", image: `${GH_BASE}/modes/TDM_Arena_01.jpg.jpeg` },
  { name: "Team Deathmatch - Bank", image: `${GH_BASE}/modes/TDM_Bank_01.jpg.jpeg` },
  { name: "Team Deathmatch - Bridge", image: `${GH_BASE}/modes/TDM_Bridge_01.jpg.jpeg` },
  { name: "Team Deathmatch - Cairo", image: `${GH_BASE}/modes/TDM_Cairo_01.jpg.jpeg` },
  { name: "Team Deathmatch - China Town", image: `${GH_BASE}/modes/TDM_ChinaTown_01.jpg.jpeg` },
  { name: "Team Deathmatch - City", image: `${GH_BASE}/modes/TDM_City_01.jpg.jpeg` },
  { name: "Team Deathmatch - Docks", image: `${GH_BASE}/modes/TDM_Docks_01.jpg.jpeg` },
  { name: "Team Deathmatch - Factory", image: `${GH_BASE}/modes/TDM_Factory_01.jpg.jpeg` },
  { name: "Team Deathmatch - Favela", image: `${GH_BASE}/modes/TDM_Favela_01.jpg.jpeg` },
];

// RANKS - All 100 using GitHub URLs
const ranksData = Array.from({ length: 100 }, (_, i) => {
  const rankNum = i + 1;
  return {
    name: `Rank ${rankNum}`,
    tier: rankNum,
    emblem: `${GH_BASE}/ranks/rank_${rankNum}.jpg.jpeg`,
  };
});

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with CATBOX + GitHub URLs...");

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
    console.log(`   📊 Total: ${weaponCount} weapons + ${modeCount} modes + ${rankCount} ranks`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

export default seedDatabase;
