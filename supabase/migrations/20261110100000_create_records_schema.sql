-- S2-DBA-01..04
-- Customer and product master data, dated price history, audit log.
-- Mirrors the rules enforced by the application store in lib/data/store.js.
--
-- Replayable from scratch: every object is created with IF NOT EXISTS or
-- CREATE OR REPLACE, and nothing is dropped.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Helper: the signed-in user's role and rights
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.users where id = auth.uid();
$$;

-- Mirrors lib/domain/constants.js ROLE_PERMISSIONS.
create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case public.current_user_role()
    when 'superadmin' then true
    when 'admin' then p_permission in (
      'customer.view', 'customer.create', 'customer.edit', 'customer.delete',
      'product.view', 'product.create', 'product.edit', 'product.delete',
      'price.create', 'price.edit', 'price.delete'
    )
    when 'user' then p_permission in ('customer.view', 'product.view')
    else false
  end;
$$;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  pay_terms text not null default 'NET_30',
  status text not null default 'active',
  notes text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id),
  updated_by uuid references public.users (id),
  constraint customers_code_unique unique (code),
  constraint customers_code_format check (code ~ '^[A-Z0-9][A-Z0-9-]{2,19}$'),
  constraint customers_name_length check (char_length(name) between 2 and 120),
  constraint customers_pay_terms_allowed
    check (pay_terms in ('COD', 'NET_15', 'NET_30', 'NET_45', 'NET_60')),
  constraint customers_status_allowed check (status in ('active', 'inactive')),
  constraint customers_email_format
    check (email is null or email = '' or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$')
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text not null,
  unit text not null default 'PC',
  status text not null default 'active',
  notes text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id),
  updated_by uuid references public.users (id),
  constraint products_code_unique unique (code),
  constraint products_code_format check (code ~ '^[A-Z0-9][A-Z0-9-]{2,23}$'),
  constraint products_description_length check (char_length(description) between 2 and 160),
  constraint products_unit_allowed
    check (unit in ('PC', 'BOX', 'SET', 'KG', 'L', 'M', 'HR')),
  constraint products_status_allowed check (status in ('active', 'inactive'))
);

-- ---------------------------------------------------------------------------
-- Price history
-- ---------------------------------------------------------------------------

create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  amount numeric(12, 2) not null,
  effective_date date not null,
  note text,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.users (id),
  updated_by uuid references public.users (id),
  constraint price_history_amount_positive check (amount > 0),
  constraint price_history_amount_scale check (amount = round(amount, 2)),
  constraint price_history_date_range
    check (effective_date between date '2000-01-01' and date '2100-12-31')
);

-- One live price per product per effective date. Soft-deleted rows step aside
-- so the date can be reused.
create unique index if not exists price_history_active_date_idx
  on public.price_history (product_id, effective_date)
  where not is_deleted;

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor_id uuid references public.users (id),
  actor_email text,
  action text not null,
  entity text not null,
  entity_id uuid not null,
  entity_label text,
  parent_id uuid,
  detail text,
  constraint audit_log_entity_allowed check (entity in ('customer', 'product', 'price'))
);

-- ---------------------------------------------------------------------------
-- Indexes (S2-DBA-01, S2-DBA-06)
-- ---------------------------------------------------------------------------

create index if not exists customers_active_status_idx
  on public.customers (status) where not is_deleted;
create index if not exists customers_pay_terms_idx
  on public.customers (pay_terms) where not is_deleted;
create index if not exists customers_code_trgm_idx
  on public.customers using gin (lower(code) gin_trgm_ops);
create index if not exists customers_name_trgm_idx
  on public.customers using gin (lower(name) gin_trgm_ops);
create index if not exists customers_contact_trgm_idx
  on public.customers using gin (lower(coalesce(contact_person, '')) gin_trgm_ops);

create index if not exists products_active_status_idx
  on public.products (status) where not is_deleted;
create index if not exists products_unit_idx
  on public.products (unit) where not is_deleted;
create index if not exists products_code_trgm_idx
  on public.products using gin (lower(code) gin_trgm_ops);
create index if not exists products_description_trgm_idx
  on public.products using gin (lower(description) gin_trgm_ops);

create index if not exists price_history_product_date_idx
  on public.price_history (product_id, effective_date desc) where not is_deleted;

create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);
create index if not exists audit_log_parent_idx on public.audit_log (parent_id);

-- ---------------------------------------------------------------------------
-- Active views (S2-DBA-01)
-- security_invoker keeps the caller's RLS policies in force.
-- ---------------------------------------------------------------------------

create or replace view public.active_customers
with (security_invoker = true) as
  select * from public.customers where not is_deleted;

create or replace view public.active_products
with (security_invoker = true) as
  select * from public.products where not is_deleted;

