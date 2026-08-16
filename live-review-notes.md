# CrossFire Wiki live review notes

## Homepage — 2026-08-16

The live homepage at https://crossfire.wiki/ loads successfully over HTTPS and presents a dark CrossFire-themed visual system. The first viewport contains a global navigation bar, AI link, login and sign-up actions, a large hero section titled “CrossFire Wiki,” a short value proposition, and a prominent search field. The category portal grid exposes Weapons, Maps, Mercenaries, Modes, Ranks, and Events. The page also includes latest news, monthly highlights, official staff, newsletter signup, community links, and footer navigation.

Positive observations: the value proposition is immediately understandable; primary discovery paths are visible; the portal cards are visually strong; the news cards use stable CDN images; and the overall theme is cohesive and game-relevant.

Potential hiring-manager concerns: the first viewport is visually dense with many navigation items and controls; the copy “everything you need to dominate” is energetic but not especially authoritative; several sections are below the fold and need interaction review; and the page should be evaluated for mobile layout, Arabic parity, content freshness, and trust signals. The colored numbered boxes and dashed outlines visible in the captured screenshots are browser inspection annotations, not evidence that the public site exposes a debug overlay, so they should not be treated as a site defect.

Visible routes and actions include /weapons, /maps, /mercenaries, /modes, /ranks, /events, /news, /download, /reviews, /support, /ai, /login, and /register.

## Arabic homepage — 2026-08-16

The Arabic homepage at https://crossfire.wiki/ar/ loads successfully and the main navigation, category labels, search placeholder, CTA links, footer, and portal labels are translated. The layout is visually mirrored and the RTL presentation appears active. However, the CrossFire Wiki brand name remains in English, the hero news cards and article excerpts remain in English, the content type labels remain English, and the top utility search still shows the English placeholder “Search...”. This creates a mixed-language experience rather than full Arabic parity. The colored numbered boxes and dashed outlines in the captured screenshot are browser inspection annotations, not a confirmed public-site issue. The real localization concern is the remaining English utility search placeholder and untranslated article metadata/content.

The Arabic page has stronger localized category cards than the English page in this session, but that visual difference should be checked for deterministic asset selection and language-specific content consistency. The Arabic page exposes the expected discovery routes and appears to retain the same content hierarchy as English.

## News listing and article detail — 2026-08-16

The Arabic news listing is visually strong and presents six articles with stable images, dates, categories, quick-access links, wiki statistics, and an about card. The content is materially better than placeholder copy and includes explicit rumor verification. However, many official product names remain in English, which is acceptable for proper nouns but should be handled consistently with a glossary and accessible Arabic explanations. The article cards are dense and the sidebar becomes crowded on smaller screens.

The Arabic ZM4 article loads as a long-form detail page with a prominent hero image, structured sections, source links, and a clear author/date/category treatment. The editorial tone is considerably more credible than short filler content, and it distinguishes official information from strategy suggestions. A real routing defect appears in the extracted breadcrumb links: the Home and News links become malformed paths such as `/arhttps://crossfire.wiki/` and `/arhttps://crossfire.wiki/news`. These links should be normalized to `/ar/` and `/ar/news` or generated through the locale-aware router. The article also exposes an `LTR` direction control and retains English utility labels in the header, which should be reviewed for Arabic completeness.

## Weapons route — 2026-08-16

Opening https://crossfire.wiki/weapons while the browser retained Arabic language state redirected to /ar/weapons. The page header and footer rendered, but the main content area between them was almost entirely empty/black in the captured viewport. No weapon database, filters, cards, counts, or loading/error explanation were visible. The extracted page text contained only the shared navigation and footer, with no weapon content. This is a critical production issue: either the route is rendering an empty state, data loading is failing silently, or the language-aware route is misconfigured. The page should show a clear loading state, an actionable error state, or the actual weapon catalogue instead of a large blank area.

The global search placeholder also remained in English on the Arabic route. The colored numbered boxes and dashed outlines in the captured screenshot are browser inspection annotations and are not counted as a public-site defect.

