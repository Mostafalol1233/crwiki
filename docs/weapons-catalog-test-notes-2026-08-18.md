# Weapons catalogue test notes — 2026-08-18

## Local preview

The English route `/weapons?catalog-preview=1` rendered successfully after the Vite server finished restarting. The page shows the dark catalogue shell, the official-style header region, acquisition filter row, category glyph filters, alphabet row, search/sort controls, and two local fallback weapon records.

## Data status

The local sandbox has no usable Supabase response for this preview, so the page displays `AK47 Beast` and `M4A1 Ranger`. Both are intentionally marked `Unverified`; no acquisition method is invented. The acquisition counts therefore read All items 2 and Unverified 2, with zero GP, ZP, Mileage, Black Market, or Event/Pass items.

## Changes under test

`client/src/lib/supabaseApi.ts` now passes through acquisition type, acquisition method, acquisition, shop type, currency, acquisition verification, source URL, and created date when available. `api/sitemap.ts` tries a richer weapon projection first and falls back to the stable projection when an older Supabase schema does not expose one of those optional columns.

## Visual observation

The responsive desktop render is structurally correct. The fallback image is displayed inside the light card area because the local fallback weapon records have no image URL. This is expected behavior for unavailable media and should be replaced by real API/local weapon images when the production dataset is reachable.

## Arabic preview

The language switch opened `/ar/weapons?catalog-preview=1` and rendered the catalogue in RTL. Acquisition labels, category labels, search placeholder, footer navigation, and status labels were translated. The breadcrumb and internal links use one `/ar` prefix rather than `/ar/ar`.

The two fallback records remained `غير متحقق`, which is the correct conservative behavior when no verified acquisition source is present.

## Detail modal

Opening `AK47 Beast` in Arabic displayed the RTL detail dialog with category, `غير متحقق` status, the Arabic no-description notice, and the explicit acquisition-source note. Closing the dialog returned cleanly to the catalogue without changing the selected filters.
