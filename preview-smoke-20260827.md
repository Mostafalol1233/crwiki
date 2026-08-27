# Preview smoke check — 2026-08-27

Preview deployment checked: `crossfirewiki-oqlzk01gt-mostafalol1233s-projects.vercel.app`.

The deployment metadata reported `READY` for commit `bc4bfabfb55b6976d81cd173e88488a11a9b3cfc` from PR #45. Read-only HTTP checks returned status 200 for the competition API in preview mode, the events API with limit 3, the Arabic events route, the Arabic competition route in preview mode, `sitemap.xml`, and `robots.txt`. The competition API response was 25,351 bytes and contained the private-preview configuration and question payload. The events API response was 20,202 bytes; the Arabic events page was 10,695 bytes; the Arabic competition page was 10,695 bytes; the sitemap was 437,207 bytes; and robots.txt was 1,204 bytes.

This file records Preview only. No production alias, DNS, deployment protection, secret, or Supabase environment setting was changed.
