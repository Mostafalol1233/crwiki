/**
 * CrossFire Real Data Seed Script
 * Seeds accurate ranks (Z8 CDN images), modes (real screenshots), and
 * mercenaries (catbox CDN images) into Supabase.
 *
 * Run:  node scripts/seed-crossfire-data.js
 *       node scripts/seed-crossfire-data.js --only=ranks
 *       node scripts/seed-crossfire-data.js --only=modes
 *       node scripts/seed-crossfire-data.js --only=mercenaries
 */

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://qywburkldwdkegztsgjj.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('❌  SUPABASE_SERVICE_KEY is not set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

// Base URLs
const Z8   = 'https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_'; // {tier}.jpg
const GH   = 'https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets';
const CATBOX = 'https://files.catbox.moe';

// ─── RANKS ───────────────────────────────────────────────────────────────────
// Real CrossFire rank names mapped 1-to-1 with the Z8 CDN image tiers.
// exp_required values are approximate real CrossFire progression requirements.
const RANKS = [
  // ── Trainee ──
  { tier:   1, name: 'Trainee 1',              group: 'Trainee',              bonus: '' },
  { tier:   2, name: 'Trainee 2',              group: 'Trainee',              bonus: 'Smile Grenade 7 days' },
  // ── Private ──
  { tier:   3, name: 'Private',                group: 'Private',              bonus: 'Boost Box 3 days' },
  { tier:   4, name: 'Private First Class',    group: 'Private',              bonus: 'Starter Weapon Box 3 days' },
  // ── Corporal ──
  { tier:   5, name: 'Corporal',               group: 'Corporal',             bonus: 'Pottery Boost Box 7 days' },
  // ── Sergeant ──
  { tier:   6, name: 'Sergeant 1',             group: 'Sergeant',             bonus: 'Camo Box 7 days' },
  { tier:   7, name: 'Sergeant 2',             group: 'Sergeant',             bonus: '' },
  { tier:   8, name: 'Sergeant 3',             group: 'Sergeant',             bonus: '' },
  { tier:   9, name: 'Sergeant 4',             group: 'Sergeant',             bonus: '30,000 GP' },
  // ── Staff Sergeant ──
  { tier:  10, name: 'Staff Sergeant 1',       group: 'Staff Sergeant',       bonus: 'Red Dragon Box 7 days' },
  { tier:  11, name: 'Staff Sergeant 2',       group: 'Staff Sergeant',       bonus: '' },
  { tier:  12, name: 'Staff Sergeant 3',       group: 'Staff Sergeant',       bonus: '' },
  { tier:  13, name: 'Staff Sergeant 4',       group: 'Staff Sergeant',       bonus: 'VIP Weapon Box 3 days' },
  { tier:  14, name: 'Staff Sergeant 5',       group: 'Staff Sergeant',       bonus: '' },
  { tier:  15, name: 'Staff Sergeant 6',       group: 'Staff Sergeant',       bonus: 'Red SMOKE 30 days' },
  // ── Sergeant First Class ──
  { tier:  16, name: 'Sergeant First Class 1', group: 'Sergeant First Class', bonus: '' },
  { tier:  17, name: 'Sergeant First Class 2', group: 'Sergeant First Class', bonus: '30,000 GP' },
  { tier:  18, name: 'Sergeant First Class 3', group: 'Sergeant First Class', bonus: '' },
  { tier:  19, name: 'Sergeant First Class 4', group: 'Sergeant First Class', bonus: 'AK-47-K-Yellow Fractal 14 days' },
  { tier:  20, name: 'Sergeant First Class 5', group: 'Sergeant First Class', bonus: '' },
  { tier:  21, name: 'Sergeant First Class 6', group: 'Sergeant First Class', bonus: 'B.C-Axe-Ares 7 days' },
  // ── Master Sergeant ──
  { tier:  22, name: 'Master Sergeant 1',      group: 'Master Sergeant',      bonus: '' },
  { tier:  23, name: 'Master Sergeant 2',      group: 'Master Sergeant',      bonus: 'M4A1-S-Yellow Fractal 14 days' },
  { tier:  24, name: 'Master Sergeant 3',      group: 'Master Sergeant',      bonus: '' },
  { tier:  25, name: 'Master Sergeant 4',      group: 'Master Sergeant',      bonus: 'Barrett M82A1-Royal Dragon 7 days' },
  { tier:  26, name: 'Master Sergeant 5',      group: 'Master Sergeant',      bonus: '' },
  { tier:  27, name: 'Master Sergeant 6',      group: 'Master Sergeant',      bonus: 'Sidearm Box 7 days' },
  // ── Second Lieutenant ──
  { tier:  28, name: 'Second Lieutenant 1',    group: 'Second Lieutenant',    bonus: '' },
  { tier:  29, name: 'Second Lieutenant 2',    group: 'Second Lieutenant',    bonus: 'M4A1-S-Yellow Fractal 30 days' },
  { tier:  30, name: 'Second Lieutenant 3',    group: 'Second Lieutenant',    bonus: '' },
  { tier:  31, name: 'Second Lieutenant 4',    group: 'Second Lieutenant',    bonus: 'Throw Weapon Box 30 days' },
  { tier:  32, name: 'Second Lieutenant 5',    group: 'Second Lieutenant',    bonus: '' },
  { tier:  33, name: 'Second Lieutenant 6',    group: 'Second Lieutenant',    bonus: 'KAC Chainsaw-Ancient Dragon 30 days' },
  { tier:  34, name: 'Second Lieutenant 7',    group: 'Second Lieutenant',    bonus: '' },
  { tier:  35, name: 'Second Lieutenant 8',    group: 'Second Lieutenant',    bonus: 'Kukri-Royal Dragon 30 days' },
  // ── First Lieutenant ──
  { tier:  36, name: 'First Lieutenant 1',     group: 'First Lieutenant',     bonus: '' },
  { tier:  37, name: 'First Lieutenant 2',     group: 'First Lieutenant',     bonus: 'AK-47-K-Yellow Fractal 30 days' },
  { tier:  38, name: 'First Lieutenant 3',     group: 'First Lieutenant',     bonus: '' },
  { tier:  39, name: 'First Lieutenant 4',     group: 'First Lieutenant',     bonus: 'Bulletproof Package 30 days' },
  { tier:  40, name: 'First Lieutenant 5',     group: 'First Lieutenant',     bonus: '' },
  { tier:  41, name: 'First Lieutenant 6',     group: 'First Lieutenant',     bonus: 'Rifle Box 30 days' },
  { tier:  42, name: 'First Lieutenant 7',     group: 'First Lieutenant',     bonus: 'Blue Muzzle Flame 30 days' },
  { tier:  43, name: 'First Lieutenant 8',     group: 'First Lieutenant',     bonus: '' },
  // ── Captain ──
  { tier:  44, name: 'Captain 1',              group: 'Captain',              bonus: '' },
  { tier:  45, name: 'Captain 2',              group: 'Captain',              bonus: '30,000 GP' },
  { tier:  46, name: 'Captain 3',              group: 'Captain',              bonus: '' },
  { tier:  47, name: 'Captain 4',              group: 'Captain',              bonus: 'CFWE Pistol Ticket 30 days' },
  { tier:  48, name: 'Captain 5',              group: 'Captain',              bonus: '' },
  { tier:  49, name: 'Captain 6',              group: 'Captain',              bonus: 'Yellow Smoke 30 days' },
  { tier:  50, name: 'Captain 7',              group: 'Captain',              bonus: '' },
  { tier:  51, name: 'Captain 8',              group: 'Captain',              bonus: 'Green Muzzle Flame 30 days' },
  // ── Major ──
  { tier:  52, name: 'Major 1',                group: 'Major',                bonus: '30,000 GP' },
  { tier:  53, name: 'Major 2',                group: 'Major',                bonus: '' },
  { tier:  54, name: 'Major 3',                group: 'Major',                bonus: 'Mutant Box 30 days' },
  { tier:  55, name: 'Major 4',                group: 'Major',                bonus: '' },
  { tier:  56, name: 'Major 5',                group: 'Major',                bonus: '' },
  { tier:  57, name: 'Major 6',                group: 'Major',                bonus: 'CFWE Sniper Ticket 30 days' },
  { tier:  58, name: 'Major 7',                group: 'Major',                bonus: 'Octane Camo Grenade 30 days' },
  { tier:  59, name: 'Major 8',                group: 'Major',                bonus: 'CFWE MG Ticket 30 days' },
  // ── Lieutenant Colonel ──
  { tier:  60, name: 'Lieutenant Colonel 1',   group: 'Lieutenant Colonel',   bonus: '' },
  { tier:  61, name: 'Lieutenant Colonel 2',   group: 'Lieutenant Colonel',   bonus: 'Bulletproof Package 30 days' },
  { tier:  62, name: 'Lieutenant Colonel 3',   group: 'Lieutenant Colonel',   bonus: 'CFWE SMG Ticket 30 days' },
  { tier:  63, name: 'Lieutenant Colonel 4',   group: 'Lieutenant Colonel',   bonus: 'M4A1 Custom-Octane Camo 30 days' },
  { tier:  64, name: 'Lieutenant Colonel 5',   group: 'Lieutenant Colonel',   bonus: '' },
  { tier:  65, name: 'Lieutenant Colonel 6',   group: 'Lieutenant Colonel',   bonus: 'CFWE Rifle Ticket 30 days' },
  { tier:  66, name: 'Lieutenant Colonel 7',   group: 'Lieutenant Colonel',   bonus: '' },
  { tier:  67, name: 'Lieutenant Colonel 8',   group: 'Lieutenant Colonel',   bonus: '10 Horus Crates' },
  // ── Colonel ──
  { tier:  68, name: 'Colonel 1',              group: 'Colonel',              bonus: '' },
  { tier:  69, name: 'Colonel 2',              group: 'Colonel',              bonus: '' },
  { tier:  70, name: 'Colonel 3',              group: 'Colonel',              bonus: 'M4A1-S-Yellow Fractal 60 days' },
  { tier:  71, name: 'Colonel 4',              group: 'Colonel',              bonus: '' },
  { tier:  72, name: 'Colonel 5',              group: 'Colonel',              bonus: 'BC Axe-Octane Camo 30 days' },
  { tier:  73, name: 'Colonel 6',              group: 'Colonel',              bonus: '' },
  { tier:  74, name: 'Colonel 7',              group: 'Colonel',              bonus: 'Character Box 30 days' },
  { tier:  75, name: 'Colonel 8',              group: 'Colonel',              bonus: '10 Octane Crates' },
  // ── Brigadier General ──
  { tier:  76, name: 'Brigadier General 1',    group: 'Brigadier General',    bonus: '' },
  { tier:  77, name: 'Brigadier General 2',    group: 'Brigadier General',    bonus: '' },
  { tier:  78, name: 'Brigadier General 3',    group: 'Brigadier General',    bonus: '' },
  { tier:  79, name: 'Brigadier General 4',    group: 'Brigadier General',    bonus: 'AK-47-K-Yellow Fractal 60 days' },
  { tier:  80, name: 'Brigadier General 5',    group: 'Brigadier General',    bonus: '' },
  { tier:  81, name: 'Brigadier General 6',    group: 'Brigadier General',    bonus: '30 x 7th Anniversary Crates' },
  // ── Major General ──
  { tier:  82, name: 'Major General 1',        group: 'Major General',        bonus: '' },
  { tier:  83, name: 'Major General 2',        group: 'Major General',        bonus: 'G-Yellow Crystal perm' },
  { tier:  84, name: 'Major General 3',        group: 'Major General',        bonus: '' },
  { tier:  85, name: 'Major General 4',        group: 'Major General',        bonus: '' },
  { tier:  86, name: 'Major General 5',        group: 'Major General',        bonus: '10 Color Blaze Crates' },
  { tier:  87, name: 'Major General 6',        group: 'Major General',        bonus: 'Slaughter Ticket Box' },
  // ── Lieutenant General ──
  { tier:  88, name: 'Lieutenant General 1',   group: 'Lieutenant General',   bonus: '' },
  { tier:  89, name: 'Lieutenant General 2',   group: 'Lieutenant General',   bonus: '' },
  { tier:  90, name: 'Lieutenant General 3',   group: 'Lieutenant General',   bonus: 'M4A1-S-Yellow Fractal perm' },
  { tier:  91, name: 'Lieutenant General 4',   group: 'Lieutenant General',   bonus: '' },
  { tier:  92, name: 'Lieutenant General 5',   group: 'Lieutenant General',   bonus: '' },
  { tier:  93, name: 'Lieutenant General 6',   group: 'Lieutenant General',   bonus: 'RPK-Infernal Dragon 30 days' },
  // ── General ──
  { tier:  94, name: 'General 1',              group: 'General',              bonus: '' },
  { tier:  95, name: 'General 2',              group: 'General',              bonus: 'AK-47-K-Yellow Fractal perm' },
  { tier:  96, name: 'General 3',              group: 'General',              bonus: '' },
  { tier:  97, name: 'General 4',              group: 'General',              bonus: 'AWM-Infernal Dragon 30 days' },
  { tier:  98, name: 'General 5',              group: 'General',              bonus: '' },
  { tier:  99, name: 'General 6',              group: 'General',              bonus: 'AK-47 Fury 30 days' },
  { tier: 100, name: 'General 7',              group: 'General',              bonus: '' },
  // ── Grand Marshall (top rank) ──
  { tier: 104, name: 'Grand Marshall',         group: 'Grand Marshall',       bonus: '30 Free Crate Tickets' },
];

