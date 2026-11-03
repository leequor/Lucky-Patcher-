# Hope Inc. ERP — Database Setup

## Overview

This repository uses Supabase and PostgreSQL for the project's database.

Database migration files are stored in `supabase/migrations/`. Use the Supabase CLI to track and apply migrations in order.

## Prerequisites

- Access to the team's Supabase project
- Supabase CLI installed
- Git installed

## Environment Variables

1. Copy `.env.example` to `.env.local` for local application development.
2. Add the correct Supabase project URL and public client key provided by the team.
3. Never commit real credentials or secret keys.

## Database Migration Setup

1. Clone the repository and switch to the team's approved development branch.

2. Install project dependencies:

   ```bash
   npm install
   ```

3. Authenticate with the Supabase CLI:

   ```bash
   npx supabase login
   ```

4. Link the repository to the correct Supabase project:

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with the actual project reference provided by the team.

5. Check the migration status:

   ```bash
   npm run db:migration:list
   ```

6. Preview pending migration changes without applying them:

   ```bash
   npm run db:migrate:dry-run
   ```

7. After reviewing the pending migrations and obtaining approval to update the shared database, apply them:

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
