// Wrapper for Vercel: import the compiled Express app and export it as the function handler.
// During the build step we compile server/index.ts -> dist/server/index.js
// Vercel will call the default export as (req, res) and Express app is compatible.
import app from '../dist/server/index.js';

export default app;
