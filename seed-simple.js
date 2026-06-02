#!/usr/bin/env node
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

const mercenariesData = [
  { id: "1", name: "Wolf", image: "https://files.catbox.moe/6npa73.jpeg", role: "Assault" },
  { id: "2", name: "Vipers", image: "https://files.catbox.moe/4il6hi.jpeg", role: "Sniper" },
  { id: "3", name: "Sisterhood", image: "https://files.catbox.moe/3o58nb.jpeg", role: "Medic" },
  { id: "4", name: "Black Mamba", image: "https://files.catbox.moe/r26ox6.jpeg", role: "Scout" },
  { id: "5", name: "Arch Honorary", image: "https://files.catbox.moe/ctwnqz.jpeg", role: "Guardian" },
  { id: "6", name: "Desperado", image: "https://files.catbox.moe/hh7h5u.jpeg", role: "Engineer" },
  { id: "7", name: "Ronin", image: "https://files.catbox.moe/eck3jc.jpeg", role: "Samurai" },
  { id: "8", name: "Dean", image: "https://files.catbox.moe/t78mvu.jpeg", role: "Specialist" },
  { id: "9", name: "Thoth", image: "https://files.catbox.moe/g4zfzn.jpeg", role: "Guardian" },
  { id: "10", name: "SFG", image: "https://files.catbox.moe/3bba2g.jpeg", role: "Special Forces" },
];

const weaponsData = [
  { name: "Weapon 1", image: "https://files.catbox.moe/oshs66.png", damage: 45, recoil: 12 },
  { name: "Weapon 2", image: "https://files.catbox.moe/y5xyvh.png", damage: 48, recoil: 14 },
  { name: "Weapon 3", image: "https://files.catbox.moe/dikemy.png", damage: 42, recoil: 10 },
  { name: "Weapon 4", image: "https://files.catbox.moe/m7ii5b.png", damage: 50, recoil: 15 },
  { name: "Weapon 5", image: "https://files.catbox.moe/2hx3cf.png", damage: 40, recoil: 8 },
  { name: "Weapon 6", image: "https://files.catbox.moe/5r592p.png", damage: 46, recoil: 11 },
  { name: "Weapon 7", image: "https://files.catbox.moe/obytvu.png", damage: 44, recoil: 13 },
  { name: "Weapon 8", image: "https://files.catbox.moe/0dp3c2.png", damage: 47, recoil: 12 },
  { name: "Weapon 9", image: "https://files.catbox.moe/7mo6zg.png", damage: 49, recoil: 14 },
  { name: "Weapon 10", image: "https://files.catbox.moe/5wvixf.png", damage: 43, recoil: 9 },
  { name: "Weapon 11", image: "https://files.catbox.moe/nd0e8l.png", damage: 51, recoil: 16 },
  { name: "Weapon 12", image: "https://files.catbox.moe/z4auy7.png", damage: 45, recoil: 12 },
  { name: "Weapon 13", image: "https://files.catbox.moe/8qkl0a.png", damage: 48, recoil: 13 },
  { name: "Weapon 14", image: "https://files.catbox.moe/4o20pn.png", damage: 46, recoil: 11 },
  { name: "Weapon 15", image: "https://files.catbox.moe/bpa85i.png", damage: 44, recoil: 10 },
  { name: "Weapon 16", image: "https://files.catbox.moe/mx62ji.png", damage: 50, recoil: 15 },
  { name: "Weapon 17", image: "https://files.catbox.moe/g1ng1o.png", damage: 47, recoil: 12 },
  { name: "Weapon 18", image: "https://files.catbox.moe/t02svh.png", damage: 49, recoil: 14 },
  { name: "Weapon 19", image: "https://files.catbox.moe/vf910w.png", damage: 43, recoil: 9 },
  { name: "Weapon 20", image: "https://files.catbox.moe/jfuae1.png", damage: 45, recoil: 11 },
  { name: "Weapon 21", image: "https://files.catbox.moe/avqjsd.png", damage: 48, recoil: 13 },
  { name: "Weapon 22", image: "https://files.catbox.moe/9yfkfq.png", damage: 51, recoil: 16 },
  { name: "Weapon 23", image: "https://files.catbox.moe/irpla6.png", damage: 46, recoil: 12 },
  { name: "Weapon 24", image: "https://files.catbox.moe/outzzz.png", damage: 44, recoil: 10 },
  { name: "Weapon 25", image: "https://files.catbox.moe/2catwt.jpeg", damage: 47, recoil: 11 },
  { name: "Weapon 26", image: "https://files.catbox.moe/f3esjq.png", damage: 49, recoil: 14 },
  { name: "Weapon 27", image: "https://files.catbox.moe/j7z531.jpeg", damage: 50, recoil: 15 },
  { name: "Weapon 28", image: "https://files.catbox.moe/xb2ftb.png", damage: 42, recoil: 8 },
];

