# Connecting the app to Supabase

The deployed build currently runs the **demo workspace**: records live in each browser's
local storage, so two people do not see the same data and clearing site data reseeds it.
This document is the switch to a real, shared database.

Nothing here is done yet — the repository has no Supabase project reference
(`supabase/config.toml` only carries `project_id = "hope-inc-erp"`), and no credentials.

---

## 1. Get a project

You have two routes.

### A. Ask the project owner for access (the team's existing project)

Only the owner can grant it. There is no workaround, and nobody should try to take it.

Send them this:

> Hi — I need to work on the database for the Hope, Inc. ERP project.
> Could you open the Supabase dashboard → your organisation → **Team** → **Invite member**
> and invite `your@email` with the **Developer** role?
> That gives me the SQL editor and the ability to apply migrations, without giving me
> your account.

If they would rather not add a member, the alternative is that **they** run the SQL in
step 2 and give you the two public values in step 4.

### B. Create your own project (fastest, and you own it)

1. Sign in at <https://supabase.com/dashboard> (GitHub login is fine).
2. **New project** → name it `hope-inc-erp`, pick the region closest to you, set a database
   password and save it somewhere safe.
3. Wait for provisioning (~2 minutes).

A free project is enough for this app.

---

## 2. Create the schema

Open **SQL Editor** in the project and run these three files, **in this order**, one at a
time (copy the whole file, paste, Run):

| Order | File | Creates |
| --- | --- | --- |
| 1 | `supabase/migrations/20261105160000_create_users_and_roles.sql` | `roles`, `users`, the signup trigger |
| 2 | `supabase/migrations/20261110100000_create_records_schema.sql` | customers, products, price history, audit log, views, `current_price()`, indexes, RLS |
| 3 | `supabase/migrations/20261112120000_seed_demo_records.sql` | demo customers, products and prices |

Each file is safe to run twice. If the project already has the Sprint 1 tables, step 1
does nothing (`create table if not exists`).

With the CLI instead:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:migrate
```

---

## 3. Auth settings

**Authentication → Providers → Email**: turn **Confirm email** off for the demo (otherwise
new accounts cannot sign in until they click a link).

**Authentication → URL Configuration**:

- Site URL: the deployed origin, e.g. `https://wbapp-....apps.workbuddy.host`
- Redirect URLs: add `<origin>/reset-password`

---

## 4. Give the app the two public values

From **Project Settings → API**:

- Project URL — `https://<ref>.supabase.co`
- `anon` `public` key

Both are public client values; they are safe to put in the app. The **service_role** key and
the database password must never go into the app, the repo or a chat message.

Then either:

- put them in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and
  rebuild, or
- hand them over so the app can be wired and redeployed.

---

## 5. What changes in the code

The store is already isolated behind `lib/data/store.js`, so the switch is contained:

1. **Auth** — `components/providers/auth-provider.js` and `lib/auth/session.js` move to
   `supabase.auth` (`signInWithPassword`, `signUp`, `signOut`, `resetPasswordForEmail`,
   `updateUser`). The role comes from `public.users`, which the signup trigger fills.
2. **Records** — each function in `lib/data/store.js` becomes a Supabase query against the
   active views (`active_customers`, `active_products`, `product_current_price`). The rules
   that today live in JavaScript already exist in SQL: unique codes, one live price per
   date, the delete guard trigger, and RLS per right.
3. **Audit** — inserts go to `audit_log` with `actor_id = auth.uid()`, which the insert
   policy enforces.
4. **Demo accounts** — they stop existing; real accounts are created by signing up, and the
   first one needs its role set once in the SQL editor:

   ```sql
   update public.users set role = 'superadmin' where id = (select id from auth.users order by created_at limit 1);
   ```

---

## 6. What this costs you

- Email confirmation, reset emails and sessions are handled by Supabase, so the reset flow
  becomes real mail instead of the demo link.
- The "one-click demo accounts" on the login screen go away.
- The app keeps working offline only if we keep the local store as a fallback; decide
  whether you want that or a hard requirement on the database.

---

## 7. Verifying it works

After the switch:

1. Sign up in the app, promote the account to `superadmin` with the SQL above.
2. Create a customer. In the dashboard → **Table editor** → `customers`, the row is there.
3. Open the deployed link in a second browser, sign in, and confirm the same customer is
   visible. That is the proof the data is shared, not local.
4. Check `audit_log` has a row with your `actor_id`.
