# Sprint 2 DBA Performance Report

**Issue:** S2-DBA-06 — Search performance check and index tuning (#80)

## 1. Objective

Measure customer, product, and price-history queries using the available database records, identify query execution plans, and apply index tuning where appropriate.

## 2. Test Data Volume

| Table | Total Records | Active Records |
|---|---:|---:|
| customer | 87 | 87 |
| product | 62 | 62 |
| pricehist | 89 | 89 |

## 3. Baseline Measurements

The following queries were measured using `EXPLAIN (ANALYZE, BUFFERS)` before refreshing database statistics.

| Query | Execution Time | Execution Plan |
|---|---:|---|
| Customer name search | 0.293 ms | Sequential Scan |
| Product description search | 0.232 ms | Sequential Scan |
| Latest product price | 0.192 ms | Sequential Scan + Sort |

## 4. Query Analysis

- Customer search used a sequential scan despite existing B-tree and GIN trigram indexes.
- Product description search also used a sequential scan despite existing B-tree and GIN trigram indexes.
- Price-history lookup initially used a sequential scan followed by sorting.
- The tables contained relatively few records, making sequential scans reasonable for some queries.

PostgreSQL statistics were refreshed using `ANALYZE` on all three tables.

## 5. Results After ANALYZE

| Query | Before | After ANALYZE |
|---|---:|---:|
| Customer name search | 0.293 ms | 0.303 ms |
| Product description search | 0.232 ms | 0.234 ms |
| Latest product price | 0.192 ms | 0.156 ms |

After refreshing statistics, PostgreSQL selected the existing `pricehist_pkey` index using a backward index scan for the latest-price query.

## 6. Index Tuning

Added the following index:

```sql
CREATE INDEX IF NOT EXISTS idx_pricehist_prodcode_effdate
ON public.pricehist (prodcode, effdate DESC)
INCLUDE (unitprice);
```

This index supports queries that filter by product code, filter by effective date, and retrieve the latest applicable price.

The existing primary-key index was retained.

## 7. Measurements After Index Tuning

| Metric | Before New Index | After New Index |
|---|---:|---:|
| Execution Time | 0.156 ms | 0.161 ms |
| Scan Method | Backward Index Scan | Index Only Scan |
| Index Used | pricehist_pkey | idx_pricehist_prodcode_effdate |

The new index was selected by PostgreSQL. The execution plan no longer required a separate sorting step.

The measured execution time increased slightly by 0.005 ms. Therefore, no runtime speed improvement is claimed from this small dataset. The main improvement is the more suitable index access strategy for product-and-date lookups.

## 8. Index Usage Verification

The new index was verified through `pg_stat_user_indexes`.

| Index | Recorded Scans | Size |
|---|---:|---:|
| idx_pricehist_prodcode_effdate | 1 | 16 kB |
| pricehist_pkey | 24 | 16 kB |

The new index recorded one scan during the benchmark.

## 9. Conclusion

The customer and product searches remained on sequential scans because of the relatively small table sizes. No additional indexes were added for those tables.

A targeted composite index was added to `pricehist` to support latest-price lookups by product and effective date. PostgreSQL selected the new index during the final benchmark.

The results demonstrate that query plans and index selection were evaluated using actual execution measurements rather than assuming that additional indexes always improve performance.

For larger production datasets, further benchmarking should be performed to evaluate the performance impact under a more representative workload.