// ─── MODES ───────────────────────────────────────────────────────────────────
// All use image_url column. Images are GitHub raw URLs; the Modes page also
// falls back to keyword-matched images when the URL doesn't resolve.
const MODES = [
  {
    name: 'Team Deathmatch',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    description: 'Two teams of Black List and Global Risk fight in direct combat. The team that reaches the kill limit first wins. The most popular and iconic CrossFire mode.',
  },
  {
    name: 'Search & Destroy',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/SND_Ankara3_01.jpg.jpeg`,
    description: 'Black List must plant and detonate a bomb at one of two bomb sites. Global Risk must defuse it or eliminate all enemies. No respawns — every life counts.',
  },
  {
    name: 'Ghost Mode',
    type: 'competitive',
    category: 'Ghost Mode',
    image: `${GH}/modes/GM_Laboratory_04.jpg.jpeg`,
    description: 'Black List soldiers turn nearly invisible when moving slowly. Global Risk must rely on footsteps, shadows, and sharp awareness to find and eliminate them.',
  },
  {
    name: 'Zombie Mode',
    type: 'cooperative',
    category: 'Zombie Mode',
    image: `${GH}/modes/ZM1_EvilDen_01.jpg.jpeg`,
    description: 'Cooperate with teammates to survive relentless waves of zombie enemies. Use powerful weapons and teamwork to fend off the undead until the final wave is cleared.',
  },
  {
    name: 'Mutation Mode',
    type: 'competitive',
    category: 'Mutation',
    image: `${GH}/modes/MHMX_TwistedMansion_01.jpg.jpeg`,
    description: 'Players who die transform into powerful mutants with enhanced speed and strength. Human survivors must hold out until the timer expires.',
  },
  {
    name: 'Hero Mode',
    type: 'competitive',
    category: 'Hero Mode',
    image: `${GH}/modes/MHX_Colony_01.jpg.jpeg`,
    description: 'One player is chosen as the Hero with special abilities and a powerful weapon. The other players start as mutants and must eliminate the Hero before time runs out.',
  },
  {
    name: 'Free For All',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/FFA_Farm.jpg.jpeg`,
    description: 'Every player fights for themselves — no teams, no allies. The player with the most kills when time expires wins. Pure individual skill.',
  },
  {
    name: 'Elimination',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/ELM_ShootingCenter01.jpg.jpeg`,
    description: 'No respawns until the round ends. The last team standing wins. Methodical play and teamwork are essential.',
  },
  {
    name: 'Escape Mode',
    type: 'competitive',
    category: 'Escape',
    image: `${GH}/modes/MESC_LucidDream_00.jpg.jpeg`,
    description: 'Human survivors must reach the extraction zone while infected mutants try to stop them. Plan your route and work together to escape.',
  },
  {
    name: 'Ranked Zombie Mode',
    type: 'competitive',
    category: 'Zombie Mode',
    image: `${GH}/modes/RZM_Dystopia_thumb.jpg.jpeg`,
    description: 'A competitive ranked version of Zombie Mode where performance directly affects your rating. Fight your way up the zombie ranked ladder.',
  },
  {
    name: 'Sniper Mode',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/SIN_Laboratory_05.jpg.jpeg`,
    description: 'Sniper rifles only. Long-range precision and quick reflexes determine the winner in this focused, skill-testing mode.',
  },
  {
    name: 'Stealth Deathmatch',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/STDM_Fort_01.jpg.jpeg`,
    description: 'A Deathmatch variant with stealth mechanics. Move slowly to stay off the minimap — combine tactical awareness with aggressive combat.',
  },
  {
    name: 'Aim Training',
    type: 'training',
    category: 'Training',
    image: `${GH}/modes/AIM_AimMaster_01.jpg.jpeg`,
    description: 'Sharpen your accuracy with dedicated aim training exercises. Practice tracking, flick shots, and reaction time to improve your gameplay.',
  },
  // ── Additional modes ──
  {
    name: 'Giant Mode',
    type: 'cooperative',
    category: 'Co-op',
    image: `${GH}/modes/ZM1_EvilDen_01.jpg.jpeg`,
    description: 'Take on enormous mutant giants with powerful health pools and devastating attacks. Coordinate with your team to bring these massive enemies down before they wipe the squad.',
  },
  {
    name: 'Crystal Defend',
    type: 'cooperative',
    category: 'Co-op',
    image: `${GH}/modes/ZM1_EvilDen_01.jpg.jpeg`,
    description: 'Protect the crystal from endless waves of mutant enemies. Build your defense, coordinate positions, and survive as long as possible. Letting the crystal fall means instant defeat.',
  },
  {
    name: 'Tank Mode',
    type: 'cooperative',
    category: 'Co-op',
    image: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    description: 'Pilot powerful armored tanks against enemy forces. Use the cannon and armor to dominate the battlefield while your crew coordinates attacks from inside.',
  },
  {
    name: 'Melee Mode',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/FFA_Farm.jpg.jpeg`,
    description: 'Firearms are forbidden — only melee weapons allowed. Get up close and personal as players brawl with knives, axes, and other close-quarters weapons in intense hand-to-hand combat.',
  },
  {
    name: 'Demolition',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/SND_Ankara3_01.jpg.jpeg`,
    description: 'Similar to Search & Destroy but with respawns enabled mid-round. Bomb planting and defusing remain the objectives, but the action is non-stop with continuous respawns.',
  },
  {
    name: 'One in the Chamber',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/FFA_Farm.jpg.jpeg`,
    description: 'Every player starts with one bullet. A kill earns you another. Miss your shot and you are down to melee only. Pure precision and nerve decide the winner.',
  },
  {
    name: 'Ranked Match',
    type: 'competitive',
    category: 'Ranked',
    image: `${GH}/modes/SND_Ankara3_01.jpg.jpeg`,
    description: 'The official competitive ranked queue. Win matches to climb the ladder and earn prestigious seasonal rewards. Losses drop your rating — only the best survive at the top.',
  },
  {
    name: 'Mutation Night Mode',
    type: 'competitive',
    category: 'Mutation',
    image: `${GH}/modes/MHMX_TwistedMansion_01.jpg.jpeg`,
    description: 'A darker, more intense version of Mutation Mode. Visibility is drastically reduced and mutants gain additional abilities in the darkness. Humans must use flashlights and sound to survive.',
  },
  {
    name: 'Biohazard Mode',
    type: 'cooperative',
    category: 'Co-op',
    image: `${GH}/modes/ZM1_EvilDen_01.jpg.jpeg`,
    description: 'A deadly virus has been released. Human survivors must locate the antidote and escape while avoiding infected enemies. Coordination and speed are the keys to survival.',
  },
  {
    name: 'War Mode',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    description: 'Large-scale team warfare across sprawling maps. Multiple objectives, vehicle support, and massive player counts create chaotic, epic battles unlike any other CrossFire mode.',
  },
  {
    name: 'Capture the Flag',
    type: 'competitive',
    category: 'Standard',
    image: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    description: 'Steal the enemy flag and return it to your base while defending your own. Balance offense and defense as both teams race to capture flags and score points before time runs out.',
  },
  {
    name: 'AI Mode',
    type: 'training',
    category: 'Training',
    image: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    description: 'Practice against AI-controlled bots. Perfect for warming up, learning maps, or training new players without the pressure of live competition.',
  },
  // ── EVENT modes (triggers classifyModeCategory → "event") ──
  {
    name: 'Sky Raid',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/sky_skyblock_01.jpg.jpeg`,
    description: 'A sky-high limited-time event mode where players fight across floating platforms high above the ground. One slip and you fall. Exclusive sky-themed weapons and crates available.',
  },
  {
    name: 'Treasure Hunt',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/FFA_Farm.jpg.jpeg`,
    description: 'Search for hidden treasure chests scattered across the map. Collect coins and valuables while eliminating other players. The player with the most treasure at round end wins.',
  },
  {
    name: 'Void Breach',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/MESC_LucidDream_00.jpg.jpeg`,
    description: 'A special event mode set in a void dimension. Gravity is altered, visibility is limited, and special rules apply. Only the most adaptable soldiers survive the void.',
  },
  {
    name: 'Lucid Dream',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/MESC_LucidDream_00.jpg.jpeg`,
    description: 'Fight through a surreal lucid dreamscape where the rules of physics bend. A special limited-time mode with unique map geometry, dream-themed weapons, and unpredictable gameplay.',
  },
  {
    name: 'Guess Who',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/GM_Laboratory_04.jpg.jpeg`,
    description: 'A social deduction event mode: one player is disguised as a civilian among NPCs. Other players must guess who the real enemy is before they are eliminated. Mind games over firepower.',
  },
  {
    name: 'Special Operations',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/SND_Ankara3_01.jpg.jpeg`,
    description: 'A rotating collection of special limited-time missions with unique rules and exclusive rewards. Each operation brings a new challenge, new objectives, and new prizes.',
  },
  {
    name: 'Road to Glory',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/ELM_ShootingCenter01.jpg.jpeg`,
    description: 'A ranked roadmap challenge spanning multiple weeks. Complete tiered missions to unlock milestone rewards, exclusive weapon skins, and a permanent title at the final checkpoint.',
  },
  {
    name: 'Anniversary Event Mode',
    type: 'Special Event',
    category: 'Special',
    image: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    description: 'Celebrate CrossFire milestones with this exclusive anniversary event mode. Special maps, anniversary-themed weapons, and legendary crates available only during the celebration period.',
  },
];

// ─── EVENTS ──────────────────────────────────────────────────────────────────
// columns: title, event_name_slug, title_ar, description, description_ar,
//          date, location, type, image_url, featured, sort_order
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const EVENTS = [
  {
    title: 'CrossFire 15th Anniversary Event',
    title_ar: 'حدث الذكرى السنوية الـ 15 لكروس فاير',
    description: 'Celebrate 15 years of CrossFire! Earn exclusive anniversary weapons, character skins, and limited-time crates through special anniversary missions and login bonuses.',
    description_ar: 'احتفل بـ 15 عامًا من CrossFire! احصل على أسلحة وشخصيات حصرية من خلال مهام الذكرى السنوية الخاصة وتسجيل الدخور اليومي.',
    date: '2024-05-01',
    type: 'Anniversary',
    image_url: `${GH}/modes/TDM_Ship_01.jpg.jpeg`,
    featured: true,
    sort_order: 1,
  },
  {
    title: 'Summer Battle 2024',
    title_ar: 'معركة الصيف 2024',
    description: 'The heat is on! Join the Summer Battle event for exclusive beach-themed weapon skins, tropical character outfits, and summer crates. Complete daily missions to earn points and climb the leaderboard.',
    description_ar: 'الحرارة في ذروتها! انضم إلى حدث المعركة الصيفية للحصول على أسلحة وملابس استوائية حصرية. أكمل المهام اليومية لتصعد على لوحة المتصدرين.',
    date: '2024-07-01',
    type: 'Seasonal',
    image_url: `${GH}/modes/FFA_Farm.jpg.jpeg`,
    featured: false,
    sort_order: 2,
  },
  {
    title: 'Halloween Nightmare 2024',
    title_ar: 'كابوس هالوين 2024',
    description: 'Darkness descends on the battlefield! Face zombie waves, earn spooky weapon wraps, and unlock limited-edition Halloween mercenary outfits. New Halloween-themed maps available for a limited time.',
    description_ar: 'الظلام يسود ساحة المعركة! واجه أمواج الزومبي، واحصل على تغليفات أسلحة مخيفة، وافتح ملابس مرتزقة هالوين محدودة الإصدار.',
    date: '2024-10-01',
    type: 'Seasonal',
    image_url: `${GH}/modes/MHMX_TwistedMansion_01.jpg.jpeg`,
    featured: true,
    sort_order: 3,
  },
  {
    title: 'Christmas Combat 2024',
    title_ar: 'معركة الكريسماس 2024',
    description: 'Season\'s greetings, soldier! Collect Christmas presents scattered across maps, unlock festive weapon skins and holiday character costumes. Daily login rewards throughout the holiday season.',
    description_ar: 'تحيات الموسم أيها الجندي! اجمع هدايا الكريسماس المنتشرة على الخرائط وافتح أسلحة احتفالية وأزياء شخصيات عيد الميلاد.',
    date: '2024-12-01',
    type: 'Seasonal',
    image_url: `${GH}/modes/em_christmas_03.jpg.jpeg`,
    featured: false,
    sort_order: 4,
  },
  {
    title: 'Lunar New Year Festival',
    title_ar: 'مهرجان رأس السنة القمرية',
    description: 'Welcome the Year of the Dragon! Celebrate with dragon-themed weapons, traditional outfits, and red envelope rewards. Special Lunar New Year maps and limited-time game modes available.',
    description_ar: 'أهلاً بعام التنين! احتفل بأسلحة ذات طابع التنين وملابس تقليدية وجوائز الأظرف الحمراء.',
    date: '2024-02-10',
    type: 'Seasonal',
    image_url: `${GH}/modes/ZM1_EvilDen_01.jpg.jpeg`,
    featured: false,
    sort_order: 5,
  },
  {
    title: 'CFWE 2024 — World Esports Championship',
    title_ar: 'بطولة الرياضات الإلكترونية العالمية CFWE 2024',
    description: 'The world\'s best CrossFire teams compete for the ultimate prize. Watch live matches, pick your favorite team, and earn special in-game viewer rewards. Who will be crowned the CrossFire World Champion?',
    description_ar: 'تتنافس أفضل فرق CrossFire في العالم على الجائزة الكبرى. شاهد المباريات مباشرة وادعم فريقك المفضل واحصل على مكافآت خاصة.',
    date: '2024-08-15',
    type: 'Esports',
    image_url: `${GH}/modes/SND_Ankara3_01.jpg.jpeg`,
    featured: true,
    sort_order: 6,
  },
  {
    title: 'Operation: Black Shield',
    title_ar: 'عملية: الدرع الأسود',
    description: 'A new threat emerges. Complete Operation Black Shield missions across 6 weeks to unlock exclusive Black Shield weapon crates, character skins, and the limited-edition Black Shield title.',
    description_ar: 'تهديد جديد يظهر. أكمل مهام عملية الدرع الأسود على مدى 6 أسابيع لفتح صناديق أسلحة حصرية وعناوين محدودة الإصدار.',
    date: '2024-03-15',
    type: 'Operation',
    image_url: `${GH}/modes/STDM_Fort_01.jpg.jpeg`,
    featured: false,
    sort_order: 7,
  },
  {
    title: 'Double XP Weekend',
    title_ar: 'عطلة نهاية الأسبوع مضاعفة الخبرة',
    description: 'Rank up faster this weekend! All matches award double EXP points. Grind through the ranks, complete rank-up missions, and push for your next promotion before the event ends.',
    description_ar: 'ارتقِ بمستواك بشكل أسرع هذا الأسبوع! جميع المباريات تمنح نقاط خبرة مضاعفة. اعمل بجد للحصول على ترقيتك التالية قبل انتهاء الحدث.',
    date: '2024-06-15',
    type: 'Bonus Event',
    image_url: `${GH}/modes/ELM_ShootingCenter01.jpg.jpeg`,
    featured: false,
    sort_order: 8,
  },
  {
    title: 'Black Friday Sale & Event',
    title_ar: 'تخفيضات الجمعة السوداء وحدثها',
    description: 'The biggest sale of the year! Massive discounts on ZP, weapon packages, VIP packages, and character costumes. Limited-time bundles and exclusive Black Friday-only items.',
    description_ar: 'أكبر تخفيضات السنة! خصومات ضخمة على ZP وحزم الأسلحة والشخصيات. حزم محدودة الوقت ومنتجات حصرية يوم الجمعة السوداء فقط.',
    date: '2024-11-29',
    type: 'Sale',
    image_url: `${GH}/modes/GM_Laboratory_04.jpg.jpeg`,
    featured: false,
    sort_order: 9,
  },
  {
    title: 'Ranked Season 12 — Iron Throne',
    title_ar: 'الموسم المصنف 12 — العرش الحديدي',
    description: 'Season 12 of Ranked Match is live! Climb from Bronze to Champion and earn the exclusive Iron Throne weapon skin and player title. Season ends with a special championship event.',
    description_ar: 'الموسم 12 من المباريات المصنفة بدأ! ارتقِ من البرونز إلى البطل واحصل على حزمة العرش الحديدي الحصرية.',
    date: '2024-09-01',
    type: 'Ranked Season',
    image_url: `${GH}/modes/RZM_Dystopia_thumb.jpg.jpeg`,
    featured: true,
    sort_order: 10,
  },
];

// ─── MERCENARIES ─────────────────────────────────────────────────────────────
// column is `image` (confirmed from frontend source at merc.image)
// Uses catbox CDN (more stable) with GitHub as fallback in description
const MERCS = [
  {
    name: 'Wolf',
    role: 'Assault',
    order_index: 1,
    image: `${CATBOX}/6npa73.jpeg`,
    description: 'Wolf is a seasoned Global Risk operative who specializes in aggressive frontal assaults. His military background and battle-hardened instincts give him an edge in any firefight.',
    sounds: [],
  },
  {
    name: 'Vipers',
    role: 'Recon',
    order_index: 2,
    image: `${CATBOX}/4il6hi.jpeg`,
    description: 'Vipers is an all-female Global Risk tactical squad specializing in rapid strikes and coordinated flanking. Their speed and combat chemistry make them a lethal force.',
    sounds: [],
  },
  {
    name: 'Sisterhood',
    role: 'Support',
    order_index: 3,
    image: `${CATBOX}/3o58nb.jpeg`,
    description: 'The Sisterhood is a covert Black List unit trained in espionage and infiltration. They excel at ghost operations, moving unseen through enemy lines.',
    sounds: [],
  },
  {
    name: 'Black Mamba',
    role: 'Assault',
    order_index: 4,
    image: `${CATBOX}/r26ox6.jpeg`,
    description: 'Black Mamba is a deadly assassin from an elite Black List unit. Her lightning reflexes and close-quarters expertise make her one of the most feared operatives on the battlefield.',
    sounds: [],
  },
  {
    name: 'Arch Honorary',
    role: 'Elite',
    order_index: 5,
    image: `${CATBOX}/ctwnqz.jpeg`,
    description: 'Arch Honorary is a prestigious Black List veteran decorated for exceptional service. Decades of combat experience give him unmatched situational awareness and adaptability.',
    sounds: [],
  },
  {
    name: 'Desperado',
    role: 'Assault',
    order_index: 6,
    image: `${CATBOX}/hh7h5u.jpeg`,
    description: 'Desperado is a rogue gunslinger who fights for the highest bidder. His unorthodox dual-wielding style and unpredictable tactics make him extremely dangerous in close quarters.',
    sounds: [],
  },
  {
    name: 'Ronin',
    role: 'Recon',
    order_index: 7,
    image: `${CATBOX}/eck3jc.jpeg`,
    description: 'A masterless samurai turned mercenary, Ronin operates in the shadows. His discipline and stealth abilities make him nearly impossible to detect until it is too late.',
    sounds: [],
  },
  {
    name: 'Dean',
    role: 'Support',
    order_index: 8,
    image: `${CATBOX}/t78mvu.jpeg`,
    description: 'Dean is a Global Risk logistics and support specialist. His deep knowledge of weapons, map layouts, and enemy patterns helps keep his squad equipped and alive.',
    sounds: [],
  },
  {
    name: 'Thoth',
    role: 'Elite',
    order_index: 9,
    image: `${CATBOX}/g4zfzn.jpeg`,
    description: 'Named after the Egyptian god of knowledge, Thoth is a calculating long-range sniper. His patience and mathematical precision make him dominant from extreme distances.',
    sounds: [],
  },
  {
    name: 'SFG',
    role: 'Assault',
    order_index: 10,
    image: `${CATBOX}/3bba2g.jpeg`,
    description: 'SFG (Special Forces Group) is an elite Global Risk soldier trained in guerrilla warfare and heavy weapons. His tactical knowledge provides critical support in the most dangerous operations.',
    sounds: [],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function clearTable(table) {
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.warn(`  ⚠️  Could not clear ${table}: ${error.message}`);
  } else {
    console.log(`  🗑️  Cleared ${table}`);
  }
}

async function batchInsert(table, rows, batchSize = 50) {
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ❌  Insert error in ${table}: ${error.message}`);
    } else {
      total += batch.length;
      process.stdout.write(`\r  Inserted ${total}/${rows.length}...`);
    }
  }
  process.stdout.write('\n');
  return total;
}

