-- ============================================================================
-- Nano-Almacén — Migration 002: Waitlist
-- Sprint A · Día 3 · 2026-08-26
--
-- Pre-signup waitlist para landing pública. Global (no multi-tenant).
-- Se llena via /api/waitlist antes de que existan tenants reales.
-- ============================================================================

create table public.waitlist_signups (
  id                 uuid primary key default uuid_generate_v4(),
  email              text not null,
  whatsapp_phone     text,
  business_name      text,
  city               text,
  source             text default 'landing',
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  notes              text,
  contacted_at       timestamptz,
  converted_at       timestamptz,
  created_at         timestamptz default now(),
  unique (email)
);

create index waitlist_created_idx on public.waitlist_signups(created_at desc);

comment on table  public.waitlist_signups is 'Pre-signup landing waitlist. Public insert via anon key.';
comment on column public.waitlist_signups.converted_at is 'Set cuando el email se convierte a tenant_users owner.';

alter table public.waitlist_signups enable row level security;

-- Public can insert (anon key, from landing form)
create policy "waitlist_public_insert"
  on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (true);

-- Only service_role can read (protects email list). No SELECT policy for anon/authenticated.

grant insert on public.waitlist_signups to anon, authenticated;
