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
2. Install the Supabase CLI by following the official Supabase documentation.
3. Authenticate with the CLI:

   ```bash
   supabase login
   ```

4. Link the repository to the correct Supabase project:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

5. Check the migration status:

   ```bash
   supabase migration list
   ```

6. After reviewing the pending migrations and obtaining approval to update the shared database, apply them:

   ```bash
   supabase db push
   ```

Replace `YOUR_PROJECT_REF` with the actual project reference provided by the team.

## Migration Guidelines

- Store migration scripts in `supabase/migrations/`.
- Use unique timestamp-based filenames, such as `20261026120000_example_change.sql`.
- Review migration SQL before applying it.
- Do not run destructive SQL against the shared database without approval.
- Keep database schema creation and sample data in their assigned tasks.
- Never commit passwords, service-role keys, or other secrets.
