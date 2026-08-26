-- ============================================================================
-- Nano-Almacén — Migration 003: Fiado (cuentas por cobrar cliente)
-- Sprint B · Feature #2 · 2026-08-26
--
-- KILLER cultural MX: todos los tenderos llevan libreta de fiado.
-- Treinta lo hace básico, Alegra/Bind no lo tienen bien. Diferenciador core.
-- ============================================================================

-- Tabla principal: 1 fiado por cliente (upsert unique tenant_id + customer_id)
create table public.fiados (
  id                        uuid primary key default uuid_generate_v4(),
  tenant_id                 uuid not null references public.tenants(id) on delete cascade,
  customer_id               uuid not null references public.customers(id) on delete cascade,
  saldo_actual              numeric(10,2) not null default 0 check (saldo_actual >= 0),
  limite_credito            numeric(10,2) check (limite_credito >= 0),
  fecha_ultimo_movimiento   timestamptz default now(),
  fecha_ultimo_abono        timestamptz,
  status                    text not null default 'activo' check (status in ('activo', 'pagado', 'moroso', 'cancelado')),
  notas                     text,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),
  unique (tenant_id, customer_id)
);
create index fiados_tenant_status_idx on public.fiados(tenant_id, status, fecha_ultimo_movimiento desc);
create index fiados_tenant_saldo_idx  on public.fiados(tenant_id, saldo_actual desc) where saldo_actual > 0;

comment on table  public.fiados                is 'Cuenta corriente cliente por tienda. Upsert por (tenant_id, customer_id).';
comment on column public.fiados.saldo_actual  is 'Saldo pendiente de cobro. Nunca negativo (no pre-pagos).';
comment on column public.fiados.status        is 'activo=con saldo · pagado=saldo=0 · moroso=>15d sin abono · cancelado=incobrable';

-- Movimientos: audit trail cargo/abono
create table public.fiado_movimientos (
  id             uuid primary key default uuid_generate_v4(),
  fiado_id       uuid not null references public.fiados(id) on delete cascade,
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  tipo           text not null check (tipo in ('cargo', 'abono')),
  monto          numeric(10,2) not null check (monto > 0),
  saldo_despues  numeric(10,2) not null check (saldo_despues >= 0),
  order_id       uuid references public.orders(id),
  metodo_pago    text check (metodo_pago in ('efectivo', 'transferencia', 'tarjeta', 'oxxo', 'otro')),
  notas          text,
  created_at     timestamptz default now()
);
create index fiado_mov_fiado_idx  on public.fiado_movimientos(fiado_id, created_at desc);
create index fiado_mov_tenant_idx on public.fiado_movimientos(tenant_id, created_at desc);

comment on column public.fiado_movimientos.saldo_despues is 'Snapshot saldo post-movimiento. Permite reconstruir historial sin recomputar.';

-- Trigger: actualizar fiado.saldo_actual + fechas al insertar movimiento
create or replace function public.handle_fiado_movimiento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_saldo numeric(10,2);
begin
  -- Compute new saldo
  select
    case when new.tipo = 'cargo' then coalesce(saldo_actual, 0) + new.monto
         else greatest(coalesce(saldo_actual, 0) - new.monto, 0)
    end
    into new_saldo
    from public.fiados
    where id = new.fiado_id;

  -- Snapshot saldo_despues on the movement row
  new.saldo_despues := new_saldo;

  -- Update parent fiado
  update public.fiados
    set saldo_actual = new_saldo,
        fecha_ultimo_movimiento = new.created_at,
        fecha_ultimo_abono = case when new.tipo = 'abono' then new.created_at else fecha_ultimo_abono end,
        status = case
          when new_saldo = 0 then 'pagado'
          when new.tipo = 'abono' then 'activo'  -- reset moroso al abonar
          else status
        end,
        updated_at = now()
    where id = new.fiado_id;

  return new;
end;
$$;

create trigger fiado_movimiento_updates_saldo
  before insert on public.fiado_movimientos
  for each row execute function public.handle_fiado_movimiento();

