import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { WebSocketServer } from "ws";
import { verifyToken } from "./utils/auth";
import { storage } from "./storage";
import { setupVite, serveStatic, log } from "./vite";
import { weaponsData, modesData, ranksData, mercenariesData } from './data/seed-data.js';
import { insertWeaponSchema, insertModeSchema, insertRankSchema } from "@shared/mongodb-schema";

// Export for Vercel serverless functions
const app = express();
export default app;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Basic CORS middleware for serverless and browser clients
app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigin = process.env.PUBLIC_BASE_URL || process.env.VITE_API_URL || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Canonical domain and HTTPS enforcement (production only)
app.use((req: Request, res: Response, next: NextFunction) => {
  try {
    const isDev = app.get('env') === 'development';
    const canonical = (process.env.PUBLIC_BASE_URL || '').toLowerCase();
    if (!canonical || isDev) return next();

    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;

    const urlHost = host.toLowerCase();
    const wantsHttps = canonical.startsWith('https://');
    const canonicalHost = canonical.replace(/^https?:\/\//, '');

    const needsHostRedirect = urlHost.startsWith('www.') && !canonicalHost.startsWith('www.')
      ? true
      : (!urlHost.startsWith('www.') && canonicalHost.startsWith('www.'));
    const needsProtoRedirect = wantsHttps && proto !== 'https';

    if (needsHostRedirect || needsProtoRedirect) {
      const target = canonical.replace(/\/$/, '') + req.originalUrl;
      return res.redirect(301, target);
    }
  } catch {}
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const hasMongo = Boolean(process.env.MONGODB_URI);
  if (hasMongo) {
    try {
      const { initializeDatabase } = await import('./db-connect.js');
      await initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  } else {
    log('Skipping MongoDB initialization; using in-memory storage');
  }

  // Optional: auto seed CF data on boot when AUTO_SEED=1
  if (process.env.AUTO_SEED === '1') {
    try {
      // Clear and re-seed mercenaries
      const existingMercs = await storage.getAllMercenaries();
      if (existingMercs && existingMercs.length > 0) {
        for (const m of existingMercs) {
          try { await storage.deleteMercenary(m.id); } catch {}
        }
        log(`AUTO_SEED: cleared ${existingMercs.length} mercenaries`);
      }
      
      let created = 0;
      for (const m of mercenariesData) {
        try { 
          await storage.createMercenary({ name: m.name, image: m.image, role: m.role, description: (m as any).description || "" }); 
          created++; 
        } catch (e) {
          console.error('Failed to create mercenary:', m.name, e);
        }
      }
      log(`AUTO_SEED: created ${created} mercenaries`);

      const existingWeapons = await storage.getAllWeapons();
      if (!existingWeapons || existingWeapons.length === 0) {
        let created = 0;
        for (const w of weaponsData) {
          try { await storage.createWeapon(insertWeaponSchema.parse(w)); created++; } catch {}
        }
        log(`AUTO_SEED: created ${created} weapons`);
      }

      const existingModes = await storage.getAllModes();
      if (!existingModes || existingModes.length === 0) {
        let created = 0;
        for (const m of modesData) {
          try { await storage.createMode(insertModeSchema.parse(m)); created++; } catch {}
        }
        log(`AUTO_SEED: created ${created} modes`);
      }

      const existingRanks = await storage.getAllRanks();
      if (!existingRanks || existingRanks.length === 0) {
        let created = 0;
        for (const r of ranksData) {
          try { await storage.createRank(insertRankSchema.parse(r)); created++; } catch {}
        }
        log(`AUTO_SEED: created ${created} ranks`);
      }
    } catch (err) {
      console.error('AUTO_SEED failed:', err);
    }
  }

  const server = await registerRoutes(app);

  // WebSocket server for chat
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Map<string, Set<any>>();

  function addClient(userId: string, ws: any) {
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId)!.add(ws);
  }
  function removeClient(userId: string, ws: any) {
    const set = clients.get(userId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) clients.delete(userId);
    }
  }
  function broadcastToUsers(userIds: string[], payload: any) {
    const data = JSON.stringify(payload);
    for (const uid of userIds) {
      const set = clients.get(uid);
      if (set) {
        for (const sock of set) {
          try { sock.send(data); } catch {}
        }
      }
    }
  }

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token") || "";
      const payload: any = token ? verifyToken(token) : null;
      if (!payload || !payload.id) {
        ws.close();
        return;
      }

      const userId = String(payload.id);
      addClient(userId, ws);

      ws.on("message", async (raw: any) => {
        try {
          const msg = JSON.parse(String(raw || ""));
          if (msg.type === "message/send") {
            const { conversationId, content, replyTo } = msg;
            if (!conversationId || !content) return;
            const created = await storage.createMessage({ conversationId, senderId: userId, content, replyTo } as any);
            const conv = await storage.getConversationById(conversationId);
            const participants = (conv?.participants || []).map(String);
            broadcastToUsers(participants, { type: "message/new", message: created });
          } else if (msg.type === "typing") {
            const { conversationId, isTyping } = msg;
            const conv = await storage.getConversationById(conversationId);
            const others = (conv?.participants || []).map(String).filter((p) => p !== userId);
            broadcastToUsers(others, { type: "typing", conversationId, userId, isTyping: !!isTyping });
          } else if (msg.type === "read") {
            const { messageId, conversationId } = msg;
            if (messageId) await storage.markMessageRead(messageId, userId);
            const conv = await storage.getConversationById(conversationId);
            const others = (conv?.participants || []).map(String).filter((p) => p !== userId);
            broadcastToUsers(others, { type: "read", messageId, userId });
          }
        } catch {}
      });

      ws.on("close", () => {
        removeClient(userId, ws);
      });
    } catch {}
  });

  // Serve static assets from attached_assets folder
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const assetsPath = path.resolve(currentDir, "..", "attached_assets");
  app.use("/assets", express.static(assetsPath));

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // For Vercel deployment, export the app instead of starting a server
  if (process.env.VERCEL) {
    // Export for Vercel serverless functions - app is already configured
  } else {
    // Local development: serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    // Try listening on the configured port; if it's in use try the next few ports
    const maxAttempts = 10;
    let attempted = 0;
    const tryListen = (p: number) => new Promise<void>((resolve, reject) => {
      const onError = (err: any) => {
        server.off('listening', onListening);
        server.off('error', onError);
        reject(err);
      };

      const onListening = () => {
        server.off('listening', onListening);
        server.off('error', onError);
        log(`serving on port ${p}`);
        resolve();
      };

      server.once('error', onError);
      server.once('listening', onListening);

      try {
        server.listen({ port: p, host: '0.0.0.0', reusePort: true });
      } catch (err) {
        onError(err);
      }
    });

    (async () => {
      let currentPort = port;
      while (attempted < maxAttempts) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await tryListen(currentPort);
          break;
        } catch (err: any) {
          if (err && err.code === 'EADDRINUSE') {
            log(`port ${currentPort} in use, trying port ${currentPort + 1}...`);
            attempted += 1;
            currentPort += 1;
            // small delay before retry
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 200));
            continue;
          }

          // Unknown error: rethrow to surface it
          throw err;
        }
      }

      if (attempted >= maxAttempts) {
        log(`Failed to bind after ${maxAttempts} attempts. Please free port ${port} or set PORT to a different value.`);
        process.exit(1);
      }
    })();
  }
})();


