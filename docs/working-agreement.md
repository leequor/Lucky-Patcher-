# Working Agreement & Definition of Done

## 1. Working Agreement

These are the short team rules we all agree to follow.

### Communication
- We communicate primarily in the team chat; important decisions are written down in issues/PRs.
- We reply to teammates within 24 hours on working days.
- If someone is blocked, they say so immediately — no silent blockers.

### Meetings
- Stand-up: daily, 10 minutes maximum, 3 questions (done / next / blockers).
- Sprint planning and review happen at the start and end of every sprint.
- If you cannot attend, post your update in the chat beforehand.

### Code & Git
- No direct commits to `main`. Everything goes through a Pull Request.
- Every branch is named `type/short-description` (e.g. `docs/working-agreement-dod`).
- Every PR is linked to an issue.
- Every PR is reviewed and approved by at least one teammate before merging.
- Keep commits small and messages clear.
- Never commit secrets, API keys, passwords or `.env` files.

### Work tracking
- Every task has an issue in GitHub.
- Issues are moved through the board: To Do → In Progress → In Review → Done.
- Only one main task "In Progress" per person at a time.

### Respect
- Assume good intent.
- Critique code, not people.
- Ask questions freely — no question is "too basic".

---

## 2. Definition of Done (DoD)

A task is **only** considered **Done** when **all** of the following are true:

- [ ] **Pull Request merged** — the change is merged into `main`.
- [ ] **Linked to an issue** — the PR references the issue (e.g. `Closes #42`).
- [ ] **Approved by a teammate** — at least one other team member reviewed and approved the PR.
- [ ] **Tested** — the change has been tested (manual or automated) and the result is documented.
- [ ] **No keys committed** — no secrets, API keys, tokens, passwords or `.env` files are included.

If any box is unchecked, the task is **not** done — it stays open.

---

## 3. Team confirmation

All team members have read and agreed to this document.

| Name | Read & agreed | Date |
|------|---------------|------|
|      | ☐             |      |
|      | ☐             |      |
|      | ☐             |      |
|      | ☐             |      |
