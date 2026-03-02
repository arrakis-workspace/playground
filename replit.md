# replit.md

## Overview

This is a mobile-first financial tech investment platform built with a React frontend and Express backend. The app features a multi-step onboarding flow (Google OAuth login → profile setup → investor questionnaire → handle selection → brokerage linking via SnapTrade), a financial dashboard with portfolio tracking, time-series growth charts, holdings display, US equity market data (S&P 500, DOW, NASDAQ indexes with overlay comparison), equity search, and user-configurable watchlists. It includes social features (unique user handles, connection requests, user search, real-time chat). The UI uses a blue-themed color scheme with green accents.

## User Preferences

Preferred communication style: Simple, everyday language.
Git push target: Run `npx tsx scripts/push-to-github.ts` to push to both the user's own GitHub (`playground`) and https://github.com/arrakis-workspace/playground (uses GitHub integration token).

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Uses `wouter` for lightweight client-side routing (not React Router)
- **State Management**: TanStack React Query for server state; local React `useState` for form state
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charting**: Recharts for portfolio time-series charts and index overlay comparison (LineChart)
- **Styling**: Tailwind CSS with CSS variables for theming (HSL-based color system defined in `index.css`). Uses `class-variance-authority` for component variants and `tailwind-merge` via the `cn()` utility
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`
- **Pages**:
  - `Login` — Landing/auth with Google OAuth
  - `ProfileSetup` — User details form (first/last name, contact, country) + notification settings toggles
  - `InvestorQuestion` — Yes/no investor question
  - `HandleSelection` — Choose unique handle (@username)
  - `LinkInstitution` — Connect brokerage via SnapTrade
  - `SnaptradeCallback` — Post-SnapTrade sync page
  - `Home` — Dashboard (portfolio value, chart with index overlays, equity search, holdings, top equities, watchlists)
  - `Social` — Connections, pending requests, user search
  - `Chat` — Conversation list and thread view
  - `EquityDetail` — Individual equity page with price chart, key stats, company info (accessible from any equity list or search)
  - `PrivacyPolicy`, `TermsOfService`, `Company` — Public pages
- **Dashboard Components**:
  - `Dashboard.tsx` — Main dashboard with chart, index toggles, equity lists
  - `EquitySearch.tsx` — Search bar for stocks/ETFs with watchlist add functionality
  - `EquityList.tsx` — Reusable expandable/collapsible equity list with sorting

### Backend
- **Framework**: Express.js running on Node with TypeScript (compiled via `tsx` in dev, `esbuild` for production)
- **API Pattern**: All API routes prefixed with `/api`. Routes registered in `server/routes.ts`
- **Auth**: Google OAuth 2.0 with express-session stored in PostgreSQL via connect-pg-simple
- **Storage Layer**: Abstracted behind an `IStorage` interface in `server/storage.ts`, backed by PostgreSQL via Drizzle ORM
- **SnapTrade Integration**: `server/snaptrade.ts` handles user registration, login URL generation, account/holdings sync
- **Market Data**: `server/market-data.ts` — Yahoo Finance integration via `yahoo-finance2` for index history, equity quotes, fundamentals, and search. In-memory caching with TTLs (60s quotes, 5min history, 1hr fundamentals)
- **Dev Server**: Vite dev server integrated as Express middleware for HMR

### Shared Code
- **Schema**: `shared/schema.ts` re-exports from `shared/models/auth.ts`, `shared/models/accounts.ts`, `shared/models/social.ts`
- **Models**:
  - `auth.ts` — users table, sessions table, profile/handle validation schemas
  - `accounts.ts` — linkedAccounts, holdings, portfolioHistory, marketIndexes, watchlists tables
  - `social.ts` — connections, messages tables, message validation schema

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL dialect (using `pg` driver)
- **Tables**: users, sessions, linked_accounts, holdings, portfolio_history, market_indexes, watchlists, connections, messages
- **Connection**: Requires `DATABASE_URL` environment variable
- **Session Store**: `connect-pg-simple` for Express session storage in PostgreSQL

### API Routes
- **Auth**: GET `/api/login`, GET `/api/auth/google/callback`, GET `/api/logout`, GET `/api/auth/user`, DELETE `/api/account` (soft-delete user)
- **Profile**: POST `/api/profile` (update profile), POST `/api/handle` (set handle), GET `/api/handle/check/:handle`
- **Notifications**: GET `/api/notifications/settings`, PUT `/api/notifications/settings`
- **SnapTrade**: POST `/api/snaptrade/register`, GET `/api/snaptrade/login-url`, POST `/api/snaptrade/sync`
- **Portfolio**: GET `/api/portfolio/holdings`, GET `/api/portfolio/accounts`, GET `/api/portfolio/history`
- **Market Data**: GET `/api/market/indexes` (index time-series), GET `/api/market/quotes` (equity quotes), GET `/api/market/top-equities` (top 10 by sort), GET `/api/market/search` (equity search), GET `/api/market/equity/:symbol` (full equity detail), GET `/api/market/equity/:symbol/chart` (equity chart data)
- **Watchlists**: GET `/api/watchlists`, POST `/api/watchlists`, PUT `/api/watchlists/:id`, DELETE `/api/watchlists/:id`
- **Social**: GET `/api/users/search`, POST `/api/connections/request`, GET `/api/connections`, GET `/api/connections/pending`, POST `/api/connections/:id/accept`, POST `/api/connections/:id/reject`, DELETE `/api/connections/:userId` (remove connection), GET `/api/connections/unseen-count`, POST `/api/connections/mark-seen`
- **Messaging**: POST `/api/messages`, GET `/api/messages/:userId`, GET `/api/conversations`, DELETE `/api/conversations/:userId` (delete chat)

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
- **Yahoo Finance**: `yahoo-finance2` for US equity market data (indexes, quotes, search, fundamentals). Requires `new YahooFinance()` instantiation pattern
- **Charting**: `recharts` for time-series portfolio and index overlay charts
- **UI Framework**: shadcn/ui components (Radix UI + Tailwind CSS + CVA)
- **Fonts**: Google Fonts (Aclonica, Roboto, Ubuntu) loaded via CDN
- **Static Assets**: Figma-exported SVG assets referenced from `/figmaAssets/` directory
- **Email**: Resend (`resend` npm package) for transactional email notifications (connection requests). Service in `server/email.ts`
- **Secrets Required**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET, RESEND_API_KEY, SNAPTRADE_CLIENT_ID (optional), SNAPTRADE_CONSUMER_KEY (optional)
