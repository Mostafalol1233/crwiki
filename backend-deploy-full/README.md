# Backend Deploy (Full)

This folder contains a deployable copy of the backend adapted for the KATABUMP host. It serves API endpoints and static assets.

Important environment variables
- MONGODB_URI: MongoDB connection string
- PORT: port to listen on (default 20032)
- FRONTEND_URL: allowed origin for CORS (e.g., https://crossfire.wiki)
- JWT_SECRET: secret for signing JWT tokens
- ADMIN_PASSWORD: password for quick super_admin token approach
- ATTACHED_ASSETS_PATH: optional path to the `attached_assets` folder on disk; if omitted, falls back to `../attached_assets` relative to the backend folder
- SCRAPER_API_KEY: optional global key to allow automated scraping from trusted hosts; pass in header `x-scraper-api-key` to bypass auth for scraper endpoints

Scrape endpoints
- GET /api/scrape/forum-list — returns list of announcement URLs (protected: super_admin or API key)
- POST /api/scrape/event-details — accepts `{ url }` and returns the scraped event details (protected: super_admin or API key)
- POST /api/scrape/multiple-events — accepts `{ urls: [ ... ] }` and returns an array of scraped event objects (protected: event_scraper role or API key)

Assets
Place images in the folder pointed to by `ATTACHED_ASSETS_PATH` (or copy to the repo root `attached_assets/`). Backend serves static assets at `/assets/*`.

Debug
- GET /api/debug/assets — returns the resolved assets path and whether a `SCRAPER_API_KEY` is set.
Backend Deploy - Full copy

This folder contains a full copy of the original backend server adapted for deployment.

Quick start

1. Install dependencies

   npm install

2. Copy or edit `.env` (an example is provided in `.env.example`). Ensure `MONGODB_URI` is set.

3. Run in development

   npm run dev

4. Run in production

   npm start

Important notes

- Default port is `20032`. Update `PORT` in `.env` if you need something else.
- `FRONTEND_URL` should be set to your frontend origin for CORS when deploying to production (replace `*`).
- Upload endpoint uses `fetch` + `FormData` + `Blob`. Node's built-in `fetch` is available on Node 18+. If your runtime is older, you may need to polyfill `fetch`/`FormData`.
- For secure deployments, update `JWT_SECRET` and `ADMIN_PASSWORD` in `.env`.

Next steps

- Run `npm install` in this folder and start the server. If there are runtime errors, share the terminal output and I'll fix them.
