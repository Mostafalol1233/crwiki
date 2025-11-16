#!/usr/bin/env node
/**
 * convert-urls-to-seed.js
 * Converts catbox-urls.txt output into a complete seed-from-urls.js file
 * 
 * Usage:
 *   1. Run: .\catbox-upload.ps1
 *   2. Creates: catbox-urls.txt
 *   3. Run: node convert-urls-to-seed.js
 *   4. Creates: seed-from-urls.js with all URLs filled in!
 */

import fs from 'fs';
import path from 'path';

const inputFile = './catbox-urls.txt';
const outputFile = './backend-deploy-full/seed-from-urls.js';

// Parse the catbox-urls.txt file
function parseUrls() {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    console.error('   First run: .\\catbox-upload.ps1');
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l);

  const urls = {
    mercenaries: {},
    weapons: {},
    modes: {},
    ranks: {}
  };

  lines.forEach(line => {
    const [type, filename, url] = line.split(':');
    if (!url || !url.startsWith('http')) return;

    switch (type) {
      case 'MERC':
        const mercName = filename.replace('merc-', '').replace('.jpg', '');
        urls.mercenaries[mercName] = url;
        break;
      case 'WEAPON':
        urls.weapons[filename] = url;
        break;
      case 'MODE':
        urls.modes[filename] = url;
        break;
      case 'RANK':
        urls.ranks[filename] = url;
        break;
    }
  });

  return urls;
}

// Generate mercenary entries
function generateMercenaries(urls) {
  const mercNames = ['wolf', 'vipers', 'sisterhood', 'blackmamba', 'desperado', 'ronin', 'sfg', 'thoth', 'archhonorary', 'dean'];
  const roles = ['Assault', 'Sniper', 'Medic', 'Scout', 'Tank', 'Engineer', 'Samurai', 'Specialist', 'Guardian', 'Special Forces'];
  const descriptions = [
    'Aggressive assault specialist',
    'Precision sniper expert',
    'Support and healing specialist',
    'Fast reconnaissance scout',
    'Heavy armor tank',
    'Technical engineer specialist',
    'Melee combat warrior',
    'Specialized tactics expert',
    'Protective guardian role',
    'Special forces operative'
  ];

  let code = '// MERCENARIES - 10 unique mercenary characters with Catbox URLs\n';
  code += 'const mercenariesData = [\n';

  mercNames.forEach((name, i) => {
    const url = urls.mercenaries[name] || `https://files.catbox.moe/MISSING_${name}.jpg`;
    const capitalName = name.split(/(?=[A-Z])/).join(' ').replace(/\b\w/g, l => l.toUpperCase());
    code += `  { id: "${i + 1}", name: "${capitalName}", image: "${url}", role: "${roles[i]}", description: "${descriptions[i]}" },\n`;
  });

  code += '];\n\n';
  return code;
}

// Generate weapon entries
function generateWeapons(urls) {
  let code = '// ALL weapon images (44 files) with Catbox URLs\n';
  code += 'const weaponsData = [\n';

  let count = 1;
  Object.entries(urls.weapons).forEach(([file, url]) => {
    code += `  { name: "Weapon ${count}", description: "${file}", category: "Weapon", image: "${url}" },\n`;
    count++;
  });

  code += '];\n\n';
  return code;
}

// Generate mode entries
function generateModes(urls) {
  const modeNames = {
    'TDM_AirForceOne_01.jpg.jpeg': 'Team Deathmatch - Air Force One',
    'TDM_AlleyMarket_01.jpg.jpeg': 'Team Deathmatch - Alley Market',
    'TDM_Aquarium_01.jpg.jpeg': 'Team Deathmatch - Aquarium',
    'TDM_Arena_01.jpg.jpeg': 'Team Deathmatch - Arena',
    'TDM_Bank_01.jpg.jpeg': 'Team Deathmatch - Bank',
    'TDM_Bridge_01.jpg.jpeg': 'Team Deathmatch - Bridge',
    'TDM_Cairo_01.jpg.jpeg': 'Team Deathmatch - Cairo',
    'TDM_ChinaTown_01.jpg.jpeg': 'Team Deathmatch - China Town',
    'TDM_City_01.jpg.jpeg': 'Team Deathmatch - City',
    'TDM_Docks_01.jpg.jpeg': 'Team Deathmatch - Docks',
    'TDM_Factory_01.jpg.jpeg': 'Team Deathmatch - Factory',
    'TDM_Favela_01.jpg.jpeg': 'Team Deathmatch - Favela',
    'TDM_Fortress_01.jpg.jpeg': 'Team Deathmatch - Fortress',
    'TDM_Harbor_01.jpg.jpeg': 'Team Deathmatch - Harbor',
    'TDM_Mexico_01.jpg.jpeg': 'Team Deathmatch - Mexico',
    'TDM_Prison_01.jpg.jpeg': 'Team Deathmatch - Prison',
    'TDM_RedSquare_01.jpg.jpeg': 'Team Deathmatch - Red Square',
    'TDM_Sewers_01.jpg.jpeg': 'Team Deathmatch - Sewers',
    'TDM_Ship_01.jpg.jpeg': 'Team Deathmatch - Ship',
    'TDM_Stadium_01.jpg.jpeg': 'Team Deathmatch - Stadium',
    'TDM_Riverside_01.jpg.jpeg': 'Team Deathmatch - Riverside',
    'TDM_Gallery_01.jpg.jpeg': 'Team Deathmatch - Gallery',
    'TDM_Egypt_01.jpg.jpeg': 'Team Deathmatch - Egypt',
    'MHMX_TwistedMansion_01.jpg.jpeg': 'Mutation - Twisted Mansion',
    'MHMX_Void2_01.jpg.jpeg': 'Mutation - Void',
    'MHX_Colony_01.jpg.jpeg': 'Mutation - Colony',
    'GM_Laboratory_04.jpg.jpeg': 'Ghost Mode - Laboratory',
    'SND_Ankara3_01.jpg.jpeg': 'Bomb Mode - Ankara',
    'SND_CentralStation01.jpg.jpeg': 'Bomb Mode - Central Station',
    'SND_Port2_01.jpg.jpeg': 'Bomb Mode - Port',
    'ELM_ShootingCenter01.jpg.jpeg': 'Elimination - Shooting Center',
    'FFA_Farm.jpg.jpeg': 'Free For All - Farm',
    'ZM1_MetalRage_01.jpg.jpeg': 'Zombie Mode - Metal Rage',
    'ZM1_EvilDen_01.jpg.jpeg': 'Zombie Mode - Evil Den',
    'KEM_SkyBuilding_01.jpg.jpeg': 'Sky Building',
    'AIM_AimMaster_01.jpg.jpeg': 'Aim Master'
  };

  let code = '// Game modes with Catbox URLs\n';
  code += 'const modesData = [\n';

  Object.entries(modeNames).forEach(([file, name]) => {
    const url = urls.modes[file] || `https://files.catbox.moe/MISSING_${file}`;
    code += `  { name: "${name}", image: "${url}" },\n`;
  });

  code += '];\n\n';
  return code;
}

