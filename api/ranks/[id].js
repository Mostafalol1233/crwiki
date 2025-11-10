import { storage } from '../../server/storage.js';
import { requireAuth, requireRankManager } from '../../server/utils/auth.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'PUT') {
      await requireAuth(req, res);
      await requireRankManager(req, res);

      const updates = req.body;
      const rank = await storage.updateRank(id, updates);

      if (!rank) {
        return res.status(404).json({ error: "Rank not found" });
      }

      res.json(rank);
    } else if (req.method === 'DELETE') {
      await requireAuth(req, res);
      await requireRankManager(req, res);

      const deleted = await storage.deleteRank(id);

      if (!deleted) {
        return res.status(404).json({ error: "Rank not found" });
      }

      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
