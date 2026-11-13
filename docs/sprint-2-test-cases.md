# Sprint 2 test cases (S2-TST-01..04)

Scope: customer module, product module, price history, soft delete/restore, per-right
permissions. Each case is marked with the suite that covers it where one exists.

Legend: **Auto** = `npm test`, **Manual** = executed in the browser.

---

## 1. Customer list (S2-TST-01)

| ID | Scenario | Steps | Expected | Covered by |
| --- | --- | --- | --- | --- |
| CUS-L01 | Default list | Open `/customers` | Active and inactive customers, no deleted rows, sorted by name, 10 per page | Manual, `store-records` |
| CUS-L02 | Search by code | Type `CUS-1001` | One row: Northwind Traders | Auto |
| CUS-L03 | Search by name | Type `north` | One row | Auto |
| CUS-L04 | Search by contact | Type `Elena` | Northwind Traders | Auto |
| CUS-L05 | Search by phone | Type `917 204` | Northwind Traders | Auto |
| CUS-L06 | Filter by status | Choose Inactive | Only Mabini Print Shop | Auto |
| CUS-L07 | Filter by terms | Choose COD | Rivera Hardware, Bagong Silang Cooperative | Auto |
| CUS-L08 | Empty result | Search `zzzz` | "No matching customers" with a Clear filters action | Manual |
| CUS-L09 | Pagination | Page 2 | Next five customers, counter reads 6–10 of 11 | Auto, Manual |
| CUS-L10 | No view right | Sign in as staff → `/customers` | List is visible (staff has view) | Manual |
| CUS-L11 | Menu without right | Sign in as a role without customer view | Customers entry hidden, direct URL shows the access panel | Manual |

## 2. Customer create and edit (S2-TST-01)

| ID | Scenario | Steps | Expected | Covered by |
| --- | --- | --- | --- | --- |
| CUS-C01 | Create valid | New customer, fill all fields, save | Row created, toast, back to list with the previous filters | Auto, Manual |
| CUS-C02 | Required fields | Submit empty form | Inline errors on code and name, no write | Auto |
| CUS-C03 | Code format | Enter `CUS 1001!` | "Use letters, numbers and dashes only" | Auto |
| CUS-C04 | Duplicate code | Enter an existing code | "Customer code … is already in use" | Auto |
| CUS-C05 | Invalid email | Enter `not-an-email` | Inline email error | Auto |
| CUS-C06 | Terms restricted | Choose Net 90 (not offered) | Not selectable; store rejects any other value | Auto |
| CUS-C07 | Edit saves | Change terms Net 45 → Net 60 | Saved, activity entry names the field | Auto |
| CUS-C08 | Rights on submit | Staff posts a create | Rejected with 403 | Auto |
| CUS-C09 | Search state kept | Create from a filtered list | Returns to the same `?q=&status=` view | Manual |

## 3. Product list, create and edit (S2-TST-02)

| ID | Scenario | Steps | Expected | Covered by |
| --- | --- | --- | --- | --- |
| PRD-L01 | Current price column | Open `/products` | Every priced product shows amount and "since" date | Auto, Manual |
| PRD-L02 | No price state | Look at PRD-2009 | "No price set" in muted italics, never zero | Auto, Manual |
| PRD-L03 | Filter by unit | Choose Metre | Only metre products | Manual |
| PRD-L04 | Filter by price state | Choose "No price set" | Only products without a current price | Manual |
| PRD-C01 | Create valid | New product, save | Created with no price, "No price set" until a price is added | Auto, Manual |
| PRD-C02 | Unit restricted | Store rejects `PALLET` | Validation error on unit | Auto |
| PRD-C03 | Duplicate code | Reuse `PRD-2005` | Rejected | Auto |
| PRD-C04 | Rights | Staff posts a create | 403 | Manual |

## 4. Price history (S2-TST-02)

| ID | Scenario | Steps | Expected | Covered by |
| --- | --- | --- | --- | --- |
| PRC-01 | Current price | Open PRD-2005 | ₱335.00 since 1 Sep 2026, marked current | Auto, Manual |
| PRC-02 | Between two prices | Ask for 31 Dec 2025 | Returns the ₱310.00 row | Auto |
| PRC-03 | Before first price | Ask for 1 Jan 2024 | Empty result, shown as "No price set" | Auto |
| PRC-04 | Add past price | Add ₱350 effective 1 Nov 2026 | Becomes the current price immediately | Auto |
| PRC-05 | Add future price | Add ₱390 effective 1 Dec 2026 | Current price unchanged, row marked scheduled | Auto |
| PRC-06 | Duplicate date | Add a second price on 1 Sep 2026 | "A price is already effective on …" | Auto, Manual |
| PRC-07 | Edit price | Change amount and date | Row and delta update, audit entry written | Auto, Manual |
| PRC-08 | Delete price | Delete the newest row | Next newest becomes current | Auto, Manual |
| PRC-09 | Delta | Look at a row with a predecessor | Shows amount and percent against the previous row | Auto |
| PRC-10 | Rights | Staff adds a price | 403 | Auto |

## 5. Soft delete and restore (S2-TST-03)

| ID | Scenario | Steps | Expected | Covered by |
| --- | --- | --- | --- | --- |
| DEL-01 | Delete customer | Delete from the record page | Confirmation first, then `is_deleted` set, row leaves the active list | Auto, Manual |
| DEL-02 | Restore customer | Filter status = Deleted, Restore | Back in the active list | Auto, Manual |
| DEL-03 | Delete twice | Repeat the delete | "This customer is already deleted" | Auto |
| DEL-04 | Product with prices | Delete PRD-2005 | Blocked: "This product has 3 price records…" | Auto, Manual |
| DEL-05 | Product without prices | Delete PRD-2006 after removing its price | Succeeds | Auto |
| DEL-06 | Restore product | Restore a deleted product | Returns with its price history | Manual |
| DEL-07 | Audit | Check the activity log after delete and restore | Two entries, both naming the acting user | Auto |

## 6. Permissions per action (S2-TST-04)

| ID | Role | Customer | Product | Price | Activity |
| --- | --- | --- | --- | --- | --- |
| PERM-01 | Superadmin | view, add, edit, delete | view, add, edit, delete | add, edit, delete | read |
| PERM-02 | Admin | view, add, edit, delete | view, add, edit, delete | add, edit, delete | no access |
| PERM-03 | Staff | view | view | none | no access |

Checked in both places for each cell: the button is not rendered, and a direct call is
rejected by the store (`assertCan`). `pricing-and-permissions.test.mjs` pins the matrix.
