
-- ============================================================
-- S2-DBA-05: Demo data for customer, product, and price history
-- Safe to run repeatedly.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Demo customers
-- ------------------------------------------------------------

INSERT INTO public.customer (custno, custname, address, payterm)
VALUES
    ('D9001', 'Northstar Office',
     'Quezon City, Metro Manila', 'Net 30'),

    ('D9002', 'BluePeak Tech',
     'Makati City, Metro Manila', 'Net 45'),

    ('D9003', 'Greenfield Trading',
     'Cebu City, Cebu', 'COD'),

    ('D9004', 'Summit Learning',
     'Pasig City, Metro Manila', 'Prepaid'),

    ('D9005', 'Pacific Business Sys',
     'Davao City, Davao del Sur', 'Net 30')
ON CONFLICT (custno) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Demo products
-- ------------------------------------------------------------

INSERT INTO public.product (prodcode, description, unit)
VALUES
    ('DM9001', 'Wireless Office Mouse', 'piece'),
    ('DM9002', 'Mechanical Keyboard', 'piece'),
    ('DM9003', 'Portable SSD 1TB', 'each'),
    ('DM9004', 'Full HD Projector', 'each'),
    ('DM9005', 'A4 Copy Paper Bundle', 'pack')
ON CONFLICT (prodcode) DO NOTHING;


-- ------------------------------------------------------------
-- 3. Demo product price history
-- Each product has a past price and a newer current price.
-- ------------------------------------------------------------

INSERT INTO public.pricehist (effdate, prodcode, unitprice)
VALUES
    -- Wireless Office Mouse
    ('2025-01-01', 'DM9001', 450.00),
    ('2026-01-01', 'DM9001', 495.00),

    -- Mechanical Keyboard
    ('2025-01-01', 'DM9002', 1250.00),
    ('2026-01-01', 'DM9002', 1395.00),

    -- Portable SSD 1TB
    ('2025-01-01', 'DM9003', 3200.00),
    ('2026-01-01', 'DM9003', 3499.00),

    -- Full HD Projector
    ('2025-01-01', 'DM9004', 18500.00),
    ('2026-01-01', 'DM9004', 19950.00),

    -- A4 Copy Paper Bundle
    ('2025-01-01', 'DM9005', 220.00),
    ('2026-01-01', 'DM9005', 245.00)
ON CONFLICT (effdate, prodcode) DO NOTHING;

COMMIT;

-- ============================================================
-- Expected result on a fresh database:
-- 5 demo customers
-- 5 demo products
-- 10 price history records
-- ============================================================
