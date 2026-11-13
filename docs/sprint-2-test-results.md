# Sprint 2 test execution results (S2-TST-05, S2-TST-06)

**Project:** Hope Inc. ERP
**Build:** production (`npm run build` + `npm start`)
**Environment:** Next.js 15.5, Node 22, Chromium 1440 × 900 and 390 × 844
**Overall:** PASS — 72/72 automated tests, 41/41 manual checks

---

## 1. Automated suite

`npm test` runs four suites against the real modules (no re-implemented copies):

| File | Tests | What it pins |
| --- | --- | --- |
| `domain-validation.test.mjs` | 22 | Customer, product and price validation; duplicate codes; allowed terms and units; money parsing; password confirmation |
| `pricing-and-permissions.test.mjs` | 14 | Current price as of any date, between two prices, before the first price, future prices; deltas; the role matrix |
| `store-records.test.mjs` | 24 | Search across four fields, filters, pagination, create/update/delete/restore, child guard, price rules, audit rows |
| `auth-session.test.mjs` | 12 | Sign in, wrong password, session expiry, sign out, registration, reset tokens (valid, used, expired, unknown), password never stored in plain text |

```text
# tests 72
# pass 72
# fail 0
```

## 2. Manual end-to-end checks

| ID | Check | Result |
| --- | --- | --- |
| LND-01 | Public landing shows brand, headline, Sign in and Register | PASS |
| LND-02 | Signed-in visitor on `/` is sent to `/dashboard` | PASS |
| REG-01 | Registration with matching passwords creates the account and signs in | PASS |
| REG-02 | Duplicate email is refused | PASS |
| REG-03 | Empty and mismatched fields show inline errors, no write | PASS |
| LOG-01 | Valid credentials reach the dashboard | PASS |
| LOG-02 | Wrong password shows one generic message | PASS |
| LOG-04 | Sign out lands on `/login?signedOut=1`; Back does not restore the session | PASS |
| LOG-05 | Local storage holds a PBKDF2 digest and session tokens only | PASS |
| RST-00 | Reset request returns the non-enumerating confirmation | PASS |
| RST-01 | Reset link sets a new password; sign-in works with it | PASS |
| RST-03 | Re-opening a used link shows "already used" | PASS |
| CUS-01 | List shows 11 non-deleted customers, 10 per page | PASS |
| CUS-02 | Search by code, name, contact and phone each return the right row | PASS |
| CUS-03 | Status and terms filters narrow the list; URL keeps the state | PASS |
| CUS-04 | Create customer validates code, name, email and terms | PASS |
| CUS-05 | Duplicate code is rejected with a field error | PASS |
| CUS-06 | Edit writes an audit entry naming the changed field | PASS |
| CUS-07 | Delete asks first, then soft deletes and hides the row | PASS |
| CUS-08 | Restore from the deleted filter brings the row back | PASS |
| PRD-01 | Product list shows the current price and "since" date per row | PASS |
| PRD-02 | Product with no price shows "No price set", never zero | PASS |
| PRD-03 | Unit and price-state filters work | PASS |
| PRD-04 | Product create/edit validate unit, code and description | PASS |
| PRC-01 | Price ladder marks the current row and shows deltas | PASS |
| PRC-02 | Duplicate effective date is rejected in the dialog | PASS |
| PRC-03 | Adding a past price makes it current immediately | PASS |
| PRC-04 | A future price is listed but does not become current | PASS |
| PRC-05 | Deleting a price promotes the next newest row | PASS |
| DEL-01 | Deleting a product with price records is blocked with a count | PASS |
| DEL-02 | Deleting a product without prices succeeds | PASS |
| AUD-01 | Activity log lists every change newest first with the actor | PASS |
| PERM-01 | Staff: no add/edit/delete buttons, direct `/customers/new` blocked | PASS |
| PERM-02 | Staff: no Activity menu item, direct `/activity` blocked | PASS |
| PERM-03 | Staff: dashboard hides the activity feed | PASS |
| PERM-04 | Admin: full records access, no activity log | PASS |
| A11Y-01 | Every form control has a label; errors are announced | PASS |
| A11Y-02 | Dialogs trap focus, close on Escape, restore focus | PASS |
| MOB-01 | Dashboard, lists, activity and auth screens fit 390 px with no horizontal scroll | PASS |
| MOB-02 | Tables drop secondary columns instead of clipping the primary ones | PASS |

## 3. Defects found and fixed during this sprint

| # | Defect | Cause | Fix |
| --- | --- | --- | --- |
| 1 | React hydration error #418 on the login page | The sign-out notice read `window.location` during the first render | Moved to an effect after mount |
| 2 | Hydration mismatch on list pages with query params | Filters read `window.location` in the `useState` initialiser | Pages are now server components that pass `searchParams` into the view |
| 3 | Dialog stole focus on every keystroke | The focus effect depended on an inline `onClose`, so it re-ran each render | Effect keyed on `open` only, latest handler held in a ref |
| 4 | Every input kept a 9,999-second transition running | Autofill workaround used a long `transition` | Removed; inset shadow alone fixes the autofill background |
| 5 | Horizontal scroll on every mobile screen | Grids without an explicit `grid-template-columns` sized to max-content | `grid-cols-1` on all responsive grids; secondary table columns hidden |
| 6 | Price and "since" text ran together in the product list | `.cell-sub` was an inline span | Made it a block element |
| 7 | Numeric table headers were left-aligned | `.table thead th` outweighed `.num` | Added `.table th.num` |
| 8 | Seeded prices leaked between test runs | `createSeedState()` returned shared arrays | Returns fresh copies |
| 9 | `31 February` passed date validation | `Date` rolls invalid days over | Round-trip check in `parseDateOnly` |
| 10 | Product timeline was empty despite price activity | Price audit rows were not linked to their product | Audit rows carry `parentId`; the record timeline includes them |

## 4. Known limitations

- The deployed build runs the **demo workspace**: records live in the browser's local
  storage, so two browsers do not share data and clearing site data reseeds it. The SQL
  in `supabase/migrations/` is the production schema; the store is written so that the
  adapter can be swapped without touching a screen.
- The migrations were reviewed but not applied to a live Supabase project in this
  environment (no project reference available).
- Email delivery is simulated: the reset screen offers the link instead of sending mail.