## Modes route — 2026-08-16

The Arabic modes page at https://crossfire.wiki/ar/modes loads real data and presents 61 modes across three categories, a search field, category filters, a selectable mode list, a detail panel, win conditions, source links, and map previews. This is a strong product surface for a wiki because it combines discovery and detail in one view.

The main weakness is localization: the route is Arabic, but the page heading appears as “GAMEMODES,” the mode names and descriptions are English, the filter labels are English, and the detail copy is English. This is acceptable for canonical game names only when paired with Arabic explanatory text; here it appears to be a broad untranslated dataset. The page also shows a loading line for extra details inside the selected mode, so the final detail state and failure state should be verified.

This confirms that the blank weapons route is not a universal data-loading failure. Modes successfully render a populated catalogue, making /ar/weapons a route-specific defect or deployment/data-query issue.

## Weapons deep-link retest — 2026-08-16

Opening https://crossfire.wiki/ar/weapons?q=AK-47 confirms the route-specific failure. The page renders the heading, search field, alphabet filters, weapon-type filters, and sort controls, but the data area remains empty with a loading indicator and no result or error after navigation. The extracted text says “Loading... — explore stats, categories and details” and contains no weapon cards. The `q=AK-47` deep-link is therefore not usable in production at the time of review. This should be treated as the highest-priority functional defect because Weapons is a primary navigation destination and a headline value proposition of the wiki.

## Authentication and acquisition — 2026-08-16

The Arabic login page has a polished split layout with clear benefits and database counts on the left and a compact login card on the right. It offers email/username/phone, password, Google continuation, password reset, and registration. The main concern is mixed language: “The Definitive,” “Continue with Google,” and “Forgot password?” remain English on the Arabic page, while the main labels are Arabic. The product should either provide complete Arabic localization or intentionally label account/authentication UI as bilingual.

The Arabic registration page presents a stronger value proposition with member benefits, optional profile picture, email, optional phone, username, password requirements, and a clear account CTA. Again, almost the entire form and benefits panel remain English, including “CREATE ACCOUNT,” “JOIN THE COMMUNITY,” and “TRACK YOUR RANK PROGRESSION.” From a hiring-manager perspective, this looks like an unfinished localization pass and weakens international-product credibility. The form also should expose privacy/terms consent at the point of account creation, or clearly state where those policies apply.

## About and download pages — 2026-08-16

The Arabic About page is one of the strongest content pages. It has a clear hero, game overview, factions, mode explanations, map showcase, currencies, discovery links, and community links. It reads like a real onboarding guide rather than a placeholder page. The main improvement opportunity is editorial trust: claims such as “millions of active players” and broad availability statements should be tied to a dated official source, and the page needs an explicit editorial methodology, last-verified date, and team/about section. Several canonical game terms are transliterated into Arabic inconsistently, so a terminology glossary would improve professionalism.

The Arabic Download page has good safety and trust language: it points to the official Z8Games download URL, states that the wiki does not distribute files or modifications, identifies CrossFire West, and provides installation steps and system requirements. The main problem is that the hero and installation sections remain almost entirely in English on an Arabic route, while the requirements heading is Arabic. The requirements should also include a “last verified” date and an explicit Windows 11/support status, because the minimum OS list currently stops at Windows 10 and could be outdated. The page should make region/server scope more prominent before the download CTA so users do not mistake it for a universal CrossFire client.

## Crawlability and SEO surface — 2026-08-16

The live robots.txt is reachable and clearly disallows `/admin`, `/api`, and allows the primary public sections. It references the main sitemap, news sitemap, images sitemap, and sitemap index. Cloudflare-managed content signals also permit search indexing and reference use while disallowing AI training, which is a deliberate and professional policy choice.

The live sitemap index is valid XML and references `sitemap.xml`, `news-sitemap.xml`, and `images-sitemap.xml`. A concern is freshness: all three sitemap entries show `lastmod` as 2026-07-21 even though the visible news content is dated August 2026. A hiring-manager review would flag this as an SEO operations gap. Sitemap last-modified values should update when new articles or events are published, and the index should be checked for Arabic/English URL coverage and canonical consistency.