const modesData = [
  { name: "Peak Pursuit Roadmap", image: "https://files.catbox.moe/wof38b.jpeg" },
  { name: "Team Deathmatch - Air Force One", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_AirForceOne_01.jpg.jpeg" },
  { name: "Team Deathmatch - Bank", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Bank_01.jpg.jpeg" },
  { name: "Mutation - Twisted Mansion", image: "https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/MHMX_TwistedMansion_01.jpg.jpeg" },
];

const ranksData = Array.from({ length: 100 }, (_, i) => ({
  name: `Rank ${i + 1}`,
  tier: i + 1,
  emblem: `https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/ranks/rank_${i + 1}.jpg.jpeg`,
}));

async function seedDatabase() {
  try {
    console.log("🔄 Starting seeding...\n");

    console.log(`Connecting to: ${API_BASE}/api/auth/login`);
    const authRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: ADMIN_PASSWORD }),
    });

    console.log(`Auth response status: ${authRes.status}`);
    const auth = await authRes.json();
    console.log(`Auth response:`, auth);
    if (!auth.token) throw new Error("Auth failed");
    console.log("✅ Authenticated\n");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`,
    };

    // Seed mercenaries
    console.log(`⚔️ Seeding ${mercenariesData.length} mercenaries...`);
    let mc = 0;
    for (const m of mercenariesData) {
      const r = await fetch(`${API_BASE}/api/mercenaries`, { method: "POST", headers, body: JSON.stringify(m) });
      if (r.ok) mc++;
    }
    console.log(`✅ Seeded ${mc} mercenaries\n`);

    // Seed weapons
    console.log(`📦 Seeding ${weaponsData.length} weapons...`);
    let wc = 0;
    for (const w of weaponsData) {
      const r = await fetch(`${API_BASE}/api/weapons`, { method: "POST", headers, body: JSON.stringify(w) });
      if (r.ok) wc++;
    }
    console.log(`✅ Seeded ${wc} weapons\n`);

    // Seed modes
    console.log(`🎮 Seeding ${modesData.length} modes...`);
    let md = 0;
    for (const m of modesData) {
      const r = await fetch(`${API_BASE}/api/modes`, { method: "POST", headers, body: JSON.stringify(m) });
      if (r.ok) md++;
    }
    console.log(`✅ Seeded ${md} modes\n`);

    // Seed ranks
    console.log(`🏅 Seeding ${ranksData.length} ranks...`);
    let rc = 0;
    for (const r of ranksData) {
      const res = await fetch(`${API_BASE}/api/ranks`, { method: "POST", headers, body: JSON.stringify(r) });
      if (res.ok) rc++;
      if (rc % 25 === 0) console.log(`  ✅ ${rc}/${ranksData.length} ranks...`);
    }
    console.log(`✅ Seeded ${rc} ranks\n`);

    console.log("✅ SEEDING COMPLETE!");
    console.log(`📊 Total: ${mc} mercenaries + ${wc} weapons + ${md} modes + ${rc} ranks\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

seedDatabase();
