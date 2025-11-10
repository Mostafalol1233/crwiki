import { storage } from '../../server/storage.js';
import { insertWeaponSchema } from '@shared/mongodb-schema';
import { requireAuth, requireWeaponManager } from '../../server/utils/auth.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      await requireAuth(req, res);
      await requireWeaponManager(req, res);

      const { weapons } = req.body;

      if (!Array.isArray(weapons)) {
        return res.status(400).json({ error: 'Weapons must be an array' });
      }

      const createdWeapons = [];
      for (const weaponData of weapons) {
        try {
          const data = insertWeaponSchema.parse(weaponData);
          const weapon = await storage.createWeapon(data);
          createdWeapons.push(weapon);
        } catch (error) {
          console.error('Error creating weapon:', weaponData, error);
        }
      }

      res.status(201).json({ count: createdWeapons.length, weapons: createdWeapons });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
