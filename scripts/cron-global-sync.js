import { scrapeGlobalRegions } from './scrape-global-regions.js';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

async function runSync() {
  const items = await scrapeGlobalRegions();
  console.log(`[global-sync] collected ${items.length} region feed items`);
}

runSync();
setInterval(runSync, SIX_HOURS_MS);
