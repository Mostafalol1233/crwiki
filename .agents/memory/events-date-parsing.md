---
name: Events date parsing & site banner removal
description: How non-ISO human date strings are handled in EventsList/EventDetail, and that SiteBanner was removed from App.tsx
---

## Rule
Events stored with human-readable date strings like "July 20–26, 2026" must be parsed via `parseDateRange()` before any Date math. Never pass raw human strings to `new Date()` directly — results in "Invalid Date" shown to users.

**Why:** Supabase `events` table stores `date` as a plain text field (e.g. "July 24 – 31, 2026"), not ISO 8601. `new Date("July 24 – 31, 2026")` returns NaN in most browsers.

**How to apply:**
- `EventsList.tsx` has `parseDateRange()` helper at top of file — use it in `formatDate()`, `classifyEvent()`, and `Countdown` component.
- `EventDetail.tsx` has `parseDateStr()` (single-date variant) — same pattern.
- `formatDate(d)` now returns raw string `d` as fallback when `isNaN(parsed.getTime())` — never shows "Invalid Date".
- `Countdown` component resolves `dateStr` to ISO before starting timer.

## SiteBanner
`client/src/components/SiteBanner.tsx` still exists but is no longer imported or rendered in `App.tsx`. It was showing "🚧 The site is still experiencing some issues" on every page to every visitor. Removed July 26, 2026.

## GM Section
`GMSection.tsx` previously showed hardcoded "Last seen: Apr 27" stale dates with always-green dots. Changed to show "Official CF Staff" green badge — no stale date displayed.

## AdminTopbar
`AdminTopbar.tsx` previously used `window.location.href` for logout and breadcrumb "Admin" click (full page reload). Fixed to use wouter `navigate()`.