// ─── SEED FUNCTIONS ───────────────────────────────────────────────────────────
async function seedRanks() {
  console.log('\n🎖️   Seeding ranks...');
  await clearTable('ranks');

  // Columns: id, name, image_url, tier, exp_required, description, requirements, bonus, created_at
  // EXP formula: tier^2.8 * 800 — gives clear distinct values for all 101 tiers,
  // scaling from ~800 (Trainee 1) to ~355M (Grand Marshall), well under INT_MAX.
  const calcExp = (tier) => Math.round(Math.pow(tier, 2.8) * 800);
  const rows = RANKS.map(r => ({
    name: r.name,
    image_url: `${Z8}${r.tier}.jpg`,
    tier: r.tier,
    exp_required: calcExp(r.tier),
    description: `${r.group} — Tier ${r.tier}`,
    requirements: 'Keep playing and winning matches to advance.',
    bonus: r.bonus || '',
  }));

  const count = await batchInsert('ranks', rows);
  console.log(`  ✅  Seeded ${count} ranks`);
}

async function seedModes() {
  console.log('\n🎮  Seeding game modes...');
  await clearTable('modes');

  // Columns: id, name, image_url, description, type, category, created_at
  const rows = MODES.map(m => ({
    name: m.name,
    image_url: m.image,
    description: m.description,
    type: m.type,
    category: m.category,
  }));

  const count = await batchInsert('modes', rows);
  console.log(`  ✅  Seeded ${count} modes`);
}

