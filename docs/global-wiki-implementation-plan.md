# CrossFire Global Wiki implementation plan

1. Expand the shared region model to cover West, China, Vietnam, Brazil, Philippines, Korea, and Russia, with canonical slugs, SEO metadata, and comparison helpers.
2. Add regression tests around regional slug resolution and comparison data before changing runtime behavior.
3. Wire the server and client to use the new region model for homepage cards, region landing pages, comparison pages, and dynamic /:region and /:region/weapons/:slug routes.
4. Add database migration SQL for regions and generic entity-region linking, then expose the data through the API layer.
5. Update SEO, sitemap, breadcrumbs, and prerender metadata so each region and region-weapon path gets meaningful metadata.
6. Refactor the scraper layer into a per-region architecture so each region can be scraped and surfaced independently through the global scrape endpoint.
7. Verify the new flow by running the test suite and smoke-testing the key API routes and client routes.
