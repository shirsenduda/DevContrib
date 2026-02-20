# Contributing to DevContrib

Welcome! This guide explains how the codebase is organized so you can start contributing quickly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Frontend | React 19, Tailwind CSS 4, Framer Motion |
| State | Zustand (client), TanStack React Query (server) |
| Backend | Next.js API Routes (inside `src/app/api/`) |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis via ioredis |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| Jobs | BullMQ (Redis-backed background workers) |
| Testing | Vitest |
| CI | GitHub Actions |

## Architecture Overview

This is a **Next.js App Router** project. Frontend and backend live in the same codebase — this is by design. API routes (`route.ts` files) are the backend. Page components (`page.tsx` files) are the frontend.

```
User's Browser
      |
      v
  FRONTEND (React)              BACKEND (API Routes)           EXTERNAL
  ─────────────────             ────────────────────           ──────────
  page.tsx (UI)                 route.ts (endpoints)
       |                              |
  hooks/ (data fetching) ──fetch──>   |
  stores/ (client state)              |
  components/ (UI pieces)        services/ (business logic)
                                      |
                                  lib/db.ts ──────> PostgreSQL
                                  lib/redis.ts ───> Redis
                                  lib/github.ts ──> GitHub API
                                      |
                                  jobs/ ──────────> BullMQ Workers
```

## Folder Structure

```
dev-contrib-platform/
├── .github/workflows/     CI pipeline (lint, test, build)
├── prisma/                Database schema, migrations, seed
├── scripts/               CLI utilities (manual scrape triggers)
├── public/                Static assets
├── worker.ts              Background job processor entry point
│
└── src/
    ├── app/               PAGES + API ROUTES (Next.js convention)
    │   ├── (admin)/       Admin pages (route group, no URL impact)
    │   ├── (auth)/        Login/auth pages
    │   ├── (dashboard)/   Main user-facing pages
    │   └── api/           ALL backend API endpoints
    │
    ├── components/        FRONTEND — Reusable React components
    │   ├── admin/         Admin-specific components
    │   ├── features/      Feature components (IssueCard, DCSCard, etc.)
    │   ├── layout/        Layout components (Navbar, Sidebar)
    │   └── providers/     React context providers
    │
    ├── hooks/             FRONTEND — Custom React hooks for data fetching
    ├── stores/            FRONTEND — Zustand state stores
    │
    ├── services/          BACKEND — Business logic (scoring algorithms)
    ├── jobs/              BACKEND — BullMQ queue definitions + workers
    │
    ├── lib/               SHARED — Utilities used by both sides
    │   ├── db.ts          Prisma client (database)
    │   ├── redis.ts       Redis client (caching)
    │   ├── github.ts      GitHub API functions
    │   ├── auth.ts        NextAuth configuration
    │   ├── api-helpers.ts Response helpers, auth guards, validation
    │   └── rate-limit.ts  API rate limiting
    │
    ├── types/             SHARED — TypeScript type definitions
    ├── test/              Test setup and utilities
    └── middleware.ts      Auth middleware (runs on every request)
```

### Key Convention: Route Groups

Folders wrapped in parentheses like `(dashboard)` are **route groups**. They organize code without affecting URLs:

| File Path | URL |
|-----------|-----|
| `src/app/(dashboard)/dashboard/page.tsx` | `/dashboard` |
| `src/app/(dashboard)/explore/page.tsx` | `/explore` |
| `src/app/(dashboard)/profile/page.tsx` | `/profile` |
| `src/app/(admin)/admin/page.tsx` | `/admin` |
| `src/app/api/issues/route.ts` | `GET /api/issues` |

### Key Convention: route.ts = Backend

Any file named `route.ts` inside `src/app/api/` is a **backend API endpoint**. It runs on the server, never in the browser.

### Key Convention: page.tsx = Frontend

Any file named `page.tsx` is a **page component**. It renders in the browser.

## Data Flow Example

Here's how data flows when a user views the Explore page:

