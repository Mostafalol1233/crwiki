# CrossFire Wiki — Final Verification and Production Handoff

## Executive verdict

The CrossFire Wiki hardening branch is **source-ready and build-verified**, but the public production site is **not yet serving the latest branch**. The final code is pushed to `manus/review-hardening-20260814` at commit `0f7852f`, and Pull Request [#34][1] remains open. The latest Vercel deployment is READY, while the Vercel project metadata still reports `live: false` and lists only Vercel-managed domains; `crossfire.wiki` is not attached to that project deployment. Consequently, the public domain must be assigned to the READY deployment before the live-site fixes can be considered released.

The most important newly discovered defect was a Vercel-only TypeScript error in `api/images/upload.ts`. The local project check did not reproduce it, but Vercel’s serverless validation reported that the multer middleware invocation was not callable. The middleware is now explicitly narrowed to a callable signature, and the replacement deployment completed successfully without that error.

## Changes completed in this continuation

The public FAQ now uses direct, neutral wording instead of the retired “Attention Mercenaries” address. Its support promise no longer claims permanent 24/7 availability; it explains that tickets are reviewed as soon as possible. The Arabic support link is now routed to `/ar/support`, and the fallback FAQ data in the admin interface uses the same wording.

The email backend no longer contains the retired Bimora sender identity. The sender is configurable through `EMAIL_FROM`, with a CrossFire Wiki default, so the application can use a verified production sender without exposing a legacy brand in generated messages. Internal identifiers that still used the old brand name were also renamed to neutral `wikiPicks` and `aboutWiki` keys; the rendered labels already displayed CrossFire Wiki.

The Vercel-only upload error was fixed in `api/images/upload.ts` by introducing an explicit `UploadMiddleware` callable type and invoking the typed adapter rather than calling the incompatible inferred type directly. This preserves the existing authentication, MIME filtering, ten-megabyte limit, and Cloudinary upload behavior.

## Verification results

| Check | Result | Evidence |
|---|---:|---|
| Repository TypeScript check | Passed | `pnpm run check` completed without errors |
| Local production client build | Passed | `pnpm run build` completed successfully in approximately 37 seconds |
| Vercel build for commit `0f7852f` | Passed | Build log ended with `Build Completed`, `Deployment completed`, and no upload TypeScript error [2] |
| Latest Vercel deployment | READY | `dpl_3ttYvs2JHfZH329zjMXpxojXFMiF` is READY [2] |
| API route count | 12 | `find api -type f -name '*.ts'` returned 12; the project remains within the user’s maximum |
| Configured Vercel function entries | 10 | `vercel.json` contains 10 explicit function settings; no additional serverless function was introduced |
| Legacy visible-brand scan | Clean | No matches for Bimora, Official CF Staff, Attention Mercenaries, the 24/7 promise, or the old sender address in `client` and `api` |
| Sitemap preview | Passed | HTTP 200, `application/xml`, and `lastmod` values of `2026-08-16`; the preview correctly carries `noindex` [2] |
| Pull request | Open and pushed | PR #34 points to commit `0f7852f` [1] |

The Vercel build log also reported non-blocking platform warnings: a failed submodule fetch warning, pnpm-version notices, ignored dependency build scripts, and a PostCSS `from`-option warning. None stopped the successful build, but the submodule configuration and PostCSS warning should be reviewed during ordinary maintenance if those dependencies become relevant to deployment output.

## Current production state

| Area | Current state | Release implication |
|---|---|---|
| GitHub branch | `manus/review-hardening-20260814` | All final code changes are pushed |
| Latest deployment | READY deployment `dpl_3ttYvs2JHfZH329zjMXpxojXFMiF` | Safe candidate for production assignment |
| Vercel project status | `live: false` | The project is not currently marked live through the inspected Vercel integration |
| Domains reported by Vercel | Internal Vercel domains only | `crossfire.wiki` is not attached in the inspected project metadata |
| Public custom domain | Previously observed serving the older build | The Arabic loading, localization, SEO, and branding fixes will not appear publicly until the domain is switched |
| Preview route access | Protected by Vercel SSO | The sitemap could be fetched directly; application routes returned an SSO redirect until a valid preview access link is available |

The previous live review found the custom domain still showing the old interface, including the old branding and the weapons/events loading behavior. The new Vercel project metadata independently confirms that the custom domain is absent from the inspected project domain list. This is a deployment-routing issue, not evidence that the current source fixes failed.

## Required production actions

| Order | Action | Completion condition |
|---:|---|---|
| 1 | In the Vercel project, assign `crossfire.wiki` to the READY deployment for commit `0f7852f`, or promote that deployment through the project’s production workflow. | Visiting `https://crossfire.wiki/` returns assets from the new build rather than the older deployment. |
| 2 | Set the Production environment variables. | `ADMIN_PASSWORD` contains the newly generated password chosen for production; `ADMIN_TOKEN_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_KEY` are present. Configure the Cloudinary variables if production image uploads are enabled. Do not commit any of these values. |
| 3 | Redeploy or promote after environment-variable changes. | The deployment is READY and the production domain is attached to that same release. |
| 4 | Run the smoke tests below from the public domain. | All routes show the correct language, data, authentication behavior, and SEO metadata. |

## Public smoke-test matrix

| URL | Expected result |
|---|---|
| `https://crossfire.wiki/` | CrossFire Wiki branding, current build assets, and no retired Bimora copy |
| `https://crossfire.wiki/ar/` | Arabic interface with Arabic canonical and Open Graph locale |
| `https://crossfire.wiki/ar/admin/login` | Admin login route loads; successful authentication depends on the production environment variables |
| `https://crossfire.wiki/ar/weapons` | Weapon data loads or a clear retry/error state appears; no indefinite blank screen |
| `https://crossfire.wiki/ar/events` | Event data loads or a clear retry/error state appears; cards use safe image fallbacks |
| `https://crossfire.wiki/events` | English content remains English, without Arabic state leakage |
| `https://crossfire.wiki/posts` | Detailed posts show localized metadata, real reading time where body text exists, and non-identical image fallbacks |
| `https://crossfire.wiki/sitemap.xml` | HTTP 200 XML response with current, non-future `lastmod` values |

## Final assessment

The codebase has reached a substantially stronger release state: authentication hardening, protected administration endpoints, bilingual routing and content, SEO and sitemap improvements, wiki templates, safer image rendering, scraper translation improvements, richer content, search deep links, and the live-review defect fixes are all present on the pushed branch. The remaining release blocker is operational: **Vercel must serve the READY deployment through `crossfire.wiki`, and Production environment variables must be verified**. Until that is completed, the public domain should not be described as fully updated even though the source branch and latest Vercel build are verified.

## References

[1]: https://github.com/Mostafalol1233/crwiki/pull/34 "CrossFire Wiki Pull Request #34"
[2]: https://vercel.com/mostafalol1233s-projects/crossfire.wiki/3ttYvs2JHfZH329zjMXpxojXFMiF "Vercel deployment for commit 0f7852f"
[3]: https://crossfire.wiki/ "CrossFire Wiki public domain"
[4]: https://vercel.com/docs/deployments/configure-a-build "Vercel build configuration documentation"
