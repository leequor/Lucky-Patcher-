-- S2-DBA-05
-- Demo data for the customer, product and price history screens.
-- Idempotent: safe to run more than once. Re-running never duplicates a code
-- or a dated price.

insert into public.customers
  (code, name, contact_person, email, phone, address, pay_terms, status, notes)
select v.code, v.name, v.contact_person, v.email, v.phone, v.address, v.pay_terms, v.status, v.notes
from (values
  ('CUS-1001', 'Northwind Traders', 'Elena Reyes', 'elena.reyes@northwind.ph', '+63 917 204 1188', '12 Mabini Ave, Quezon City', 'NET_30', 'active', 'Bulk orders every second Monday. Deliver to warehouse gate 3.'),
  ('CUS-1002', 'Blue Harbor Supply', 'Marco Lim', 'purchasing@blueharbor.ph', '+63 918 552 0043', 'Pier 4, North Harbor, Manila', 'NET_15', 'active', 'Requires delivery receipt signed by the pier supervisor.'),
  ('CUS-1003', 'Rivera Hardware', 'Ana Rivera', 'ana@riverahardware.ph', '+63 921 778 3390', '88 Rizal St, San Fernando, Pampanga', 'COD', 'active', 'Cash on delivery only. Owner collects at the counter.'),
  ('CUS-1004', 'Summit Builders', 'Danilo Cruz', 'dcruz@summitbuilders.ph', '+63 927 441 9021', 'Km 42, Aguinaldo Highway, Tagaytay', 'NET_45', 'active', 'Site deliveries need a 24-hour heads-up for gate access.'),
  ('CUS-1005', 'Luntian Farms', 'Grace Villar', 'grace@luntianfarms.ph', '+63 915 330 7742', 'Purok 3, Bay, Laguna', 'NET_30', 'active', 'Seasonal volume; slows down from June to August.'),
  ('CUS-1006', 'Cordillera Textiles', 'Ramon Bautista', 'ramon@cordilleratextiles.ph', '+63 926 118 5560', 'Session Road, Baguio City', 'NET_60', 'active', 'Longest terms on the books. Reviewed every quarter.'),
  ('CUS-1007', 'Mabini Print Shop', 'Liza Santos', 'liza@mabiniprint.ph', '+63 922 661 8834', '5 Mabini St, Cebu City', 'NET_15', 'inactive', 'Paused account since March. Owner is relocating the shop.'),
  ('CUS-1008', 'Pacific Marine Works', 'Tony Ong', 'tong@pacificmarine.ph', '+63 917 882 4410', 'Shipyard Road, Subic', 'NET_30', 'active', 'Orders in metres. Confirm cut lengths before invoicing.'),
  ('CUS-1009', 'Sierra Electrical', 'Joy Mendoza', 'joy@sierraelectrical.ph', '+63 939 220 1177', '17 Del Pilar St, Davao City', 'NET_45', 'active', 'Preferred courier is the morning route.'),
  ('CUS-1010', 'Bagong Silang Cooperative', 'Pedro Dizon', 'pedro@bagongsilang.coop', '+63 908 771 2255', 'Phase 4, Bagong Silang, Caloocan', 'COD', 'active', 'Cooperative purchase orders need two signatories.'),
  ('CUS-1011', 'Orchid Hotel Group', 'Carla Gomez', 'procurement@orchidhotels.ph', '+63 917 553 6602', 'Ayala Center, Makati', 'NET_30', 'active', 'Central procurement handles all four properties.')
) as v (code, name, contact_person, email, phone, address, pay_terms, status, notes)
where not exists (select 1 from public.customers c where c.code = v.code);

insert into public.products (code, description, unit, status, notes)
select v.code, v.description, v.unit, v.status, v.notes
from (values
  ('PRD-2001', 'Industrial epoxy adhesive, 5 kg pail', 'BOX', 'active', 'Two-part mix. Shelf life 12 months.'),
  ('PRD-2002', 'Galvanised steel sheet, 4 x 8 ft', 'PC', 'active', 'Gauge 24. Stored in the covered yard.'),
  ('PRD-2003', 'Copper wire THHN 2.0 mm, 100 m roll', 'SET', 'active', 'Colour varies by stock. Confirm before dispatch.'),
  ('PRD-2004', 'Marine plywood, 3/4 in, 4 x 8 ft', 'PC', 'active', 'Bonded grade. Keep dry.'),
  ('PRD-2005', 'Portland cement, 40 kg bag', 'BOX', 'active', 'Fast mover. Reorder at 40 bags.'),
  ('PRD-2006', 'Powder-coated angle bar, 40 x 40 mm', 'M', 'active', 'Cut to length on request.'),
  ('PRD-2007', 'Safety helmet, Class A, ratchet strap', 'PC', 'active', 'Six colours in stock. White is the default.'),
  ('PRD-2008', 'Welding rod E6013, 2.5 mm, 5 kg pack', 'BOX', 'active', 'Keep sealed until use.'),
  ('PRD-2009', 'Hydraulic hose, 1/2 in, braided', 'M', 'active', 'New line item. Price still being confirmed with the supplier.'),
  ('PRD-2010', 'Industrial paint thinner, 4 L can', 'L', 'active', 'Flammable. Store in the outside cabinet.'),
  ('PRD-2011', 'Stainless bolt M12, pack of 50', 'SET', 'active', 'Grade 304.'),
  ('PRD-2012', 'Compressor belt, A-section, 42 in', 'PC', 'inactive', 'Superseded by the B-section belt. Kept for old machines.')
) as v (code, description, unit, status, notes)
where not exists (select 1 from public.products p where p.code = v.code);

