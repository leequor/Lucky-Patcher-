# Database migrations

Migration scripts in apply order. Every file is replayable from scratch.

| # | File | What it does |
| --- | --- | --- |
| 1 | `20261105160000_create_users_and_roles.sql` | `roles` and `users` tables, the signup trigger, first RLS policies (Sprint 1) |
| 2 | `20261110100000_create_records_schema.sql` | Customers, products, price history, audit log; active views; `current_price()`; check constraints; trigram and partial indexes; delete guard; RLS policies that mirror the app's role matrix (S2-DBA-01..04) |
| 3 | `20261112120000_seed_demo_records.sql` | Idempotent demo customers, products, prices and a short activity trail (S2-DBA-05) |

## Applying

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:migration:list      # what is pending
npm run db:migrate:dry-run     # preview
npm run db:migrate             # apply
```

Review the SQL before pushing to a shared database. Nothing in these files drops or
truncates an existing object.

## Rules the database enforces

- `pay_terms` and `unit` are restricted by CHECK constraints, so a bad value cannot be
  saved even by a client that skips the app.
- One live price per product per effective date (partial unique index, so a soft-deleted
  row frees its date).
- Soft-deleting a product that still has price records raises `restrict_violation`.
- Every policy is written against `public.has_permission(...)`, which mirrors
  `lib/domain/constants.js` — one matrix, two enforcement points.
- Hard deletes are refused on customers and products; the app only ever sets
  `is_deleted`.
- The activity log is append-only: insert as yourself, read with the audit right, no
  update or delete.

## Checking the query plan (S2-DBA-06)

```sql
explain analyse
select code, name from public.active_customers
where lower(name) like '%cement%';
```

The trigram indexes (`customers_name_trgm_idx`, `products_description_trgm_idx`) keep
`ILIKE '%term%'` off a sequential scan once the tables carry volume. Partial indexes on
`is_deleted` keep the active views cheap.
