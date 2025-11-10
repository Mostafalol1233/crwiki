import { storage } from '../server/storage.js';
import { insertWeaponSchema } from '@shared/mongodb-schema';
import { requireAuth, requireWeaponManager } from '../server/utils/auth.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const weapons = await storage.getAllWeapons();
      res.json(weapons);
    } else if (req.method === 'POST') {
      await requireAuth(req, res);
      await requireWeaponManager(req, res);

      const data = insertWeaponSchema.parse(req.body);
      const weapon = await storage.createWeapon(data);
      res.status(201).json(weapon);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
