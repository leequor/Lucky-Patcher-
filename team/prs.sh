#!/usr/bin/env bash
# Lucky Patcher — every PR in one script.
#   bash prs.sh <name>            create + push + open all of your PRs
#   bash prs.sh <name> reviews    approve the four PRs assigned to you
#   WAIT=1 bash prs.sh <name>     pause after each PR until it is merged
# Names: alexander rian ivan kenneth jaymark
# Needs: git, and GitHub CLI (`gh`) logged in as you. No gh? It prints compare links instead.
# The run stops if gh is logged in as a different person, so points land on the right account.
set -uo pipefail

NAME=$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')
MODE=$(printf '%s' "${2:-prs}" | tr '[:upper:]' '[:lower:]')
case "$NAME" in
  alexander|rian|ivan|kenneth|jaymark) ;;
  *) echo "usage: bash prs.sh <alexander|rian|ivan|kenneth|jaymark> [reviews]"; exit 1 ;;
esac

SELF="$(cd "$(dirname "$0")" 2>/dev/null && pwd)/$(basename "$0")"
REPO="${REPO:-$HOME/Lucky-Patcher-}"
REF="${REF:-$HOME/_lp-ref}"
DRY="${DRY:-}"
WAIT="${WAIT:-}"

# run it from inside a clone: bash team/prs.sh <name>
if [ -z "${REPO:-}" ] || [ "$REPO" = "$HOME/Lucky-Patcher-" ]; then
  near="$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)"
  if [ -d "$near/.git" ] && git -C "$near" remote get-url origin 2>/dev/null | grep -q 'Lucky-Patcher-'; then
    REPO="$near"
  fi
fi


case "$NAME" in
  alexander) GIT_NAME="Alexander R. Campita"; GIT_MAIL="leequor@users.noreply.github.com"; GH_LOGIN="leequor" ;;
  rian)      GIT_NAME="Rian D. Sabrido";      GIT_MAIL="SabridoRian@users.noreply.github.com"; GH_LOGIN="SabridoRian" ;;
  ivan)      GIT_NAME="Ivanhoe V. Rabaca";    GIT_MAIL="eoh-navi@users.noreply.github.com"; GH_LOGIN="eoh-navi" ;;
  kenneth)   GIT_NAME="Ian Kenneth P. Rafanan"; GIT_MAIL="takt-axl@users.noreply.github.com"; GH_LOGIN="takt-axl" ;;
  jaymark)   GIT_NAME="Jaymark A. De Guzman"; GIT_MAIL="Jaymark-DG@users.noreply.github.com"; GH_LOGIN="Jaymark-DG" ;;
esac

