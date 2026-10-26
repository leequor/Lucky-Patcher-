
# Database Migrations

This folder stores database migration scripts in SQL format.

## Rules
- Give each migration a unique, timestamp-based filename.
- Apply migrations in chronological order.
- Review each migration before applying it to the shared Supabase database.
- Do not commit database passwords, API keys, or other secrets.
- Do not run destructive SQL scripts against the shared database without approval.

