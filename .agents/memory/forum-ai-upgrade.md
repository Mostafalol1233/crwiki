---
    name: Forum + AI upgrade
    description: Full forum system and open-access AI with live Supabase knowledge injection
    ---

    ## Forum System
    - Tables: forum_categories, forum_threads, forum_posts
    - Routes: /forum, /forum/:categorySlug, /forum/:categorySlug/:threadId, /forum/:categorySlug/new
    - Pages: Forum.tsx, ForumCategory.tsx, ForumThread.tsx, NewThread.tsx
    - API functions appended to supabaseApi.ts
    - No login required — guest posting allowed with optional display name
    - Forum.tsx shows full setup SQL + Copy button when tables are missing
    - Header Community dropdown: navForum → /forum, navAI → /ai added

    **Why:** Admin must run setup SQL once in Supabase SQL Editor to create tables + seed 6 default categories.

    ## AI Assistant Upgrade
    - Removed auth gate from AIAssistant.tsx — anyone can use /ai
    - vite.config.ts cfAiPlugin: fetchWebsiteContext() fetches weapons/ranks/modes/mercenaries/events from Supabase REST API
    - Context injected into system prompt, cached 30min in-memory
    - Uses VITE_SUPABASE_PUBLISHABLE_KEY env var for anon access
    - Model: openai/gpt-oss-20b:free (confirmed working)
    