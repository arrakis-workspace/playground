# replit.md

## Overview

This is a mobile-first investment onboarding application built with a React frontend and Express backend. The app guides users through a multi-step flow: authentication (Google signup/login), profile setup (collecting personal details like name, contact, country), and an investor questionnaire. The UI is designed to resemble a mobile device interface (Google Pixel style) with a blue-themed color scheme. Currently, the app is mostly frontend with minimal backend logic — routes and storage are scaffolded but not fully implemented.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Uses `wouter` for lightweight client-side routing (not React Router)
- **State Management**: TanStack React Query for server state; local React `useState` for form state
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming (HSL-based color system defined in `index.css`). Uses `class-variance-authority` for component variants and `tailwind-merge` via the `cn()` utility
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`
- **Pages**: Three main pages — `GooglePixel` (landing/auth), `ProfileSetup` (user details form), `InvestorQuestion` (yes/no investor question)

### Backend
- **Framework**: Express.js running on Node with TypeScript (compiled via `tsx` in dev, `esbuild` for production)
- **API Pattern**: All API routes should be prefixed with `/api`. Routes are registered in `server/routes.ts`
- **Storage Layer**: Abstracted behind an `IStorage` interface in `server/storage.ts`. Currently uses `MemStorage` (in-memory Map) but is designed to be swapped for a database-backed implementation
- **Dev Server**: Vite dev server is integrated as Express middleware for HMR during development. In production, static files are served from `dist/public`

### Shared Code
- **Schema**: `shared/schema.ts` contains Drizzle ORM table definitions and Zod validation schemas shared between frontend and backend
- **Current Schema**: A `users` table with `id` (UUID, auto-generated), `username` (unique text), and `password` (text)

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL dialect
- **Database Driver**: `@neondatabase/serverless` (Neon PostgreSQL)
- **Connection**: Requires `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory. Use `npm run db:push` to push schema changes
- **Session Store**: `connect-pg-simple` is included as a dependency (for Express session storage in PostgreSQL), though not yet wired up

### Build & Scripts
- `npm run dev` — Development server with HMR
- `npm run build` — Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.js`
- `npm start` — Runs production build
- `npm run check` — TypeScript type checking
- `npm run db:push` — Push Drizzle schema to database

## External Dependencies

- **Database**: PostgreSQL via Neon serverless (`@neondatabase/serverless`). Requires `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **UI Framework**: shadcn/ui components (Radix UI + Tailwind CSS + CVA)
- **Fonts**: Google Fonts (Architects Daughter, DM Sans, Fira Code, Geist Mono, Roboto) loaded via CDN
- **Static Assets**: Figma-exported SVG assets referenced from `/figmaAssets/` directory (served as public static files)
- **Replit Plugins**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev-only Replit integrations)