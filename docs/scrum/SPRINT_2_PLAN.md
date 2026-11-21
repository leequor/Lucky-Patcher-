# Sprint 2 — Planning Notes

**Purpose:** Sprint 2 planning record for S2-SM-01 (issue #92).
**Scope:** Weeks 3–4 of the eight-week roadmap — Customer and Product Management.
**Date:** 2026-11-21
**Status:** Evidence-based planning record. Team validation of scope and due days is **pending**; no planning meeting was recorded in the repository.

## Sprint goal

Deliver permission-checked Customer and Product management, including soft delete/restore and dated price history with current-price display, with database support and verification evidence — without pulling Human Resources, Sales or Reports into this sprint.

## Evidence

- `HOPE_Sprint_Task_Plan_revised.xlsx`: 30 planned Sprint 2 tasks (8 DEV / 6 DBA / 6 TST / 5 UIX / 5 SM), due days 1–10.
- GitHub milestone `Sprint 2`: 30 issues #67–#96, 6 closed, 24 open at 2026-11-21.
- Existing Project v2 board `Hope ERP - Sprint 2` (#3): 30 items, statuses Backlog / In Progress / Review / Done.
- GitHub issues #67–#96 bodies (Task IDs, acceptance criteria, assignees).
- Merged PRs #98, #100–#103; open PRs #104, #105 (customer/product work), #99, #97.
- `README.md` §Customer/Product behaviour; `docs/sprint2-test-cases.md`.

## Scope and backlog

| Role | Planned | Issues | Closed | Open | Evidence |
|---|---:|---|---:|---:|---|
| Developer | 8 | #67–#74 | 4 (#67–#70) | 4 (#71–#74) | PRs #100–#103 merged; #104/#105 open |
| Database Administrator | 6 | #75–#80 | 0 | 6 | No linked PRs found |
| Tester | 6 | #81–#86 | 2 (#81, #82) | 4 | PR #98 merged; #99 open |
| UI/UX Designer | 5 | #87–#91 | 0 | 5 | No linked PRs found |
| Scrum Master | 5 | #92–#96 | 0 | 5 | This document plus companion reports |
| **Total** | **30** | **#67–#96** | **6** | **24** | GitHub issue states, 2026-11-21 |

No new issues were created for Sprint 2; the existing 30 issues are preserved.

## Carryover from Sprint 1

The team states Sprint 1 is complete. Evidence: milestone `Nov 9 Demo` has 21 closed items (20 non-PR issues), including PRs #51–#66 and bug fix #62. No recorded Sprint 1 retrospective document exists in the repository, so there are **no agreed retrospective actions to import**. See `SPRINT_2_RETRO_FOLLOWUP.md` for evidence-derived recommendations, explicitly marked as new and awaiting team validation.

Known technical carryover relevant to Sprint 2:

- Only one committed migration exists (`20261105160000_create_users_and_roles.sql`) while application code references `customers`, `products_active`, `user_rights`, `soft_delete_customer` and `restore_customer`. Tracked in `IMPEDIMENT_LOG.md` (I-01).
- Product per-action rights are not yet enforced server-side (issue #74 remains open).
- LOG-04 logout redirect was fixed in PR #62; include it in regression scope (issue #85).

## Priorities (Scrum Master proposal — pending team confirmation)

| Priority | Items | Reason |
|---|---|---|
| High | #73, #74, #75, #76, #83, #84, #85, #92–#96 | Price history, current price, DB views/query, permission and regression tests, Scrum evidence |
| Medium | #71, #72, #77–#80, #86–#91 | Remaining CRUD, constraints, demo data, design and bug-tracking work |

## Dependencies

| Predecessor | Successor | State of predecessor |
|---|---|---|
| #75 active views/indexes | #70, #74 current-price display | Open — implementation exists in app code but DB object is unverified |
| #76 price-as-of query | #73, #74 | Open |
| #81/#82 test cases | #83–#86 execution | Closed |
| #87–#90 design artefacts | #71–#74 implementation review | Open |
| #67–#70 customer/product CRUD | #83–#86 tests | Closed |
| Sprint 1 migration work | #75–#80 | Missing migration evidence (I-01) |

## Board

Use the existing board **Hope ERP - Sprint 2** (https://github.com/users/leequor/projects/3). It already contains all 30 Sprint 2 issues. Columns in use: Backlog, In Progress, Review, Done. No duplicate board was created for this work.

## Action items

| # | Action | Owner | Status |
|---|---|---|---|
| P1 | Confirm sprint goal, priorities and due days with the team | Scrum Master + team | Awaiting team validation |
| P2 | Review open PRs #104/#105 and close review loop | Reviewers | Open |
| P3 | Resolve migration gap I-01 before database verification | Database Administrator | Blocked on approval/access |
| P4 | Execute plan against existing issues only — do not create duplicates | Scrum Master | Done |

## References

- Issue #92: https://github.com/leequor/Lucky-Patcher-/issues/92
- Issues #67–#96: https://github.com/leequor/Lucky-Patcher-/milestone/2
- Companion docs: `SPRINT_2_RETRO_FOLLOWUP.md`, `SPRINT_2_MID_SPRINT.md`, `SPRINT_2_BURNDOWN.md`, `SPRINT_2_REVIEW_RETRO.md`, `IMPEDIMENT_LOG.md`, `DECISIONS_LOG.md`