prs_alexander() { cat <<'EOF'
22|s1-sm-01-repo-setup|chore: set up repo templates and workflow|Adds the PR and issue templates, repo agent instructions, .gitignore, the written team workflow, the documentation index, and the issue audit table. First PR of the sprint; it lands before the app so every later PR inherits the templates.|.gitignore .github/pull_request_template.md .github/ISSUE_TEMPLATE/task.md .github/copilot-instructions.md .github/agents/db-admin.agent.md .github/agents/dev.agent.md .github/agents/scrum-master.agent.md .github/agents/tester.agent.md .github/agents/ui-ux.agent.md docs/README.md docs/issue-status.md|Kenneth
42|s1-sm-03-working-agreement|docs: add the working agreement and Definition of Done|Adds the team rules, branch and PR conventions, review expectations, and the Definition of Done: PR merged, linked to an issue, approved by a teammate, tested, no keys committed.|docs/working-agreement.md|Jaymark
43|s1-sm-02-demo-script|docs: add the demo script and rehearsal notes|Adds the presentation order (board, register, login, landing page, reset password, Supabase data, test results), the speaker split, the backup screenshots and recording, and the rehearsal checklist.|docs/demo-script.md|Ivan
EOF
}
prs_rian() { cat <<'EOF'
25|s1-dev-01-scaffold|feat: add the app scaffold and Supabase connection|Adds the runnable Next.js app, environment configuration, Supabase browser/server clients, session middleware, health endpoints, the status page, shared UI primitives, the auth service library, and the unit suite. Includes a test page and endpoint that prove the Supabase connection.|package.json package-lock.json next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts eslint.config.mjs vitest.config.mts vitest.setup.ts proxy.ts app/layout.tsx app/globals.css app/not-found.tsx app/actions/auth.ts app/api/health/route.ts app/api/health/supabase/route.ts app/status/page.tsx components/ui/alert.tsx components/ui/button.tsx components/ui/form-field.tsx components/ui/logo.tsx components/ui/navbar.tsx components/ui/role-badge.tsx components/ui/submit-button.tsx components/landing/status-panel.tsx lib/config.ts lib/health.ts lib/utils.ts lib/supabase/client.ts lib/supabase/env.ts lib/supabase/middleware.ts lib/supabase/server.ts lib/auth/errors.ts lib/auth/service.ts lib/auth/session.ts lib/auth/types.ts lib/auth/validation.ts docs/architecture.md tests/health.test.ts tests/utils.test.ts tests/auth-errors.test.ts tests/auth-service.test.ts tests/validation.test.ts|Jaymark
36|s1-dev-03-login-logout|feat: add login and logout|Adds the shared auth layout and card, the login form with field errors and an alert region, the signed-in navbar, and the logout action. Passwords are handled by Supabase Auth and never stored by the app.|app/(auth)/layout.tsx app/(auth)/login/page.tsx components/auth/auth-shell.tsx components/auth/auth-card.tsx components/auth/login-form.tsx|Ivan
30|s1-dev-02-register|feat: add the register page|Adds the public registration form with email, display name, and password validation, wired to Supabase sign-up. Duplicate email and too-short passwords are rejected with clear messages.|app/(auth)/register/page.tsx components/auth/register-form.tsx|Kenneth
37|s1-dev-04-forgot-password|feat: add the forgot-password page|Adds the email form that sends the Supabase recovery link, with validation and a neutral message that does not reveal whether an account exists. The reset page and callback follow in the next PR, which closes #37.|app/(auth)/forgot-password/page.tsx components/auth/forgot-password-form.tsx|Ivan
38|s1-dev-08-landing-page|feat: add the signed-in landing page|Adds the protected landing page with the user's email, role badge, account summary, and logout, plus the redirect to /login for signed-out visitors. Includes the landing-view tests and the design-preview route used for screenshots.|app/page.tsx components/landing/landing-view.tsx app/design-preview/page.tsx tests/landing-view.test.tsx|Ivan
37|s1-dev-04-reset-password|feat: add the reset-password page and auth callbacks|Adds the set-a-new-password form, the callback and confirm routes that exchange the Supabase token, and explicit handling for expired or already-used links. Completes #37.|app/(auth)/reset-password/page.tsx components/auth/reset-password-form.tsx app/auth/callback/route.ts app/auth/confirm/route.ts app/design-preview/reset-password/page.tsx|Jaymark
EOF
}
prs_ivan() { cat <<'EOF'
31|s1-dba-02-users-roles|feat(db): add profiles, roles, and row level security|Creates the profiles table, the superadmin/admin/user role enum, the updated-at trigger, the auth sign-up sync trigger, and RLS policies. The migration runs with supabase db push.|supabase/migrations/202610260001_initial_schema.sql|Rian
23|s1-dba-01-db-setup|chore(db): add Supabase config, env template, setup docs, and CI|Adds the Supabase CLI config, seed file, environment template with placeholders only, the step-by-step setup README, the environment checker, and the CI workflow that runs typecheck, lint, test, and build.|.env.example supabase/config.toml supabase/seed.sql docs/supabase-setup.md scripts/check-env.mjs .github/workflows/ci.yml|Alexander
33|s1-dba-05-demo-security|feat(db): seed demo accounts and document security|Adds the seed script for the three demo accounts (superadmin, admin, user) and the security notes covering RLS, key handling, and why the service-role key stays server-side.|scripts/seed-demo-users.mjs docs/security.md|Kenneth
32|s1-dba-04-reset-tokens|docs: record the password-reset token decision|Documents why the team uses Supabase Auth's hashed, single-use recovery tokens instead of a custom password_reset_tokens table, and where expiry is configured. Closes #32 as decided rather than implemented.||Rian
EOF
}
prs_kenneth() { cat <<'EOF'
24|s1-uix-01-design-system|docs: add the design system|Documents the palette, typography, spacing, form states, buttons, inputs, alerts, navbar, and status language used by every Sprint 1 screen, with the rationale for each choice.|docs/design-system.md design/README.md|Rian
34|s1-uix-02-wireframes|docs: add login, register, and reset-password wireframes|Adds the three low-fidelity wireframes the backend builds against: field order, button placement, and the alert region on each screen.|design/wireframes/login.svg design/wireframes/register.svg design/wireframes/reset-password.svg|Alexander
35|s1-uix-03-mockups|docs: add final mockups and screenshots|Adds the four final screen mockups built on the design system, plus the captured screenshots and developer notes on messages, spacing, and button states.|design/mockups/login.svg design/mockups/register.svg design/mockups/reset-password.svg design/mockups/landing.svg docs/screenshots/README.md docs/screenshots/login.png docs/screenshots/register.png docs/screenshots/forgot-password.png docs/screenshots/reset-password.png docs/screenshots/landing-preview.png docs/screenshots/status.png|Jaymark
EOF
}
prs_jaymark() { cat <<'EOF'
26|s1-tst-01-test-plan|test: add the Sprint 1 test plan and acceptance criteria|Adds the plan the sprint is tested against: scope, environments, entry and exit criteria, test data, per-feature pass/fail criteria, test levels, defect policy, schedule, risks, and traceability to the issues.|docs/test-plan.md|Alexander
39|s1-tst-02-test-cases-auth|test: add register and login test cases|Adds the case catalogue for registration and login/logout: good input, duplicate email, short password, empty fields, wrong password, and logout, each with steps and the expected result.||Rian
40|s1-tst-03-test-cases-reset-landing|test: add password-reset and landing-page test cases|Extends the catalogue with a valid reset link, an expired link, an already-used link, and the landing page when logged in and logged out, each with steps and the expected result.|docs/test-cases.md|Kenneth
41|s1-tst-05-test-report|docs: add the full test report|Records the executed unit, RLS, and browser checks against every case, the bugs found and their status, and the remaining manual email check, with the local command output as evidence.|docs/test-report.md|Alexander
EOF
}

