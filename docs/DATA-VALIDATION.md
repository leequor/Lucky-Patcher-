
# Database Validation Rules

## S2-DBA-03: Payment Terms and Product Units

This document describes the database-level validation rules for customer payment terms and product units.

### 1. Customer Payment Terms

Table: `public.customer`

Column: `payterm`

Allowed values:

- `Net 30`
- `Net 45`
- `COD`
- `Prepaid`

The payment term is optional, so NULL values are allowed.

Legacy value conversions:

| Previous Value | Standardized Value |
|---|---|
| `30D` | `Net 30` |
| `45D` | `Net 45` |
| `COD` | `COD` |

Database constraint:

`customer_payterm_check`

### 2. Product Units

Table: `public.product`

Column: `unit`

Allowed values:

- `each`
- `piece`
- `box`
- `pack`
- `set`
- `pair`
- `kg`
- `g`
- `liter`
- `meter`
- `roll`

Product units are required and cannot be NULL.

Legacy value conversions:

| Previous Value | Standardized Value |
|---|---|
| `ea` | `each` |
| `pc` | `piece` |
| `mtr` | `meter` |
| `pkg` | `pack` |
| `ltr` | `liter` |

Database constraint:

`product_unit_check`

### 3. Validation Enforcement

Both fields are validated at the database level using PostgreSQL CHECK constraints.

Invalid values are rejected even when records are inserted or updated outside the application.

Application-level validation is also maintained to provide users with understandable error messages before submitting data.

### 4. Testing

The following validations were tested:

- All approved payment terms are accepted.
- Unsupported payment terms are rejected.
- All approved product units are accepted.
- Unsupported product units are rejected.
- Existing application validation tests pass.

Automated test results:

- Customer validation: 5 passed.
- Product validation: 6 passed.
- Complete automated test suite: 51 passed, 0 failed.

### 5. Related Files

- `supabase/migrations/20261126160000_add_customer_payment_term_and_product_unit_constraints.sql`
- `app/lib/customer-validation.mjs`
- `app/lib/product-validation.mjs`
- `tests/customer-validation.test.mjs`
- `tests/product-query.test.mjs`
