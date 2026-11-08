
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

## S1-UIX-01
### Global Styling
- **Font Family:** Inter, sans-serif
- **Modal Surface:** #FFFFFF (White)
- **Primary Buttons / Dark:** #000000 (Black)
- **Input Fields & Secondary Buttons:** #F3F3F3 (Light Gray)
- **Corner Radius:** 24px (Card) / 14px (Inputs & Buttons)

---

### Screen 1: Welcome & Landing (Hope, Inc. ERP)
- **Top Header Banner:** Background `#000000`, Logo `#FFFFFF`, App Name `Hope, Inc. ERP` (Inter, Semi-Bold, `#FFFFFF`)
- **Main Headline:** "Run your entire business with confidence" (Inter, Bold 700, `#000000`)
- **Description:** "Hope, Inc. ERP unifies Customer Management..." (Inter, Regular 400, `#71717A`)
- **"Sign In" Button:** Background `#F3F3F3`, Text: "Sign In" (Inter, Semi-Bold 600, `#000000`), Radius: 14px
- **Divider:** "or" (Inter, Medium 500, `#000000`)
- **"Register" Button:** Background `#F3F3F3`, Text: "Register" (Inter, Semi-Bold 600, `#000000`), Radius: 14px

---

### Screen 2: Login — "Welcome Back"
- **Title:** "Welcome Back" (Inter, Bold 700, `#000000`)
- **Subtitle:** "Login to your Hope, Inc. ERP account" (Inter, Regular 400, `#808080`)
- **Field Labels:** "Emails", "Password" (Inter, Semi-Bold 600, `#000000`)
- **Forgot Password Link:** "Forgot your password?" (Inter, Semi-Bold 600, `#000000`)
- **Input Fields:** Background `#F3F3F3`, Radius: 14px, Border: None
- **Primary Button:** "Login" (Background `#000000`, Text: `#FFFFFF`, Inter Semi-Bold 600, Radius: 14px)
- **Social Login:** 3 buttons with `#F3F3F3` background
- **Footer:** "Don't have an account? Sign up" (Inter, Semi-Bold 600, `#000000`)

---

### Screen 3: Register — "Create an Account"
- **Title:** "Create an Account" (Inter, Bold 700, `#000000`)
- **Subtitle:** "Sign up to your Hope, Inc. ERP account" (Inter, Regular 400, `#808080`)
- **Field Labels:** "Full Name", "Email", "Password", "Confirm Password" (Inter, Semi-Bold 600, `#000000`)
- **Input Fields:** Background `#F3F3F3`, Radius: 14px
- **Primary Button:** "Create Account" (Background `#000000`, Text: `#FFFFFF`, Inter Semi-Bold 600, Radius: 14px)
- **Footer:** "Already have an account? Log in" (Inter, Semi-Bold 600, `#000000`)

---

### Screen 4: Password Reset — "Reset your Password"
- **Title:** "Reset your Password" (Inter, Bold 700, `#000000`)
- **Subtitle:** "We'll email you a link to reset it" (Inter, Regular 400, `#808080`)
- **Field Labels:** "Name", "Email" (Inter, Semi-Bold 600, `#000000`)
- **Input Fields:** Background `#F3F3F3`, Radius: 14px
- **Primary Button:** "Send reset link" (Background `#000000`, Text: `#FFFFFF`, Inter Semi-Bold 600, Radius: 14px)
- **Footer:** "Remembered it? Back to log in" (Inter, Semi-Bold 600, `#000000`)

## S1-UIX-02

<img width="1920" height="1080" alt="Page" src="https://github.com/user-attachments/assets/6d9c876a-9e3d-4f2e-b974-8a4f6064382d" />
<img width="1920" height="1080" alt="Log In" src="https://github.com/user-attachments/assets/a4053269-72d5-4677-9ac4-d560cb84a195" />
<img width="1920" height="1080" alt="Register" src="https://github.com/user-attachments/assets/126c29e8-53f5-4625-bdaf-1aa261c92216" />
<img width="1920" height="1080" alt="Reset Password" src="https://github.com/user-attachments/assets/0f9bdbc0-259a-4153-88fd-da64162514c6" />

## S1-UIX-03, S1-UIX-04

<img width="1920" height="1080" alt="Homepage UI" src="https://github.com/user-attachments/assets/1f560a95-c44f-45af-bc91-4874b95295a7" />
<img width="1920" height="1080" alt="Log In UI" src="https://github.com/user-attachments/assets/12dc02b5-28a8-4965-a918-5d6020b7799c" />
<img width="1920" height="1080" alt="Register UI" src="https://github.com/user-attachments/assets/082de783-69f8-4339-9499-faa8401fd2f6" />
<img width="1920" height="1080" alt="Reset Password UI" src="https://github.com/user-attachments/assets/24db7974-a386-40c6-b237-b96a4abd18a1" />



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
