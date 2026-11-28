
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


Users with the `customers.view` right can open the Customers page from the dashboard. The list defaults to active customers and supports searching by customer number, name, and address, payment-term filtering, and pagination. Active customer records are retrieved through the `customer_active` database view, which excludes soft-deleted records. Users need matching `customers.add`, `customers.edit`, `customers.delete`, or `customers.restore` rights to use those actions. The server checks permissions, while database policies control row access.

Users with the `products.view` right can open the Products page from the dashboard. The list defaults to active products and supports searching by product code and description, unit filtering, and pagination. Active product records are retrieved through the `product_active` database view, which excludes soft-deleted records. Current prices come from the latest non-deleted `pricehist` entry effective on or before today; products without a matching row show “No price set.” Deleted product records require the appropriate restore permission.

Users with the `departments.view` right can open the Departments page from the dashboard. The module supports department code/name/description search, active and deleted status filters, pagination, and add/edit/delete/restore actions according to the matching department rights.

Users with the `jobs.view` right can open the Jobs page from the dashboard. The module supports job code/title/description search, active and deleted status filters, pagination, and add/edit/delete/restore actions according to the matching job rights.

### S2-DBA-01: Customer and Product Active Views and Indexes

The database migration `20261122160000_customer_product_active_indexes.sql` creates the `customer_active` and `product_active` views and supporting indexes for active customer and product searches.

- Customer search indexes support customer number and customer name searches.
- Product search indexes support product code and description searches.
- Partial indexes exclude soft-deleted records.
- The migration uses conditional extension and index creation so it can be safely replayed.
- Query plans were checked using `EXPLAIN`. Customer name search used the trigram index. Product description search used a sequential scan because the table contained only 57 records, even though its supporting trigram index exists.

Users with the `products.price.view` right can expand a product's dated price history. The `products.price.add`, `products.price.edit`, and `products.price.delete` rights control price mutations independently of product edits. The `20261124180000_finish_customer_product_price_audit.sql` migration creates the current-price view, rejects duplicate active effective dates, and audits customer, product, and price-history changes with the acting user. Product creation and updates do not directly set prices; use dated price history instead.

Users who forget their password can request a reset email at `/forgot-password` and choose a new password at `/reset-password`. In the Supabase dashboard, add the app's origin to the Auth redirect URL allow list; reset emails redirect to `<app-origin>/reset-password`. The reset form requires an active Supabase recovery session, so expired or already-used links must be requested again.

To create a production build and run it locally:

```bash
npm run build
npm start
```

## Database Performance Report

The Sprint 2 database search and index performance measurements are documented in [DBA Performance Report](docs/DBA-PERFORMANCE-REPORT.md).

The report includes:
- Customer, product, and price-history query benchmarks.
- EXPLAIN ANALYZE execution plans.
- Index tuning and verification results.
- Before-and-after performance measurements.

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


## UI/UX reference — Hope ERP

Expand a section to view its screens. Click an image to view it full size.

### Overview

<details>
<summary><strong>01 · Landing, roles & dashboard</strong> — 3 screens</summary>

#### Landing
<img width="2003" height="1080" alt="Hope ERP · Landing" src="https://github.com/user-attachments/assets/e995e488-88ad-48b7-ab73-f2015bae8642" />


#### About and roles
<img width="2003" height="1080" alt="Hope ERP · About and roles" src="https://github.com/user-attachments/assets/87a8a2af-425b-46bb-af6c-f65f215a789a" />

#### Dashboard
<img width="2003" height="1080" alt="Hope ERP · Dashboard" src="https://github.com/user-attachments/assets/d4871ba1-4925-403c-a0a9-640c2f374a6e" />

</details>

### Authentication & access

<details>
<summary><strong>02 · Sign in, registration & password recovery</strong> — 6 screens</summary>

#### Sign in
<img width="2003" height="1080" alt="Hope ERP · Sign in" src="https://github.com/user-attachments/assets/a57ddb63-f9d7-4194-ba47-fdf668bf702a" />

#### Register
<img width="2003" height="1080" alt="Hope ERP · Register" src="https://github.com/user-attachments/assets/05f682d5-ac3f-4674-8c9f-4448080b844a" />

#### Forgot password
<img width="2003" height="1080" alt="Hope ERP · Forgot password" src="https://github.com/user-attachments/assets/94d6a91b-bb13-4d12-9116-1dfbb370f175" />

#### Password reset — Awaiting approval
<img width="2003" height="1080" alt="Hope ERP · Password reset · Awaiting approval" src="https://github.com/user-attachments/assets/711c58bf-7f62-46f0-aa1e-c339d53654d1" />

#### Password reset — Approved
<img width="2003" height="1080" alt="Hope ERP · Password reset · Approved" src="https://github.com/user-attachments/assets/0d05a062-31a9-48ef-9cb8-2481f8f1a08d" />

