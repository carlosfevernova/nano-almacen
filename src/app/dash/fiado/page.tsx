// /dash/fiado?tenant_id=xxx — UI fiados (server component)
// Tabla con saldo, días mora, status badge, botón "Recordar por WhatsApp"

import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Fiado · Nano-Almacén",
  robots: { index: false, follow: false },
};

interface FiadoPageProps {
  searchParams: Promise<{ tenant_id?: string }>;
}

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface FiadoRow {
  id: string;
  tenant_id: string;
  customer_id: string;
  customer_name: string | null;
  whatsapp_phone: string;
  saldo_actual: number;
  limite_credito: number | null;
  status: string;
  fecha_ultimo_movimiento: string | null;
  fecha_ultimo_abono: string | null;
  dias_desde_ultimo_movimiento: number | null;
  dias_sin_abono: number | null;
  notas: string | null;
}

async function loadFiados(tenantId: string): Promise<{ tenant: { id: string; name: string } | null; fiados: FiadoRow[]; error?: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { tenant: null, fiados: [], error: "supabase_not_configured" };
  }
  const supabase = createServiceClient();

  const [tenantRes, fiadosRes] = await Promise.all([
    supabase.from("tenants").select("id,name").eq("id", tenantId).maybeSingle(),
    supabase
      .from("v_fiados_con_mora")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("saldo_actual", { ascending: false })
      .limit(200),
  ]);

  if (tenantRes.error) return { tenant: null, fiados: [], error: `tenant_query: ${tenantRes.error.message}` };
  if (!tenantRes.data) return { tenant: null, fiados: [], error: "tenant_not_found" };
  if (fiadosRes.error) return { tenant: tenantRes.data as { id: string; name: string }, fiados: [], error: `fiados_query: ${fiadosRes.error.message}` };

  return { tenant: tenantRes.data as { id: string; name: string }, fiados: (fiadosRes.data ?? []) as FiadoRow[] };
}

function buildWaReminderUrl(f: FiadoRow, tenantName: string): string {
  const cleanPhone = f.whatsapp_phone.replace(/[^0-9]/g, "");
  const nombre = f.customer_name?.split(" ")[0] ?? "hola";
  const monto = currencyFmt.format(f.saldo_actual);
  const dias = f.dias_sin_abono ?? 0;
  const msg = `Hola ${nombre}, saludos desde ${tenantName}. Te recordamos que tienes un saldo pendiente de ${monto} desde hace ${dias} día${dias === 1 ? "" : "s"}. ¿Cuándo te podemos apoyar para cerrarlo? Gracias 🙏`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

function moraStyle(dias: number | null): { label: string; cls: string } {
  const d = dias ?? 0;
  if (d <= 7) return { label: `${d}d`, cls: "text-emerald-700 bg-emerald-50" };
  if (d <= 15) return { label: `${d}d`, cls: "text-amber-700 bg-amber-50" };
  return { label: `${d}d`, cls: "text-red-700 bg-red-50" };
}

function statusBadge(status: string): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    activo: { label: "Activo", cls: "bg-emerald-100 text-emerald-800" },
    pagado: { label: "Pagado", cls: "bg-neutral-100 text-neutral-700" },
    moroso: { label: "Moroso", cls: "bg-red-100 text-red-800" },
    cancelado: { label: "Cancelado", cls: "bg-neutral-200 text-neutral-500 line-through" },
  };
  return map[status] ?? { label: status, cls: "bg-neutral-100 text-neutral-700" };
}

