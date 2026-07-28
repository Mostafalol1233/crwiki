const dotenv = require('dotenv');
dotenv.config();
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('missing env');
  process.exit(1);
}
const ref = new URL(url).hostname.split('.')[0];
const base = 'https://api.supabase.com/v1/projects/' + ref;
const endpoints = ['/database/query', '/database/sql', '/database/querys', '/database/execute', '/database/query/execute'];
(async () => {
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(base + endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
          'apikey': key
        },
        body: JSON.stringify({ query: 'select 1' })
      });
      const text = await res.text();
      console.log(endpoint, res.status, text.slice(0, 500));
    } catch (e) {
      console.log(endpoint, 'ERR', e.message);
    }
  }
})();
