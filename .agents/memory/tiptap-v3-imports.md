---
name: TipTap v3 imports
description: Which TipTap v3 extensions use named vs default exports — critical for avoiding "does not provide an export named 'default'" errors.
---

**Rule:** In TipTap v3 (`^3.x`), `@tiptap/extension-table` is a **named-only** export. Use `import { Table } from '@tiptap/extension-table'`. Using the default import crashes the whole editor module.

**Other extensions:**
- `@tiptap/extension-color` — use `import { Color }` (named). Default import builds locally but **fails Vercel/rollup**.
- `@tiptap/extension-text-style` — use `import { TextStyle }` (named only, no default export at all).
- `@tiptap/extension-link` — has both named `{ Link }` and default. Either works; alias it to avoid conflict with lucide `Link`.
- `TableRow`, `TableCell`, `TableHeader` — default exports only.
- `@tiptap/extension-underline` — must be installed AND added to `extensions[]` before adding a toolbar button for it.

**Why:** TipTap v3 changed several extension exports to named-only. The v2→v3 migration guide lists these but the errors appear at runtime as "error loading dynamically imported module", not a build error.

**How to apply:** Every time a new TipTap extension is added, verify whether it has a named or default export before writing the import line.
