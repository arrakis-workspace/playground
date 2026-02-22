# replit.md

## Overview

This is a mobile-first financial tech investment platform built with a React frontend and Express backend. The app features a multi-step onboarding flow (Google OAuth login → profile setup → investor questionnaire → handle selection → brokerage linking via SnapTrade), a financial dashboard with portfolio tracking, time-series growth charts, and holdings display. It includes social features (unique user handles, connection requests, user search, real-time chat). The UI uses a blue-themed color scheme with green accents.

## User Preferences

Preferred communication style: Simple, everyday language.
Git push target: Always push to https://github.com/arrakis-workspace/playground.git (use GitHub integration token for authentication).

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Uses `wouter` for lightweight client-side routing (not React Router)
- **State Management**: TanStack React Query for server state; local React `useState` for form state
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charting**: Recharts for portfolio time-series charts
- **Styling**: Tailwind CSS with CSS variables for theming (HSL-based color system defined in `index.css`). Uses `class-variance-authority` for component variants and `tailwind-merge` via the `cn()` utility
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`
- **Pages**:
  - `Login` — Landing/auth with Google OAuth
  - `ProfileSetup` — User details form (first/last name, contact, country)
  - `InvestorQuestion` — Yes/no investor question
  - `HandleSelection` — Choose unique handle (@username)
  - `LinkInstitution` — Connect brokerage via SnapTrade
  - `SnaptradeCallback` — Post-SnapTrade sync page
  - `Home` — Dashboard (portfolio value, chart, holdings, nav to social/chat)
  - `Social` — Connections, pending requests, user search
  - `Chat` — Conversation list and thread view
  - `PrivacyPolicy`, `TermsOfService`, `Company` — Public pages

### Backend
- **Framework**: Express.js running on Node with TypeScript (compiled via `tsx` in dev, `esbuild` for production)
- **API Pattern**: All API routes prefixed with `/api`. Routes registered in `server/routes.ts`
- **Auth**: Google OAuth 2.0 with express-session stored in PostgreSQL via connect-pg-simple
- **Storage Layer**: Abstracted behind an `IStorage` interface in `server/storage.ts`, backed by PostgreSQL via Drizzle ORM
- **SnapTrade Integration**: `server/snaptrade.ts` handles user registration, login URL generation, account/holdings sync
- **Dev Server**: Vite dev server integrated as Express middleware for HMR

### Shared Code
- **Schema**: `shared/schema.ts` re-exports from `shared/models/auth.ts`, `shared/models/accounts.ts`, `shared/models/social.ts`
- **Models**:
  - `auth.ts` — users table, sessions table, profile/handle validation schemas
  - `accounts.ts` — linkedAccounts, holdings, portfolioHistory tables
  - `social.ts` — connections, messages tables, message validation schema

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL dialect (using `pg` driver)
- **Tables**: users, sessions, linked_accounts, holdings, portfolio_history, connections, messages
- **Connection**: Requires `DATABASE_URL` environment variable
- **Session Store**: `connect-pg-simple` for Express session storage in PostgreSQL

### API Routes
- **Auth**: GET `/api/login`, GET `/api/auth/google/callback`, GET `/api/logout`, GET `/api/auth/user`
- **Profile**: POST `/api/profile` (update profile), POST `/api/handle` (set handle), GET `/api/handle/check/:handle`
- **SnapTrade**: POST `/api/snaptrade/register`, GET `/api/snaptrade/login-url`, POST `/api/snaptrade/sync`
- **Portfolio**: GET `/api/portfolio/holdings`, GET `/api/portfolio/accounts`, GET `/api/portfolio/history`
- **Social**: GET `/api/users/search`, POST `/api/connections/request`, GET `/api/connections`, GET `/api/connections/pending`, POST `/api/connections/:id/accept`, POST `/api/connections/:id/reject`
- **Messaging**: POST `/api/messages`, GET `/api/messages/:userId`, GET `/api/conversations`

### Build & Scripts
- `npm run dev` — Development server with HMR
- `npm run build` — Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.js`
- `npm start` — Runs production build
- `npm run check` — TypeScript type checking
- `npm run db:push` — Push Drizzle schema to database

## External Dependencies

- **Database**: PostgreSQL via pg driver. Requires `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **SnapTrade**: `snaptrade-typescript-sdk` for brokerage linking and portfolio data
- **Charting**: `recharts` for time-series portfolio charts
- **UI Framework**: shadcn/ui components (Radix UI + Tailwind CSS + CVA)
- **Fonts**: Google Fonts (Aclonica, Roboto, Ubuntu) loaded via CDN
- **Static Assets**: Figma-exported SVG assets referenced from `/figmaAssets/` directory
- **Secrets Required**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, SNAPTRADE_CLIENT_ID (optional), SNAPTRADE_CONSUMER_KEY (optional)
