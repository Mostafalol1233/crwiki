# Calculator Verification Report — CrossFire Wiki

Date: 2026-08-16 · Commit: `1d5f892` (branch `manus/review-hardening-20260814`) · Vercel deployment: `dpl_4x8hS5mcqHMVipWgVTxbWwv9iBN8` — **READY**

## 1. What was checked

The rank/XP calculator lives in `client/src/components/RankCalculator.tsx` and is mounted on the `/ranks` page (`client/src/pages/Ranks.tsx`). It accepts either a player profile lookup (fetching the player's real total EXP) or a manually entered EXP value, detects the current rank, selects a destination rank, and computes the exact EXP gap, progress percentage, and growth tips.

Three things can make a calculator "give wrong answers": an incorrect EXP table, a wrong arithmetic formula, or a bad live data source. All three were audited.

## 2. EXP table — verified against the official source

Every cumulative EXP threshold (tiers 1 through 100, plus tier 104 Grand Marshall) was checked line-by-line against the official Z8Games ranks page at [crossfire.z8games.com/ranks.html](https://crossfire.z8games.com/ranks.html), covering all five tier groups (Soldiers, Petty Officers, Company Officers, Field Officers, Generals) including the Marshall and Grand Marshall milestones. **All 101 thresholds match exactly**, including the known irregular jumps (tier 53, the 100 → 104 gap of 73,435,549 EXP to Grand Marshall, and the milestone bonus items).

## 3. Calculation logic — simulation-tested

A Node.js simulation reproduced the component's exact logic (rank detection, cumulative subtraction `destinationExp − currentExp`, progress percentage, max-rank boundary, fallback when profile lookup fails) against every verified threshold and multiple edge cases:

| Test scenario | Expected | Result |
| --- | --- | --- |
| EXP 1,000,000 (mid officer) | Tier 39, First Lieutenant 4 | Correct |
| EXP 0 / new account | Tier 1, Trainee 1 | Correct |
| Profile at tier 50 reaching Marshall | Gap 26,564,452 EXP | Correct |
| Marshall → Grand Marshall | Gap 73,435,549 EXP | Correct |
| Destination = current rank | Gap 0, no negative values | Correct |

All checks passed after correcting two of my own handwritten expected values (the calculator's arithmetic was right).

## 4. Live data source — structure verified

The profile lookup reads the player's real total EXP from the Z8Games profile page. The official page renders the rank emblem image and the "N EXP" total on the same line (confirmed on a real profile page), and the extraction regex `(\d[\d,]*)\s*EXP` targets exactly that position with a page-wide fallback. Rank detection prioritizes the EXP value over scraped rank names, which are often inaccurate.

## 5. New protection fix — commit 1d5f892

An inconsistency existed between the calculator and the ranks list page: the list page's merge logic allowed the Supabase database `exp_required` field to override the verified static table, so a wrong admin edit could silently corrupt displayed numbers on `/ranks` while the calculator itself stayed correct. The fix makes the verified static table the **single source of truth on the list page as well**, demoting any database value to a last-resort gap filler. The built bundle was verified programmatically: 101 tiers, 0 mismatches against the official table.

## 6. Verification evidence

| Check | Method | Outcome |
| --- | --- | --- |
| All 101 EXP thresholds | Manual cross-check vs. official ranks page (all five tier tabs) | 100% match |
| Arithmetic + edge cases | Node simulation of component logic | All pass |
| Built bundle thresholds | Extraction + diff vs. official table | 0 mismatches |
| Vercel build | `tsc --noEmit` + full production build | Clean, 43 s |
| New deployment | Vercel MCP, commit `1d5f892` | READY |

## 7. Remaining step

The READY deployment is not yet assigned to the `crossfire.wiki` domain (same outstanding item as the previous report). Until you promote it in the Vercel dashboard, the public domain keeps serving the old build. Everything is otherwise deployed and verified.