```
1. User visits /explore
2. src/app/(dashboard)/explore/page.tsx renders
3. It calls useIssues() hook (src/hooks/use-issues.ts)
4. The hook fetches GET /api/issues
5. src/app/api/issues/route.ts handles the request
6. It checks Redis cache (src/lib/redis.ts)
7. If cache miss, queries PostgreSQL via Prisma (src/lib/db.ts)
8. Returns JSON response
9. React Query caches the response
10. IssueCard components render the data
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/issues` | List issues with filters |
| GET | `/api/issues/recommend` | AI-matched recommendations |
| GET | `/api/issues/[id]` | Single issue details |
| GET | `/api/contributions` | User's contributions |
| POST | `/api/contributions` | Start a contribution |
| PUT | `/api/contributions/[id]` | Update contribution status |
| POST | `/api/contributions/[id]/sync` | Sync PR status with GitHub |
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |
| GET | `/api/user/stats` | User statistics |
| GET | `/api/user/dcs` | Developer Contribution Score |
| GET | `/api/repositories` | List repositories |
| GET | `/api/health` | Health check |
| POST | `/api/webhooks/github` | GitHub webhook handler |
| GET | `/api/admin/stats` | Admin statistics |
| POST | `/api/admin/scrape` | Trigger GitHub scrape |
| GET | `/api/admin/scrape-logs` | Scrape history |
| GET | `/api/admin/users` | User management |
| POST | `/api/admin/repositories` | Add repository |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm@latest`)
- PostgreSQL database
- Redis server
- GitHub OAuth app (for auth)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your DATABASE_URL, REDIS_URL, GitHub OAuth credentials, etc.

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database (optional)
pnpm db:seed

# Start the dev server
pnpm dev

# In a separate terminal, start the background worker
pnpm worker
```

### Common Commands

```bash
pnpm dev              # Start Next.js dev server
pnpm worker           # Start background job worker
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm typecheck        # Run TypeScript type checker
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm db:studio        # Open Prisma Studio (database GUI)
pnpm db:migrate       # Create and run migrations
```

## Making Changes

### Adding a New Page

1. Create `src/app/(dashboard)/your-page/page.tsx`
2. Add `'use client'` at the top if it uses React hooks
3. The page is automatically available at `/your-page`

### Adding a New API Endpoint

1. Create `src/app/api/your-endpoint/route.ts`
2. Export async functions named `GET`, `POST`, `PUT`, or `DELETE`
3. Use helpers from `src/lib/api-helpers.ts` for auth, validation, responses

### Adding a New Component

1. Create in `src/components/features/your-component.tsx`
2. Import and use in your page

### Adding a New Hook

1. Create in `src/hooks/use-your-data.ts`
2. Use TanStack React Query for data fetching
3. Point the `queryFn` at your API endpoint

## Testing

Tests live next to the code they test in `__tests__/` folders:

```
src/services/__tests__/dcs-scoring.test.ts    # DCS algorithm tests
src/services/__tests__/scoring.test.ts        # Repo scoring tests
src/lib/__tests__/api-helpers.test.ts         # API helper tests
src/lib/__tests__/admin.test.ts               # Admin guard tests
src/lib/__tests__/utils.test.ts               # Utility function tests
```

Run tests: `pnpm test:run`

## DCS (Developer Contribution Score)

The platform's unique feature. A 0-1000 score calculated from 4 dimensions:

```
DCS = 0.30(Merge Rate) + 0.25(Difficulty Growth) + 0.25(Repo Caliber) + 0.20(Consistency)
```

- **Merge Rate**: What % of your PRs get merged (with volume bonus)
- **Difficulty Growth**: Are you tackling harder issues over time?
- **Repo Caliber**: How popular are the repos you contribute to? (log scale)
- **Consistency**: How many of the last 12 weeks have you been active?

Code: `src/services/dcs-scoring.ts`
Tests: `src/services/__tests__/dcs-scoring.test.ts`
API: `src/app/api/user/dcs/route.ts`
UI: `src/components/features/dcs-card.tsx`
