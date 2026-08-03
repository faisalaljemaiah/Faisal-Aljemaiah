# OP Interns

A production-ready pharmacy intern management platform — scheduling, clinical
learning (Drug of the Day, counseling simulator), reflections, gamified
leaderboard, and a full admin panel — built for hospital pharmacy teams.

## Stack

| Layer          | Technology                                              |
| -------------- | -------------------------------------------------------- |
| Frontend       | React 19 + Vite + TypeScript                              |
| Styling / UI   | Tailwind CSS v4 + hand-rolled shadcn/ui-style components   |
| Data / Auth    | Supabase (Postgres, Auth, Row Level Security, Realtime)   |
| State / Data   | TanStack Query                                            |
| Forms          | react-hook-form + zod                                     |
| Charts         | Recharts                                                   |
| Deployment     | Vercel                                                     |

## Features

- **Auth**: login, register, forgot/reset password, profile editing, change password
- **Dashboard**: upcoming shifts, today's activities, Drug of the Day, weekly leaderboard, announcements, quick actions
- **Schedule**: calendar view, shift assignments, rotations, attendance check-in/out
- **Drug of the Day**: admin-published clinical spotlight with a scored quiz (server-side grading via Postgres RPC)
- **Drug Locator**: fast fuzzy search by generic/brand name with shelf/bin/room storage info
- **Counseling Simulator**: virtual patient cases with a counseling checklist, server-graded score and feedback
- **Reflections**: draft/submit clinical learning logs with preceptor/admin review
- **Leaderboard**: weekly / monthly / all-time rankings, badges auto-awarded by point thresholds
- **Admin Panel**: manage users & roles, schedules & rotations, Drug of the Day, drug directory, counseling cases, announcements, reflection review, analytics dashboard

Every feature reads and writes through Supabase with Row Level Security — there
is no mock data or fake API layer.

## Getting started

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com/dashboard), then open
the SQL Editor and run the migration files in `supabase/migrations/` **in
order** (0001 → 0005). If you use the [Supabase CLI](https://supabase.com/docs/guides/cli)
instead:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This creates every table, index, trigger, RPC function, view, and RLS policy
described below. All five migrations have been validated end-to-end against a
real PostgreSQL 16 instance (schema creation, triggers, RLS enforcement, and
the scoring RPCs all verified).

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase
project's Settings → API page.

### 3. Install & run

```bash
npm install
npm run dev
```

### 4. Create your first admin user

Sign up through the app's `/register` page (this creates an `intern` by
default). Then, in the Supabase SQL editor, promote that user:

```sql
update public.profiles set role = 'admin' where email = 'you@hospital.org';
```

From then on you can manage roles from the Admin Panel → Interns tab.

## Database design

All schema lives in `supabase/migrations/`, split for readability:

- `0001_extensions_and_types.sql` — `pgcrypto`, `pg_trgm`, and enum types (`user_role`, `shift_status`, `case_difficulty`, etc.)
- `0002_tables.sql` — every table: `profiles`, `rotations`, `rotation_assignments`, `shifts`, `shift_assignments`, `announcements`, `notifications`, `drugs`, `drug_of_day` (+ questions + completions), `counseling_cases`, `counseling_attempts`, `reflections`, `points_ledger`, `badges`, `user_badges` — with foreign keys and indexes (including a trigram index for drug name search)
- `0003_functions_triggers.sql` — `handle_new_user` (auth.users → profiles), `updated_at` maintenance, points-ledger → profile points sync, automatic badge awarding, server-side quiz/counseling scoring RPCs (`submit_drug_of_day_quiz`, `submit_counseling_attempt`), notification triggers, and leaderboard views
- `0004_rls.sql` — Row Level Security enabled and policies defined for every table (role-aware: intern/preceptor/admin)
- `0005_seed_badges.sql` — reference data for the badge system (no fake user/clinical data)

Quiz and counseling-simulator scoring happens **inside Postgres** via
`security definer` RPC functions so scores and point awards can't be
tampered with from the client.

## Project structure

```
src/
  components/       shared UI (shadcn-style primitives in components/ui, layout, ProtectedRoute)
  contexts/          AuthContext, ThemeContext
  hooks/             one file per domain — react-query hooks wrapping Supabase calls
  pages/             one page per route; pages/admin/ holds the admin panel
  types/database.ts  hand-written types mirroring the Postgres schema
  lib/               supabase client, cn()/formatting utilities
supabase/migrations/ SQL migrations (see above)
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel as a Vite project (framework preset: Vite).
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables.
4. Deploy — `vercel.json` already configures the SPA rewrite so client-side routes work on refresh.

In Supabase, add your Vercel domain to **Authentication → URL Configuration**
(Site URL + Redirect URLs) so password reset and email confirmation links
resolve correctly in production.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — typecheck + production build
- `npm run typecheck` — TypeScript project build/typecheck only
- `npm run lint` — oxlint
- `npm run preview` — preview the production build locally