insert into public.price_history (product_id, amount, effective_date, note)
select p.id, v.amount, v.effective_date, v.note
from (values
  ('PRD-2001', 2450.00, date '2024-01-15', ''),
  ('PRD-2001', 2690.00, date '2025-03-01', ''),
  ('PRD-2001', 2850.00, date '2026-02-01', ''),
  ('PRD-2002', 1180.00, date '2024-06-01', ''),
  ('PRD-2002', 1250.00, date '2025-09-15', ''),
  ('PRD-2002', 1395.00, date '2026-07-01', ''),
  ('PRD-2003', 3420.00, date '2025-01-10', ''),
  ('PRD-2003', 3780.00, date '2026-10-30', ''),
  ('PRD-2004', 980.00, date '2025-02-01', ''),
  ('PRD-2004', 1040.00, date '2026-03-12', ''),
  ('PRD-2005', 285.00, date '2024-11-05', ''),
  ('PRD-2005', 310.00, date '2025-08-20', ''),
  ('PRD-2005', 335.00, date '2026-09-01', ''),
  ('PRD-2006', 420.00, date '2026-01-18', ''),
  ('PRD-2007', 460.00, date '2025-04-15', ''),
  ('PRD-2007', 495.00, date '2026-11-07', ''),
  ('PRD-2008', 215.00, date '2025-05-10', ''),
  ('PRD-2008', 238.00, date '2026-06-11', ''),
  ('PRD-2010', 640.00, date '2025-07-01', ''),
  ('PRD-2010', 705.00, date '2026-04-02', ''),
  ('PRD-2011', 890.00, date '2025-08-15', ''),
  ('PRD-2011', 940.00, date '2026-02-20', ''),
  ('PRD-2012', 320.00, date '2025-09-20', '')
) as v (code, amount, effective_date, note)
join public.products p on p.code = v.code
where not exists (
  select 1 from public.price_history ph
  where ph.product_id = p.id
    and ph.effective_date = v.effective_date
    and not ph.is_deleted
);

-- A short activity trail so the Activity screen is not empty on a fresh
-- database. Only inserted when the log has no rows yet.
insert into public.audit_log (at, actor_id, actor_email, action, entity, entity_id, entity_label, detail)
select
  now() - (v.age_hours || ' hours')::interval,
  u.id,
  u.email,
  v.action,
  v.entity,
  coalesce(p.id, c.id),
  coalesce(p.description, c.name),
  v.detail
from (values
  ('product', 'PRD-2009', 'product.create', 48, 'Added product PRD-2009. No price set yet.'),
  ('customer', 'CUS-1004', 'customer.update', 36, 'Payment terms changed from Net 30 to Net 45.')
) as v (entity, code, action, age_hours, detail)
left join public.customers c on v.entity = 'customer' and c.code = v.code
left join public.products p on v.entity = 'product' and p.code = v.code
cross join lateral (select id, email from public.users order by created_at limit 1) u
where not exists (select 1 from public.audit_log)
  and coalesce(p.id, c.id) is not null;

insert into public.audit_log (at, actor_id, actor_email, action, entity, entity_id, entity_label, parent_id, detail)
select
  now() - interval '24 hours',
  u.id,
  u.email,
  'price.create',
  'price',
  ph.id,
  p.description,
  p.id,
  'Added price ' || to_char(ph.amount, 'FM999,990.00') || ' effective ' ||
    to_char(ph.effective_date, 'DD Mon YYYY') || '.'
from public.products p
join public.price_history ph
  on ph.product_id = p.id and ph.effective_date = date '2026-09-01' and not ph.is_deleted
cross join lateral (select id, email from public.users order by created_at limit 1) u
where p.code = 'PRD-2005'
  and not exists (select 1 from public.audit_log where action = 'price.create');
