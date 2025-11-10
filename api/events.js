import { storage } from '../server/storage.js';
import { insertEventSchema } from '@shared/mongodb-schema';
import { requireAuth, requireEventManager } from '../server/utils/auth.js';
import DOMPurify from 'isomorphic-dompurify';

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
      const events = await storage.getAllEvents();
      res.json(events);
    } else if (req.method === 'POST') {
      await requireAuth(req, res);
      await requireEventManager(req, res);

      const data = insertEventSchema.parse(req.body);
      if (data.description) {
        data.description = DOMPurify.sanitize(data.description, {
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
      if (data.descriptionAr) {
        data.descriptionAr = DOMPurify.sanitize(data.descriptionAr, {
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
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
