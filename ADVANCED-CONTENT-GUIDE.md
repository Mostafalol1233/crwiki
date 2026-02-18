# Advanced Content Manager - Complete Guide

## Overview
The Advanced Content Manager is a comprehensive tool for managing mercenaries, news, events, and posts with both local storage and backend synchronization.

## Features

### ✅ Verified Working
- **MP3 Audio File**: Test URL `https://files.catbox.moe/zbha6p.mp3` ✅ (4.2 MB, successfully downloaded)
- **Local Storage**: All items saved in browser's localStorage automatically
- **Backend Sync**: Push/pull content to/from MongoDB database
- **Multi-type Management**: Mercenaries, News, Events, Posts
- **Export**: Download items as JSON for backup
- **Real-time Status**: See sync status and item counts

## How to Use

### 1. Access the Advanced Content Manager
- Go to Admin Dashboard
- Click the **📋 Advanced Content Manager** button (top right)

### 2. Create Mercenary with Audio
**Steps:**
1. Click the **Mercenary** tab
2. Fill in:
   - **Name**: e.g., "Dean" or "Special Agent"
   - **Role**: e.g., "Assault", "Support", "Sniper"
   - **Image URL**: Avatar/profile picture URL
3. Add Sound URLs:
   - Paste a URL in the "Sound URL" field
   - Click **+** button to add
   - Example: `https://files.catbox.moe/zbha6p.mp3`
4. Click **Save Mercenary**

**Example Data for Dean:**
```
Name: Dean
Role: Special Agent
Image: [your-image-url]
Sounds: 
  - https://files.catbox.moe/zbha6p.mp3
```

### 3. Create News Article
**Steps:**
1. Click the **News** tab
2. Fill in:
   - **Title**: News headline
   - **Featured Image**: Banner image URL
   - **Content**: Full article text (supports multiline)
3. Click **Save News**

**Example - BINGO Event:**
```
Title: Imperial Dawn BINGO Edition
Image: [event-banner-url]
Content: Attention Mercenaries, B-I-N-G-O, B-I-N-G-O—get ready to shout it loud...
[Rest of content]
```

### 4. Create Event
**Steps:**
1. Click the **Event** tab
2. Fill in:
   - **Title**: Event name
   - **Start Date**: YYYY-MM-DD format
   - **End Date**: YYYY-MM-DD format
   - **Featured Image**: Event banner URL
   - **Description**: Event details (multiline)
3. Click **Save Event**

**Example:**
```
Title: BINGO: Imperial Dawn Edition
Start Date: 2025-11-10
End Date: 2025-11-17
Image: [event-banner]
Description: [full event details]
```

### 5. Create Post
**Steps:**
1. Click the **Post** tab
2. Fill in:
   - **Title**: Post heading
   - **Excerpt**: Short summary
   - **Tags**: Comma-separated keywords
   - **Featured Image**: Post thumbnail URL
   - **Content**: Full post body
3. Click **Save Post**

## Saving & Syncing

### Local Storage (Default)
- Items are saved to browser localStorage automatically
- Persist across browser sessions
- No internet required
- Limited by browser storage (usually 5-10 MB)

### Backend Sync
**To Sync to MongoDB:**
1. Click the **Load** button to pull latest from backend
2. Make your changes locally
3. Click the **Sync** button to push to MongoDB

**Status:**
- ✅ Green indicator = Successfully synced
- ⚠️ Blue badge = Stored locally only
- 🔄 During sync = Upload in progress

### Bulk Operations
- **Load**: Fetch all items from backend (overwrites local changes)
- **Sync**: Push all local items to backend (preserves changes)

## Export & Backup

Each item has **export** button (📥):
1. Click 📥 on any item
2. Downloads as JSON file
3. Can be imported manually

### Backup All Items
1. Right-click in browser console
2. Run: `localStorage.getItem('advancedContent')`
3. Copy the JSON output
4. Save to file

## API Endpoints

### For Developers

**Get all items:**
```bash
GET /api/content-items
Header: Authorization: Bearer {token}
```

**Get by type:**
```bash
GET /api/content-items/type/mercenary
GET /api/content-items/type/news
GET /api/content-items/type/event
GET /api/content-items/type/post
```

