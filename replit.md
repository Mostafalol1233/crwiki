# Overview

CrossFire Wiki is a comprehensive gaming community platform built with React, Express, and MongoDB. The project provides a full-featured wiki, blog, event management system, and admin dashboard for the CrossFire gaming community. It includes SEO optimization, multi-language support (English/Arabic), and advanced content management capabilities.

The platform serves as a central hub for CrossFire players to access game information (weapons, modes, ranks, mercenaries), read news and tutorials, participate in events, and engage with the community.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling and development
- TailwindCSS for styling with custom theme system
- Wouter for client-side routing
- TanStack Query for server state management
- Radix UI for accessible component primitives

**Key Design Patterns:**
- Component-based architecture with separation of concerns
- Custom hooks for shared logic (authentication, theme management)
- Context providers for global state (auth, theme)
- Route-based code splitting for performance
- SEO-optimized components with dynamic meta tags and JSON-LD structured data

**Styling Approach:**
- Dark/light theme toggle with localStorage persistence
- CSS custom properties for theme colors
- Responsive design with mobile-first approach
- Premium gradient effects and animations
- Arabic/English RTL support

## Backend Architecture

**Technology Stack:**
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- Multer for file uploads
- Rate limiting for API protection
- WebSocket support for real-time features

**API Design:**
- RESTful endpoints with consistent patterns
- Role-based access control (super_admin, event_manager, news_manager, etc.)
- Built-in rate limiting (100 requests per 15 minutes general, 10 uploads per hour)
- CORS configuration for production deployment
- Serverless function compatibility (Vercel)

**Data Models:**
- Users (authentication with email/phone verification)
- Posts (blog articles with post_slug, tags, categories, reading time)
- Comments (threaded discussions)
- Events (date-range based with event_name_slug, multilingual support)
- News (announcements with news_slug, rich content)
- Mercenaries (character profiles with audio voice lines)
- Weapons, Modes, Ranks (game content)
- Tickets (support system)
- Settings (site configuration)

**URL Slug System:**
- All content types (posts, events, news) use title-based slugs for SEO-friendly URLs
- Slugs are auto-generated from titles using slugifyEventName helper
- API endpoints support lookup by slug: /api/posts/slug/:slug, /api/events/slug/:slug, /api/news/slug/:slug
- Fallback search patterns for robustness (canonical URL, title match)

## Authentication & Authorization

**Strategy:**
- JWT token-based authentication
- Multiple user roles with granular permissions
- Admin password environment variable for quick super_admin access
- Middleware-based route protection
- Optional scraper API key for automated content ingestion

**Roles:**
- super_admin: Full system access
- event_manager: Event CRUD operations
- news_manager: News article management
- post_manager: Blog post management
- ticket_manager: Support ticket handling
- settings_manager: Site configuration
- event_scraper: Automated event data collection

## Data Storage

**Primary Database:**
- MongoDB Atlas (cloud-hosted)
- Connection string via MONGODB_URI environment variable
- Mongoose schemas with validation
- Indexes on frequently queried fields (username, email, post_slug)

**File Storage:**
- Image uploads to Catbox.moe CDN via API
- Static assets served from `/assets/*` route
- Audio files (MP3) for mercenary voice lines
- Fallback to GitHub raw URLs for images

**Local Storage (Browser):**
- Theme preference
- Advanced Content Manager drafts
- Authentication tokens

## Content Management

**Auto-Seeding System:**
- Triggered via AUTO_SEED=true environment variable
- Seeds initial data for weapons, modes, ranks, mercenaries
- Optional web scraper for event data from forum.z8games.com
- Direct MongoDB writes (no API calls during seed)

**Advanced Content Manager:**
- Browser-based UI for creating mercenaries, news, events, posts
- Local storage persistence for drafts
- Bulk operations (save/load multiple items)
- Backend sync to MongoDB
- Export/backup as JSON

**Scraper Service:**
- Cheerio-based HTML parsing
- Forum announcement extraction
- Event detail scraping with image URLs
- Batch operations for multiple events
- Protected endpoints (requires authentication or API key)

## SEO Optimization

**On-Page SEO:**
- Dynamic meta tags per route (title, description, keywords)
- Open Graph tags for social media sharing
- Canonical URLs for duplicate content
- JSON-LD structured data (Article, NewsArticle, WebSite, Event schemas)
- Sitemap.xml auto-generation
- Robots.txt configuration

**Performance:**
- Code splitting with manual chunks (vendor, router, ui, query)
- Image optimization recommendations (WebP, compression)
- HTTP caching headers
- Lighthouse score optimizations

**Internationalization:**
- English/Arabic language toggle
- RTL layout support
- Separate content fields (title/titleAr, content/contentAr)

# External Dependencies

