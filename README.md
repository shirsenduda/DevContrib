<div align="center">

<img src="public/logo.png" alt="DevContrib Logo" width="64" height="64" />

# DevContrib

**Find and ship your next open source contribution.**

AI-matched GitHub issues · DCS scoring · PR tracking · Real-time notifications

[![Live Demo](https://img.shields.io/badge/Live%20Demo-devcontrib.com-0070f3?style=for-the-badge&logo=vercel)](https://devcontrib.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

</div>

---

## What is DevContrib?

DevContrib matches developers with high-quality GitHub issues they can actually get merged. Stop scrolling through thousands of issues — get personalized recommendations based on your skills, languages, and experience level.

Every contribution is tracked from start to finish, and your **Developer Contribution Score (DCS)** gives you a measurable, shareable proof of your open source impact.

---

## Features

- **AI-Matched Recommendations** — Issues matched to your skill level, preferred languages, and contribution history
- **DCS Score** — 4-dimension scoring algorithm: merge rate, difficulty growth, repo caliber, and consistency
- **PR Tracking** — Track your pull requests from open → merged automatically via GitHub webhooks
- **Explore Issues** — Filter by difficulty, language, stars, and repo owner
- **Smart Notifications** — Get notified when your PR merges, closes, or goes stale
- **Admin Dashboard** — Manage repos, trigger scrapes, view platform stats and logs
- **GitHub OAuth** — One-click sign in, no passwords

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | NextAuth.js (GitHub OAuth) |
| Caching | Upstash Redis |
| Notifications | Novu |
| Styling | Tailwind CSS v4 + Framer Motion |
| Deployment | Vercel |
| Cron Jobs | GitHub Actions |
| Rate Limiting | Upstash Ratelimit |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- GitHub OAuth App
- GitHub Personal Access Token

### 1. Clone the repo

```bash
git clone https://github.com/shirsenduda/DevContrib.git
cd DevContrib
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                        # openssl rand -base64 32

# GitHub OAuth (github.com/settings/developers)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# GitHub PAT (for scraping issues)
GITHUB_PERSONAL_ACCESS_TOKEN=

# GitHub Webhooks
GITHUB_WEBHOOK_SECRET=

# Upstash Redis (upstash.com)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Novu (dashboard.novu.co)
NOVU_SECRET_KEY=
NEXT_PUBLIC_NOVU_APP_ID=

# Admin
ADMIN_USERNAMES=your-github-username

# Cron security
CRON_SECRET=                            # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set up the database

```bash
pnpm db:push        # Push schema to database
pnpm db:generate    # Generate Prisma client
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Seed initial data (optional)

```bash
pnpm scrape         # Scrape GitHub repos & issues into your database
```

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/admin/          # Admin dashboard pages
│   ├── (auth)/login/           # Login page
│   ├── (dashboard)/            # Dashboard, Explore, Contributions, Profile
│   └── api/                    # API routes
│       ├── admin/              # Admin endpoints
│       ├── cron/               # Cron job endpoints (scrape, PR check, cleanup, notifications)
│       ├── contributions/      # Contribution CRUD
│       ├── issues/             # Issue fetching & recommendations
│       ├── user/               # User profile & stats
│       └── webhooks/github/    # GitHub webhook handler
├── jobs/                       # Background job implementations
├── services/                   # Business logic (github-sync, scoring, dcs-scoring)
├── lib/                        # Utilities (db, redis, auth, novu, github, logger)
└── components/                 # React components
scripts/
├── scrape.ts                   # Manual scrape runner
.github/workflows/
└── cron-jobs.yml               # Automated scheduled jobs (free, via GitHub Actions)
```

---

## Automated Cron Jobs

All scheduled tasks run via **GitHub Actions** (free) — no paid queue service needed:

| Job | Schedule |
|---|---|
| Scrape repos & issues | Every 6 hours |
| Check PR status | Every 6 hours |
| Update merge probabilities | Daily 2 AM UTC |
| Cleanup stale data | Weekly Sunday 3 AM UTC |
| Send notifications | Daily 9 AM & 10 AM UTC |

Add these secrets to your GitHub repo (`Settings → Secrets → Actions`):

| Secret | Description |
|---|---|
| `DATABASE_URL` | Production database URL |
| `GH_PAT` | GitHub Personal Access Token |
| `APP_URL` | Your deployed app URL |
| `CRON_SECRET` | Same as your `CRON_SECRET` env var |

---

## DCS Score Algorithm

The **Developer Contribution Score** measures 4 dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| Merge Rate | 35% | % of contributions that got merged |
| Difficulty Growth | 25% | Progression from easy to hard issues |
| Repo Caliber | 25% | Star count & health of repos contributed to |
| Consistency | 15% | Regular contribution activity over time |

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a pull request
```

---

## License

MIT © [Shirsendu Das](https://github.com/shirsenduda)

---

<div align="center">

Built with Next.js · Deployed on Vercel · [devcontrib.com](https://devcontrib.com)

</div>
