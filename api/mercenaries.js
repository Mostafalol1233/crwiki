import { storage } from '../server/storage.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'crossfire.wiki');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const mercenaries = await storage.getAllMercenaries();
      res.json(mercenaries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, image, role, sounds } = req.body;
      if (!name || !image || !role) {
        return res.status(400).json({ error: 'Name, image, and role are required' });
      }
      const mercenary = await storage.createMercenary({ name, image, role, sounds });
      res.status(201).json(mercenary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      const { name, image, role, sounds } = req.body;
      await storage.updateMercenary(id, { id, name, image, role, sounds });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      const deleted = await storage.deleteMercenary(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Mercenary not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