## Third-Party Services

**Catbox.moe CDN:**
- Free image hosting service
- Used for mercenary images, weapons, and mode screenshots
- API endpoint: https://catbox.moe/user/api.php
- Upload via multipart form data
- Returns permanent URLs

**MongoDB Atlas:**
- Cloud database hosting
- Free tier available
- Connection via MONGODB_URI environment variable
- Sample: mongodb+srv://user:pass@cluster.mongodb.net/database

**Replit (Deployment):**
- Backend serves both API and built frontend from dist/client
- Port 5000 (mapped to external port 80)
- Environment variables via Replit Secrets
- Build frontend with: npm run build (outputs to dist/client)
- Start server with: npm run dev (or npm start)

**Google Analytics:**
- Tracking ID: G-LJSL5CQGP3
- Pageview and event tracking
- Integration via gtag.js script

## Third-Party APIs

**Forum Scraper:**
- Source: forum.z8games.com
- Scrapes CrossFire announcements and events
- No authentication required (public pages)
- Rate-limited to avoid server overload

## NPM Packages (Key Dependencies)

**Frontend:**
- react, react-dom: UI framework
- @tanstack/react-query: Server state management
- wouter: Lightweight routing
- @radix-ui/*: Accessible UI primitives
- tailwindcss: Utility-first CSS
- lucide-react: Icon library
- date-fns: Date formatting
- dompurify: HTML sanitization

**Backend:**
- express: Web framework
- mongoose: MongoDB ODM
- jsonwebtoken: JWT authentication
- bcryptjs: Password hashing
- multer: File upload handling
- express-rate-limit: Rate limiting
- cors: CORS middleware
- cheerio: HTML parsing for scraper
- axios: HTTP client
- zod: Schema validation
- dotenv: Environment variables

**Development:**
- vite: Build tool and dev server
- typescript: Type safety
- tsx: TypeScript execution
- nodemon: Auto-restart on changes
- esbuild: Fast bundling

## Weapons Data & Scraping

**Scraped Weapons (49 total):**
- Location: attached_assets/scraped_weapons/ (PNG images)
- Data file: attached_assets/weapons_data.json
- Seed script: scripts/seed-weapons.js

**Categories:**
- Assault Rifles: AK47, M4A1, M16, FAMAS, G36K, etc.
- Sniper Rifles: AWM, Barrett M82A1, Dragunov, M700
- SMG: P90, MP5, UMP-45, Kriss Super V, Uzi
- Machine Guns: M249 Minimi, M60, RPK, MG3
- Shotguns: SPAS-12, XM1014, AA-12, Jackhammer
- Pistols: Desert Eagle, Glock-18, USP, Colt Python
- Rifles: Winchester

**To seed weapons to database:**
```bash
node scripts/seed-weapons.js --execute
```

## Image Sources

**Primary (Catbox CDN):**
- 10 mercenary images
- 28 weapon images
- 13 game mode images
- Audio files (MP3 voice lines)

**Fallback (GitHub Raw URLs):**
- Additional mode images (328 total)
- Rank emblems (100 total)
- Repository: github.com/Mostafalol1233/crwiki/main/backend-deploy-full/attached_assets

## Environment Variables Required

**Backend:**
- MONGODB_URI: Database connection string
- JWT_SECRET: Token signing secret
- ADMIN_PASSWORD: Quick admin access password
- PORT: Server port (default 20032)
- FRONTEND_URL: CORS allowed origin
- AUTO_SEED: Enable auto-seeding on startup
- ATTACHED_ASSETS_PATH: Optional local assets directory
- SCRAPER_API_KEY: Optional API key for scraper endpoints
- PUBLIC_BASE_URL: Base URL for sitemap generation

**Frontend:**
- VITE_API_URL: Backend API base URL
- NODE_ENV: production/development

## Recent Fixes & Features

- **Orb WebGL graceful degradation**: `Orb.tsx` now wraps WebGL initialization in try-catch so it fails silently on headless/no-GPU environments
- **`requireOwnershipOrAdmin` middleware**: Admins with events:manage/edit/add/scrape permissions can now edit ANY event/news including scraped content without `createdByAdminId`
- **Pricing page `isArabic`**: Local variable computed from `localStorage`/`document.documentElement.lang`
- **Events category page**: Magazine-style layout with featured full-width card + responsive grid
- **Fandom wiki import**: `/api/admin/fandom-import` (bulk by category) and `/api/admin/fandom-import-article` (single page) + admin panel dialog
- **Weapon cache invalidation**: `updateWeaponMutation.onSuccess` now invalidates both `/api/weapons` and `/api/weapons/search`
- **Admin panel tabs**: Users tab trigger visible; scraper and seller-reviews tabs hidden (`{false && ...}`)