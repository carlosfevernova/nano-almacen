// GET  /api/fiado?tenant_id=xxx           → list fiados con mora (via v_fiados_con_mora)
// POST /api/fiado?tenant_id=xxx           → registra movimiento
//   body: { customer_id, tipo: 'cargo'|'abono', monto, order_id?, metodo_pago?, notas?, limite_credito? }
//
// Usa RPC registrar_fiado_movimiento() para atomicidad (upsert fiado + insert mov + trigger update saldo).

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MovimientoPayload {
  customer_id?: string;
  tipo?: "cargo" | "abono";
  monto?: number;
  order_id?: string | null;
  metodo_pago?: "efectivo" | "transferencia" | "tarjeta" | "oxxo" | "otro" | null;
  notas?: string | null;
  limite_credito?: number | null;
}

function requireTenantId(request: NextRequest): { tenantId: string } | NextResponse {
  const tenantId = request.nextUrl.searchParams.get("tenant_id")?.trim();
  if (!tenantId) {
    return NextResponse.json({ error: "missing_tenant_id" }, { status: 400 });
  }
  return { tenantId };
}

function requireSupabase(): NextResponse | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const guard = requireTenantId(request);
  if (guard instanceof NextResponse) return guard;
  const supabaseErr = requireSupabase();
  if (supabaseErr) return supabaseErr;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("v_fiados_con_mora")
    .select("*")
    .eq("tenant_id", guard.tenantId)
    .order("saldo_actual", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "list_failed", detail: error.message }, { status: 500 });
  }

  const total_saldo = (data ?? []).reduce((acc, f) => acc + Number(f.saldo_actual ?? 0), 0);
  const morosos = (data ?? []).filter((f) => (f.dias_sin_abono ?? 0) > 15 && Number(f.saldo_actual ?? 0) > 0);
  const activos = (data ?? []).filter((f) => Number(f.saldo_actual ?? 0) > 0);

  return NextResponse.json({
    ok: true,
    count: (data ?? []).length,
    total_saldo,
    activos_count: activos.length,
    morosos_count: morosos.length,
    fiados: data ?? [],
  });
}

export async function POST(request: NextRequest) {
  const guard = requireTenantId(request);
  if (guard instanceof NextResponse) return guard;
  const supabaseErr = requireSupabase();
  if (supabaseErr) return supabaseErr;

  let body: MovimientoPayload;
  try {
    body = (await request.json()) as MovimientoPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { customer_id, tipo, monto } = body;
  if (!customer_id) return NextResponse.json({ error: "missing_customer_id" }, { status: 400 });
  if (tipo !== "cargo" && tipo !== "abono") return NextResponse.json({ error: "invalid_tipo", hint: "cargo | abono" }, { status: 400 });
  if (typeof monto !== "number" || monto <= 0 || !Number.isFinite(monto)) {
    return NextResponse.json({ error: "invalid_monto", hint: "number > 0" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("registrar_fiado_movimiento", {
    _tenant_id: guard.tenantId,
    _customer_id: customer_id,
    _tipo: tipo,
    _monto: monto,
    _order_id: body.order_id ?? null,
    _metodo_pago: body.metodo_pago ?? null,
    _notas: body.notas ?? null,
    _limite_credito: body.limite_credito ?? null,
  });

  if (error) {
    const msg = error.message ?? String(error);
    const status = msg.includes("abono_on_zero_balance") ? 409 : 500;
    return NextResponse.json({ error: "rpc_failed", detail: msg }, { status });
  }

  return NextResponse.json({ ok: true, result: data });
}
