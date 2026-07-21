---
name: Arabic i18n Setup
description: Full Arabic/English translation system — architecture, URL routing, RTL fix, and which files use t() vs hardcoded strings
---

## Architecture
- `client/src/components/LanguageProvider.tsx` — central i18n system with React Context
- Language detection order: URL `/ar` prefix → localStorage → browser locale → fallback `en`
- URL-based routing: visiting `/ar` or `/ar/...` sets Arabic; switching language updates URL via `window.history.replaceState`
- `setLanguage(lang)` exported from context (besides `toggleLanguage`) for programmatic switching
- `t("key")` hook used everywhere for UI strings

## RTL Bug Fix
- Old code hardcoded `dir="ltr"` even for Arabic — fixed to set `dir="rtl"` for Arabic, `dir="ltr"` for English
- `document.documentElement` and `document.body` both updated on language change

## Translation Keys Added (July 2026)
Added ~100 new keys covering:
- Footer: all section labels, links, newsletter, social buttons (footerStayInformed, footerNewsSection, etc.)
- Support page: all form labels, placeholders, toast messages (supportCenter, supportCategory, etc.)
- Contact page: channel cards, form, follow us, need support section
- Login page: all labels, feature list, stats
- Header: navTutorials (was hardcoded "Tutorials")

## Files Now Fully Using t()
- `Header.tsx` — all nav items including Tutorials
- `Footer.tsx` — full translation; link arrays defined inside component to access t()
- `Support.tsx` — all labels, form fields, toasts, breadcrumb
- `Contact.tsx` — channel cards defined inside component; all text translated
- `Login.tsx` — all labels, taglines, feature items

**Why:** Footer's link arrays had to be moved inside the Footer component because they need access to t() from the hook — can't use hooks at module level.
