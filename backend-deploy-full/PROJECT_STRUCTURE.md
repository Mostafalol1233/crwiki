# Project Structure and Overview

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Wouter (routing), React Query.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ORM).
- **Shared**: TypeScript interfaces and schemas shared between frontend and backend.

## Directory Structure
- **`client/`**: Frontend application.
  - `src/pages/`: Page components (e.g., `Home.tsx`, `Admin.tsx`, `News.tsx`, `Posts.tsx`, `EventDetail.tsx`).
  - `src/components/`: Reusable components (e.g., `TutorialManager.tsx`, `Pagination`, `ui/`).
  - `src/lib/`: Utilities and query client setup.
- **`backend-deploy-full/`**: Backend application.
  - `routes.js`: Main API route definitions.
  - `server.js`: Server entry point.
- **`shared/`**: Shared code between frontend and backend.
  - `mongodb-schema.ts`: Mongoose schema definitions (interfaces and schemas).
  - `schema.ts`: Drizzle ORM schema definitions (legacy/alternative).

## Key Architectural Patterns
- **Pagination**: API routes return `{ items: any[], total: number }`. Frontend uses React Query to handle pagination state.
- **Slugs**: Content (Posts, Events, News, Tutorials) uses slugs for SEO-friendly URLs. Unique constraints are enforced in Mongoose schemas.
- **Multilingual Support**: Content supports English and Arabic (e.g., `contentHtmlEn`, `contentHtmlAr`).
- **Role-Based Access**: Admin dashboard (`Admin.tsx`) is protected and provides CRUD operations.

## Key Files
- `client/src/pages/Admin.tsx`: Main admin dashboard.
- `client/src/pages/EventDetail.tsx`: Event detail page with slug handling.
- `backend-deploy-full/routes.js`: API routes implementation.
- `shared/mongodb-schema.ts`: Database schemas.
