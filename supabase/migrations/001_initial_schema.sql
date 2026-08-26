-- ============================================================================
-- Nano-Almacén — Migration 001: Initial multi-tenant schema
-- Sprint A · Día 2 · 2026-08-26
--
-- Multi-tenant SaaS para tienditas MX. Tenant = tiendita. Members = staff.
-- All domain tables scoped by tenant_id. RLS via public.is_tenant_member().
-- Uses Supabase Auth (auth.users) — Better Auth migration path if needed later.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. Tenants (tienditas)
-- ============================================================================

create table public.tenants (
  id                       uuid primary key default uuid_generate_v4(),
  slug                     text unique not null check (slug ~ '^[a-z0-9-]+$' and length(slug) between 3 and 40),
  name                     text not null,
  rfc                      text,
  whatsapp_phone_id        text unique,
  whatsapp_display_number  text,
  timezone                 text default 'America/Mexico_City',
  currency                 text default 'MXN',
  plan                     text default 'free' check (plan in ('free', 'starter', 'growth', 'pro')),
  status                   text default 'active' check (status in ('active', 'suspended', 'canceled')),
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

comment on table  public.tenants is 'Tiendita/negocio. Root de todo el multi-tenancy.';
comment on column public.tenants.slug is 'URL-safe slug para subdominio o /t/{slug}.';
comment on column public.tenants.rfc is 'RFC MX para emisión CFDI 4.0 via Facturapi.';
comment on column public.tenants.whatsapp_phone_id is 'Meta Business phone_number_id (webhook routing).';

-- ============================================================================
-- 2. Tenant members (auth.users ↔ tenants)
-- ============================================================================

create table public.tenant_users (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id)      on delete cascade,
  role        text not null default 'owner' check (role in ('owner', 'staff', 'viewer')),
  created_at  timestamptz default now(),
  primary key (tenant_id, user_id)
);
create index tenant_users_user_id_idx on public.tenant_users(user_id);

-- ============================================================================
-- 3. Products (catalog por tenant)
-- ============================================================================

create table public.products (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  sku          text,
  name         text not null,
  description  text,
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  unit         text default 'pieza',
  photo_url    text,
  category     text,
  stock        integer default 0,
  active       boolean default true,
  aliases      text[] default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (tenant_id, sku)
);
create index products_tenant_id_idx     on public.products(tenant_id);
create index products_tenant_active_idx on public.products(tenant_id, active) where active = true;
create index products_aliases_gin       on public.products using gin (aliases);

comment on column public.products.aliases is 'Sinónimos para Claude parse_order: {"corona","coronita","cerveza corona"}.';

-- ============================================================================
-- 4. Customers (end users que piden por WhatsApp)
-- ============================================================================

create table public.customers (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  whatsapp_phone  text not null,
  name            text,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (tenant_id, whatsapp_phone)
);
create index customers_tenant_id_idx on public.customers(tenant_id);

comment on column public.customers.whatsapp_phone is 'E.164 format: +5213312345678.';

-- ============================================================================
-- 5. Orders
-- ============================================================================

