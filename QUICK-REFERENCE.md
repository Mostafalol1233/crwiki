# Quick Reference - Advanced Content Manager

## 🎯 Quick Start (30 seconds)

1. **Go Admin Dashboard** → Click 📋 **Advanced Content Manager**
2. **Choose Tab**: Mercenary / News / Event / Post
3. **Fill Form** → Click **Save**
4. **Sync** → Click **Sync** button to save to database

---

## 📋 Create Mercenary with Audio

**Example - Dean (Special Agent)**

| Field | Value |
|-------|-------|
| Name | Dean |
| Role | Special Agent |
| Image | `[avatar-url]` |
| Sound URL | `https://files.catbox.moe/zbha6p.mp3` |

**Steps:**
1. Paste sound URL
2. Click **+** button
3. Confirm sounds appear in list
4. Click **Save Mercenary**

---

## 📰 Create News Article

**Example - BINGO Event**

| Field | Value |
|-------|-------|
| Title | Imperial Dawn BINGO Edition |
| Image | `[banner-url]` |
| Content | `Attention Mercenaries, B-I-N-G-O...` |

---

## 🎪 Create Event

**Example - BINGO Event**

| Field | Value |
|-------|-------|
| Title | BINGO: Imperial Dawn Edition |
| Start Date | 2025-11-10 |
| End Date | 2025-11-17 |
| Image | `[event-banner]` |
| Description | `Get ready to shout it loud...` |

---

## 📝 Create Post

**Example - Weapons List**

| Field | Value |
|-------|-------|
| Title | BINGO Edition Weapons |
| Excerpt | Check all the weapons available |
| Tags | weapons,bingo,event |
| Image | `[thumbnail-url]` |
| Content | `AK-47-Imperial Beast...` |

---

## 💾 Save & Sync

```
Local Storage (Automatic) → Changes saved in browser
                             ↓
Click "Sync" Button    → Uploads to MongoDB
                             ↓
Click "Load" Button    → Downloads from MongoDB
```

---

## 🎵 Audio Files

**✅ Tested & Working:**
```
https://files.catbox.moe/zbha6p.mp3
```

**Supported Formats:**
- MP3 ⭐ (best)
- WAV
- OGG
- WebM

**How to Add:**
1. Get audio URL
2. Paste in "Sound URL" field
3. Click **+**
4. Repeat for multiple sounds

---

## 📥 Export Items

**Per Item:**
1. Click on item in list
2. Click **📥 Export** or **Copy JSON**
3. Save file

**All Items:**
1. Browser Console: F12
2. Run: `localStorage.getItem('advancedContent')`
3. Copy all data
4. Save to file

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Items not saving | Click **Sync** button |
| Lost after refresh | Sync before closing |
| Storage full | Export & delete old items |
| Audio not playing | Check URL is public & format supported |
| Can't connect backend | Check internet & login token |

---

## 📊 Item Counts

**In Header:**
```
Mercenaries (5)  News (8)  Events (3)  Posts (12)
```

---

## ⌨️ Keyboard Tips

- **Tab** - Jump between fields
- **Enter** in textarea - New line
- **Ctrl+S** - Save (if supported)

---

## 🚀 Pro Tips

1. **Always Sync** - After creating items
2. **Export Backup** - Before deleting
3. **Test URLs** - Open in new tab first
4. **Use Consistent Tags** - For filtering
5. **Add Images** - Makes content rich

---

## 📱 Data Backup

**Automatic:**
- Local Storage = Backup in browser
- Backend Sync = Backup in database

**Manual:**
1. Click **Load** to fetch from backend
2. Export items as JSON
3. Store file safely

---

## 📞 Status Indicators

- ✅ **Green** = Successfully synced
- 🔵 **Blue** = Saved locally (not synced)
- 🔄 **Spinning** = Syncing in progress
- ❌ **Red** = Error occurred

---

## 🎯 Common Tasks

**Task** | **Steps**
--------|----------
Save mercenary | Fill form → Add sounds → Click Save
Add multiple sounds | Paste URL → Click + → Repeat → Save
Backup all | Click Load → Export each item
Restore backup | Paste URL → Click + or create new
Delete item | Click item → ❌ Delete button
View all items | Tab shows item count

---

## 📚 Full Documentation

See `ADVANCED-CONTENT-GUIDE.md` for:
- Complete API reference
- Data structure details
- Advanced troubleshooting
- Backend integration

---

**Last Updated:** November 17, 2025  
**MP3 Test:** ✅ Verified Working (4.2 MB)  
**Build Status:** ✅ All Systems Go
