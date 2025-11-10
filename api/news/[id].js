import { storage } from '../../server/storage.js';
import { requireAuth, requireNewsManager } from '../../server/utils/auth.js';
import DOMPurify from 'isomorphic-dompurify';

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
      await requireNewsManager(req, res);

      const updates = req.body;
      if (updates.content) {
        updates.content = DOMPurify.sanitize(updates.content, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span',
            'hr'
          ],
          ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title',
            'style', 'class',
            'width', 'height',
            'target', 'rel'
          ],
          ALLOW_DATA_ATTR: false,
          KEEP_CONTENT: true
        });
      }
      if (updates.contentAr) {
        updates.contentAr = DOMPurify.sanitize(updates.contentAr, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'a', 'img',
            'blockquote', 'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'div', 'span',
            'hr'
          ],
          ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title',
            'style', 'class',
            'width', 'height',
            'target', 'rel'
          ],
          ALLOW_DATA_ATTR: false,
          KEEP_CONTENT: true
        });
      }
      const news = await storage.updateNews(id, updates);

      if (!news) {
        return res.status(404).json({ error: "News item not found" });
      }

      res.json(news);
    } else if (req.method === 'DELETE') {
      await requireAuth(req, res);
      await requireNewsManager(req, res);

      const deleted = await storage.deleteNews(id);

      if (!deleted) {
        return res.status(404).json({ error: "News item not found" });
      }

      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
