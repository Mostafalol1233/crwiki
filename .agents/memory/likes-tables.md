---
name: Likes tables
description: Schema and API for universal likes (posts/videos/comments) added to supabase-schema.sql and supabaseApi.ts
---

Three tables added to the schema:
- `likes` — universal: target_id TEXT, target_type TEXT (e.g. "post","video"), user_identifier TEXT. UNIQUE(target_id, target_type, user_identifier).
- `video_likes` — video_id TEXT, user_identifier TEXT. UNIQUE(video_id, user_identifier).
- `comment_likes` — comment_id UUID FK→comments, user_identifier TEXT. UNIQUE(comment_id, user_identifier).

All three have RLS policies (public read, anyone can insert/delete own).

API functions exported from supabaseApi.ts:
- getLikeCount(targetId, targetType) → number
- hasUserLiked(targetId, targetType) → boolean
- toggleLike(targetId, targetType) → { liked, count }
- getVideoLikeCount(videoId) → number
- toggleVideoLike(videoId) → { liked, count }
- toggleCommentLike(commentId) → { liked, count }

**Why:** user_identifier is generated client-side (localStorage "cf_user_id"), not from auth — no login required to like.

**How to apply:** Import from supabaseApi.ts. Use `toggleLike(id, "post"|"news"|"video"|"event")` for generic likes. Use specific functions for video and comment likes.
