import { storage } from '../../server/storage.js';
import { insertPostSchema } from '@shared/mongodb-schema';
import { calculateReadingTime, generateSummary, formatDate } from '../../server/utils/helpers.js';
import { requireAuth, requirePostManager } from '../../server/utils/auth.js';

export default async function handler(req, res) {
  const { id } = req.query;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const post = await storage.getPostById(id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await storage.incrementPostViews(id);

      const formattedPost = {
        ...post,
        date: formatDate(post.createdAt),
      };

      res.json(formattedPost);
    } else if (req.method === 'PUT') {
      await requireAuth(req, res);
      await requirePostManager(req, res);

      const updates = req.body;

      if (updates.content && !updates.readingTime) {
        updates.readingTime = calculateReadingTime(updates.content);
      }

      if (updates.content && !updates.summary) {
        updates.summary = generateSummary(updates.content);
      }

      const post = await storage.updatePost(id, updates);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(post);
    } else if (req.method === 'DELETE') {
      await requireAuth(req, res);
      await requirePostManager(req, res);

      const deleted = await storage.deletePost(id);

      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