## Privacy and trust pages — 2026-08-16

The Arabic privacy page is present, readable, dated 26 March 2026, and includes collection, usage, security, cookies/analytics, rights, sharing, children’s privacy, changes, and contact information. This is a positive trust signal. It identifies contact@crossfire.wiki and Bimora Gaming.

The page is still a general-purpose policy rather than a fully operational compliance surface. It should identify the data controller/legal entity and jurisdiction, explain Supabase/authentication and storage providers more precisely, state retention periods, clarify Google Analytics consent behavior, and link to an actual cookie preference control if non-essential analytics are used. The Arabic list rendering shows literal bullet characters in the text, which is visually less polished. The footer copyright year differs between pages in the wider site, so legal and brand metadata should be made consistent.

## Core database pages — 2026-08-16

The Arabic Maps page confirms the database count of 312/312 and shows a useful grid/list switch plus search. However, the route is visibly mixed-language: breadcrumb “Home > Maps,” English section label “BATTLE ARENAS,” English search placeholder, and English card names. In the viewport, some map cards load images while later cards show large dark empty image areas; this may be lazy-loading or missing-image behavior, but it does not look production-polished and should be verified on a slower connection and at scroll depth.

The Arabic Ranks page loads 101 ranks and presents a strong data layout with search, sort, grid/table modes, rank colors, and a rank lookup tool. It is functional and visually coherent, but the entire control layer remains English (“PROGRESSION SYSTEM,” “Search ranks…,” “EXP LOW→HIGH,” “GRID,” “TABLE,” “LOOK UP”), which makes the Arabic route feel partially translated rather than localized. The rank lookup also needs a clear explanation of what data is sent to the external Z8Games profile endpoint and how failures are handled.

## Characters and FAQ — 2026-08-16

The Arabic Mercenaries page is visually distinctive and contains 41 operatives, image cards, strip/grid layout controls, and voice controls. It is not sufficiently localized: breadcrumb, section label, layout controls, and interaction labels are English. More seriously, the screenshot shows many character cards with large dark blank image areas while a few images load. The data contains suspicious duplicated-looking image mappings for some characters (for example identical asset paths appearing for different named characters in the extracted content). This is a high-visibility media-quality issue that makes the page feel unfinished even though the dataset exists.

The Arabic FAQ is a strong content asset with 40 questions across six categories, a search field, category filters, expandable items, and a support CTA. It uses accessible colloquial Arabic for many questions and retains English equivalents, which is useful for the audience. The main issue is routing consistency: the support CTA extracted from the Arabic page points to `/support` rather than `/ar/support`, risking a language reset or incorrect route. The FAQ also claims 24/7 support, which should be operationally verifiable or softened to avoid overpromising. The title and category controls are Arabic, but several branded terms and English equivalents create a mixed-language presentation that needs a deliberate style guide.

## Support workflow — 2026-08-16

The Arabic support page is usable and visually coherent: it has WhatsApp escalation, response expectations, ticket status indicators, a category selector, priority selector, subject/details fields, optional attachment, and a clear submit CTA. It provides a better operational impression than many other sections.

The Arabic My Tickets page is a notable localization failure. Although opened at `/ar/my-tickets`, the visible content is entirely English: “SUPPORT,” “My Tickets,” “Enter Your Email,” “View My Tickets,” and an English placeholder. This is especially damaging because it is a post-support workflow where users need confidence and clarity. It should also explain why email lookup is used, provide a secure ticket-access model, and clearly distinguish it from authenticated account support.

## Search and editorial catalogue — 2026-08-16

The Arabic search page opens with the query `AK-47`, shows the expected four tabs and Arabic field placeholder, but remains on a loading spinner with no result card or error explanation. The counters report one overall result and one news/article result, but the result body does not visibly resolve during review. This is a high-priority trust issue: a search page must never leave a user staring at an indefinite spinner.