**Save item:**
```bash
POST /api/content-items
{
  "id": "merc-1731876000000",
  "name": "Dean",
  "type": "mercenary",
  "content": {
    "name": "Dean",
    "role": "Special Agent",
    "image": "url",
    "sounds": ["https://files.catbox.moe/zbha6p.mp3"]
  }
}
```

**Delete item:**
```bash
DELETE /api/content-items/{id}
```

**Bulk sync:**
```bash
POST /api/content-items/bulk-save
{
  "items": [
    { "id": "...", "name": "...", "type": "...", "content": {...} }
  ]
}
```

## Audio File Management

### Supported Formats
- MP3 (primary)
- WAV
- OGG
- WebM

### Valid URL Sources
- **Catbox.moe** (recommended): `https://files.catbox.moe/xxxxx.mp3`
- AWS S3, Google Cloud Storage, etc.
- Any publicly accessible audio URL

### Testing Audio
The provided example MP3 is production-ready:
- **URL**: `https://files.catbox.moe/zbha6p.mp3`
- **Size**: 4.2 MB
- **Format**: MP3
- **Status**: ✅ Verified Working

## Data Structure

### Mercenary Object
```typescript
{
  id: "merc-1731876000000",
  name: "Dean",
  type: "mercenary",
  content: {
    name: "Dean",
    role: "Special Agent",
    image: "https://...",
    sounds: ["https://files.catbox.moe/zbha6p.mp3"],
    soundUrl: ""
  },
  createdAt: "2025-11-17T09:00:00.000Z",
  savedLocally: true,
  synced: false
}
```

### News Object
```typescript
{
  id: "news-1731876000000",
  name: "Imperial Dawn BINGO Edition",
  type: "news",
  content: {
    title: "Imperial Dawn BINGO Edition",
    content: "Attention Mercenaries...",
    image: "https://..."
  },
  createdAt: "2025-11-17T09:00:00.000Z",
  savedLocally: true,
  synced: false
}
```

### Event Object
```typescript
{
  id: "event-1731876000000",
  name: "BINGO: Imperial Dawn Edition",
  type: "event",
  content: {
    title: "BINGO: Imperial Dawn Edition",
    description: "Get ready to shout it loud...",
    startDate: "2025-11-10",
    endDate: "2025-11-17",
    image: "https://..."
  },
  createdAt: "2025-11-17T09:00:00.000Z",
  savedLocally: true,
  synced: false
}
```

### Post Object
```typescript
{
  id: "post-1731876000000",
  name: "BINGO Edition Weapons List",
  type: "post",
  content: {
    title: "BINGO Edition Weapons List",
    excerpt: "Check all the weapons...",
    content: "AK-47-Imperial Beast...",
    tags: "weapons,bingo,event",
    image: "https://..."
  },
  createdAt: "2025-11-17T09:00:00.000Z",
  savedLocally: true,
  synced: false
}
```

## Troubleshooting

### Items Not Syncing
1. Check internet connection
2. Verify authentication token in localStorage
3. Check browser console for errors
4. Try "Load" first to test backend connection

### Items Lost After Refresh
- Make sure "Sync" button was clicked
- Or export items for backup first

### Audio Not Playing
- Verify URL is publicly accessible
- Check supported format (MP3, WAV, OGG, WebM)
- Test URL in browser directly

### Storage Full
- Export items as JSON backup
- Clear old items manually
- Use backend sync to clear local storage

## Advanced Tips

### Keyboard Shortcuts
- Tab: Move between fields
- Enter in textarea: New line
- Shift+Enter: Submit forms

### Bulk Import
1. Export from another instance
2. Copy JSON
3. Open browser console
4. `localStorage.setItem('advancedContent', jsonData)`
5. Refresh page

### Search Items
- Click on item to view full content
- Copy JSON to clipboard with **Copy JSON** button

## Performance Notes

- **Local Storage**: Fast, works offline
- **Backend Sync**: ~1-2 seconds per item
- **Bulk Operations**: All items in single request

## Version Info
- Created: November 17, 2025
- MP3 Test File: ✅ Verified
- Build Status: ✅ All passing
- Backend: Express.js + MongoDB

## Support

For issues:
1. Check browser console (F12)
2. Verify authentication
3. Test with simple item first
4. Check network requests (DevTools)
