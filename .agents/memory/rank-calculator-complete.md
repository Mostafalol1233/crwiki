---
name: Rank Calculator — real rank data from Z8Games
description: All details of the rank system — real EXP values scraped from z8games.com, tier layout, and image URLs.
---

## Data source
Real EXP values scraped from https://crossfire.z8games.com/ranks.html on 2026-07-22.
The old polynomial formula (`487 * tier^2.5`) was WRONG — replaced with a hardcoded lookup table in both `Ranks.tsx` and `RankCalculator.tsx`.

## Rank count: 101 (not 104)
The real site has 101 ranks: tiers 1–100 plus tier 104 (Grand Marshall).
Tiers 101–103 do not exist on the official site.

## Tier layout (real, from z8games)
| Tiers | Rank group |
|-------|-----------|
| 1-2 | Trainee |
| 3-5 | Private / PFC / Corporal |
| 6-9 | Sergeant 1-4 |
| 10-15 | Staff Sergeant 1-6 |
| 16-21 | Sergeant First Class 1-6 |
| 22-27 | Master Sergeant 1-6 |
| 28-35 | Second Lieutenant 1-8 |
| 36-43 | First Lieutenant 1-8 |
| 44-51 | Captain 1-8 |
| 52-59 | Major 1-8 |
| 60-67 | Lieutenant Colonel 1-8 |
| 68-75 | Colonel 1-8 |
| 76-81 | Brigadier General 1-6 |
| 82-87 | Major General 1-6 |
| 88-93 | Lieutenant General 1-6 |
| 94-99 | General 1-6 (NOT 1-10 — old code was wrong) |
| 100 | Marshall (new rank — did not exist in old code) |
| 104 | Grand Marshall |

## Key EXP values (real)
- Tier 2: 457 EXP | Tier 9: 13,225 | Tier 27: 279,301 | Tier 79: 8,964,562 | Tier 100: 26,564,452 | Tier 104: 100,000,000

## Image URL
`https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_{tier}.jpg`

## Supabase SQL
Full upsert SQL at `supabase/seed-ranks-real.sql` — run in Supabase SQL editor to sync DB.
The SUPABASE_SERVICE_KEY secret is not injected into ShellExec so the seeding script must be run manually or via the Supabase dashboard.

## Dark mode fix
- ThemeProvider defaults to "dark", clears stale "light" localStorage.
- `<html class="dark">` in index.html for before-JS-runs coverage.
