// Wrapper for Vercel: import the compiled Express app and export it as the function handler.
// During the build step we compile server/index.ts -> dist/server/index.js
// Vercel will call the default export as (req, res) and Express app is compatible.

export default async function handler(req, res) {
  try {
    const mod = await import('../dist/server/index.js');
    const app = mod.default || mod;
    // Express app is a function (req, res), call it directly
    return app(req, res);
  } catch (err) {
    console.error('Failed to load server bundle:', err);
    res.statusCode = 500;
    res.end('Server bundle not available. Did build succeed?');
  }
}
