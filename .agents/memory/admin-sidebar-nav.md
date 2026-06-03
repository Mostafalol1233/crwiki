---
name: AdminSidebar navigation pattern
description: How to build sidebar nav items that avoid nested anchor DOM errors and invalid hook call crashes in Wouter.
---

**Rule:** Never nest a `<Link>` (Wouter) around an `<a>` tag, and never place an `<a>` inside a `<Link>`. Wouter's `<Link>` renders as an `<a>`, so nesting causes an invalid DOM structure that React/Wouter turns into an "invalid hook call" crash.

**Pattern used in AdminSidebar:**
```tsx
const [, navigate] = useLocation();
<div
  role="button"
  tabIndex={0}
  onClick={() => navigate(item.path)}
  onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
>
  {item.label}
</div>
```

**Why:** The nested anchor caused an "invalid hook call" error in the browser that crashed the entire admin panel. The fix is to use a `div` with `role="button"` + `useLocation` navigate(), which produces valid HTML and correct SPA routing.

**How to apply:** Any sidebar/nav component in this project should follow this div+navigate pattern, not Link-wrapping styled anchors.
