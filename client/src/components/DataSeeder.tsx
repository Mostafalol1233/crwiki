import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

export default function DataSeeder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSeedData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await apiRequest('/api/seed/cf-data', 'POST', {});
      const weapons = res?.createdWeapons ?? 0;
      const modes = res?.createdModes ?? 0;
      const ranks = res?.createdRanks ?? 0;

      setSuccess(`Successfully seeded data: ${weapons} weapons, ${modes} modes, ${ranks} ranks.`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to seed data');
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