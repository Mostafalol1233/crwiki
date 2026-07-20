---
name: Rank Calculator — complete 104-tier system
description: All details of the rank calculator implementation and EXP threshold formula.
---

## EXP formula
`EXP(tier) = round(487 * tier^2.5, 1000)` — calibrated so tier 79 (Brigadier General 4) ≈ 27,000,000, matching real player data. Tier 1 = 0 EXP.

## Tier layout (104 total)
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
| 76-81 | Brigadier General 1-6 (confirmed BG4=79, BG6=81) |
| 82-87 | Major General 1-6 (confirmed MG2=83, MG5=86, MG6=87) |
| 88-93 | Lieutenant General 1-6 (confirmed LTG3=90, LTG6=93) |
| 94-103 | General 1-10 (confirmed Gen2=95, Gen4=97, Gen6=99) |
| 104 | Grand Marshall |

## Image URL
`https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_{tier}.jpg`

## Dark mode fix
- Site default was "light" — ThemeProvider now defaults to "dark" and migrates old "light" localStorage.
- `<html class="dark">` in index.html for before-JS-runs coverage.
- ThemeProvider clears stale "light" preference on init.

**Why:** Site is dark-only wiki; many Tailwind classes (bg-card, bg-muted, border-border) relied on CSS vars that defaulted to light, causing white EventsRibbon and other broken elements.
