import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import type { Plugin } from "vite";

// Register endpoint — creates user with email already confirmed (no confirmation step)
function cfRegisterPlugin(): Plugin {
  return {
    name: "cf-register",
    configureServer(server) {
      server.middlewares.use("/api/auth/register", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Method not allowed" }));
        }
        try {
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve) => {
            req.on("data", (c: Buffer) => chunks.push(c));
            req.on("end", resolve);
          });
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const { email, password, username, phone, avatar } = body;

          if (!email || !password || !username) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Email, password and username are required" }));
          }

          const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
          const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

          if (!SUPABASE_URL || !SERVICE_KEY) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Server misconfigured" }));
          }

          const { fetch: undiciFetch } = await import("undici");

          // Create user via Supabase Admin API with email already confirmed
          const createRes = await undiciFetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": SERVICE_KEY,
              "Authorization": `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              user_metadata: { username, phone: phone || "", avatar: avatar || "" },
            }),
          } as any);

          const createData = await createRes.json() as any;

          if (!createRes.ok) {
            const msg = createData?.msg || createData?.message || createData?.error_description || "Registration failed";
            res.writeHead(createRes.status === 422 ? 409 : 400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: msg }));
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, user: { id: createData.id, email: createData.email } }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || "Registration failed" }));
        }
      });
    },
  };
}

// CF player lookup dev middleware — bypasses Akamai using undici (HTTP/2)
function cfPlayerLookupPlugin(): Plugin {
  return {
    name: "cf-player-lookup",
    configureServer(server) {
      server.middlewares.use("/api/player/lookup", async (req, res) => {
        try {
          const url = new URL(req.url || "", "http://localhost");
          const nickname = (url.searchParams.get("nickname") || "").trim();

          if (!nickname || nickname.length < 2 || nickname.length > 32) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Invalid nickname" }));
          }

          const { fetch } = await import("undici");
          const CF_API = `https://crossfire.z8games.com/rest/userprofile.json?usn=${encodeURIComponent(nickname)}`;
          const response = await fetch(CF_API, {
            signal: AbortSignal.timeout(12000),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
              "Accept": "application/json, text/plain, */*",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://crossfire.z8games.com/myprofile.html",
              "sec-fetch-site": "same-origin",
              "sec-fetch-mode": "cors",
              "sec-fetch-dest": "empty",
            },
          } as any);

          const contentType = response.headers.get("content-type") || "";
          if (!contentType.includes("json")) {
            res.writeHead(502, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "CF API unavailable, try again shortly" }));
          }

          const data = await response.json() as any;

          if (data.p_o_ErrID === -702 || data.p_o_ErrDesc === "Character not found") {
            res.writeHead(404, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: `Player "${nickname}" not found on CrossFire NA.`, notFound: true }));
          }

          const kills = data.TotalKills ?? data.total_kills ?? data.Kills ?? null;
          const deaths = data.TotalDeaths ?? data.total_deaths ?? data.Deaths ?? null;
          const wins = data.TotalWins ?? data.total_wins ?? data.Wins ?? null;
          const losses = data.TotalLosses ?? data.total_losses ?? data.Losses ?? null;
          const exp = data.TotalExp ?? data.UserExp ?? data.exp ?? null;

          const profile = {
            nickname: data.UserNickname || data.usn || nickname,
            exp,
            rank: data.RankName || data.rank_name || data.Rank || null,
            rankTier: data.RankNo || data.rank_no || data.RankTier || null,
            rankImage: data.RankImg || data.rank_img || null,
            kills,
            deaths,
            wins,
            losses,
            kdRatio: kills !== null && deaths !== null && deaths > 0 ? (kills / deaths).toFixed(2) : null,
            winRate: wins !== null && losses !== null && (wins + losses) > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : null,
            playtime: data.PlayTime || data.play_time || null,
            level: data.UserLevel || data.level || null,
            clan: data.ClanName || data.clan_name || null,
            raw: data,
          };

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, profile }));
        } catch (err: any) {
          const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timeout");
          res.writeHead(isTimeout ? 504 : 500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: isTimeout ? "CF servers timed out, try again shortly." : "Failed to fetch player data." }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    cfRegisterPlugin(),
    cfPlayerLookupPlugin(),
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/client"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          router: ['wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          query: ['@tanstack/react-query'],
          utilities: ['clsx', 'tailwind-merge', 'date-fns'],
          icons: ['lucide-react'],
        },
        // Optimize chunk filenames for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Increase chunk size warning limit to accommodate larger bundles
    chunkSizeWarningLimit: 1000,
    // Disable source maps for production to reduce bundle size
    sourcemap: false,
    // Minify for better performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },
    // Enable CSS minification
    cssMinify: true,
    // Report compressed size
    reportCompressedSize: true,
    // Target modern browsers for better optimization
    target: 'es2020',
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    fs: {
      strict: false,
    },
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
    'process.env.PUBLIC_BASE_URL': JSON.stringify(process.env.PUBLIC_BASE_URL),
  },
});
