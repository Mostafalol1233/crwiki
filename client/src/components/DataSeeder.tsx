import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

export default function DataSeeder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const weaponsData = [
    // Import comprehensive weapons data from seed-data.js
    ...require('../../server/data/seed-data.js').weaponsData
  ];

  const modesData = [
    // Import comprehensive modes data from seed-data.js
    ...require('../../server/data/seed-data.js').modesData
  ];

  const ranksData = [
    // Import comprehensive ranks data from seed-data.js
    ...require('../../server/data/seed-data.js').ranksData
  ];

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Upload weapons in bulk
      await apiRequest('/api/weapons/bulk-create', 'POST', { weapons: weaponsData });

      // Upload modes one by one
      for (const mode of modesData) {
        await apiRequest('/api/modes', 'POST', mode);
      }

      // Upload ranks one by one
      for (const rank of ranksData) {
        await apiRequest('/api/ranks', 'POST', rank);
      }

      setSuccess('Successfully seeded weapons, modes, and ranks data!');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedFromServerAssets = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await apiRequest('/api/admin/seed-from-assets', 'POST');
      setSuccess(`Seeded from server assets: ${res.weapons || 0} weapons, ${res.modes || 0} modes, ${res.ranks || 0} ranks`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Button disabled={loading} onClick={handleSeedData} className="w-full">
          {loading ? "Seeding data..." : "Seed Sample Data"}
        </Button>

        <Button disabled={loading} onClick={handleSeedFromServerAssets} className="w-full">
          {loading ? "Processing assets..." : "Seed From Server Assets"}
        </Button>
      </div>
    </div>
  );
}