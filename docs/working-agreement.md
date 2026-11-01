# Working Agreement and Definition of Done

## Purpose

This is a short, practical agreement for Sprint 1. It keeps work visible, keeps `main`
healthy, and makes "done" mean the same thing to everyone.

## Team roles

| Name | Primary role | Backup area |
| --- | --- | --- |
| Alexander R. Campita | Scrum Master / project lead | Demo and board |
| Ivanhoe V. Rabaca | DevSecOps | Supabase and security |
| Ian Kenneth P. Rafanan | UI/UX | Design and mockups |
| Rian D. Sabrido | Backend / full-stack | Auth and app features |
| Jaymark A. De Guzman | QA | Test cases and test report |

## How we work

- **Plan first.** Every task has an issue with a description, acceptance criteria, and a due
  date before work starts.
- **One task, one branch, one PR.** Keep changes reviewable. Do not mix unrelated fixes.
- **Ask early.** If a blocker lasts more than one working session, post it in the team channel
  and move the issue back to Blocked.
- **Review quickly.** A teammate should respond to a review request the same day when possible.
- **No surprise merges.** Do not merge your own PR. One approval is required.
- **Respect the demo.** Do not break `main` before Nov 9. If a risky change is needed, put it
  behind a branch and test it before merging.

## Branch and commit conventions

- Branch: `feat/short-name`, `fix/short-name`, `docs/short-name`, or `test/short-name`.
- Commit: short imperative subject, for example `feat: add reset password form`.
- PR title: clear and specific, for example `feat: add register page`.
- PR body: what changed, how to test it, and `Closes #<issue>`.

## Pull request checklist

- [ ] The PR is linked to an issue.
- [ ] The change is limited to the issue.
- [ ] I tested the change myself.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass when relevant.
- [ ] Screenshots or a short recording are attached for UI changes.
- [ ] No keys, passwords, `.env` files, or service-role keys are included.
- [ ] A teammate reviewed and approved the PR.

## Definition of Done

A task is done only when **all** of these are true:

1. The pull request is merged.
2. The PR is linked to an issue with `Closes #<number>`.
3. A teammate approved the PR (the author did not approve their own work).
4. The change was tested, with evidence in the PR or the test report.
5. No keys, passwords, `.env` files, or service-role keys were committed.

Additional expectations:

- Acceptance criteria in the issue are checked off.
- Relevant docs are updated.
- The feature works on the happy path and the important error paths.
- The issue is closed and the project card is moved to Done.

## Security rules

- Supabase **anon** keys may be public. Supabase **service-role** keys are server-only and must
  never appear in client code, screenshots, PRs, or chat.
- Passwords are handled by Supabase Auth and are never stored in our own tables.
- Row Level Security must stay enabled on application tables.
- Demo accounts use a local-only password from `DEMO_PASSWORD`.
- Report a leaked secret immediately; rotate it before continuing.

## Meetings

- **Daily check-in:** 10 minutes, board first, blockers second.
- **Sprint review:** demo the working app, not slides alone.
- **Retro:** one thing to keep, one thing to change, one action.

## Conflict and decisions

- Decisions are recorded in the issue or a short doc.
- If the team cannot agree, the Scrum Master makes the call and records it.
- Technical safety wins over speed. If a shortcut weakens security, it needs an explicit note and
  a follow-up issue.

## Team acknowledgement

Each teammate initials and dates this table after reading the agreement.

| Name | Read | Date |
| --- | --- | --- |
| Alexander R. Campita | [ ] | |
| Ivanhoe V. Rabaca | [ ] | |
| Ian Kenneth P. Rafanan | [ ] | |
| Rian D. Sabrido | [ ] | |
| Jaymark A. De Guzman | [ ] | |

> The document is ready for sign-off. The table is intentionally blank until each person has
> actually read it; do not pre-fill acknowledgements.