async function seedMercenaries() {
  console.log('\n🪖  Seeding mercenaries...');
  await clearTable('mercenaries');

  // Columns: id, name, image_url, role, sounds, order_index, created_at
  const rows = MERCS.map(m => ({
    name: m.name,
    image_url: m.image,
    role: m.role,
    sounds: m.sounds || [],
    order_index: m.order_index,
  }));

  const count = await batchInsert('mercenaries', rows);
  console.log(`  ✅  Seeded ${count} mercenaries`);
}

async function seedEvents() {
  console.log('\n📅  Seeding events...');
  await clearTable('events');

  // Columns: title, event_name_slug, title_ar, description, description_ar,
  //          date, location, type, image_url, featured, sort_order
  const rows = EVENTS.map(e => ({
    title: e.title,
    event_name_slug: slugify(e.title),
    title_ar: e.title_ar || '',
    description: e.description,
    description_ar: e.description_ar || '',
    date: e.date,
    type: e.type,
    image_url: e.image_url,
    featured: e.featured || false,
    sort_order: e.sort_order || 0,
  }));

  const count = await batchInsert('events', rows);
  console.log(`  ✅  Seeded ${count} events`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀  CrossFire Real Data Seeder');
  console.log(`    Supabase: ${SUPABASE_URL}\n`);

  const only = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];

  if (!only || only === 'ranks')        await seedRanks();
  if (!only || only === 'modes')        await seedModes();
  if (!only || only === 'mercenaries')  await seedMercenaries();
  if (!only || only === 'events')       await seedEvents();

  console.log('\n🎉  Done! Refresh your site to see real CrossFire data.');
}

main().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });
