# Catbox.moe Image Upload Guide

## Quick Start

### Step 1: Upload Images to Catbox.moe
1. Go to https://catbox.moe
2. Click "Select File" and choose an image from your attached_assets folder
3. Click "Upload"
4. Copy the resulting URL (e.g., `https://files.catbox.moe/abc123.jpg`)

### Step 2: Update seed-from-catbox-easy.js
Open `seed-from-catbox-easy.js` and replace placeholders:

**For Mercenaries:**
```javascript
{ 
  id: "1", 
  name: "Wolf", 
  image: "https://files.catbox.moe/YOUR_WOLF_URL.jpg",  // ← Replace this
  ...
}
```

**For Weapons:**
```javascript
{ name: "Weapon 1", ..., image: "https://files.catbox.moe/YOUR_WEAPON_1_URL.png" }  // ← Replace this
```

**For Modes:**
```javascript
{ name: "Team Deathmatch - Air Force One", image: "https://files.catbox.moe/YOUR_MODE_URL.jpeg" }  // ← Replace this
```

**For Ranks:**
```javascript
emblem: `https://files.catbox.moe/YOUR_RANK_1_URL.jpeg`  // ← Replace this (all 100 ranks)
```

### Step 3: Use the Script
Once URLs are filled in, use the script as normal:

```bash
export AUTO_SEED=true
npm run dev

# Or on Katabump:
cd /path/to/backend-deploy-full
AUTO_SEED=true node index.js
```

---

## Batch Upload Tips (Faster Method)

Instead of uploading one-by-one:

1. **Use a bulk uploader** - Install a Catbox browser extension or use curl/wget in bulk
2. **Example with curl (bash):**
   ```bash
   for file in attached_assets/mercenaries/*; do
     curl -F "reqtype=fileupload" -F "fileToUpload=@$file" https://catbox.moe/user/api.php
   done
   ```

3. **Organize results** - Save each URL to a text file as you go

---

## File Count Reference

- **Mercenaries:** 10 images
- **Weapons:** 44 images  
- **Modes:** 328 images (seed first 30-36)
- **Ranks:** 100 images

---

## Current File Locations

```
attached_assets/
├── merc-*.jpg (10 files)
├── weapons/ (44 PNG files)
├── modes/ (328 JPEG files)
└── ranks/ (100 JPEG files)
```

---

## Complete URLs After Upload

Once you upload all images, your URL list will look like:

```
Mercenaries:
- https://files.catbox.moe/abcd1234.jpg (Wolf)
- https://files.catbox.moe/efgh5678.jpg (Vipers)
- ...

Weapons:
- https://files.catbox.moe/ijkl9012.png (C4410)
- https://files.catbox.moe/mnop3456.png (C4742)
- ...

Modes:
- https://files.catbox.moe/qrst7890.jpeg (TDM_AirForceOne)
- ...

Ranks (1-100):
- https://files.catbox.moe/uvwx1111.jpeg (Rank 1)
- https://files.catbox.moe/yzab2222.jpeg (Rank 2)
- ...
```

---

## Notes

- Catbox.moe is **free** and **no registration needed**
- URLs are **permanent** (no expiration)
- Good for saving Katabump disk space (all images served from CDN)
- You can keep the GitHub URLs as fallback if needed
