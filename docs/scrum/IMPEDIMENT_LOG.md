# Impediment and Risk Log

**Purpose:** Shared register for Sprint 2 blockers, risks and escalations (supports S2-SM-03, issue #94).
**Scope:** Sprint 2.
**Date:** 2026-11-21
**Status:** Live register. Items marked `Requires user approval` must not be actioned without that approval.

| ID | Raised | Type | Description | Impact | Owner | Severity | Next action | Escalation | Status | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| I-01 | 2026-11-21 | Blocker | Only one committed migration (`20261105160000_create_users_and_roles.sql`) exists, but application code queries `customers`, `products_active`, `user_rights` and calls `soft_delete_customer` / `restore_customer` | End-to-end verification of Sprint 2 impossible from a clean database; #75–#80 cannot be evidenced | Database Administrator | Critical | Prepare migration plan; run `npm run db:migrate:dry-run`; do not apply to shared DB without approval | User approval required for any shared-database change | Open | `supabase/migrations/`, `app/api/**`, `app/lib/user-access.js` |
| I-02 | 2026-11-21 | Impediment | PR #104 (#71) and PR #105 (#72) remain open since 2026-11-19 / 2026-11-20 | Product create/edit and soft delete/restore not merged; sprint goal at risk | Reviewers | High | Review and merge or return with comments within one working day | Team stand-up | Open | GitHub PRs #104, #105 |
| I-03 | 2026-11-21 | Impediment | PR #97 (`-- ignore --`, branch `feat/sprint-2-records`) and PR #99 (test-case revision) are open with no confirmed issue linkage | Unclear whether work is abandoned or untracked | Scrum Master | Medium | Confirm purpose; link to an issue or close with a recorded reason | Team stand-up | Open | GitHub PRs #97, #99 |
| I-04 | 2026-11-21 | Risk | No recorded Sprint 1 retrospective exists | Issue #93 cannot cite agreed actions; carryover is unverified | Scrum Master | Medium | Obtain team confirmation of R-01…R-06 in `SPRINT_2_RETRO_FOLLOWUP.md` | Team | Awaiting team validation | Repository search; issues #92–#96 |
| I-05 | 2026-11-21 | Risk | Working-agreement sign-off table empty; issue #42 closed with two acceptance boxes unchecked | DoD/agreement cannot be presented as team-approved | Scrum Master | Medium | Record real team acceptance | Team | Awaiting team validation | `docs/working-agreement.md`, issue #42 |
| I-06 | 2026-11-21 | Risk | No linked design artefacts for #87–#91 | Design acceptance evidence absent | UI/UX Designer | Medium | Link wireframes/mockups to their issues or record that work was not done | Team stand-up | Open | GitHub issues #87–#91 |
| I-07 | 2026-11-21 | Risk | No CI workflow; `npm test` run locally only (28/28 passing) | Test evidence is not continuously enforced | Database Administrator / Developer | Medium | Add test/build workflow or record an agreed manual gate | Team | Open | `git ls-files .github`, `npm test` 2026-11-21 |
| I-08 | 2026-11-21 | Risk | Supabase and Vercel dashboards were not accessed; cloud state unverified | Migration status, RLS and deployment configuration unconfirmed | DevSecOps + user | Medium | Confirm project links and read-only status with user | User approval required | Blocked | Repository only; no cloud metadata committed |

## Escalation rules

1. A Critical item is escalated immediately to the team and the user where approval is needed.
2. An item older than two working days without a next-action owner is escalated at the daily stand-up.
3. Resolution requires a date and an evidence link; an item is not closed by assumption.
4. Never apply destructive SQL, select paid plans, enter payment details or make production deployments without explicit approval.

## References

- Issue #94: https://github.com/leequor/Lucky-Patcher-/issues/94
- `docs/scrum/SPRINT_2_MID_SPRINT.md`, `docs/scrum/DECISIONS_LOG.md`
