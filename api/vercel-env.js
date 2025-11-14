// This file is used by Vercel to load environment variables in ESM
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
const envPath = resolve(__dirname, '../../.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}

// Export environment variables for ESM
export default {
  ...process.env,
  // Add any default values here if needed
};
