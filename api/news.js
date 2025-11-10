import { storage } from '../server/storage.js';
import { insertNewsSchema } from '@shared/mongodb-schema';
import { requireAuth, requireNewsManager } from '../server/utils/auth.js';
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
      const news = await storage.getAllNews();
      res.json(news);
    } else if (req.method === 'POST') {
      await requireAuth(req, res);
      await requireNewsManager(req, res);

      const data = insertNewsSchema.parse(req.body);
      if (data.content) {
        data.content = DOMPurify.sanitize(data.content, {
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
      if (data.contentAr) {
        data.contentAr = DOMPurify.sanitize(data.contentAr, {
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
      const news = await storage.createNews(data);
      res.status(201).json(news);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