create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  customer_id     uuid references public.customers(id),
  status          text not null default 'pending' check (status in
                    ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal        numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  notes           text,
  payment_method  text check (payment_method in ('cash', 'transfer', 'card', 'oxxo', 'mercadopago')),
  payment_status  text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  cfdi_uuid       text,
  cfdi_pdf_url    text,
  cfdi_xml_url    text,
  source          text default 'whatsapp' check (source in ('whatsapp', 'web', 'manual')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index orders_tenant_id_idx     on public.orders(tenant_id);
create index orders_tenant_status_idx on public.orders(tenant_id, status, created_at desc);
create index orders_customer_idx      on public.orders(customer_id, created_at desc);

comment on column public.orders.cfdi_uuid is 'UUID fiscal SAT devuelto por Facturapi al emitir CFDI 4.0.';

-- ============================================================================
-- 6. Order items
-- ============================================================================

create table public.order_items (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id),
  product_name  text not null,
  quantity      numeric(10,2) not null check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  line_total    numeric(10,2) not null,
  notes         text,
  created_at    timestamptz default now()
);
create index order_items_order_id_idx on public.order_items(order_id);

comment on column public.order_items.product_name is 'Snapshot — sobrevive si producto se borra.';

-- ============================================================================
-- 7. WhatsApp conversations (audit trail para Claude parse_order)
-- ============================================================================

create table public.whatsapp_conversations (
  id                    uuid primary key default uuid_generate_v4(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  customer_id           uuid references public.customers(id),
  order_id              uuid references public.orders(id),
  direction             text not null check (direction in ('inbound', 'outbound')),
  message_type          text default 'text' check (message_type in ('text', 'image', 'audio', 'document', 'system')),
  content               text not null,
  whatsapp_message_id   text unique,
  parsed_intent         jsonb,
  parse_confidence      numeric(3,2),
  created_at            timestamptz default now()
);
create index wa_conv_tenant_idx   on public.whatsapp_conversations(tenant_id, created_at desc);
create index wa_conv_customer_idx on public.whatsapp_conversations(customer_id, created_at desc);
create index wa_conv_order_idx    on public.whatsapp_conversations(order_id);

comment on column public.whatsapp_conversations.whatsapp_message_id is 'Meta message ID — dedup webhook retries.';
comment on column public.whatsapp_conversations.parsed_intent is 'Claude structured output: {products: [{sku, qty}], intent: order|question|complaint}.';

-- ============================================================================
-- 8. Helper functions
-- ============================================================================

create or replace function public.user_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_users where user_id = auth.uid();
$$;

create or replace function public.is_tenant_member(_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_users
    where tenant_id = _tenant_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_tenant_owner(_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_users
    where tenant_id = _tenant_id and user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at   before update on public.tenants   for each row execute function public.handle_updated_at();
create trigger products_updated_at  before update on public.products  for each row execute function public.handle_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.handle_updated_at();
create trigger orders_updated_at    before update on public.orders    for each row execute function public.handle_updated_at();

-- ============================================================================
-- 9. RLS policies
-- ============================================================================

alter table public.tenants                  enable row level security;
alter table public.tenant_users             enable row level security;
alter table public.products                 enable row level security;
alter table public.customers                enable row level security;
alter table public.orders                   enable row level security;
alter table public.order_items              enable row level security;
alter table public.whatsapp_conversations   enable row level security;

-- tenants
create policy "tenants_select_own"
  on public.tenants for select
  using (public.is_tenant_member(id));

create policy "tenants_update_own"
  on public.tenants for update
  using (public.is_tenant_owner(id));

-- tenant creation goes via RPC create_tenant() to avoid RLS chicken-and-egg
-- (user needs tenant_users row before is_tenant_member returns true).

-- tenant_users
create policy "tenant_users_select_own"
  on public.tenant_users for select
  using (user_id = auth.uid() or public.is_tenant_member(tenant_id));

create policy "tenant_users_manage_by_owner"
  on public.tenant_users for all
  using (public.is_tenant_owner(tenant_id));

-- products
create policy "products_all_tenant"
  on public.products for all
  using (public.is_tenant_member(tenant_id));

-- customers
create policy "customers_all_tenant"
  on public.customers for all
  using (public.is_tenant_member(tenant_id));

-- orders
create policy "orders_all_tenant"
  on public.orders for all
  using (public.is_tenant_member(tenant_id));

-- order_items (via join)
create policy "order_items_all_tenant"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and public.is_tenant_member(o.tenant_id)
    )
  );

-- whatsapp_conversations
create policy "wa_conv_all_tenant"
  on public.whatsapp_conversations for all
  using (public.is_tenant_member(tenant_id));

-- ============================================================================
-- 10. RPC: create_tenant (atomic tenant + owner)
-- ============================================================================

create or replace function public.create_tenant(
  _slug text,
  _name text,
  _rfc  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.tenants (slug, name, rfc)
  values (_slug, _name, _rfc)
  returning id into new_tenant_id;

  insert into public.tenant_users (tenant_id, user_id, role)
  values (new_tenant_id, auth.uid(), 'owner');

  return new_tenant_id;
end;
$$;

grant execute on function public.create_tenant(text, text, text) to authenticated;

-- ============================================================================
-- 11. Grants (Supabase authenticated role)
-- ============================================================================

grant usage  on schema public to authenticated;
grant select, insert, update, delete on all tables    in schema public to authenticated;
grant usage, select                  on all sequences in schema public to authenticated;
grant execute                        on all functions in schema public to authenticated;

-- service_role bypasses RLS by default; webhooks/cron use it for cross-tenant ops.
