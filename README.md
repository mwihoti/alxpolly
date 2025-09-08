# PollMaster

A modern polling and voting application for teams and communities to create polls, collect votes, and visualize results in real time. Built for product teams, classrooms, open-source communities, and anyone who needs quick, transparent decisions.

## 🚀 Tech Stack

- Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Lucide Icons
- Backend: Next.js Server Actions (RSC), Supabase (Auth + REST + Realtime), Node 18+
- Database: PostgreSQL (Supabase) with RLS, triggers, and views
- Authentication: Supabase Auth (email/password; OAuth-ready)
- Deployment: Vercel (recommended) + Supabase Managed Postgres

## ✨ Features

- Poll management
  - Create polls with 2–10 options, optional description, and expiration date
  - Configure single-vote or multi-vote and control result visibility
  - Owner-only edit/close/delete (enforced by DB Row Level Security)
- Voting
  - Authenticated voting with DB-integrity checks and conflict handling
  - Real-time-ready (Supabase Realtime) for live result updates
  - Results aggregation view for efficient reads
- UX/UI
  - Responsive UI using Tailwind + shadcn/ui primitives (Button, Card, Input, etc.)
  - Share poll (copy link + social share) and CSV export of results
  - Accessible forms with validation and helpful error messages
- Security & data integrity
  - RLS policies for polls, options and votes
  - Triggers: single-vote enforcement, updated_at maintenance, min-options check
  - Strict input validation using zod in server actions

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm 9+
- Supabase project (PostgreSQL) with email/password auth enabled
- Optional: Vercel account for hosting the Next.js app

### Environment Variables

Copy the template below to `.env.local` (Next.js reads this file automatically):

```env
# Required (public) — used by the browser and server
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional aliases (if you prefer non-public names). If set, keep them in sync.
# SUPABASE_URL and SUPABASE_ANON_KEY are NOT read by this app unless you map them yourself.
# SUPABASE_URL=
# SUPABASE_ANON_KEY=

# Not used in this project (documented here only if your org standard requires it)
# NEXTAUTH_SECRET=
```

### Installation

```bash
npm install
```

### Database Setup

Apply the schema in Supabase:
1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/migrations/0001_polls.sql`
3. Run the script and save as a migration

What it creates:
- Tables: `public.polls`, `public.poll_options`, `public.votes`
- View: `public.poll_results` (aggregated counts per option)
- Indexes: for performant lookups on poll/options/votes
- RLS policies: read/write protection; owner-only modifications
- Triggers:
  - `trg_votes_single_vote`: enforces single-vote when configured
  - `trg_polls_min_options`: ensures ≥2 options before activation
  - `trg_polls_updated_at`: maintains `updated_at`

### Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## 📱 Usage

- Authentication
  - Register at `/auth/register`, then sign in at `/auth/login`
  - Auth state is provided via a client `AuthProvider` (`app/auth/auth-context.tsx`)
- Create a poll
  - Navigate to `/polls/create`
  - Add 2–10 options, optional expiration, and settings (single/multi vote, show/hide results)
- Vote on a poll
  - Go to `/polls/[id]` and select your choice(s)
  - Results update on revalidation; Realtime can be enabled for live updates
- Share a poll
  - Use the Share section to copy link or post to social networks
- Export results
  - Download a CSV of option counts from the results panel

## 🧩 Architecture Overview

- Data layer
  - PostgreSQL with strict RLS guarding all writes and sensitive reads
  - `polls` (owner, settings, lifecycle) → `poll_options` (options) → `votes` (voter_id + choice)
- Server actions (in `app/poll-actions.ts`)
  - `createPoll`: zod-validated insert of poll + options, with cache revalidation
  - `vote`: integrity-checked insert of a vote; revalidates detail page
  - `getPollById`: typed read of a poll and options
- Authentication
  - Supabase Auth; session is available to server via `app/lib/supabase-server.ts`
  - Client session via `app/auth/auth-context.tsx` with listener for token refresh
- UI
  - Tailwind CSS v4 theme tokens in `app/globals.css`
  - shadcn/ui components under `app/components/ui`

## 🔒 Security & Business Rules

- Validation
  - zod schemas: title length, option count (2–10), option text limits, expiration ISO format
  - DB unique: `(poll_id, text)` prevents duplicate option labels
- Permissions
  - Only poll owner can modify or delete polls and options
  - Only authenticated users can vote; votes must target active, unexpired polls
- Integrity
  - Trigger blocks multiple votes in single-vote mode
  - CHECK constraint ensures an option belongs to its poll
- Concurrency
  - Concurrent votes resolved by DB constraints; losers receive deterministic error
  - Consider optimistic concurrency (version/updated_at) for admin edits
- Audit
  - `votes` provides minimal history; extend with a `votes_log` trigger/table if needed (e.g., hashed IP/user-agent)

## 🧪 Testing (outline)

- Unit tests for server actions with mocked Supabase client
- Validation tests (zod) for happy/sad paths
- Integration tests for RLS behavior (using a test Supabase project)
- E2E tests for create → vote → results (Playwright/Cypress)

## 🚀 Deployment

- Deploy frontend on Vercel:
  - Set environment variables in Vercel project settings
  - Connect to this repository and deploy
- Supabase: Ensure the SQL migration has been applied in your production project

## 📖 Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

(Add a `test` script when tests are introduced, e.g., with Vitest.)

## 🗺️ Roadmap

- Server actions for update/delete of polls with optimistic concurrency
- Real-time subscriptions on votes for live results
- Owner tools (close poll, edit options before first vote, analytics)
- Pagination and filters on `/polls`
- Test suite + CI pipeline

## 📄 License

MIT — see LICENSE file if provided.
