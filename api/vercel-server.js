// Vercel server entry point with ESM support
import './vercel-env.js';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import your API routes
import apiRoutes from '../dist/server/routes/api.js';
app.use('/api', apiRoutes);

// Serve static files from the client
app.use(express.static(resolve(__dirname, '../../dist/client')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, '../../dist/client/index.html'));
});

// Start the server
const server = createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
