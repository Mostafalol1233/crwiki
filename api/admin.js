import { storage } from '../../server/storage.js';
import { requireAuth, requireSuperAdmin } from '../../server/utils/auth.js';
import { scrapeWeapons, scrapeModes, scrapeRanks } from '../../server/services/scraper.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://crwiki-4lq833imx-mostafalol1233s-projects.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      await requireAuth(req, res);
      await requireSuperAdmin(req, res);

      console.log('Starting asset seeding...');

      // Scrape weapons
      const weapons = await scrapeWeapons();
      console.log(`Scraped ${weapons.length} weapons`);

      // Scrape modes
      const modes = await scrapeModes();
      console.log(`Scraped ${modes.length} modes`);

      // Scrape ranks
      const ranks = await scrapeRanks();
      console.log(`Scraped ${ranks.length} ranks`);

      // Clear existing data
      await storage.clearWeapons();
      await storage.clearModes();
      await storage.clearRanks();

      // Insert scraped data
      const weaponResults = [];
      for (const weapon of weapons) {
        try {
          const result = await storage.createWeapon(weapon);
          weaponResults.push(result);
        } catch (error) {
          console.error('Error creating weapon:', weapon, error);
        }
      }

      const modeResults = [];
      for (const mode of modes) {
        try {
          const result = await storage.createMode(mode);
          modeResults.push(result);
        } catch (error) {
          console.error('Error creating mode:', mode, error);
        }
      }

      const rankResults = [];
      for (const rank of ranks) {
        try {
          const result = await storage.createRank(rank);
          rankResults.push(result);
        } catch (error) {
          console.error('Error creating rank:', rank, error);
        }
      }

      res.json({
        weapons: weaponResults.length,
        modes: modeResults.length,
        ranks: rankResults.length
      });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