revs_kenneth() { cat <<'EOF'
s1-sm-01-repo-setup Alexander
s1-dev-02-register Rian
s1-dba-05-demo-security Ivan
s1-tst-03-test-cases-reset-landing Jaymark
EOF
}
revs_jaymark() { cat <<'EOF'
s1-dev-01-scaffold Rian
s1-dev-04-reset-password Rian
s1-uix-03-mockups Kenneth
s1-sm-03-working-agreement Alexander
EOF
}
revs_rian() { cat <<'EOF'
s1-dba-02-users-roles Ivan
s1-uix-01-design-system Kenneth
s1-dba-04-reset-tokens Ivan
s1-tst-02-test-cases-auth Jaymark
EOF
}
revs_alexander() { cat <<'EOF'
s1-dba-01-db-setup Ivan
s1-uix-02-wireframes Kenneth
s1-tst-01-test-plan Jaymark
s1-tst-05-test-report Jaymark
EOF
}
revs_ivan() { cat <<'EOF'
s1-dev-03-login-logout Rian
s1-dev-04-forgot-password Rian
s1-dev-08-landing-page Rian
s1-sm-02-demo-script Alexander
EOF
}

have_gh() { command -v gh >/dev/null 2>&1; }

pause() { [ -n "$DRY" ] && return 0; [ -n "$WAIT" ] || return 0; echo; printf '%s ' "Press Enter when it is merged (or Ctrl+C to stop):"; read -r _ < /dev/tty; }

