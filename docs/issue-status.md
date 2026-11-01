# Sprint 1 Issue Status

This table maps the original issues in `leequor/Lucky-Patcher-` to the tracking issues in
`leequor/lucky-lee` and to the evidence in this repository.

| New issue | Original | Title | Evidence | Status |
| --- | --- | --- | --- | --- |
| #1 | #22 | Repo setup: PR/issue templates, branch rules | `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/task.md`, README workflow, ruleset | Done |
| #2 | #23 | Team database setup, migration script, setup README | `supabase/migrations/`, `supabase/config.toml`, `.env.example`, `.gitignore`, `docs/supabase-setup.md` | Done |
| #3 | #24 | Design system | `docs/design-system.md`, `tailwind.config.ts`, `design/` | Done |
| #4 | #25 | Project scaffold | Next.js app, `npm run dev`, env config, `/api/health/supabase`, `docs/architecture.md` | Done |
| #5 | #26 | Sprint 1 test plan | `docs/test-plan.md` | Done |
| #6 | #30 | Register page | `app/(auth)/register/`, `registerAction`, validation and tests | Done |
| #7 | #31 | Users and roles tables | `profiles` table and `app_role` enum in the migration | Done |
| #8 | #32 | Password reset token table | Supabase built-in reset chosen; no custom table; documented in `docs/supabase-setup.md` | Closed as not needed |
| #9 | #33 | Demo accounts and secure database | `scripts/seed-demo-users.mjs`, RLS policies, `docs/security.md` | Done; run the seed with the real project |
| #10 | #34 | Wireframes | `design/wireframes/*.svg` | Done |
| #11 | #35 | Final mockups | `design/mockups/*.svg`, `design/README.md` | Done |
| #12 | #36 | Login and logout | `app/(auth)/login/`, `loginAction`, `logoutAction`, tests | Done |
| #13 | #37 | Set and reset password | `forgot-password`, `reset-password`, `/auth/callback`, `/auth/confirm`, tests | Done |
| #14 | #38 | Main landing page | `app/page.tsx`, `components/landing/landing-view.tsx`, tests | Done |
| #15 | #39 | Test cases for register and login | `docs/test-cases.md` | Done |
| #16 | #40 | Test cases for reset and landing | `docs/test-cases.md` | Done |
| #17 | #41 | Run the full test and report | `docs/test-report.md`, 50 passing automated checks | Done; live Supabase checklist remains |
| #18 | #42 | Working Agreement and Definition of Done | `docs/working-agreement.md` | Document done; team sign-off table is blank |
| #19 | #43 | Demo script and rehearsal | `docs/demo-script.md`, `docs/screenshots/` | Script and technical dry run done; full team rehearsal planned for Nov 7 |

## Notes

- The original repo is not modified. This working copy is private by default so unfinished work
  and demo setup cannot leak.
- Issue #8 is intentionally closed rather than implemented. Supabase Auth owns reset-token
  generation, hashing, expiry, and single-use enforcement.
- Issue #18's acknowledgement table is intentionally blank until each teammate reads the
  agreement. The document is ready; a checkbox cannot honestly represent a person's reading.
- Issue #19's technical dry run covered the app screens and backup screenshots. The live email
  and reset flow need one run with the team's Supabase project.
