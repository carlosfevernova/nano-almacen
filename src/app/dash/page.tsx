// Sprint B · Día 1: Dashboard tendero mínimo `/dash?tenant_id=xxx`.
// Server component: lee Supabase directo con service role (bypass RLS).
// Auth via query param `tenant_id` (temporal — futuro: session cookie owner).

import { loadDashboardData } from "@/lib/supabase/queries";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Dashboard · Nano-Almacén",
  description: "Panel del tendero — pedidos, catálogo, clientes.",
  robots: { index: false, follow: false },
};

interface DashPageProps {
  searchParams: Promise<{ tenant_id?: string }>;
}

const currencyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const timeFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function DashPage({ searchParams }: DashPageProps) {
  const params = await searchParams;
  const tenantId = params.tenant_id?.trim();

  if (!tenantId) {
    return <MissingTenantView />;
  }

  const data = await loadDashboardData(tenantId);

  if ("error" in data) {
    return <ErrorView error={data.error} tenantId={tenantId} />;
  }

  const { tenant, stats, recent_orders, recent_conversations, products_preview } = data;
  if (!tenant) return <ErrorView error="tenant_not_found" tenantId={tenantId} />;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav simple */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-display text-lg font-semibold text-neutral-900">
              Nano-Almacén
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm text-neutral-700">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>Tiendita:</span>
            <span className="font-medium text-neutral-900">{tenant.name}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
              {tenant.plan}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* KPI Hero */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Productos"
            value={stats.products_count}
            hint={`${stats.active_products_count} activos`}
            accent="emerald"
          />
          <KPICard
            label="Pedidos totales"
            value={stats.orders_count}
            hint={`${stats.pending_orders_count} pendientes`}
            accent="amber"
          />
          <KPICard
            label="Clientes"
            value={stats.customers_count}
            hint="por WhatsApp"
            accent="blue"
          />
          <KPICard
            label="Mensajes WA"
            value={stats.conversations_count}
            hint="conversaciones"
            accent="neutral"
          />
        </section>

        {/* Recent orders */}
        <section className="mt-10">
          <SectionHeader
            title="Pedidos recientes"
            hint={recent_orders.length === 0 ? "Sin pedidos aún" : `${recent_orders.length} últimos`}
          />
          {recent_orders.length === 0 ? (
            <EmptyState message="Cuando lleguen pedidos por WhatsApp aparecen aquí." />
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-left">Pago</th>
                    <th className="px-4 py-3 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">
                          {o.customer?.name || "Cliente sin nombre"}
                        </div>
                        <div className="text-xs text-neutral-500">{o.customer?.whatsapp_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {currencyFmt.format(Number(o.total))}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {o.payment_status === "paid" ? "✓ Pagado" : o.payment_method || "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-neutral-500">
                        {timeFmt.format(new Date(o.created_at))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent WA conversations */}
        <section className="mt-10">
          <SectionHeader
            title="Mensajes recientes"
            hint={
              recent_conversations.length === 0
                ? "Sin mensajes aún"
                : `${recent_conversations.length} últimos`
            }
          />
          {recent_conversations.length === 0 ? (
            <EmptyState message="Cuando conectes tu WhatsApp Business, los mensajes aparecen aquí." />
          ) : (
            <div className="mt-4 space-y-2">
              {recent_conversations.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {c.direction === "inbound" ? "→ Entrante" : "← Saliente"}
                    </span>
                    <span>{timeFmt.format(new Date(c.created_at))}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-neutral-800">{c.content}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Products preview */}
        <section className="mt-10 mb-16">
          <SectionHeader
            title="Catálogo"
            hint={`${stats.products_count} productos totales`}
            action={<Link href="/dash/catalog" className="text-sm text-emerald-700 hover:underline">Gestionar →</Link>}
          />
          {products_preview.length === 0 ? (
            <EmptyState message="Todavía no cargas productos. Sube tu inventario desde /api/catalog/upload." />
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Producto</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products_preview.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{p.name}</div>
                        <div className="text-xs text-neutral-500">{p.sku ?? "sin SKU"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-700">
                        {p.category ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {currencyFmt.format(Number(p.unit_price))}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                        <span className={p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-amber-600" : ""}>
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products_preview.length < stats.products_count && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-center text-xs text-neutral-500">
                  Mostrando {products_preview.length} de {stats.products_count}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function KPICard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent: "emerald" | "amber" | "blue" | "neutral";
}) {
  const accentBg = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    neutral: "bg-neutral-100 text-neutral-700",
  }[accent];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${accentBg}`}>
          {hint}
        </span>
      </div>
      <div className="mt-2 font-display text-4xl font-semibold tabular-nums text-neutral-900">
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-xl font-semibold text-neutral-900">{title}</h2>
        {hint && <span className="text-sm text-neutral-500">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
      {message}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
    confirmed: { label: "Confirmado", cls: "bg-blue-100 text-blue-800" },
    preparing: { label: "Preparando", cls: "bg-purple-100 text-purple-800" },
    out_for_delivery: { label: "En camino", cls: "bg-indigo-100 text-indigo-800" },
    delivered: { label: "Entregado", cls: "bg-emerald-100 text-emerald-800" },
    cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-800" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-neutral-100 text-neutral-800" };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

function MissingTenantView() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-neutral-900">Falta tenant_id</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Este dashboard requiere <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">?tenant_id=xxx</code> en la URL.
        </p>
        <p className="mt-4 text-xs text-neutral-500">
          Ejemplo: <code>/dash?tenant_id=55263cb2-da58-4cb8-9c40-c072f8e98a35</code>
        </p>
      </div>
    </div>
  );
}

function ErrorView({ error, tenantId }: { error: string; tenantId: string }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="font-display text-xl font-semibold text-red-900">No se pudo cargar</h1>
        <p className="mt-2 text-sm text-red-700">
          {error === "tenant_not_found" ? "Tiendita no encontrada" : error === "supabase_not_configured" ? "Supabase no configurado en el servidor" : error}
        </p>
        <p className="mt-4 text-xs text-red-600 font-mono">tenant_id: {tenantId}</p>
      </div>
    </div>
  );
}
