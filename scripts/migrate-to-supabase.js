/**
 * Migration script: Seeds all rescued data into Supabase
 * Run: node scripts/migrate-to-supabase.js
 * 
 * Data sources recovered from project files:
 * - 49 weapons with local images (attached_assets/weapons_data.json)
 * - 3590 weapons from wiki (weapons-all-data.json)
 * - 312 maps (cf_maps_data.json)
 * - 7 game modes (backend-deploy-full/scraped_data.json)
 * - FAQ data (backend-deploy-full/data/faq-data.json)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qywburkldwdkegztsgjj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY is required to run migrations.');
  console.error('   Get it from: https://supabase.com/dashboard/project/qywburkldwdkegztsgjj/settings/api');
  console.error('   Then run: SUPABASE_SERVICE_KEY=your_key node scripts/migrate-to-supabase.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function slugify(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function batchInsert(table, rows, batchSize = 100) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.error(`  ⚠️  Batch error in ${table}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }
  return inserted;
}

// ─── Weapons ────────────────────────────────────────────────────────────────
async function migrateWeapons() {
  console.log('\n📦 Migrating weapons...');
  
  // Use full wiki weapons (3590 entries with Fandom images)
  const wikiPath = path.join(__dirname, '..', 'weapons-all-data.json');
  const localPath = path.join(__dirname, '..', 'attached_assets', 'weapons_data.json');
  
  let weapons = [];
  
  if (fs.existsSync(wikiPath)) {
    const raw = JSON.parse(fs.readFileSync(wikiPath, 'utf-8'));
    weapons = Array.isArray(raw) ? raw : [];
    console.log(`  Found ${weapons.length} wiki weapons`);
  }
  
  // Also add local weapons with better images where available
  const localImageBase = 'https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/attached_assets/scraped_weapons/';
  if (fs.existsSync(localPath)) {
    const localData = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
    const localWeapons = localData.weapons || [];
    // Merge: local weapons override wiki if same name
    const wikiMap = new Map(weapons.map(w => [w.name.toLowerCase(), w]));
    for (const lw of localWeapons) {
      const existing = wikiMap.get(lw.name.toLowerCase());
      if (existing) {
        existing.image = localImageBase + lw.image.split('/').pop();
      }
    }
    console.log(`  Enhanced ${localWeapons.length} weapons with local images`);
  }
  
  const rows = weapons.map(w => ({
    name: String(w.name || ''),
    image_url: String(w.image || ''),
    background_url: '',
    category: String(w.category || 'Uncategorized'),
    description: String(w.description || `${w.name} - CrossFire weapon`),
    stats: {},
  }));
  
  const inserted = await batchInsert('weapons', rows);
  console.log(`  ✅ Inserted ${inserted} weapons`);
}

// ─── Modes ──────────────────────────────────────────────────────────────────
async function migrateModes() {
  console.log('\n🎮 Migrating game modes...');
  
  const scrapedPath = path.join(__dirname, '..', 'backend-deploy-full', 'scraped_data.json');
  
  const officialModes = [
    { name: 'Team Deathmatch', category: 'Standard', description: 'Two teams battle to score kills. First to reach the kill limit wins.', type: 'competitive' },
    { name: 'Search and Destroy', category: 'Standard', description: 'BL plants a bomb; GR must defuse it or eliminate all enemies.', type: 'competitive' },
    { name: 'Ghost Mode', category: 'Ghost Mode', description: 'Invisible ghost soldiers vs visible soldiers.', type: 'competitive' },
    { name: 'Zombie Mode', category: 'Zombie Mode', description: 'Survive waves of zombie attacks.', type: 'cooperative' },
    { name: 'Mutation Mode', category: 'Mutation', description: 'Players who die become mutants. Survivors must hold out.', type: 'competitive' },
    { name: 'Hero Mode', category: 'Hero Mode', description: 'One hero vs mutants. The hero has special abilities.', type: 'competitive' },
    { name: 'Elimination', category: 'Standard', description: 'Classic elimination match, no respawns until round ends.', type: 'competitive' },
    { name: 'Free For All', category: 'Standard', description: 'Every player for themselves, highest kills wins.', type: 'competitive' },
    { name: 'Stealth Mission', category: 'Special', description: 'Complete mission objectives stealthily.', type: 'cooperative' },
    { name: 'Wave Mode', category: 'Zombie Mode', description: 'Survive endless waves of zombie enemies with your team.', type: 'cooperative' },
    { name: 'Escape Mode', category: 'Special', description: 'Infected must stop survivors from escaping. Survivors must reach the exit.', type: 'competitive' },
    { name: 'Sniper Mode', category: 'Standard', description: 'Sniper rifles only. Precision shooting battle.', type: 'competitive' },
  ];
  
  let extraModes = [];
  if (fs.existsSync(scrapedPath)) {
    const scraped = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
    if (scraped.modes) {
      const existingNames = new Set(officialModes.map(m => m.name.toLowerCase()));
      for (const m of scraped.modes) {
        if (!existingNames.has(m.name.toLowerCase())) {
          extraModes.push({ name: m.name, category: m.category || 'Standard', description: m.description || '', type: 'competitive' });
        }
      }
    }
  }
  
  const allModes = [...officialModes, ...extraModes];
  const rows = allModes.map(m => ({
    name: m.name,
    image_url: m.image || '',
    description: m.description,
    type: m.type || 'competitive',
    category: m.category,
  }));
  
  const inserted = await batchInsert('modes', rows);
  console.log(`  ✅ Inserted ${inserted} modes`);
}

// ─── Maps ────────────────────────────────────────────────────────────────────
async function migrateMaps() {
  console.log('\n🗺️  Migrating maps...');
  
  const mapsPath = path.join(__dirname, '..', 'cf_maps_data.json');
  
  if (!fs.existsSync(mapsPath)) {
    console.log('  ⚠️  cf_maps_data.json not found, skipping.');
    return;
  }
  
  const raw = JSON.parse(fs.readFileSync(mapsPath, 'utf-8'));
  const maps = raw.items || [];
  
  const rows = maps.map(m => ({
    name: String(m.name || ''),
    image_url: String(m.image_url || m.thumbnail_url || ''),
    description: String(m.description || ''),
    mode: '',
    category: 'Official',
    wiki_url: String(m.wiki_url || ''),
  }));
  
  const inserted = await batchInsert('maps', rows, 50);
  console.log(`  ✅ Inserted ${inserted} maps`);
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
async function migrateFAQ() {
  console.log('\n❓ Migrating FAQ...');
  
  const faqPath = path.join(__dirname, '..', 'backend-deploy-full', 'data', 'faq-data.json');
  
  if (!fs.existsSync(faqPath)) {
    console.log('  ⚠️  faq-data.json not found, skipping.');
    return;
  }
  
  const categories = JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    
    // Insert category
    const { data: catRow, error: catErr } = await supabase
      .from('faq_categories')
      .upsert([{
        slug: cat.id,
        name: cat.name,
        name_ar: cat.nameAr || '',
        sort_order: i,
      }], { onConflict: 'slug' })
      .select()
      .single();
    
    if (catErr) {
      console.error(`  ⚠️  Category error (${cat.name}):`, catErr.message);
      continue;
    }
    
    // Insert articles for this category
    const articles = (cat.articles || []).map((a, j) => ({
      category_id: catRow.id,
      title: String(a.title || '').substring(0, 500),
      title_ar: String(a.titleAr || ''),
      body: String(a.body || ''),
      body_ar: String(a.bodyAr || ''),
      sort_order: j,
    }));
    
    if (articles.length > 0) {
      const { error: artErr } = await supabase.from('faq_articles').insert(articles);
      if (artErr) console.error(`  ⚠️  Articles error (${cat.name}):`, artErr.message);
    }
    
    console.log(`  ✅ FAQ: ${cat.name} (${articles.length} articles)`);
  }
}

// ─── Ranks ───────────────────────────────────────────────────────────────────
async function migrateRanks() {
  console.log('\n🏆 Migrating ranks...');
  
  const rankBaseUrl = 'https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/ranks/';
  
  const ranks = [
    { name: 'Private 1', tier: 1 }, { name: 'Private 2', tier: 2 }, { name: 'Private 3', tier: 3 },
    { name: 'Corporal 1', tier: 4 }, { name: 'Corporal 2', tier: 5 }, { name: 'Corporal 3', tier: 6 },
    { name: 'Sergeant 1', tier: 7 }, { name: 'Sergeant 2', tier: 8 }, { name: 'Sergeant 3', tier: 9 },
    { name: 'Staff Sergeant 1', tier: 10 }, { name: 'Staff Sergeant 2', tier: 11 }, { name: 'Staff Sergeant 3', tier: 12 },
    { name: 'Master Sergeant 1', tier: 13 }, { name: 'Master Sergeant 2', tier: 14 }, { name: 'Master Sergeant 3', tier: 15 },
    { name: 'Warrant Officer 1', tier: 16 }, { name: 'Warrant Officer 2', tier: 17 }, { name: 'Warrant Officer 3', tier: 18 },
    { name: 'Second Lieutenant 1', tier: 19 }, { name: 'Second Lieutenant 2', tier: 20 }, { name: 'Second Lieutenant 3', tier: 21 },
    { name: 'First Lieutenant 1', tier: 22 }, { name: 'First Lieutenant 2', tier: 23 }, { name: 'First Lieutenant 3', tier: 24 },
    { name: 'Captain 1', tier: 25 }, { name: 'Captain 2', tier: 26 }, { name: 'Captain 3', tier: 27 },
    { name: 'Major 1', tier: 28 }, { name: 'Major 2', tier: 29 }, { name: 'Major 3', tier: 30 },
    { name: 'Lieutenant Colonel 1', tier: 31 }, { name: 'Lieutenant Colonel 2', tier: 32 }, { name: 'Lieutenant Colonel 3', tier: 33 },
    { name: 'Colonel 1', tier: 34 }, { name: 'Colonel 2', tier: 35 }, { name: 'Colonel 3', tier: 36 },
    { name: 'Brigadier General 1', tier: 37 }, { name: 'Brigadier General 2', tier: 38 }, { name: 'Brigadier General 3', tier: 39 },
    { name: 'Major General 1', tier: 40 }, { name: 'Major General 2', tier: 41 }, { name: 'Major General 3', tier: 42 },
    { name: 'Lieutenant General 1', tier: 43 }, { name: 'Lieutenant General 2', tier: 44 }, { name: 'Lieutenant General 3', tier: 45 },
    { name: 'General 1', tier: 46 }, { name: 'General 2', tier: 47 }, { name: 'General 3', tier: 48 },
    { name: 'Four Star General 1', tier: 49 }, { name: 'Four Star General 2', tier: 50 }, { name: 'Four Star General 3', tier: 51 },
    { name: 'Commander', tier: 52 }, { name: 'Grand Commander', tier: 53 },
  ];
  
  const rows = ranks.map(r => ({
    name: r.name,
    tier: r.tier,
    image_url: '',
    description: `CrossFire rank: ${r.name}`,
    requirements: '',
    bonus: '',
    exp_required: r.tier * 1000,
  }));
  
  const inserted = await batchInsert('ranks', rows);
  console.log(`  ✅ Inserted ${inserted} ranks`);
}

// ─── Mercenaries ─────────────────────────────────────────────────────────────
async function migrateMercenaries() {
  console.log('\n⚔️  Migrating mercenaries...');
  
  const mercs = [
    { name: 'Wolf', image_url: 'https://files.catbox.moe/6npa73.jpeg', role: 'Assault', sounds: [], order_index: 1 },
    { name: 'Vipers', image_url: 'https://files.catbox.moe/4il6hi.jpeg', role: 'Recon', sounds: [], order_index: 2 },
    { name: 'Sisterhood', image_url: 'https://files.catbox.moe/3o58nb.jpeg', role: 'Support', sounds: [], order_index: 3 },
    { name: 'Black Mamba', image_url: 'https://files.catbox.moe/r26ox6.jpeg', role: 'Assault', sounds: [], order_index: 4 },
    { name: 'Arch Honorary', image_url: 'https://files.catbox.moe/ctwnqz.jpeg', role: 'Elite', sounds: [], order_index: 5 },
    { name: 'Desperado', image_url: 'https://files.catbox.moe/hh7h5u.jpeg', role: 'Assault', sounds: [], order_index: 6 },
    { name: 'Ronin', image_url: 'https://files.catbox.moe/eck3jc.jpeg', role: 'Recon', sounds: [], order_index: 7 },
    { name: 'Dean', image_url: 'https://files.catbox.moe/t78mvu.jpeg', role: 'Support', sounds: [], order_index: 8 },
    { name: 'Thoth', image_url: 'https://files.catbox.moe/g4zfzn.jpeg', role: 'Elite', sounds: [], order_index: 9 },
    { name: 'SFG', image_url: 'https://files.catbox.moe/3bba2g.jpeg', role: 'Assault', sounds: [], order_index: 10 },
  ];
  
  const inserted = await batchInsert('mercenaries', mercs);
  console.log(`  ✅ Inserted ${inserted} mercenaries`);
}

// ─── Site Settings ────────────────────────────────────────────────────────────
async function migrateSiteSettings() {
  console.log('\n⚙️  Migrating site settings...');
  const { error } = await supabase.from('site_settings').upsert([{
    review_verification_enabled: false,
    announcements_enabled: true,
    seo_title: 'CrossFire Wiki - The Ultimate CrossFire Gaming Resource',
    seo_description: 'Comprehensive CrossFire wiki with weapons, maps, modes, ranks, mercenaries, events, and community.',
    seo_keywords: ['CrossFire', 'CF wiki', 'CrossFire weapons', 'CrossFire modes', 'CrossFire ranks', 'CF mercenaries'],
    robots: 'index, follow',
    featured_weapons: [],
    public_base_url: '',
  }]);
  if (error) console.error('  ⚠️  Settings error:', error.message);
  else console.log('  ✅ Site settings inserted');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 CrossFire Wiki → Supabase Migration');
  console.log('=======================================');
  
  try {
    await migrateWeapons();
    await migrateModes();
    await migrateMaps();
    await migrateFAQ();
    await migrateRanks();
    await migrateMercenaries();
    await migrateSiteSettings();
    
    console.log('\n✅ Migration complete!');
    console.log('   Your data is now in Supabase at:');
    console.log('   https://supabase.com/dashboard/project/qywburkldwdkegztsgjj/editor');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

main();