-- Trigger updated_at en fiados
create trigger fiados_updated_at before update on public.fiados
  for each row execute function public.handle_updated_at();

-- Vista helper: fiados con días de mora + info cliente (WhatsApp para reminder)
create or replace view public.v_fiados_con_mora as
select
  f.id,
  f.tenant_id,
  f.customer_id,
  c.name as customer_name,
  c.whatsapp_phone,
  f.saldo_actual,
  f.limite_credito,
  f.status,
  f.fecha_ultimo_movimiento,
  f.fecha_ultimo_abono,
  extract(day from (now() - f.fecha_ultimo_movimiento))::int as dias_desde_ultimo_movimiento,
  extract(day from (now() - coalesce(f.fecha_ultimo_abono, f.created_at)))::int as dias_sin_abono,
  f.notas,
  f.created_at,
  f.updated_at
from public.fiados f
join public.customers c on c.id = f.customer_id;

comment on view public.v_fiados_con_mora is
  'Fiados enriched con customer name/WA + días mora calculados. Uso: dashboard + reportes.';

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.fiados             enable row level security;
alter table public.fiado_movimientos  enable row level security;

create policy "fiados_all_tenant"
  on public.fiados for all
  using (public.is_tenant_member(tenant_id));

create policy "fiado_movimientos_all_tenant"
  on public.fiado_movimientos for all
  using (public.is_tenant_member(tenant_id));

-- ============================================================================
-- RPC: crear/actualizar fiado + movimiento en 1 tx atómica
-- ============================================================================

create or replace function public.registrar_fiado_movimiento(
  _tenant_id     uuid,
  _customer_id   uuid,
  _tipo          text,
  _monto         numeric,
  _order_id      uuid default null,
  _metodo_pago   text default null,
  _notas         text default null,
  _limite_credito numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  fiado_row  public.fiados;
  mov_row    public.fiado_movimientos;
begin
  -- Validar tipo
  if _tipo not in ('cargo', 'abono') then
    raise exception 'invalid_tipo: %', _tipo;
  end if;
  if _monto <= 0 then
    raise exception 'invalid_monto_must_be_positive: %', _monto;
  end if;

  -- Upsert fiado (create si no existe, get si existe)
  insert into public.fiados (tenant_id, customer_id, saldo_actual, limite_credito, status)
  values (_tenant_id, _customer_id, 0, _limite_credito, 'activo')
  on conflict (tenant_id, customer_id) do update
    set limite_credito = coalesce(excluded.limite_credito, public.fiados.limite_credito),
        updated_at = now()
  returning * into fiado_row;

  -- Si es abono y saldo actual = 0, error (no puedes abonar a fiado en 0)
  if _tipo = 'abono' and fiado_row.saldo_actual = 0 then
    raise exception 'abono_on_zero_balance: fiado ya está en 0';
  end if;

  -- Insertar movimiento (trigger actualiza saldo_actual)
  insert into public.fiado_movimientos (fiado_id, tenant_id, tipo, monto, saldo_despues, order_id, metodo_pago, notas)
  values (fiado_row.id, _tenant_id, _tipo, _monto, 0, _order_id, _metodo_pago, _notas)
  returning * into mov_row;

  -- Re-fetch fiado con saldo actualizado
  select * into fiado_row from public.fiados where id = fiado_row.id;

  return jsonb_build_object(
    'fiado', to_jsonb(fiado_row),
    'movimiento', to_jsonb(mov_row)
  );
end;
$$;

grant execute on function public.registrar_fiado_movimiento(uuid, uuid, text, numeric, uuid, text, text, numeric) to authenticated;
grant execute on function public.registrar_fiado_movimiento(uuid, uuid, text, numeric, uuid, text, text, numeric) to service_role;

-- Grants
grant select, insert, update, delete on public.fiados            to authenticated;
grant select, insert, update, delete on public.fiado_movimientos to authenticated;
grant select                          on public.v_fiados_con_mora to authenticated;