-- ---------------------------------------------------------------------------
-- Current price (S2-DBA-02)
-- ---------------------------------------------------------------------------

create or replace function public.current_price(
  p_product_id uuid,
  p_as_of date default current_date
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select ph.amount
  from public.price_history ph
  where ph.product_id = p_product_id
    and not ph.is_deleted
    and ph.effective_date <= p_as_of
  order by ph.effective_date desc
  limit 1;
$$;

create or replace view public.product_current_price
with (security_invoker = true) as
  select
    p.id as product_id,
    p.code,
    p.description,
    p.unit,
    p.status,
    cp.amount as current_price,
    cp.effective_date as current_price_since
  from public.products p
  left join lateral (
    select ph.amount, ph.effective_date
    from public.price_history ph
    where ph.product_id = p.id
      and not ph.is_deleted
      and ph.effective_date <= current_date
    order by ph.effective_date desc
    limit 1
  ) cp on true
  where not p.is_deleted;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at
  before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists price_history_touch_updated_at on public.price_history;
create trigger price_history_touch_updated_at
  before update on public.price_history
  for each row execute function public.touch_updated_at();

-- Deleting a product that still carries live prices is refused at the
-- database level, not only in the app (S2-DBA-04).
create or replace function public.block_product_soft_delete()
returns trigger
language plpgsql
as $$
begin
  if new.is_deleted and not old.is_deleted then
    if exists (
      select 1 from public.price_history ph
      where ph.product_id = new.id and not ph.is_deleted
    ) then
      raise exception
        'Product % still has price records. Delete them first, or set the product to inactive.',
        new.code
        using errcode = 'restrict_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_block_soft_delete on public.products;
create trigger products_block_soft_delete
  before update on public.products
  for each row execute function public.block_product_soft_delete();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.price_history enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "Read customers with the view right" on public.customers;
create policy "Read customers with the view right"
  on public.customers for select to authenticated
  using (public.has_permission('customer.view'));

drop policy if exists "Create customers with the add right" on public.customers;
create policy "Create customers with the add right"
  on public.customers for insert to authenticated
  with check (public.has_permission('customer.create') and created_by = auth.uid());

drop policy if exists "Update customers with the edit right" on public.customers;
create policy "Update customers with the edit right"
  on public.customers for update to authenticated
  using (public.has_permission('customer.edit'))
  with check (public.has_permission('customer.edit'));

drop policy if exists "Read products with the view right" on public.products;
create policy "Read products with the view right"
  on public.products for select to authenticated
  using (public.has_permission('product.view'));

drop policy if exists "Create products with the add right" on public.products;
create policy "Create products with the add right"
  on public.products for insert to authenticated
  with check (public.has_permission('product.create') and created_by = auth.uid());

drop policy if exists "Update products with the edit right" on public.products;
create policy "Update products with the edit right"
  on public.products for update to authenticated
  using (public.has_permission('product.edit'))
  with check (public.has_permission('product.edit'));

drop policy if exists "Read prices with the product view right" on public.price_history;
create policy "Read prices with the product view right"
  on public.price_history for select to authenticated
  using (public.has_permission('product.view'));

drop policy if exists "Create prices with the price add right" on public.price_history;
create policy "Create prices with the price add right"
  on public.price_history for insert to authenticated
  with check (public.has_permission('price.create') and created_by = auth.uid());

drop policy if exists "Update prices with the price edit right" on public.price_history;
create policy "Update prices with the price edit right"
  on public.price_history for update to authenticated
  using (public.has_permission('price.edit'))
  with check (public.has_permission('price.edit'));

drop policy if exists "Read the activity log with the audit right" on public.audit_log;
create policy "Read the activity log with the audit right"
  on public.audit_log for select to authenticated
  using (public.has_permission('audit.view'));

drop policy if exists "Append to the activity log as yourself" on public.audit_log;
create policy "Append to the activity log as yourself"
  on public.audit_log for insert to authenticated
  with check (actor_id = auth.uid());

-- The activity log is append-only.
drop policy if exists "No updates to the activity log" on public.audit_log;
create policy "No updates to the activity log"
  on public.audit_log for update to authenticated
  using (false);

drop policy if exists "No deletes from the activity log" on public.audit_log;
create policy "No deletes from the activity log"
  on public.audit_log for delete to authenticated
  using (false);

-- Hard deletes are never allowed on records; the app soft deletes instead.
drop policy if exists "No hard deletes of customers" on public.customers;
create policy "No hard deletes of customers"
  on public.customers for delete to authenticated
  using (false);

drop policy if exists "No hard deletes of products" on public.products;
create policy "No hard deletes of products"
  on public.products for delete to authenticated
  using (false);
