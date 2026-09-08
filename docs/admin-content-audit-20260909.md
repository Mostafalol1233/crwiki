# Admin content audit — 2026-09-09

The production Vercel bundle exposes the public Supabase project URL `https://qywburkldwdkegztsgjj.supabase.co` (public URL only; no secret was recorded). Read-only REST probes against the production project returned HTTP 200 for `site_highlights`, `announcements`, `tutorials`, `likes`, `video_likes`, and `comment_likes`.

The current `site_highlights` data was stale: June 2026, April 2026, March 2026, January 2026, December 2025, and November 2025 entries.

The current `announcements` data contained one old global row marked active even though its end date was 2026-08-19. It is the obsolete global banner targeted by the repair migration. No service-role mutation was performed because the Supabase MCP project list did not expose the production project and returned a permission error for project ref `qywburkldwdkegztsgjj`.

Official forum RSS source tested:
- `https://forum.z8games.com/categories/crossfire-announcements/feed.rss`
- HTTP 200, 21 RSS items.
- Recent official entries included Hidden Clues Hunt (September 8–14), Spin the Wheel — Dragon's Eye (September 4–13), Back To School ZP Storm (September), Prime Surge Bonus (September 1–30), Voyage of the Orca (September 1–14), Graffiti Getaway (September weekends), Mercenary Pass Season 62: Fall Line, and Sentient Scholars (September 2–October 6).

Official image URLs used in the repair migration were obtained from the RSS content, including:
- `https://z8games.akamaized.net/cfna/web/main/Forum/260904_cfwe_scavengerhunt_forum.jpg`
- `https://z8games.akamaized.net/cfna/web/main/Forum/260813_cfwe_bp_sep_main_forum.jpg`
- `https://z8games.akamaized.net/cfna/web/main/Forum/260812_cfwe_qbz191s_endlessfury_forum.jpg`
- `https://z8games.akamaized.net/cfna/web/main/Forum/260826_cfwe_orca_crate_forum.jpg`
- `https://z8games.akamaized.net/cfna/web/main/Forum/260826_cfwe_zppubonus_forum.jpg`
- `https://z8games.akamaized.net/cfna/web/main/Forum/260831_cfwe_weekendparty_forums.jpg`

Recent video sources used in the repair migration:
- `https://www.youtube.com/watch?v=dEGACFrjGEw` — CFS 2026 EUMENA Day 1 Highlights
- `https://www.youtube.com/watch?v=DwO2cvPoeW4` — CFS 2026 EUMENA Day 2 Highlights
- `https://www.youtube.com/watch?v=EjWagVgt8MQ` — CFS 2026 EUMENA Day 3 Highlights
- `https://www.youtube.com/watch?v=dqRX5JNlOyg` — CrossFire West Vixen gameplay in ZM Void Rift
- `https://www.youtube.com/watch?v=69cSYqonhwQ` — CrossFire West Lapis September 2026 showcase

Search result sources:
- `https://www.youtube.com/watch?v=dEGACFrjGEw`
- `https://www.youtube.com/watch?v=DwO2cvPoeW4`
- `https://www.youtube.com/watch?v=EjWagVgt8MQ`
- `https://www.youtube.com/watch?v=dqRX5JNlOyg`
- `https://www.youtube.com/watch?v=69cSYqonhwQ`
- `https://forum.z8games.com/categories/crossfire-announcements/feed.rss`