#### Password reset — Complete
<img width="2003" height="1080" alt="Hope ERP · Password reset · Complete" src="https://github.com/user-attachments/assets/97dbd86a-86ac-43bb-bbd8-904a26591d3e" />

</details>

<details>
<summary><strong>03 · Account approvals</strong> — 2 screens</summary>

#### Superadmin
<img width="2003" height="1080" alt="Hope ERP · Account approvals · Superadmin" src="https://github.com/user-attachments/assets/3b9175ba-94a7-408a-bc17-5ec8aed74b0e" />

#### Admin
<img width="2003" height="1080" alt="Hope ERP · Account approvals · Admin" src="https://github.com/user-attachments/assets/fc515b38-ac84-49ca-b43e-95a79e49d041" />

</details>

### Workspace

<details>
<summary><strong>04 · Products, human resources & sales</strong> — 3 screens</summary>

#### Products
<img width="2003" height="1080" alt="Hope ERP · Products" src="https://github.com/user-attachments/assets/5a42d79a-22d5-40f3-a954-d7043cf4433f" />

#### Human resources
<img width="2003" height="1080" alt="Hope ERP · Human Resources" src="https://github.com/user-attachments/assets/25312d7b-9e5f-4628-9ad1-0e189205961b" />

#### Sales
<img width="2003" height="1080" alt="Hope ERP · Sales" src="https://github.com/user-attachments/assets/7e814984-4f5a-470c-85bd-e28bb8678ae7" />

</details>

<details>
<summary><strong>05 · User management</strong> — 2 screens</summary>

#### Superadmin
<img width="2003" height="1080" alt="Hope ERP · User Management · Superadmin" src="https://github.com/user-attachments/assets/8a190510-0710-493d-81a0-76d53ffe1538" />

#### Admin
<img width="2003" height="1080" alt="Hope ERP · User Management · Admin" src="https://github.com/user-attachments/assets/829950f0-def7-495d-af67-2cf8c8a785ff" />

</details>

### Customer Relations

<details>
<summary><strong>06 · Customer management</strong> — 5 screens</summary>

**Scope:** Customer list, search and filters, add/edit forms,
customer details, and delete confirmation.

#### Customer list
<img width="2003" height="1080" alt="Hope ERP · Customers" src="https://github.com/user-attachments/assets/b6365c92-408e-402a-b88c-4d7bae2d9f11" />

#### Add customer
<img width="2003" height="1080" alt="Hope ERP · Add customer" src="https://github.com/user-attachments/assets/8a5fba22-60ae-4da5-b901-f6c09c3c2a07" />

#### Edit customer
<img width="2003" height="1080" alt="Hope ERP · Edit customer" src="https://github.com/user-attachments/assets/399ee34f-4057-44aa-9504-536a5de25a92" />

#### Customer details
<img width="2003" height="1080" alt="Hope ERP · Customer details" src="https://github.com/user-attachments/assets/1566f7ce-366a-442b-9b1d-a33de354344c" />

#### Delete customer confirmation
<img width="2003" height="1080" alt="Hope ERP · Delete customer confirmation" src="https://github.com/user-attachments/assets/1a8ebee3-41cd-4a7a-9309-3d157c4b30d1" />

</details>

### Product management & price history

<details>
<summary><strong>07 · Product management</strong> — 5 screens</summary>

**Scope:** Product details with price history, add/edit product forms,
and add/edit dated price dialogs with scheduled-price handling.

#### Product details and price history
<img width="2003" height="1080" alt="Hope ERP · Product details and price history" src="https://github.com/user-attachments/assets/3905b9ab-46b5-417c-a2c0-4872a982994a" />

#### Add product
<img width="2003" height="1080" alt="Hope ERP · Add product" src="https://github.com/user-attachments/assets/0ebf1a19-a2af-431c-87b0-626fb3fffee5" />

#### Edit product
<img width="2003" height="1080" alt="Hope ERP · Edit product" src="https://github.com/user-attachments/assets/59f2a3ef-091d-45d3-b1b8-e7426675dcca" />

#### Add dated price
<img width="2003" height="1080" alt="Hope ERP · Add dated price" src="https://github.com/user-attachments/assets/0fca8f1f-04ec-4f75-bd1a-1da2a8565a5d" />

#### Edit dated price
<img width="2003" height="1080" alt="Hope ERP · Edit dated price" src="https://github.com/user-attachments/assets/57789ce4-b6ab-453d-a497-519e9c5462d9" />

</details>


## Team workflow
1. Pick an issue on the project board and move it to In Progress
2. Create a branch (never work on main)
3. Open a PR and write "Closes #<issue number>"
4. A teammate reviews it (1 approval required)
5. Merge after approval, and the card moves to Done

## Rules
- Never commit keys, passwords, or .env files
- Nobody approves their own PR
<img width="498" height="333" alt="angry-cat-meme-cat" src="https://github.com/user-attachments/assets/8899ccef-9f30-4d45-81d4-affbd527bd0a" />
