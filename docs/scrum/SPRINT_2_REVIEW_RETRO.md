# Sprint 2 — Review and Retrospective Report

**Purpose:** S2-SM-05 (issue #96) — Sprint 2 review evidence, demo checklist and retrospective observations.
**Scope:** Sprint 2 issues #67–#96.
**Date:** 2026-11-21
**Status:** **Prepared in advance of sprint close.** Sprint 2 has 6/30 issues closed; no demo or review meeting is recorded. This report must not be read as evidence that a demonstration happened.

## Evidence

- Issue states for #67–#96 at 2026-11-21 (6 closed, 24 open).
- Merged PRs #98, #100–#103; open PRs #104, #105, #97, #99.
- `npm test` 2026-11-21: 28/28 passing across 5 suites.
- `docs/sprint2-test-cases.md`, `docs/sprint2-test-plan.md` references in issue bodies.
- `docs/test-results.md` (Sprint 1 baseline, includes LOG-04).

## Sprint goal check

| Goal element | Status | Evidence |
|---|---|---|
| Permission-checked customer list, create/edit, soft delete/restore | Delivered | #67–#69 closed; PRs #100–#102 merged 2026-11-17 |
| Product list with search/filter | Delivered | #70 closed; PR #103 merged 2026-11-17 |
| Product create/edit | In review | #71 open; PR #104 open 2026-11-19 |
| Product soft delete/restore | In review | #72 open; PR #105 open 2026-11-20 |
| Price history add/edit/delete with effective date | Not evidenced | #73 open, no PR |
| Current-price display and per-action rights | Not evidenced | #74 open, no PR |
| DB views, constraints, indexes, demo data | Not evidenced | #75–#80 open |
| Tests (soft delete/restore, permissions, regression, defects) | Partially evidenced | #81, #82 closed; #83–#86 open |
| Design handoff and usability review | Not evidenced | #87–#91 open |
| Scrum evidence | Prepared | This report plus companion documents |

**Conclusion:** The Sprint 2 goal is **not yet fully met** as of 2026-11-21.

## Demo checklist (to be executed by the team — not yet performed)

| # | Scenario | Linked issue | Required evidence |
|---|---|---|---|
| D1 | Customer list: search, filter, pagination, active/deleted views | #67 | Screen or preview recording + role used |
| D2 | Customer create and edit with validation | #68 | Form submission result |
| D3 | Customer soft delete blocks when active children exist; restore works | #69 | API response + database state |
| D4 | Product list with current price | #70, #74 | Screen showing price column |
| D5 | Product create/edit | #71 | Form submission result |
| D6 | Product soft delete/restore | #72 | API response + database state |
| D7 | Price history add/edit/delete with effective date | #73 | Dialog screenshots + date ordering |
| D8 | Current price as of a date | #74, #76 | Query or UI result |
| D9 | Permission matrix: hidden control and server denial | #84 | Signed-in role + API 403 evidence |
| D10 | Sprint 1 regression, including LOG-04 logout redirect | #85, #59, PR #62 | Retest result |

Do not mark any checklist item complete without a recording, screenshot, test output or linked PR.

## Unresolved defects

- No new Sprint 2 defect issue was found in #67–#96.
- Sprint 1 defect LOG-04 (#59) was fixed in PR #62; regression retest is not yet recorded (issue #85).
- Technical gaps needing defect or task evidence: migration objects missing from the repository; product per-action rights not enforced server-side (`app/lib/product-access.js`). These are recorded as impediments I-01 and in issue #74, not as invented test failures.

## Retrospective observations (evidence-based)

| Observation | Evidence | Improvement action | Proposed owner | Measurable target |
|---|---|---|---|---|
| Review turnaround is the current bottleneck | PRs #104 (11-19), #105 (11-20) still open; no merges after 11-17 | Review open PRs within one working day | Reviewers | Zero PRs older than 2 working days at next check |
| Database workstream has no committed artefacts | Only one migration file; #75–#80 all open | Publish migration plan and dry-run summary before verification | Database Administrator | Dry-run evidence linked to #75 by next review |
| Design workstream has no linked artefacts | #87–#91 all open with no PRs or files | Link mockups/wireframes to their issues | UI/UX Designer | At least one artefact link per issue |
| Sprint 1 retrospective was never recorded | Repository search found no retrospective document | Obtain team confirmation of the proposed actions | Scrum Master | Confirmed or rejected status on each R-01…R-06 |
| Progress counters in the task-plan spreadsheet are stale | Summary sheet reports 0 merged while GitHub has 54 PRs | Use GitHub issue/PR state as the only progress source | Scrum Master | No spreadsheet counters used in reports |
| Product per-action rights incomplete | `app/lib/product-access.js` exposes only view; #74 open | Complete #74 and cover it in #84 | Developer + Tester | API denial evidence for each right |

These are observations and proposals, not agreed retrospective decisions. Team validation is pending.

## Action items

| # | Action | Owner | Status |
|---|---|---|---|
| V1 | Execute the demo checklist and attach evidence | Team | Pending |
| V2 | Confirm or amend the six improvement actions above | Team | Awaiting validation |
| V3 | Record unresolved defects as issues with reproduction steps | Tester | Pending |
| V4 | Link this report from issue #96 | Scrum Master | Done via issue comment |

## References

- Issue #96: https://github.com/leequor/Lucky-Patcher-/issues/96
- `docs/scrum/SPRINT_2_BURNDOWN.md`, `docs/scrum/SPRINT_2_MID_SPRINT.md`, `docs/scrum/IMPEDIMENT_LOG.md`, `docs/scrum/SPRINT_2_RETRO_FOLLOWUP.md`
