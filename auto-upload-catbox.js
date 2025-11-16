#!/usr/bin/env node
/**
 * auto-upload-catbox.js
 * Automatically uploads all images to catbox.moe and generates seed-from-catbox.js
 * 
 * Usage: node auto-upload-catbox.js
 * Note: Requires form-data and node-fetch npm packages
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, 'attached_assets');
const CATBOX_API = 'https://catbox.moe/user/api.php';

const urlMap = {
  mercenaries: {},
  weapons: {},
  modes: {},
  ranks: {}
};

async function uploadFile(filePath) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const response = await fetch(CATBOX_API, { method: 'POST', body: form });
    const url = (await response.text()).trim();

    if (!url.startsWith('http')) {
      return null;
    }
    return url;
  } catch (error) {
    return null;
  }
}

async function processMercenaries() {
  console.log('\n⚔️ Processing mercenaries...');
  const mercNames = {
    'merc-wolf.jpg': 'Wolf',
    'merc-vipers.jpg': 'Vipers',
    'merc-sisterhood.jpg': 'Sisterhood',
    'merc-blackmamba.jpg': 'Black Mamba',
    'merc-desperado.jpg': 'Desperado',
    'merc-ronin.jpg': 'Ronin',
    'merc-sfg.jpg': 'SFG',
    'merc-thoth.jpg': 'Thoth',
    'merc-archhonorary.jpg': 'Arch Honorary',
    'merc-dean.jpg': 'Dean'
  };

  for (const [file, name] of Object.entries(mercNames)) {
    const filePath = path.join(ASSETS_DIR, file);
    if (fs.existsSync(filePath)) {
      const url = await uploadFile(filePath);
      if (url) {
        urlMap.mercenaries[name] = url;
        console.log(`  ✅ ${name} uploaded`);
      } else {
        console.log(`  ⚠️ ${name} failed`);
      }
    }
  }
}

async function processWeapons() {
  console.log('\n📦 Processing weapons...');
  const weaponDir = path.join(ASSETS_DIR, 'weapons');
  const files = fs.readdirSync(weaponDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(weaponDir, file);
    const url = await uploadFile(filePath);
    if (url) {
      urlMap.weapons[file] = url;
      if ((i + 1) % 10 === 0) console.log(`  ✅ ${i + 1}/${files.length} weapons uploaded`);
    }
  }
  console.log(`  ✅ Total weapons: ${Object.keys(urlMap.weapons).length}`);
}

async function processModes() {
  console.log('\n🎮 Processing modes...');
  const modeDir = path.join(ASSETS_DIR, 'modes');
  const files = fs.readdirSync(modeDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(modeDir, file);
    const url = await uploadFile(filePath);
    if (url) {
      urlMap.modes[file] = url;
      if ((i + 1) % 50 === 0) console.log(`  ✅ ${i + 1}/${files.length} modes uploaded`);
    }
  }
  console.log(`  ✅ Total modes: ${Object.keys(urlMap.modes).length}`);
}

async function processRanks() {
  console.log('\n🏅 Processing ranks...');
  const rankDir = path.join(ASSETS_DIR, 'ranks');
  const files = fs.readdirSync(rankDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(rankDir, file);
    const url = await uploadFile(filePath);
    if (url) {
      urlMap.ranks[file] = url;
      if ((i + 1) % 10 === 0) console.log(`  ✅ ${i + 1}/${files.length} ranks uploaded`);
    }
  }
  console.log(`  ✅ Total ranks: ${Object.keys(urlMap.ranks).length}`);
}

function generateSeedScript() {
  console.log('\n📝 Generating seed script...');

  // Generate mercenaries array
  let mercCode = '// MERCENARIES - 10 unique mercenary characters\nconst mercenariesData = [\n';
  let mercId = 1;
  for (const [name, url] of Object.entries(urlMap.mercenaries)) {
    const role = ['Assault', 'Sniper', 'Medic', 'Scout', 'Tank', 'Engineer', 'Samurai', 'Specialist', 'Guardian', 'Special Forces'][mercId - 1];
    const desc = {
      'Wolf': 'Aggressive assault specialist',
      'Vipers': 'Precision sniper expert',
      'Sisterhood': 'Support and healing specialist',
      'Black Mamba': 'Fast reconnaissance scout',
      'Arch Honorary': 'Heavy armor tank',
      'Desperado': 'Technical engineer specialist',
      'Ronin': 'Melee combat warrior',
      'Dean': 'Specialized tactics expert',
      'Thoth': 'Protective guardian role',
      'SFG': 'Special forces operative'
    }[name] || 'Mercenary specialist';
    
    mercCode += `  { id: "${mercId}", name: "${name}", image: "${url}", role: "${role}", description: "${desc}" },\n`;
    mercId++;
  }
  mercCode += '];\n';

  // Generate weapons array
  let weapCode = '// ALL weapon images\nconst weaponsData = [\n';
  let wepId = 1;
  for (const [file, url] of Object.entries(urlMap.weapons)) {
    weapCode += `  { name: "Weapon ${wepId}", description: "${file}", category: "Weapon", image: "${url}" },\n`;
    wepId++;
  }
  weapCode += '];\n';

  // Generate modes array
  let modeCode = '// Game modes\nconst modesData = [\n';
  const modeNames = {
    'TDM_AirForceOne_01.jpg.jpeg': 'Team Deathmatch - Air Force One',
    'TDM_AlleyMarket_01.jpg.jpeg': 'Team Deathmatch - Alley Market',
    'TDM_Aquarium_01.jpg.jpeg': 'Team Deathmatch - Aquarium',
    'MHMX_TwistedMansion_01.jpg.jpeg': 'Mutation - Twisted Mansion',
    'GM_Laboratory_04.jpg.jpeg': 'Ghost Mode - Laboratory',
    'ZM1_MetalRage_01.jpg.jpeg': 'Zombie Mode - Metal Rage'
  };
  for (const [file, url] of Object.entries(urlMap.modes).slice(0, 36)) {
    const name = modeNames[file] || file.replace(/.jpg.jpeg$/, '');
    modeCode += `  { name: "${name}", image: "${url}" },\n`;
  }
  modeCode += '];\n';

  // Generate ranks array
  let rankCode = '// ALL 100 Ranks\nconst ranksData = [\n';
  const rankFiles = Object.keys(urlMap.ranks).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)[0]);
    const numB = parseInt(b.match(/\d+/)[0]);
    return numA - numB;
  });
  rankFiles.forEach((file, i) => {
    const rankNum = i + 1;
    rankCode += `  { name: "Rank ${rankNum}", tier: ${rankNum}, emblem: "${urlMap.ranks[file]}" },\n`;
  });
  rankCode += '];\n';

  // Full seed script
  const seedScript = `#!/usr/bin/env node
/**
 * seed-from-catbox.js
 * Auto-generated seed script with Catbox.moe URLs
 */
import "dotenv/config";
import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "http://localhost:20032";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sasasasa";

${mercCode}

${weapCode}

${modeCode}

${rankCode}

async function seedDatabase() {
  try {
    console.log("🔄 Starting database seeding with Catbox URLs...");
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
    console.log(\`\\n🎮 Seeding \${modesData.length} modes...\`);
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

  fs.writeFileSync(path.join(__dirname, 'seed-from-catbox.js'), seedScript);
  console.log('✅ seed-from-catbox.js generated!');
}

async function main() {
  try {
    console.log('🚀 Starting Catbox.moe upload...\n');
    
    await processMercenaries();
    await processWeapons();
    await processModes();
    await processRanks();

    generateSeedScript();

    console.log(`\n✅ Upload complete!`);
    console.log(`📊 Summary:`);
    console.log(`   Mercenaries: ${Object.keys(urlMap.mercenaries).length}`);
    console.log(`   Weapons: ${Object.keys(urlMap.weapons).length}`);
    console.log(`   Modes: ${Object.keys(urlMap.modes).length}`);
    console.log(`   Ranks: ${Object.keys(urlMap.ranks).length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
