---
    name: CF Player Stats API
    description: Real API endpoint for CrossFire NA player stats, discovered from naprofile2 React bundle.
    ---

    ## Rule
    Use `https://crossfire.z8games.com/rest/userprofile.json?usn=<nickname>` to fetch CF player stats.

    **Why:** The z8games.com profile page is a React SPA (naprofile2) that loads data client-side. This REST endpoint is what the SPA calls internally. Direct HTML scraping gives only a shell page with no player data.

    **How to apply:** 
    - Use **undici** (not axios/curl) to make the request — undici's HTTP/2 support bypasses Akamai CDN bot detection. Axios and curl both timeout.
    - Required headers: User-Agent (Chrome), Referer: crossfire.z8games.com/myprofile.html, sec-fetch-site: same-origin, sec-fetch-mode: cors
    - Error code p_o_ErrID === -702 means player not found
    - Implemented as Vite dev middleware in vite.config.ts (cfPlayerLookupPlugin) AND Express route in backend-deploy-full/index.js at /api/player/lookup
    - Other endpoints same pattern: /rest/userweapons.json?usn=, /rest/eloranking.json?startrow=0&endrow=0
    - CF stats stored in Supabase user_metadata: cf_nickname, cf_stats (object), cf_last_sync (ISO timestamp)
    