---
name: Admin source editor
description: How complete HTML/CSS content is preserved in admin editing and public rendering.
---

## Rule

Content editors have two modes: visual TipTap editing for normal rich text and a complete HTML Source mode for layouts, inline CSS, custom attributes, embeds, and code that TipTap cannot represent. Source mode updates the stored HTML directly; it must not be routed through `insertContent`.

**Why:** TipTap's schema strips unsupported layout tags, classes, styles, and image dimensions, which made imported content appear as unformatted words.

**How to apply:** Keep source mode as the lossless import/edit path. Public rendering may preserve safe presentation tags and attributes, but must remove executable script tags and event-handler attributes. JavaScript can be stored or shown in code blocks, never executed as article content.