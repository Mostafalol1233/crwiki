import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '..', 'attached_assets', 'weapons_data.json');
const API_BASE = process.env.API_URL || 'http://localhost:20032';

async function seedWeapons() {
  console.log('=== Weapons Seeding Script ===');
  console.log(`Reading weapons from: ${DATA_FILE}`);
  console.log(`API Base: ${API_BASE}`);
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('Weapons data file not found. Run scrape-weapons.js first.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const weapons = data.weapons || [];
  
  console.log(`Found ${weapons.length} weapons to seed`);
  
  const weaponsPayload = weapons.map(w => ({
    name: w.name,
    image: w.image,
    category: w.category,
    description: w.description || `CrossFire weapon - ${w.name}`
  }));
  
  console.log('\nWeapons to be added:');
  weaponsPayload.forEach((w, i) => {
    console.log(`  ${i + 1}. ${w.name} (${w.category})`);
  });
  
  console.log('\n=== Ready to Seed ===');
  console.log('To seed these weapons to your backend, use one of these methods:');
  console.log('\n1. Via API (if backend is running):');
  console.log(`   curl -X POST ${API_BASE}/api/weapons/bulk-create \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"weapons": ${JSON.stringify(weaponsPayload).substring(0, 100)}...}'`);
  console.log('\n2. Or use this Node.js script with fetch when backend is running:');
  console.log('   node scripts/seed-weapons.js --execute');
  
  if (process.argv.includes('--execute')) {
    console.log('\n=== Executing seed... ===');
    try {
      const response = await fetch(`${API_BASE}/api/weapons/bulk-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weapons: weaponsPayload })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.json();
      console.log('Seed completed!', result);
    } catch (err) {
      console.error('Seed failed:', err.message);
      console.log('\nMake sure the backend is running at', API_BASE);
    }
  }
  
  const outputFile = path.join(__dirname, '..', 'attached_assets', 'weapons_seed_payload.json');
  fs.writeFileSync(outputFile, JSON.stringify({ weapons: weaponsPayload }, null, 2));
  console.log(`\nSeed payload saved to: ${outputFile}`);
  console.log('You can use this file to manually POST to /api/weapons/bulk-create');
  
  return weaponsPayload;
}

seedWeapons().catch(console.error);