// Generate rank entries
function generateRanks(urls) {
  let code = '// ALL 100 Ranks with Catbox URLs\n';
  code += 'const ranksData = [\n';

  for (let i = 1; i <= 100; i++) {
    const filename = `rank_${i}.jpg.jpeg`;
    const url = urls.ranks[filename] || `https://files.catbox.moe/MISSING_rank_${i}.jpeg`;
    code += `  { name: "Rank ${i}", tier: ${i}, emblem: "${url}" },\n`;
  }

  code += '];\n\n';
  return code;
}

// Generate full seed script
function generateSeedScript(urls) {
  const template = `#!/usr/bin/env node
/**
 * seed-from-urls.js
 * Auto-generated with Catbox.moe URLs
 * Seeds weapons, modes, ranks, and mercenaries into MongoDB from Catbox URLs
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

${generateMercenaries(urls)}
${generateWeapons(urls)}
${generateModes(urls)}
${generateRanks(urls)}

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with Catbox URLs...");

    // Login
    const authResponse = await fetch(\`\${API_BASE}/api/auth/login\`, {
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
      Authorization: \`Bearer \${auth.token}\`,
    };

    // Seed mercenaries
    console.log(\`\\n⚔️ Seeding \${mercenariesData.length} mercenaries...\`);
    let mercCount = 0;
    for (const merc of mercenariesData) {
      const resp = await fetch(\`\${API_BASE}/api/mercenaries\`, {
        method: "POST",
        headers,
        body: JSON.stringify(merc),
      });
      if (resp.ok) mercCount++;
    }
    console.log(\`  ✅ Completed: \${mercCount} mercenaries\`);

    // Seed weapons
    console.log(\`\\n📦 Seeding \${weaponsData.length} weapons...\`);
    let weaponCount = 0;
    for (const weapon of weaponsData) {
      const resp = await fetch(\`\${API_BASE}/api/weapons\`, {
        method: "POST",
        headers,
        body: JSON.stringify(weapon),
      });
      if (resp.ok) {
        weaponCount++;
        if (weaponCount % 10 === 0) console.log(\`  ✅ Seeded \${weaponCount}/\${weaponsData.length} weapons...\`);
      }
    }
    console.log(\`  ✅ Completed: \${weaponCount} weapons\`);

    // Seed modes
    console.log(\`\\n🎮 Seeding \${modesData.length} game modes...\`);
    let modeCount = 0;
    for (const mode of modesData) {
      const resp = await fetch(\`\${API_BASE}/api/modes\`, {
        method: "POST",
        headers,
        body: JSON.stringify(mode),
      });
      if (resp.ok) modeCount++;
    }
    console.log(\`  ✅ Completed: \${modeCount} modes\`);

    // Seed ranks
    console.log(\`\\n🏅 Seeding \${ranksData.length} ranks...\`);
    let rankCount = 0;
    for (const rank of ranksData) {
      const resp = await fetch(\`\${API_BASE}/api/ranks\`, {
        method: "POST",
        headers,
        body: JSON.stringify(rank),
      });
      if (resp.ok) {
        rankCount++;
        if (rankCount % 10 === 0) console.log(\`  ✅ Seeded \${rankCount}/\${ranksData.length} ranks...\`);
      }
    }
    console.log(\`  ✅ Completed: \${rankCount} ranks\`);

    console.log("\\n✅ SEEDING COMPLETE!");
    console.log(\`   📊 Total: \${mercCount} mercenaries + \${weaponCount} weapons + \${modeCount} modes + \${rankCount} ranks\`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

export default seedDatabase;
`;

  return template;
}

// Main
console.log('📝 Converting Catbox URLs to seed script...\n');

try {
  const urls = parseUrls();
  
  console.log(`✅ Parsed from ${inputFile}:`);
  console.log(`   - Mercenaries: ${Object.keys(urls.mercenaries).length}`);
  console.log(`   - Weapons: ${Object.keys(urls.weapons).length}`);
  console.log(`   - Modes: ${Object.keys(urls.modes).length}`);
  console.log(`   - Ranks: ${Object.keys(urls.ranks).length}`);

  const seedScript = generateSeedScript(urls);

  // Ensure directory exists
  const dir = path.dirname(outputFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputFile, seedScript);
  console.log(`\n✅ Generated: ${outputFile}`);
  console.log('\n🚀 Next step: Deploy with AUTO_SEED=true');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