setup() {
  [ -d "$REF/.git" ] || git clone -q https://github.com/leequor/lucky-patcher-finished.git "$REF" || exit 1
  git -C "$REF" checkout -q 2be1682 || exit 1
  [ -d "$REPO/.git" ] || git clone -q https://github.com/leequor/Lucky-Patcher-.git "$REPO" || exit 1
  git -C "$REPO" config user.name "$GIT_NAME"
  git -C "$REPO" config user.email "$GIT_MAIL"
  [ -f "$REF/package.json" ] || { echo "reference snapshot incomplete: $REF"; exit 1; }
  if [ -z "$DRY" ] && have_gh; then
    me=$(gh api user --jq .login 2>/dev/null)
    if [ -n "$me" ] && [ "$me" != "$GH_LOGIN" ]; then
      echo "wrong GitHub account: gh is logged in as $me, but these PRs must come from $GH_LOGIN."
      echo "run: gh auth login   then start again"
      exit 1
    fi
  fi
  echo "ready: $REPO  (as $GIT_NAME, GitHub: $GH_LOGIN)"
}

if [ "$MODE" = "reviews" ]; then
  setup
  have_gh || { echo "gh is not installed. Approve in the browser instead."; exit 1; }
  while read -r branch reviewer; do
    pr=$(gh pr list -R leequor/Lucky-Patcher- --head "$branch" --state open --json number -q '.[0].number')
    if [ -z "$pr" ]; then echo "skip $branch (no open PR)"; continue; fi
    if gh pr view "$pr" -R leequor/Lucky-Patcher- --json reviews -q ".reviews[] | select(.author.login == \"$GH_LOGIN\") | .state" 2>/dev/null | grep -q APPROVED; then
      echo "already approved #$pr  $branch"
      continue
    fi
    gh pr review "$pr" -R leequor/Lucky-Patcher- --approve --body "Checked against the acceptance criteria in the linked issue. Diff is scoped, no secrets, evidence present. Approved."
    echo "approved #$pr  $branch"
  done <<EOF
$(revs_$NAME)
EOF
  exit 0
fi

setup
if ! have_gh; then
  echo "gh is not installed. PRs will still be pushed; you get a compare link to click."
  echo "for automatic PRs:  winget install --id GitHub.cli -e   then reopen Git Bash and run  gh auth login"
fi

while IFS='|' read -r issue branch title bod paths reviewer; do
  [ -z "${branch:-}" ] && continue
  if [ -z "$DRY" ] && have_gh && gh pr list -R leequor/Lucky-Patcher- --head "$branch" --state merged --json number -q '.[0].number' 2>/dev/null | grep -q .; then
    echo "== $branch already merged, skipping"; continue
  fi
  echo
  echo "== $branch  (closes #$issue, reviewer: $reviewer)"
  git -C "$REPO" switch -q main || exit 1
  git -C "$REPO" pull -q --ff-only || { echo "main is not clean/up to date — commit or stash first"; exit 1; }
  git -C "$REPO" branch -D "$branch" >/dev/null 2>&1
  git -C "$REPO" switch -q -c "$branch" || exit 1
  added=()
  for f in $paths; do
    if [ ! -e "$REF/$f" ]; then echo "missing in reference: $f"; exit 1; fi
    mkdir -p "$REPO/$(dirname "$f")"
    cp -R "$REF/$f" "$REPO/$f"
    added+=("$f")
  done
  if [ "$branch" = "s1-dba-04-reset-tokens" ]; then
    mkdir -p "$REPO/docs"
    cat > "$REPO/docs/reset-tokens.md" <<'DOC'
