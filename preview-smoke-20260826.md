# Preview smoke findings — 2026-08-26

- Deployment: commit `0044fb5` on `audit/hardening-20260826`; Preview became READY.
- Preview alias tested: `https://crossfirewiki-o6bc4jk2i-mostafalol1233s-projects.vercel.app`.
- Browser navigation from `/ar/ar/sellers` normalized to `/ar/sellers` inside the app; the Arabic seller page rendered with seller cards.
- `/ar/posts` rendered after the loading state completed. The page showed seven post cards with real source image URLs, categories, titles, and links; no empty-post state or blank content was observed.
- The first visual capture briefly showed a loading spinner; the follow-up browser view showed the complete hero card and remaining cards. This is an asynchronous loading state, not a persistent blank page.
- Safe API smoke results: page routes returned 200; `/api/content?type=posts` returned 200; unsupported `type=news` returned expected 400; unauthenticated admin/scrape/email writes returned 401; community `ticket:list` returned 401; AI request from an untrusted Origin returned 403.
- No user writes, admin login, secret values, competition changes, or production deployment were performed.

## Reviews browser check

- Navigation to `/ar/reviews` returned the Arabic route with seller review UI and six visible `Write Review` controls, plus the expected global navigation and auth links.
- The subsequent browser wait unexpectedly opened `about:blank`, so no visual conclusion is recorded for the post-load card state. No write action was taken.

## Chat and MyTickets browser check

- Opening `/ar/chat` while signed out redirected to `/ar/login?redirect=%2Fchat`; the login page was Arabic and explicitly explained that Chat requires sign-in. No message was sent.
- Opening `/ar/my-tickets` while signed out rendered the Arabic support-ticket gate with a sign-in link and no email-search field. No ticket operation was attempted.

## Admin login and Download browser check

- `/ar/admin/login` opened the dedicated administration login form with Admin and Super Admin tabs plus human-verification input. No username, password, token, or submission was entered.
- `/ar/download` returned the Arabic download page with official-client wording, Arabic CTAs, update-notes link, and the expected navigation. No blank page or route error was observed in the extracted page state.
