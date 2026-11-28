-- Improve latest-price lookups by product and effective date.
CREATE INDEX IF NOT EXISTS idx_pricehist_prodcode_effdate
ON public.pricehist (prodcode, effdate DESC)
INCLUDE (unitprice);