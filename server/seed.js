 import { weaponsData, modesData, ranksData } from './data/seed-data.js';
 import fetch from 'node-fetch';

async function seedDatabase() {
  try {
    console.log('🔄 Starting database seeding...');

    // Login as admin to get token
    const authResponse = await fetch('http://localhost:20033/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'admin' })
    });

    const auth = await authResponse.json();
    if (!auth.token) {
      throw new Error('Failed to authenticate');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.token}`
    };

    // Upload weapons in bulk
    console.log('📦 Uploading weapons...');
    const weaponsResponse = await fetch('http://localhost:20033/api/weapons/bulk-create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ weapons: weaponsData })
    });
    const weaponsResult = await weaponsResponse.json();
    console.log(`✅ Uploaded ${weaponsResult.count || 0} weapons`);

    // Upload modes
    console.log('📦 Uploading game modes...');
    const createdModes = [];
    for (const mode of modesData) {
      const response = await fetch('http://localhost:20033/api/modes', {
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
      const response = await fetch('http://localhost:20033/api/ranks', {
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