The Arabic posts catalogue is one of the strongest editorial surfaces. It presents a prominent lead story plus six additional long-form pieces, all with clear titles, categories, summaries, dates/author treatment, and readable card hierarchy. However, every card currently uses the same `/portal/modes.jpg` image in the extracted content, even for weapons, tournament, and rumor articles. That repetition makes the site look algorithmically populated rather than carefully edited. The page is also mostly English content on an Arabic route, including title, summaries, category labels, and “Read More,” so it is not ready to claim bilingual editorial quality.

## Article detail and translation control — 2026-08-16

The long-form ZM4 article is structurally impressive: it has a hero image, table of contents, anchors, source links, explicit separation between confirmed facts and editorial advice, and a useful warning that event reward figures are time-bound. This is the kind of editorial discipline a hiring manager would value.

But the Arabic route still renders the title, headings, body, TOC labels, tags, breadcrumb labels, and source-adjacent UI in English. The translation control shown in the page is actually an `LTR` direction control, not a content translation action; the prior extracted `TRANSLATE` label changed to `LTR` after interaction. The article also displays `PUBLISHED: N/A` and “1 MIN READ” despite its long body, which strongly signals incomplete metadata wiring. Breadcrumbs contain both `/ar/` links and a malformed-looking absolute URL pattern in the earlier extraction; route generation should be normalized and tested. These are high-impact polish issues rather than content-depth issues.

## Events page — 2026-08-16

The Arabic events page exposes the right product model—All/Active/Upcoming/Ended filters, a community Discord panel, quick links, and a status guide—but the main event catalogue remains on a visible indefinite loading spinner with no cards or empty/error state. The page title, subtitle, filters, Discord content, quick links, and status guide are predominantly English on an Arabic route. This is another critical reliability/localization failure in a primary destination and weakens confidence in the data-driven announcement/event system.

## English events comparison — 2026-08-16

Opening `/events` after the Arabic review does not restore a proper English page. The main content area is completely blank, while the footer still renders in Arabic and links point to `/ar/...`. This indicates the language state or route canonicalization is leaking across sessions, and the events route has a cross-locale production defect beyond the Arabic translation gap. A hiring manager would treat this as a release-blocking navigation/state bug because a canonical English URL cannot reliably show English content.

## Language-state diagnosis — 2026-08-16

Browser inspection of `/events` shows `localStorage.language = "ar"`, `localStorage.theme = "dark"`, no cookies, and the URL remains `https://crossfire.wiki/events`. The application is therefore allowing an Arabic persisted language preference to override the language implied by the English route, without redirecting to `/ar/events` or rendering a true English page. This is a concrete reproducible state-management defect, not only a visual translation observation.

## English home page — 2026-08-16

The home page makes a strong first impression visually: clear CrossFire branding, a useful universal search, six category portals, current news cards, quick links, community Discord, newsletter capture, and a coherent dark/gold visual system. It looks like a real product rather than a bare database.

The main professional risk is trust-language. The home content claims “Official Staff,” “Game Masters,” “Support & System Operations,” “Security & Anti-Cheat Operations,” and “Community Liaison & Forums,” which could be interpreted as publisher-affiliated roles. Unless those are explicitly verified and legally authorized, the labels should be changed to community roles such as “Wiki Editors,” “Community Moderation,” and “Player Support Guides,” with a visible disclaimer that the site is independent and not affiliated with Z8Games. The hero also says “everything you need to dominate,” which is energetic but less credible than a precise value proposition for a serious knowledge product.

## Download and responsive baseline — 2026-08-16

The download page is commercially and editorially strong: it links directly to the official Z8Games CrossFire West client, offers patch notes, explains installation, lists requirements, and explicitly states that the wiki is independent and does not distribute game files or modifications. This disclaimer should be promoted to the About and homepage surfaces as well.

At the current desktop viewport, the document has no horizontal overflow (`innerWidth=1280`, document width `1265`), which is a positive desktop baseline. This is not a substitute for a real mobile-width visual pass; the next review should test 390px and 768px breakpoints, especially the hero, data tables, search controls, cards, admin forms, and long articles.
