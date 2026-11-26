
# S2-DBA-04: Child-Record Delete Integrity Tests

**Issue:** #78  
**Role:** Database Administrator  
**Plan ID:** S2-DBA-04

## Objective

Verify that customers and products with active child records cannot be permanently deleted or soft-deleted.

## Test Records

| Record | Description | Active child records |
|---|---|---:|
| Customer C0001 | Globus Medical, Inc. | 3 active sales |
| Product AD0001 | Toshiba Canvio 1 TB | 2 active sales details, 1 active price history |

## Test Results

| Test | Result | Status |
|---|---|---|
| Customer hard delete | Blocked by hard-delete trigger | PASS |
| Customer soft delete | Blocked: 3 active related records | PASS |
| Product hard delete | Blocked by hard-delete trigger | PASS |
| Product soft delete | Blocked: 3 active related records | PASS |

## Actual Database Output

```text
Customer hard delete:
BLOCKED: Hard delete/truncate not allowed on customer.
Use UPDATE ... SET is_deleted = true.

Customer soft delete:
BLOCKED: Cannot delete customer row:
3 active related record(s) still exist.

Product hard delete:
BLOCKED: Hard delete/truncate not allowed on product.
Use UPDATE ... SET is_deleted = true.

Product soft delete:
BLOCKED: Cannot delete product row:
3 active related record(s) still exist.
```

## Data Preservation Verification

After testing, both records remained active:

| Record | is_deleted |
|---|---|
| Customer C0001 | false |
| Product AD0001 | false |

The test operations did not permanently modify either record.

## Findings

1. Hard deletion is prevented by the database's `trg_block_hard_delete()` trigger.
2. Soft deletion is prevented when active child records exist by `trg_check_children()`.
3. Customer deletion checks active sales records.
4. Product deletion checks active sales details and price history records.
5. The foreign keys also use `NO ACTION` as an additional protection against hard deletion.

## Conclusion

All four tests passed. The database successfully prevents hard deletion and prevents soft deletion of customers and products that still have active related records.

**Recommendation:** Keep these database protections in place. Application developers should also handle these database errors and display understandable messages to users.
