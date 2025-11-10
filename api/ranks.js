import { storage } from '../server/storage.js';
import { insertRankSchema } from '@shared/mongodb-schema';
import { requireAuth, requireRankManager } from '../server/utils/auth.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://crwiki-4lq833imx-mostafalol1233s-projects.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const ranks = await storage.getAllRanks();
      res.json(ranks);
    } else if (req.method === 'POST') {
      await requireAuth(req, res);
      await requireRankManager(req, res);

      const data = insertRankSchema.parse(req.body);
      const rank = await storage.createRank(data);
      res.status(201).json(rank);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