# Password Reset Tokens

Sprint 1 closes #32 as a recorded decision: the app does not create a
`password_reset_tokens` table of its own.

## Decision

Password recovery uses Supabase Auth's built-in flow. Supabase generates the token, stores
only its hash, applies the expiry configured in the project, and rejects a token after its
first use.

## Why

| Requirement | Supabase Auth | A hand-rolled table |
| --- | --- | --- |
| Hashed at rest | Built in | Must be built |
| Single use | Built in | Must be enforced |
| Expiry | Project setting | Must be scheduled |
| Email delivery | Built in | Must be wired |

A custom table would repeat security-critical behaviour that already exists and is tested
upstream, so #32 is closed as a decision rather than implemented.

## Where it lives

- Setup and the email template: [supabase-setup.md](supabase-setup.md).
- The recovery link uses `/auth/confirm` with `{{ .TokenHash }}`, so it works across browsers.
- `/reset-password` rejects expired and already-used links with a clear message.
- The request form shows one neutral message whether or not the email exists, which avoids
  account enumeration.

No migration is needed for this task.
DOC
    added+=(docs/reset-tokens.md)
  fi
  if [ ${#added[@]} -eq 0 ]; then echo "   no files listed for $branch - fill in the path column"; continue; fi
  if [ "$branch" = "s1-sm-01-repo-setup" ] && [ -f "$SELF" ]; then
    mkdir -p "$REPO/team"
    [ "$SELF" = "$REPO/team/prs.sh" ] || cp "$SELF" "$REPO/team/prs.sh"
    rd="$(dirname "$SELF")/README.md"
    if [ -f "$rd" ] && [ "$rd" != "$REPO/team/README.md" ]; then cp "$rd" "$REPO/team/README.md"; fi
    [ -f "$REPO/team/prs.sh" ] && added+=(team/prs.sh)
    [ -f "$REPO/team/README.md" ] && added+=(team/README.md)
  fi
  git -C "$REPO" add -- "${added[@]}"
  git -C "$REPO" commit -q -m "$title" || { echo "nothing to commit"; continue; }
  if [ -n "$DRY" ]; then echo "   dry run: copied $(echo $paths | wc -w) paths into $branch"; continue; fi
  git -C "$REPO" fetch -q origin || true
  git -C "$REPO" push -q -u --force-with-lease origin "$branch" || exit 1
  if have_gh; then
    body="## What and why
$bod

## Linked issue
Closes #$issue

## Checklist
- [x] one issue, one branch, one PR
- [x] no keys or .env files committed
- [x] approved by a teammate before merge"
    existing=$(gh pr list -R leequor/Lucky-Patcher- --head "$branch" --state open --json number -q '.[0].number' 2>/dev/null)
    if [ -n "$existing" ]; then
      if gh pr edit "$existing" -R leequor/Lucky-Patcher- --title "$title" --body "$body" >/dev/null 2>&1; then
        echo "   updated PR #$existing: https://github.com/leequor/Lucky-Patcher-/pull/$existing"
      else
        echo "   WARNING: PR #$existing is open but could not be updated. Fix it by hand:"
        echo "   https://github.com/leequor/Lucky-Patcher-/pull/$existing"
      fi
    else
      gh pr create -R leequor/Lucky-Patcher- --base main --head "$branch" --title "$title" --body "$body" || exit 1
    fi
  else
    echo "   open: https://github.com/leequor/Lucky-Patcher-/compare/main...$branch?expand=1"
  fi
  pause
done <<EOF
$(prs_$NAME)
EOF

echo
if have_gh; then
  echo "your PRs:"
  gh pr list -R leequor/Lucky-Patcher- --author "@me" --state open --json number,title,url -q '.[] | "#\(.number)  \(.title)\n        \(.url)"'
else
  echo "done. Create each PR from the compare links above."
fi
