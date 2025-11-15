import { storage } from '../../server/storage.js';
import { generateToken, verifyAdminPassword, comparePassword } from '../../server/utils/auth.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://crossfire.wiki');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (username && password) {
      const admin = await storage.getAdminByUsername(username);

      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await comparePassword(password, admin.password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({
        id: admin.id,
        username: admin.username,
        roles: admin.roles
      });

      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          roles: admin.roles
        }
      });
    } else if (password) {
      const isValid = await verifyAdminPassword(password);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = generateToken({ roles: ["super_admin"] });
      res.json({ token, admin: { roles: ["super_admin"] } });
    } else {
      return res.status(400).json({ error: "Username and password or password required" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
