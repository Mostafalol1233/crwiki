import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qywburkldwdkegztsgjj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Real data scraped from https://crossfire.z8games.com/ranks.html on 2026-07-22
const Z8 = 'https://z8games.akamaized.net/cfna/templates/assets/imgs/';

const REAL_RANKS = [
  { tier: 1,   name: 'Trainee 1',             exp_required: 0,         bonus: '' },
  { tier: 2,   name: 'Trainee 2',             exp_required: 457,       bonus: 'Smile Grenade 7 days' },
  { tier: 3,   name: 'Private',               exp_required: 913,       bonus: 'Boost Box 3 days' },
  { tier: 4,   name: 'Private First Class',   exp_required: 1825,      bonus: 'Starter Weapon Box 3 days' },
  { tier: 5,   name: 'Corporal',              exp_required: 3193,      bonus: 'Pottery Boost Box 7 days' },
  { tier: 6,   name: 'Sergeant 1',            exp_required: 5017,      bonus: 'Camo Box 7 days' },
  { tier: 7,   name: 'Sergeant 2',            exp_required: 7297,      bonus: '' },
  { tier: 8,   name: 'Sergeant 3',            exp_required: 10033,     bonus: '' },
  { tier: 9,   name: 'Sergeant 4',            exp_required: 13225,     bonus: '30,000 GP' },
  { tier: 10,  name: 'Staff Sergeant 1',      exp_required: 17785,     bonus: 'Red Dragon Box 7 days' },
  { tier: 11,  name: 'Staff Sergeant 2',      exp_required: 23941,     bonus: '' },
  { tier: 12,  name: 'Staff Sergeant 3',      exp_required: 33061,     bonus: '' },
  { tier: 13,  name: 'Staff Sergeant 4',      exp_required: 43093,     bonus: 'VIP Weapon Box 3 days' },
  { tier: 14,  name: 'Staff Sergeant 5',      exp_required: 54037,     bonus: '' },
  { tier: 15,  name: 'Staff Sergeant 6',      exp_required: 65893,     bonus: 'Red SMOKE 30 days' },
  { tier: 16,  name: 'Sergeant First Class 1',exp_required: 78661,     bonus: '' },
  { tier: 17,  name: 'Sergeant First Class 2',exp_required: 92341,     bonus: '30,000 GP' },
  { tier: 18,  name: 'Sergeant First Class 3',exp_required: 106933,    bonus: '' },
  { tier: 19,  name: 'Sergeant First Class 4',exp_required: 122437,    bonus: 'AK-47-K-Yellow Fractal 14 days' },
  { tier: 20,  name: 'Sergeant First Class 5',exp_required: 138853,    bonus: '' },
  { tier: 21,  name: 'Sergeant First Class 6',exp_required: 156181,    bonus: 'B.C-Axe-Ares 7 days' },
  { tier: 22,  name: 'Master Sergeant 1',     exp_required: 174421,    bonus: '' },
  { tier: 23,  name: 'Master Sergeant 2',     exp_required: 193573,    bonus: 'M4A1-S-Yellow Fractal 14 days' },
  { tier: 24,  name: 'Master Sergeant 3',     exp_required: 213637,    bonus: '' },
  { tier: 25,  name: 'Master Sergeant 4',     exp_required: 234613,    bonus: 'Barrett M82A1-Royal Dragon 7 days' },
  { tier: 26,  name: 'Master Sergeant 5',     exp_required: 256501,    bonus: '' },
  { tier: 27,  name: 'Master Sergeant 6',     exp_required: 279301,    bonus: 'Sidearm Box 7 days' },
  { tier: 28,  name: 'Second Lieutenant 1',   exp_required: 326725,    bonus: '' },
  { tier: 29,  name: 'Second Lieutenant 2',   exp_required: 375973,    bonus: 'M4A1-S-Yellow Fractal 30 days' },
  { tier: 30,  name: 'Second Lieutenant 3',   exp_required: 427045,    bonus: '' },
  { tier: 31,  name: 'Second Lieutenant 4',   exp_required: 479941,    bonus: 'Throw Weapon Box 30 days' },
  { tier: 32,  name: 'Second Lieutenant 5',   exp_required: 534661,    bonus: '' },
  { tier: 33,  name: 'Second Lieutenant 6',   exp_required: 591205,    bonus: 'KAC Chainsaw-Ancient Dragon 30 days' },
  { tier: 34,  name: 'Second Lieutenant 7',   exp_required: 649573,    bonus: '' },
  { tier: 35,  name: 'Second Lieutenant 8',   exp_required: 709765,    bonus: 'Kukri-Royal Dragon 30 days' },
  { tier: 36,  name: 'First Lieutenant 1',    exp_required: 771781,    bonus: '' },
  { tier: 37,  name: 'First Lieutenant 2',    exp_required: 835621,    bonus: 'AK-47-K-Yellow Fractal 30 days' },
  { tier: 38,  name: 'First Lieutenant 3',    exp_required: 901285,    bonus: '' },
  { tier: 39,  name: 'First Lieutenant 4',    exp_required: 968773,    bonus: 'Bulletproof Package 30 days' },
  { tier: 40,  name: 'First Lieutenant 5',    exp_required: 1038085,   bonus: '' },
  { tier: 41,  name: 'First Lieutenant 6',    exp_required: 1109221,   bonus: 'Rifle Box 30 days' },
  { tier: 42,  name: 'First Lieutenant 7',    exp_required: 1182181,   bonus: 'Blue Muzzle Flame 30 days' },
  { tier: 43,  name: 'First Lieutenant 8',    exp_required: 1256965,   bonus: '' },
  { tier: 44,  name: 'Captain 1',             exp_required: 1333573,   bonus: '' },
  { tier: 45,  name: 'Captain 2',             exp_required: 1412005,   bonus: '30,000 GP' },
  { tier: 46,  name: 'Captain 3',             exp_required: 1492261,   bonus: '' },
  { tier: 47,  name: 'Captain 4',             exp_required: 1574341,   bonus: 'CFWE Pistol Ticket 30 days' },
  { tier: 48,  name: 'Captain 5',             exp_required: 1658245,   bonus: '' },
  { tier: 49,  name: 'Captain 6',             exp_required: 1743973,   bonus: 'Yellow Smoke 30 days' },
  { tier: 50,  name: 'Captain 7',             exp_required: 1831525,   bonus: '' },
  { tier: 51,  name: 'Captain 8',             exp_required: 1920901,   bonus: 'Green Muzzle Flame 30 days' },
  { tier: 52,  name: 'Major 1',               exp_required: 2057701,   bonus: '30,000 GP' },
  { tier: 53,  name: 'Major 2',               exp_required: 2107237,   bonus: '' },
  { tier: 54,  name: 'Major 3',               exp_required: 2339509,   bonus: 'Mutant Box 30 days' },
  { tier: 55,  name: 'Major 4',               exp_required: 2484517,   bonus: '' },
  { tier: 56,  name: 'Major 5',               exp_required: 2632261,   bonus: '' },
  { tier: 57,  name: 'Major 6',               exp_required: 2782741,   bonus: 'CFWE Sniper Ticket 30 days' },
  { tier: 58,  name: 'Major 7',               exp_required: 2935957,   bonus: 'Octane Camo Grenade 30 days' },
  { tier: 59,  name: 'Major 8',               exp_required: 3091909,   bonus: 'CFWE MG Ticket 30 days' },
  { tier: 60,  name: 'Lieutenant Colonel 1',  exp_required: 3277045,   bonus: '' },
  { tier: 61,  name: 'Lieutenant Colonel 2',  exp_required: 3465373,   bonus: 'Bulletproof Package 30 days' },
  { tier: 62,  name: 'Lieutenant Colonel 3',  exp_required: 3673537,   bonus: 'CFWE SMG Ticket 30 days' },
  { tier: 63,  name: 'Lieutenant Colonel 4',  exp_required: 3885178,   bonus: 'M4A1 Custom-Octane Camo 30 days' },
  { tier: 64,  name: 'Lieutenant Colonel 5',  exp_required: 4100296,   bonus: '' },
  { tier: 65,  name: 'Lieutenant Colonel 6',  exp_required: 4318891,   bonus: 'CFWE Rifle Ticket 30 days' },
  { tier: 66,  name: 'Lieutenant Colonel 7',  exp_required: 4540963,   bonus: '' },
  { tier: 67,  name: 'Lieutenant Colonel 8',  exp_required: 4766512,   bonus: '10 Horus Crates' },
  { tier: 68,  name: 'Colonel 1',             exp_required: 5028199,   bonus: '' },
  { tier: 69,  name: 'Colonel 2',             exp_required: 5319184,   bonus: '' },
  { tier: 70,  name: 'Colonel 3',             exp_required: 5614501,   bonus: 'M4A1-S-Yellow Fractal 60 days' },
  { tier: 71,  name: 'Colonel 4',             exp_required: 5914150,   bonus: '' },
  { tier: 72,  name: 'Colonel 5',             exp_required: 6218131,   bonus: 'BC Axe-Octane Camo 30 days' },
  { tier: 73,  name: 'Colonel 6',             exp_required: 6526501,   bonus: '' },
  { tier: 74,  name: 'Colonel 7',             exp_required: 6839203,   bonus: 'Character Box 30 days' },
  { tier: 75,  name: 'Colonel 8',             exp_required: 7156237,   bonus: '10 Octane Crates' },
  { tier: 76,  name: 'Brigadier General 1',   exp_required: 7578037,   bonus: '' },
  { tier: 77,  name: 'Brigadier General 2',   exp_required: 8026912,   bonus: '' },
  { tier: 78,  name: 'Brigadier General 3',   exp_required: 8481772,   bonus: '' },
  { tier: 79,  name: 'Brigadier General 4',   exp_required: 8964562,   bonus: 'AK-47-K-Yellow Fractal 60 days' },
  { tier: 80,  name: 'Brigadier General 5',   exp_required: 9475852,   bonus: '' },
  { tier: 81,  name: 'Brigadier General 6',   exp_required: 10016212,  bonus: '30 x 7th Anniversary Crates' },
  { tier: 82,  name: 'Major General 1',       exp_required: 10586212,  bonus: '' },
  { tier: 83,  name: 'Major General 2',       exp_required: 11186422,  bonus: 'G-Yellow Crystal perm' },
  { tier: 84,  name: 'Major General 3',       exp_required: 11817412,  bonus: '' },
  { tier: 85,  name: 'Major General 4',       exp_required: 12479752,  bonus: '' },
  { tier: 86,  name: 'Major General 5',       exp_required: 13174012,  bonus: '10 Color Blaze Crates' },
  { tier: 87,  name: 'Major General 6',       exp_required: 13900762,  bonus: 'Slaughter Ticket Box' },
  { tier: 88,  name: 'Lieutenant General 1',  exp_required: 14660572,  bonus: '' },
  { tier: 89,  name: 'Lieutenant General 2',  exp_required: 15454012,  bonus: '' },
  { tier: 90,  name: 'Lieutenant General 3',  exp_required: 16281652,  bonus: 'M4A1-S-Yellow Fractal perm' },
  { tier: 91,  name: 'Lieutenant General 4',  exp_required: 17144062,  bonus: '' },
  { tier: 92,  name: 'Lieutenant General 5',  exp_required: 18041812,  bonus: '' },
  { tier: 93,  name: 'Lieutenant General 6',  exp_required: 18975472,  bonus: 'RPK-Infernal Dragon 30 days' },
  { tier: 94,  name: 'General 1',             exp_required: 19945612,  bonus: '' },
  { tier: 95,  name: 'General 2',             exp_required: 20952802,  bonus: 'AK-47-K-Yellow Fractal perm' },
  { tier: 96,  name: 'General 3',             exp_required: 21997612,  bonus: '' },
  { tier: 97,  name: 'General 4',             exp_required: 23080612,  bonus: 'AWM-Infernal Dragon 30 days' },
  { tier: 98,  name: 'General 5',             exp_required: 24202372,  bonus: '' },
  { tier: 99,  name: 'General 6',             exp_required: 25363462,  bonus: 'AK-47 Fury 30 days' },
  { tier: 100, name: 'Marshall',              exp_required: 26564452,  bonus: '' },
  { tier: 104, name: 'Grand Marshall',        exp_required: 100000000, bonus: '30 Free Crate Tickets' },
];

// Map to Supabase row shape
const rows = REAL_RANKS.map(r => ({
  tier: r.tier,
  name: r.name,
  exp_required: r.exp_required,
  bonus: r.bonus,
  image_url: `${Z8}rank_${r.tier}.jpg`,
}));

console.log(`Upserting ${rows.length} ranks into Supabase...`);

// Delete all existing ranks first, then insert fresh
const { error: delErr } = await supabase.from('ranks').delete().gte('tier', 0);
if (delErr) {
  console.error('❌ Delete failed:', delErr.message);
  process.exit(1);
}
console.log('✓ Cleared existing ranks');

// Insert in batches of 20
const BATCH = 20;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase.from('ranks').insert(batch);
  if (error) {
    console.error(`❌ Insert failed at batch starting ${i}:`, error.message);
    process.exit(1);
  }
  console.log(`✓ Inserted tiers ${batch[0].tier}–${batch[batch.length-1].tier}`);
}

console.log('\n✅ Done! All real rank data from z8games.com is now in Supabase.');
console.log(`   Total: ${rows.length} ranks seeded`);
console.log(`   EXP range: 0 → 100,000,000 (Grand Marshall)`);
