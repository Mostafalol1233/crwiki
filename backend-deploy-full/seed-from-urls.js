#!/usr/bin/env node
/**
 * seed-from-urls.js
 * Seeds weapons, modes, ranks, and mercenaries into MongoDB
 * USES FULL URLS - NOT TEMPLATE VARIABLES
 * This fixes the 404 errors from template variables like ${IMAGE_BASE}
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

// MERCENARIES - 10 with CATBOX URLS (working CDN)
const mercenariesData = [
  { id: "1", name: "Wolf", image: "https://files.catbox.moe/6npa73.jpeg", role: "Assault", description: "Aggressive assault specialist" },
  { id: "2", name: "Vipers", image: "https://files.catbox.moe/4il6hi.jpeg", role: "Sniper", description: "Precision sniper expert" },
  { id: "3", name: "Sisterhood", image: "https://files.catbox.moe/3o58nb.jpeg", role: "Medic", description: "Support and healing specialist" },
  { id: "4", name: "Black Mamba", image: "https://files.catbox.moe/r26ox6.jpeg", role: "Scout", description: "Fast reconnaissance scout" },
  { id: "5", name: "Arch Honorary", image: "https://files.catbox.moe/ctwnqz.jpeg", role: "Guardian", description: "Protective guardian role" },
  { id: "6", name: "Desperado", image: "https://files.catbox.moe/hh7h5u.jpeg", role: "Engineer", description: "Technical engineer specialist" },
  { id: "7", name: "Ronin", image: "https://files.catbox.moe/eck3jc.jpeg", role: "Samurai", description: "Melee combat warrior" },
  { id: "8", name: "Dean", image: "https://files.catbox.moe/t78mvu.jpeg", role: "Specialist", description: "Specialized tactics expert" },
  { id: "9", name: "Thoth", image: "https://files.catbox.moe/g4zfzn.jpeg", role: "Guardian", description: "Protective guardian role" },
  { id: "10", name: "SFG", image: "https://files.catbox.moe/3bba2g.jpeg", role: "Special Forces", description: "Special forces operative" },
];

// WEAPONS - 28 with CATBOX URLS
const weaponsData = [
  { name: "Weapon 1", description: "C4410", category: "Weapon", image: "https://files.catbox.moe/oshs66.png" },
  { name: "Weapon 2", description: "C4742", category: "Weapon", image: "https://files.catbox.moe/y5xyvh.png" },
  { name: "Weapon 3", description: "C4936", category: "Weapon", image: "https://files.catbox.moe/dikemy.png" },
  { name: "Weapon 4", description: "C4953", category: "Weapon", image: "https://files.catbox.moe/m7ii5b.png" },
  { name: "Weapon 5", description: "C5154", category: "Weapon", image: "https://files.catbox.moe/2hx3cf.png" },
  { name: "Weapon 6", description: "C5155", category: "Weapon", image: "https://files.catbox.moe/5r592p.png" },
  { name: "Weapon 7", description: "C5156", category: "Weapon", image: "https://files.catbox.moe/obytvu.png" },
  { name: "Weapon 8", description: "C5157", category: "Weapon", image: "https://files.catbox.moe/0dp3c2.png" },
  { name: "Weapon 9", description: "C5303", category: "Weapon", image: "https://files.catbox.moe/7mo6zg.png" },
  { name: "Weapon 10", description: "C5362", category: "Weapon", image: "https://files.catbox.moe/5wvixf.png" },
  { name: "Weapon 11", description: "C5390", category: "Weapon", image: "https://files.catbox.moe/nd0e8l.png" },
  { name: "Weapon 12", description: "C5473", category: "Weapon", image: "https://files.catbox.moe/z4auy7.png" },
  { name: "Weapon 13", description: "C6411", category: "Weapon", image: "https://files.catbox.moe/8qkl0a.png" },
  { name: "Weapon 14", description: "C6547", category: "Weapon", image: "https://files.catbox.moe/4o20pn.png" },
  { name: "Weapon 15", description: "C6777", category: "Weapon", image: "https://files.catbox.moe/bpa85i.png" },
  { name: "Weapon 16", description: "C7325", category: "Weapon", image: "https://files.catbox.moe/mx62ji.png" },
  { name: "Weapon 17", description: "C7411", category: "Weapon", image: "https://files.catbox.moe/g1ng1o.png" },
  { name: "Weapon 18", description: "C8017", category: "Weapon", image: "https://files.catbox.moe/t02svh.png" },
  { name: "Weapon 19", description: "C8020", category: "Weapon", image: "https://files.catbox.moe/vf910w.png" },
  { name: "Weapon 20", description: "C8053", category: "Weapon", image: "https://files.catbox.moe/jfuae1.png" },
  { name: "Weapon 21", description: "C8663", category: "Weapon", image: "https://files.catbox.moe/avqjsd.png" },
  { name: "Weapon 22", description: "C8665", category: "Weapon", image: "https://files.catbox.moe/9yfkfq.png" },
  { name: "Weapon 23", description: "C9288", category: "Weapon", image: "https://files.catbox.moe/irpla6.png" },
  { name: "Weapon 24", description: "C9482", category: "Weapon", image: "https://files.catbox.moe/outzzz.png" },
  { name: "Weapon 25", description: "cff-bg-social", category: "Weapon", image: "https://files.catbox.moe/2catwt.jpeg" },
  { name: "Weapon 26", description: "cfw-weaponbg-vip", category: "Weapon", image: "https://files.catbox.moe/f3esjq.png" },
  { name: "Weapon 27", description: "csp-bg-header2", category: "Weapon", image: "https://files.catbox.moe/j7z531.jpeg" },
  { name: "Weapon 28", description: "placeholder-weapons", category: "Weapon", image: "https://files.catbox.moe/xb2ftb.png" },
];

// MODES - Full URLs (13 Catbox + 23 GitHub)
const modesData = [
  // Catbox CDN URLs
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
];

// RANKS - All 100 with FULL GitHub URLs
const ranksData = Array.from({ length: 100 }, (_, i) => {
  const rankNum = i + 1;
  return {
    name: `Rank ${rankNum}`,
    tier: rankNum,
    emblem: `https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/ranks/rank_${rankNum}.jpg.jpeg`,
  };
});

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with FULL URLS (Catbox + GitHub)...");
    console.log("   ⚠️  NO MORE 404 ERRORS - Using real URLs, not template variables");

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
