# Nov 9 Demo Script and Rehearsal Log

**Goal:** show a working Sprint 1 account flow, prove the database and security choices, and end
with test evidence. The demo should take about 12 minutes, including one minute of questions.

## Speaker assignments

| Segment | Speaker | Why |
| --- | --- | --- |
| Welcome and board | Alexander R. Campita | Scrum Master / project lead |
| Register | Rian D. Sabrido | Backend / full-stack |
| Login | Rian D. Sabrido | Backend / full-stack |
| Landing page | Rian D. Sabrido | Backend / full-stack |
| Password reset | Ivanhoe V. Rabaca | DevSecOps |
| Supabase data and security | Ivanhoe V. Rabaca | DevSecOps |
| Test results | Jaymark A. De Guzman | QA |
| Design notes and close | Ian Kenneth P. Rafanan + Alexander | UI/UX + lead |

## Before the presentation

- [ ] `npm run check:env` passes on the presentation laptop.
- [ ] `npm run seed:demo` has created the three demo accounts.
- [ ] `/status` shows both checks green.
- [ ] The browser has tabs ready: `/`, `/register`, `/login`, `/forgot-password`, `/status`,
      the Supabase **Authentication → Users** page, and the Supabase **Table Editor → profiles**
      page.
- [ ] Backup screenshots in `docs/screenshots/` are open in a separate window.
- [ ] The demo password is in the password manager, not on a slide.
- [ ] Phone hotspot is available if the venue Wi-Fi fails.
- [ ] Notifications are off. Browser zoom is 100%.

## Run of show

### 0:00–1:00 — Welcome and the board

**Alexander**

> "We are Lucky Patcher. Sprint 1 was about getting account access right: register, log in,
> land somewhere useful, and recover a password. We tracked every task as an issue, worked on a
> branch, and merged through a pull request."

Show the issue list / board and the merged PR. Point out that each issue has acceptance criteria
and a linked PR.

### 1:00–3:00 — Register

**Rian**

1. Open `/register`.
2. Enter a display name, a fresh email, and a password shorter than six characters.
3. Submit. Point out the inline password error.
4. Fix the password and submit.
5. If email confirmation is disabled, the app lands on `/`. Otherwise, show the "check your
   email" message.
6. Open Supabase **Authentication → Users** and show the new user.
7. Open **Table Editor → profiles** and show the matching profile row.

**Say:** "The password never reaches our tables. Supabase Auth owns it."

### 3:00–4:30 — Login and landing page

**Rian**

1. Open `/login`.
2. Enter a wrong password first. Show "Wrong email or password."
3. Enter the correct demo credentials.
4. The landing page shows the signed-in email, role, and account details.
5. Point out the **Log out** button and the sprint checklist.
6. Open `/status` in a second tab and show both green checks.
7. Return to `/` and click **Log out**.
8. Try to open `/` again; the app sends you to `/login`.

**Say:** "The landing page is server-rendered and checks the session before it renders."

### 4:30–6:30 — Password reset

**Ivanhoe**

1. Open `/forgot-password`.
2. Enter the regular demo user's email and submit.
3. Show the generic success message.
4. Open the reset email from the inbox (or use the prepared inbox tab).
5. Open the reset link. If delivery is slow, switch to the backup screenshot.
6. Set a new password and submit.
7. Log in with the new password.
8. Open the same reset link again and show the expired/used rejection.

**Say:** "We use Supabase's built-in recovery flow. There is no custom token table, so the
provider handles hashing, expiry, and single-use enforcement."

### 6:30–8:30 — Supabase data and security

**Ivanhoe**

1. Open the `profiles` table and show the role column.
2. Open the migration and point out `enable row level security`.
3. Explain the three policies: own row, admin read, admin update.
4. Explain that the service-role key is server-only and not in the browser.
5. Show the three demo accounts and their roles.
6. Point out the development-role caveat and the production checklist.

**Say:** "A normal user cannot change their own role. The production checklist removes the
development shortcut."

### 8:30–10:30 — Test results

**Jaymark**

1. Show the test report summary: 50 automated checks passing.
2. Show the test plan and test cases.
3. Explain the test levels: unit, component, manual integration, visual.
4. Be honest about the remaining live Supabase checks and the plan to run them before the demo.
5. Show the health check endpoint and the build result.

### 10:30–11:30 — Design and close

**Ian Kenneth + Alexander**

1. Show the design system and one wireframe/mockup pair.
2. Point out the responsive auth shell and the landing page.
3. Close with the Sprint 1 outcome: register, login/logout, reset, landing, roles, RLS, tests,
   and documentation.
4. Invite questions.

## Backup plan

| If this fails | Do this |
| --- | --- |
| Supabase is unavailable | Use the backup screenshots and explain the `/status` failure mode. |
| Email is slow | Show the prepared reset email screenshot and walk through the reset page. |
| A form shows an error | Read the message out loud; it is part of the UX. Do not refresh repeatedly. |
| The venue Wi-Fi fails | Use the local build and the phone hotspot. |
| The board is not reachable | Show the issue status doc and the merged PR screenshot. |

## Backup screenshots

The local screenshot set is in `docs/screenshots/`:

- `login.png`
- `register.png`
- `forgot-password.png`
- `reset-password.png`
- `landing-preview.png`
- `status.png`

## Rehearsal log

| Date | Type | Result | Notes |
| --- | --- | --- | --- |
| 2026-10-26 | Technical dry run | Passed for public screens and design preview | Local Next.js build, screenshots captured. The live Supabase auth and email-delivery steps still need one run with the team's project. |
| 2026-11-07 | Full team rehearsal | Planned | Run the complete script on the presentation laptop with `DEMO_PASSWORD` and the real project. |

## Rehearsal checklist

- [x] Script order matches the issue: board, register, login, landing, reset, Supabase data,
      test results.
- [x] Every segment has a speaker.
- [x] Backup screenshots are prepared.
- [x] Public screens were walked through locally.
- [ ] Full rehearsal with the live Supabase project.
- [ ] Final timing on the presentation laptop.
- [ ] One person is responsible for the browser tabs and one for the backup window.

## Timing target

| Segment | Target |
| --- | --- |
| Welcome and board | 1:00 |
| Register | 2:00 |
| Login and landing | 1:30 |
| Password reset | 2:00 |
| Supabase data and security | 2:00 |
| Test results | 2:00 |
| Design and close | 1:00 |
| Questions | 1:00 |
| **Total** | **12:30** |
