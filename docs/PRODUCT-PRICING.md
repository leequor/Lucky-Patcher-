
# Product Pricing – Historical Price Lookup

## Purpose

The database provides a reusable function named `get_product_price_as_of()` to retrieve a product's effective price on a specified date.

This allows developers to check historical prices instead of relying only on the current price.

## Function

```sql
public.get_product_price_as_of(p_prodcode, p_as_of_date)
```

### Parameters

| Parameter | Description |
|---|---|
| `p_prodcode` | Product code to look up. |
| `p_as_of_date` | Date for which the effective price is requested. |

### Returned Columns

| Column | Description |
|---|---|
| `prodcode` | Product code. |
| `unitprice` | Effective unit price. |
| `effdate` | Effective date of the returned price. |

## Usage Example

To retrieve the price of product `AM0001` as of June 30, 2010:

```sql
SELECT *
FROM public.get_product_price_as_of(
    'AM0001',
    DATE '2010-06-30'
);
```

The function returns the latest non-deleted price record whose `effdate` is on or before the requested date.

For the seeded `AM0001` price history, the expected result is:

| prodcode | unitprice | effdate |
|---|---:|---|
| AM0001 | 36.45 | 2010-05-15 |

## No Applicable Price

If no non-deleted price record exists on or before the requested date, the function returns an empty result (zero rows).

Example:

```sql
SELECT *
FROM public.get_product_price_as_of(
    'AM0001',
    DATE '1900-01-01'
);
```

## Selection Rules

1. Only records matching the requested product code are considered.
2. Deleted price records (`is_deleted = true`) are excluded.
3. Price records after the requested date are excluded.
4. The record with the latest effective date is returned.
5. If no applicable record exists, no rows are returned.

## Access and Security

The function uses `SECURITY INVOKER`, meaning it runs with the permissions of the calling user. The caller must have permission to execute the function and access the underlying price history records.

## Related Database Objects

- `public.pricehist` – Stores product price history.
- `public.product_current_price` – View of current effective prices.
- `public.get_product_price_as_of()` – Retrieves a price effective on a specified date.
