import { storage } from '../../server/storage.js';
import { insertEventSchema } from '@shared/mongodb-schema';
import { requireAuth, requireEventManager } from '../../server/utils/auth.js';
import DOMPurify from 'isomorphic-dompurify';

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
      const event = await storage.getEventById(id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } else if (req.method === 'PUT') {
      await requireAuth(req, res);
      await requireEventManager(req, res);

      const updates = req.body;
      if (updates.description) {
        updates.description = DOMPurify.sanitize(updates.description, {
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
      if (updates.descriptionAr) {
        updates.descriptionAr = DOMPurify.sanitize(updates.descriptionAr, {
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
      const event = await storage.updateEvent(id, updates);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } else if (req.method === 'DELETE') {
      await requireAuth(req, res);
      await requireEventManager(req, res);

      const deleted = await storage.deleteEvent(id);

      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
