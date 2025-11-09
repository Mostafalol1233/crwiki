import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

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
  const server = await registerRoutes(app);

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

  // ALWAYS serve the app on the port specified in the environment variable PORT
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
})();
