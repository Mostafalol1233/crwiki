# Vercel review findings

Checked 2026-08-16 via the configured Vercel integration.

- Project: `crossfire.wiki`, project ID `prj_D8CkmUCAXzgrDTQpDsuC0hODBott`, team `team_iLCDCxo5AnnvbDcsQTU6qVil`.
- Commit `1f3d43f` deployment `dpl_DmmZs7sahp6Gx6MemLoyp31TbdA8` reached `READY` at preview URL `https://crossfirewiki-3pe4m5jzp-mostafalol1233s-projects.vercel.app`.
- Project metadata reports `live: false`; configured domains are only `crossfirewiki-mostafalol1233s-projects.vercel.app` and `crossfirewiki-git-manus-review-cb0a37-mostafalol1233s-projects.vercel.app`. `crossfire.wiki` is not listed as a project domain in this check.
- Deployment protection: password protection disabled; SSO protection enabled for all except custom domains; trusted IPs disabled.
- After commit `8179fff` (`fix: reject future sitemap modification dates`) Vercel created deployment `dpl_gzVmwGqZkVAiYww4jKWycJTt45K8` at `https://crossfirewiki-l3h9i1s1r-mostafalol1233s-projects.vercel.app`, initially `BUILDING` when checked.
- Before the date guard was deployed, preview `https://crossfirewiki-3pe4m5jzp-mostafalol1233s-projects.vercel.app/sitemap.xml` returned HTTP 200 with `content-type: application/xml`, but multiple shared URLs had `lastmod` `2026-12-31`; this prompted the future-date guard in `api/sitemap.ts`.
- The sitemap response was served with `X-Robots-Tag: noindex` as intended for a sitemap endpoint.
- Source: Vercel MCP project/deployment results and preview fetch performed in this task.

- Deployment `dpl_J9tLJLrmcEVai8hc46DwfMN9EeGo` was created from commit `ebe079a` and reached the Vercel build output stage, but its build log reported `api/images/upload.ts(36,5): error TS2349: This expression is not callable` for the multer middleware invocation. The source was patched by narrowing the middleware to an explicit callable signature; a fresh deployment is required before considering the latest build fully verified.
- The same log showed the Vite client build completed successfully (`✓ built in 1m 13s`) and then proceeded to deploy outputs; the serverless TypeScript diagnostic is therefore the remaining deployment validation item, not a client build failure.

- Fresh deployment `dpl_3ttYvs2JHfZH329zjMXpxojXFMiF` from commit `0f7852f` reached READY. Its Vercel build log ended with `Build Completed in /vercel/output`, `Deployment completed`, and no recurrence of the upload middleware TypeScript error.
- Preview `https://crossfirewiki-7pt4qerel-mostafal1233s-projects.vercel.app/sitemap.xml` returned HTTP 200 with `content-type: application/xml; charset=utf-8`; the emitted `lastmod` values were `2026-08-16`. The preview response included `x-robots-tag: noindex`, which is expected for a protected preview and is not a production indexing verdict.
- Vercel project metadata reported latest deployment `dpl_3ttYvs2JHfZH329zjMXpxojXFMiF` as READY, `live: false`, and only the domains `crossfirewiki-mostafalol1233s-projects.vercel.app` and `crossfirewiki-git-manus-review-cb0a37-mostafalol1233s-projects.vercel.app`. `crossfire.wiki` was absent from that domain list, so the public custom domain still requires manual assignment or promotion.
- Pull Request #34 remains OPEN with head commit `0f7852fab16ef7f97d5696c6e65e167ae16e405e`.
