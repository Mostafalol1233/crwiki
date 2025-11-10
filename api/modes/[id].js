import { storage } from '../../server/storage.js';
import { requireAuth, requireModeManager } from '../../server/utils/auth.js';

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
      await requireModeManager(req, res);

      const updates = req.body;
      const mode = await storage.updateMode(id, updates);

      if (!mode) {
        return res.status(404).json({ error: "Mode not found" });
      }

      res.json(mode);
    } else if (req.method === 'DELETE') {
      await requireAuth(req, res);
      await requireModeManager(req, res);

      const deleted = await storage.deleteMode(id);

      if (!deleted) {
        return res.status(404).json({ error: "Mode not found" });
      }

      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
