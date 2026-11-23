
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

Users with the `products.view` right can open the Products page from the dashboard. The list defaults to active products and supports searching by product code and description, unit filtering, and pagination. Active product records are retrieved through the `product_active` database view, which excludes soft-deleted records. Current prices are retrieved from the latest non-deleted entry in `pricehist` for each product. Deleted product records require the appropriate restore permission.

### S2-DBA-01: Customer and Product Active Views and Indexes

The database migration `20261122160000_customer_product_active_indexes.sql` creates the `customer_active` and `product_active` views and supporting indexes for active customer and product searches.

- Customer search indexes support customer number and customer name searches.
- Product search indexes support product code and description searches.
- Partial indexes exclude soft-deleted records.
- The migration uses conditional extension and index creation so it can be safely replayed.
- Query plans were checked using `EXPLAIN`. Customer name search used the trigram index. Product description search used a sequential scan because the table contained only 57 records, even though its supporting trigram index exists.

Users who forget their password can request a reset email at `/forgot-password` and choose a new password at `/reset-password`. In the Supabase dashboard, add the app's origin to the Auth redirect URL allow list; reset emails redirect to `<app-origin>/reset-password`. The reset form requires an active Supabase recovery session, so expired or already-used links must be requested again.

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
![Sign in](docs/ui-ux/images/04-sign-in.png)

#### Register
![Register](docs/ui-ux/images/05-register.png)

#### Forgot password
![Forgot password](docs/ui-ux/images/06-forgot-password.png)

#### Password reset — Awaiting approval
![Password reset awaiting approval](docs/ui-ux/images/07-reset-awaiting-approval.png)

#### Password reset — Approved
![Password reset approved](docs/ui-ux/images/08-reset-approved.png)

#### Password reset — Complete
![Password reset complete](docs/ui-ux/images/09-reset-complete.png)

</details>

<details>
<summary><strong>03 · Account approvals</strong> — 2 screens</summary>

#### Superadmin
![Account approvals for superadmin](docs/ui-ux/images/10-approvals-superadmin.png)

#### Admin
![Account approvals for admin](docs/ui-ux/images/11-approvals-admin.png)

</details>

### Workspace

<details>
<summary><strong>04 · Products, human resources & sales</strong> — 3 screens</summary>

#### Products
![Products](<img width="2003" height="1080" alt="Hope ERP · Landing" src="https://github.com/user-attachments/assets/e995e488-88ad-48b7-ab73-f2015bae8642" />)

#### Human resources
![Human resources](docs/ui-ux/images/13-human-resources.png)

#### Sales
![Sales](docs/ui-ux/images/14-sales.png)

</details>

<details>
<summary><strong>05 · User management</strong> — 2 screens</summary>

#### Superadmin
![User management for superadmin](docs/ui-ux/images/15-users-superadmin.png)

#### Admin
![User management for admin](docs/ui-ux/images/16-users-admin.png)

</details>

### Sprint 2 · S2-UIX-01

<details>
<summary><strong>06 · Customer management</strong> — 5 screens</summary>

**Scope:** Customer list, search and filters, add/edit forms,
customer details, and delete confirmation.

#### Customer list
![Customer list](docs/ui-ux/images/17-customers-list.png)

#### Add customer
![Add customer](docs/ui-ux/images/18-customers-add.png)

#### Edit customer
![Edit customer](docs/ui-ux/images/19-customers-edit.png)

#### Customer details
![Customer details](docs/ui-ux/images/20-customers-details.png)

#### Delete customer confirmation
![Delete customer confirmation](docs/ui-ux/images/21-customers-delete-confirmation.png)

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