export default async function FiadoPage({ searchParams }: FiadoPageProps) {
  const params = await searchParams;
  const tenantId = params.tenant_id?.trim();

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">Falta tenant_id</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Ejemplo: <code className="rounded bg-neutral-100 px-1 text-xs">/dash/fiado?tenant_id=xxx</code>
          </p>
        </div>
      </div>
    );
  }

  const { tenant, fiados, error } = await loadFiados(tenantId);

  if (error && !fiados.length) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-red-900">Error</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const total_saldo = fiados.reduce((acc, f) => acc + Number(f.saldo_actual), 0);
  const con_saldo = fiados.filter((f) => Number(f.saldo_actual) > 0);
  const morosos = con_saldo.filter((f) => (f.dias_sin_abono ?? 0) > 15);
  const alertaMedia = con_saldo.filter((f) => (f.dias_sin_abono ?? 0) > 7 && (f.dias_sin_abono ?? 0) <= 15);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="font-display text-lg font-semibold text-neutral-900">Nano-Almacén</Link>
            <span className="text-neutral-300">/</span>
            <Link href={`/dash?tenant_id=${tenantId}`} className="text-neutral-700 hover:text-neutral-900">Dashboard</Link>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-700">Fiado</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>Tiendita:</span>
            <span className="font-medium text-neutral-900">{tenant?.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* KPI hero */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Saldo total</div>
            <div className="mt-2 font-display text-3xl font-semibold tabular-nums text-neutral-900">
              {currencyFmt.format(total_saldo)}
            </div>
            <div className="mt-1 text-xs text-neutral-500">{con_saldo.length} cliente{con_saldo.length === 1 ? "" : "s"} con saldo</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Moroso {'>'}15 días</div>
            <div className="mt-2 font-display text-3xl font-semibold tabular-nums text-red-700">{morosos.length}</div>
            <div className="mt-1 text-xs text-neutral-500">{currencyFmt.format(morosos.reduce((a, f) => a + Number(f.saldo_actual), 0))}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Alerta 8-15 días</div>
            <div className="mt-2 font-display text-3xl font-semibold tabular-nums text-amber-700">{alertaMedia.length}</div>
            <div className="mt-1 text-xs text-neutral-500">{currencyFmt.format(alertaMedia.reduce((a, f) => a + Number(f.saldo_actual), 0))}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="text-sm text-neutral-500">Al corriente</div>
            <div className="mt-2 font-display text-3xl font-semibold tabular-nums text-emerald-700">
              {con_saldo.filter((f) => (f.dias_sin_abono ?? 0) <= 7).length}
            </div>
            <div className="mt-1 text-xs text-neutral-500">0-7 días</div>
          </div>
        </section>

        {/* Table */}
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Cuentas por cobrar
              <span className="ml-3 text-sm font-normal text-neutral-500">{fiados.length} total</span>
            </h2>
          </div>

          {fiados.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              Sin fiados registrados. Cuando registres un cargo por WhatsApp aparece aquí.
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                    <th className="px-4 py-3 text-center">Días sin abono</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-left">Último movimiento</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {fiados.map((f) => {
                    const mora = moraStyle(f.dias_sin_abono);
                    const st = statusBadge(f.status);
                    const waUrl = buildWaReminderUrl(f, tenant?.name ?? "tu tiendita");
                    const conSaldo = Number(f.saldo_actual) > 0;
                    return (
                      <tr key={f.id} className={conSaldo ? "" : "opacity-60"}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{f.customer_name ?? "Sin nombre"}</div>
                          <div className="text-xs text-neutral-500 tabular-nums">{f.whatsapp_phone}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-neutral-900">
                          {currencyFmt.format(Number(f.saldo_actual))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${mora.cls}`}>
                            {mora.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-600">
                          {f.fecha_ultimo_movimiento ? dateFmt.format(new Date(f.fecha_ultimo_movimiento)) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {conSaldo && f.whatsapp_phone ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              💬 Recordar
                            </a>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {fiados.length >= 200 && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-center text-xs text-neutral-500">
                  Mostrando primeros 200. Paginación disponible en próximas versiones.
                </div>
              )}
            </div>
          )}
        </section>

        {/* Cómo cargar */}
        <section className="mt-10 rounded-xl border border-neutral-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-neutral-900">Cómo registrar un fiado</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Actualmente vía API. Próxima versión: botón inline aquí. Ejemplo curl:
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-neutral-950 p-3 text-xs text-emerald-300">
            <code>{`curl -X POST 'https://nano-almacen.vercel.app/api/fiado?tenant_id=${tenantId}' \\
  -H 'Content-Type: application/json' \\
  -d '{"customer_id":"<uuid>","tipo":"cargo","monto":150,"notas":"5 cocas + 2 sabritas"}'`}</code>
          </pre>
        </section>
      </main>
    </div>
  );
}
