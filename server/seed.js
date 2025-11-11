import { weaponsData, modesData, ranksData } from './data/seed-data.js';
import fetch from 'node-fetch';

// Use API_BASE_URL (or SEED_API_URL) for serverless deployments (Vercel).
// Fallback to localhost:20032 for local development.
const API_BASE = process.env.API_BASE_URL || process.env.SEED_API_URL || 'http://localhost:20032';

// Credentials for seeding: prefer explicit username+password, otherwise password-only
const SEED_ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME; // optional
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin';

async function seedDatabase() {
  try {
    console.log('🔄 Starting database seeding...');

    // Login as admin to get token
    const authBody = SEED_ADMIN_USERNAME
      ? { username: SEED_ADMIN_USERNAME, password: SEED_ADMIN_PASSWORD }
      : { password: SEED_ADMIN_PASSWORD };

    const authResponse = await fetch(`${API_BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authBody)
    });

    const auth = await authResponse.json().catch(() => null);
    if (!auth || !auth.token) {
      console.error('Auth response status:', authResponse.status, authResponse.statusText);
      console.error('Auth response body:', auth);
      throw new Error('Failed to authenticate - check SEED_ADMIN_USERNAME/SEED_ADMIN_PASSWORD and API_BASE');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    };

    // Upload weapons (POST individually because /api/weapons/bulk-create may not exist on serverless API)
    console.log('📦 Uploading weapons (individual requests)...');
    const createdWeapons = [];
    for (const weapon of weaponsData) {
      const resp = await fetch(`${API_BASE}/api/weapons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(weapon)
      });
      const result = await resp.json();
      createdWeapons.push(result);
    }
    console.log(`✅ Uploaded ${createdWeapons.length} weapons`);
    const weaponsResult = { count: createdWeapons.length };

    // Upload modes
    console.log('📦 Uploading game modes...');
    const createdModes = [];
    for (const mode of modesData) {
      const response = await fetch(`${API_BASE}/api/modes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(mode)
      });
      const result = await response.json();
      createdModes.push(result);
    }
    console.log(`✅ Uploaded ${createdModes.length} game modes`);

    // Upload ranks
    console.log('📦 Uploading ranks...');
    const createdRanks = [];
    for (const rank of ranksData) {
      const response = await fetch(`${API_BASE}/api/ranks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(rank)
      });
      const result = await response.json();
      createdRanks.push(result);
    }
    console.log(`✅ Uploaded ${createdRanks.length} ranks`);

    console.log('🎉 Database seeding completed successfully!');
    
    return {
      weapons: weaponsResult.count || 0,
      modes: createdModes.length,
      ranks: createdRanks.length
    };

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedDatabase().then(results => {
  console.log('Seeding results:', results);
  process.exit(0);
});