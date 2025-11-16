# Katabump Backend Deployment Guide

Your backend is now ready to deploy on Katabump (51.75.118.151:20032). Everything is pushed to GitHub.

## 📋 What's in GitHub

```
backend-deploy-full/
├── index.js                 # Main backend server (auto-runs seeding)
├── package.json            # Dependencies
├── .env.example            # Configuration template
├── .env                    # ⚠️ YOUR SECRETS (update on server)
├── seed-from-urls.js       # Seeding script (auto-runs on startup)
├── attached_assets/        # All mercenary images + modes/ranks assets
└── services/scraper.js     # Web scraping functions
```

## 🚀 Deployment Steps on Katabump

### Step 1: Clone or Download the Backend
On your Katabump server (SSH):
```bash
cd /path/to/deployment
git clone https://github.com/Mostafalol1233/crwiki.git
cd crwiki/backend-deploy-full
```

Or download as ZIP and extract.

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Edit `.env` with your server settings:
```bash
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://ahmed12ahmed12222_db_user:XQrHohCTcVjBgEbT@cluster0.oq5zwzt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=20032
NODE_ENV=production
FRONTEND_URL=https://crossfire.wiki
ADMIN_PASSWORD=sasasasa
JWT_SECRET=a7f8c9d2e1b4a5c6f7d8e9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1
AUTO_SEED=true
MERCENARY_IMAGE_BASE=https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets
EOF
```

**Important:** 
- `AUTO_SEED=true` = automatically runs seeding on startup (no console needed!)
- `MERCENARY_IMAGE_BASE` = points to GitHub for mercenary images
- Update `ADMIN_PASSWORD` to something secure

### Step 4: Start the Server
```bash
npm run dev
```

✅ The server will:
1. Start on port 20032
2. Connect to MongoDB
3. **Auto-run seeding** (populates weapons/modes/ranks with GitHub image URLs)
4. Serve API endpoints at `/api/*`

### ✅ Verify Deployment
Test these URLs from your browser or curl:

```bash
# Health check
curl http://51.75.118.151:20032/api/health

# Get weapons (seeded automatically)
curl http://51.75.118.151:20032/api/weapons

# Get modes (seeded automatically)
curl http://51.75.118.151:20032/api/modes

# Get ranks (seeded automatically)
curl http://51.75.118.151:20032/api/ranks

# Debug endpoint
curl http://51.75.118.151:20032/api/debug/assets
```

Should return:
- ✅ JSON with weapons/modes/ranks
- ✅ Image URLs pointing to `https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/...`

---

## 🎯 Key Features

### ✅ Auto-Seeding on Startup
When backend starts, it automatically:
1. Logs in as admin using `ADMIN_PASSWORD`
2. Seeds all weapons, modes, ranks with image URLs from GitHub
3. No console commands needed!

### ✅ Low Disk Usage
- All images are stored as URLs in MongoDB (not on server disk)
- Images are served from GitHub (not from Katabump)
- Backend uses <1MB disk space for assets

### ✅ Image URLs Format
```
https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/merc-wolf.jpg
https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/modes/TDM_Arena_01.jpg
https://raw.githubusercontent.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets/ranks/rank_1.jpg
```

Frontend receives these URLs from the API and displays them directly.

---

## 📝 Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `PORT` | Backend port | `20032` |
| `FRONTEND_URL` | CORS origin (Vercel frontend) | `https://crossfire.wiki` |
| `ADMIN_PASSWORD` | Admin login password | `sasasasa` |
| `JWT_SECRET` | Token signing key | Long random string |
| `AUTO_SEED` | Auto-run seeding on startup | `true` or `false` |
| `MERCENARY_IMAGE_BASE` | Base URL for image assets | GitHub raw content URL |

---

## 🔧 Optional: Use Local Assets Instead of GitHub

If you want to serve images from Katabump (instead of GitHub):

### Step 1: Copy assets to server
```bash
cp -r backend-deploy-full/attached_assets /path/on/server/assets
```

### Step 2: Update `.env`
```env
ATTACHED_ASSETS_PATH=/path/on/server/assets
MERCENARY_IMAGE_BASE=http://51.75.118.151:20032/assets
```

Then images will be served locally from your server instead of GitHub.

---

## 📊 Architecture

```
Frontend (https://crossfire.wiki)
    ↓ (calls /api/weapons, /api/modes, etc.)
Backend (51.75.118.151:20032)
    ↓ (queries MongoDB)
MongoDB
    ↓ (contains: { name: "AK-47", image: "https://raw.githubusercontent.com/..." })
Response sent to frontend
    ↓
Frontend loads images from GitHub URLs (or local if ATTACHED_ASSETS_PATH set)
```

---

## 🆘 Troubleshooting

### Seeding Not Running?
- Check if `AUTO_SEED=true` in `.env`
- Check backend logs for errors
- Verify `ADMIN_PASSWORD` is correct

### Images Not Loading?
- Check if `MERCENARY_IMAGE_BASE` URL is accessible
- For GitHub URLs: they're public, should work
- For local URLs: verify `ATTACHED_ASSETS_PATH` exists and has files

### Cannot Connect to MongoDB?
- Verify `MONGODB_URI` is correct
- Check IP whitelist in MongoDB Atlas (add your Katabump IP)

---

## ✅ You're Done!

Backend is production-ready. Just:
1. SSH into Katabump
2. `npm install && npm run dev`
3. Auto-seeding runs automatically
4. Frontend fetches data from your backend

No manual seeding commands needed!
