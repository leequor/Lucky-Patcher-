# Hope, Inc. ERP

Customer and product master data for a distribution business: customer records with
payment terms, a product catalogue, and the dated price history that decides what a
product costs today.

Built with Next.js (App Router), React 19, Tailwind CSS 4 and Supabase-ready SQL.

---

## What shipped in Sprint 2

| Area | Behaviour |
| --- | --- |
| Customers | List with search across code, name, contact, email and phone; filters for status and payment terms; pagination; create and edit share one form and one set of messages; soft delete and restore. |
| Products | List with the current price on every row, unit and status filters, a "no price set" filter; create and edit; soft delete and restore with the price history kept intact. |
| Price history | Dated rows, newest first, each showing the change against the price before it. The current price is the newest entry dated on or before today, so a scheduled price waits its turn. |
| Rights | Every action is checked against the role matrix, on the button and again in the store before the write. Direct requests from a role without the right are rejected. |
| Audit | Every create, edit, delete, restore and price change is written with the acting user, visible on the record and in the activity log. |
| Database | Tables, active views, trigram indexes, `current_price()` function, check constraints, a delete guard trigger and RLS policies that mirror the app rules. |

Sprint 1 was also repaired — see [Sprint 1 fixes](#sprint-1-fixes).

---

## Demo workspace

The deployed app runs a self-contained demo workspace: records and accounts live in the
browser's local storage, seeded on first load. No Supabase project is required to try
every screen.

| Account | Role | Can do |
| --- | --- | --- |
| `ada@hopeinc.demo` | Superadmin | Everything, including the activity log |
| `marco@hopeinc.demo` | Admin | Customers, products and prices — no activity log |
| `rina@hopeinc.demo` | Staff | Read-only: customer and product lists |

Password for all three: `HopeInc2026!`

Sign in as **staff** to see the permission states, or register a new account (new
accounts are superadmins in this dev workspace, per `.github/copilot-instructions.md`).
"Reset workspace" is not exposed in the UI; clearing site data reseeds the demo.

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Node 20.9 or later. No environment variables are required for the demo workspace.

### Tests

```bash
npm test
```

72 tests across four files: validation rules, price resolution, the permission matrix,
the records store (search, filters, pagination, soft delete, child guards, audit) and
the auth flows (sign in, session expiry, registration, password reset tokens).

---

## Project structure

```text
app/
  page.js                     public landing page
  login|register|forgot-password|reset-password/
  (app)/                      authenticated workspace (shell + guard)
    dashboard/ customers/ products/ activity/
  api/health/supabase/        connection check for a configured Supabase project
components/
  auth/       sign-in, registration, reset screens
  customers/  shared create/edit form
  products/   shared form + price history
  shell/      sidebar, top bar, access guard
  ui/         buttons, fields, tables, modal, toasts, icons
  providers/  auth and toast context
lib/
  domain/     constants, permissions, validation, pricing, formatting (no React)
  data/       seeded store, persistence, record operations
  auth/       session, accounts, PBKDF2 password hashing
supabase/
  migrations/ schema, constraints, views, indexes, RLS, demo data
tests/        node --test suites
docs/         Sprint 1 and Sprint 2 test artefacts
```

### Data layer

`lib/data/store.js` is the only place that reads or writes records. Every mutation:

1. checks the actor's right with `assertCan` (403 when missing),
2. validates the payload with the rules in `lib/domain/validation.js`,
3. applies the business rule (unique codes, one live price per date, child guard),
4. appends an audit row with the acting user.

The demo adapter persists to `localStorage` under `hope-erp.workspace.v1`. The SQL in
`supabase/migrations/` mirrors the same tables, constraints and policies, so the adapter
can be replaced by Supabase queries without changing a screen. `npm run db:migrate`
applies it to a linked project; see `supabase/migrations/README.md`.

### Design system

S1-UIX-01 tokens, applied consistently: Inter (self-hosted, `app/fonts`), black primary
buttons, `#F3F3F3` inputs and secondary buttons, 24 px cards, 14 px controls, white
surfaces on a warm paper canvas. Status colour is used on data only, never on chrome.

---

## Sprint 1 fixes

| Issue | Fix |
| --- | --- |
| LOG-04 — logout did not redirect | Sign out clears the session, then performs a full navigation to `/login?signedOut=1`, so the Back button cannot return to an authenticated render. |
| Landing page had no public view | `/` is a public page with the brand header, headline, Sign in / Register actions and a live product preview; signed-in visitors are sent to `/dashboard`. |
| Registration had no confirm-password field | Full name, email, password and confirmation, with matching inline validation. |
| Password reset was unusable without an email link | Reset tokens are issued with a 15-minute expiry, are single-use, and sign out open sessions. The demo shows the link instead of sending mail. |
| UI ignored the S1-UIX-01 spec | Rebuilt to the tokens above; the indigo/slate palette is gone. |
| No keyboard or screen-reader affordances | Visible focus rings, labelled fields, `aria-invalid` + `aria-describedby` on errors, focus-trapped dialogs, `aria-live` toasts. |

---

## Deployment

The app is a standard Next.js server app:

```bash
npm run build && npm start
```

Set `NEXT_DIST_DIR` to keep a dev server from writing into the production build
directory. To connect a real Supabase project later, apply the migrations and add
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `/api/health/supabase`
reports the connection state.

---

## Team workflow

1. Pick an issue on the project board and move it to In Progress.
2. Create a branch (`type/short-description`) — never work on `main`.
3. Open a PR that says `Closes #<issue>`.
4. A teammate reviews it; one approval required.
5. Merge, and the card moves to Done.

### Rules

- Never commit keys, passwords or `.env` files.
- Nobody approves their own PR.
