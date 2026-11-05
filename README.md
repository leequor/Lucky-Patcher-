# Hope Inc. ERP

## Overview

This repository contains the Hope Inc. ERP base application, built with Next.js App Router, JavaScript, Tailwind CSS, and Supabase.

The application uses the `app/` directory for pages, layouts, and API routes, and `app/components/` for UI components. Database migration files are stored in `supabase/migrations/`. Use the Supabase CLI to track and apply migrations in order.

## Prerequisites

- Node.js 20.9 or later and npm
- Access to the team's Supabase project for connection checks and database tasks
- Supabase CLI installed
- Git installed

## Environment Variables

1. Copy `.env.example` to `.env.local` for local application development.
2. Add the correct Supabase project URL and public client key provided by the team.
3. Never commit real credentials or secret keys.

The application reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the environment. These are public client configuration values; never put a service-role key in the application or repository.

## Run the application locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page checks the Supabase REST API and displays the connection status. The same check is available at `/api/health/supabase`.

The registration page is available at `/register`. It creates users with Supabase Auth using the public anon key, enforces a six-character minimum password, and displays duplicate-email and configuration errors. Users can sign in at `/login` with their registered email and password. Successful sign-in returns to `/`, where the session is shown; signing out clears the Supabase Auth session and returns to `/login`. Passwords are submitted directly to Supabase Auth through password input fields and are not saved by the application. Supabase email confirmation behavior depends on the project's Auth settings.

To create a production build and run it locally:

```bash
npm run build
npm start
```

## Database Migration Setup

1. Authenticate with the Supabase CLI:

   ```bash
   npx supabase login
   ```

2. Link the repository to the correct Supabase project:

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with the actual project reference provided by the team.

3. Check the migration status:

   ```bash
   npm run db:migration:list
   ```

4. Preview pending migration changes without applying them:

   ```bash
   npm run db:migrate:dry-run
   ```

5. After reviewing the pending migrations and obtaining approval to update the shared database, apply them:

   ```bash
   npm run db:migrate
   ```

   **Important:** Review migration scripts before applying them. Do not run destructive SQL against the shared database without approval.


## Migration Guidelines

- Store migration scripts in `supabase/migrations/`.
- Use unique timestamp-based filenames, such as `20261026120000_example_change.sql`.
- Review migration SQL before applying it.
- Do not run destructive SQL against the shared database without approval.
- Keep database schema creation and sample data in their assigned tasks.
- Never commit passwords, service-role keys, or other secrets.
