// Server-side queries reusables para dashboard/reportes.
// Todas usan service role (bypass RLS) — solo consumir en server components.

import { createServiceClient } from "./server";
import type { Tenant, Product, Order, Customer, WhatsappConversation } from "./types";

export interface DashboardData {
  tenant: Tenant | null;
  stats: {
    products_count: number;
    active_products_count: number;
    orders_count: number;
    pending_orders_count: number;
    customers_count: number;
    conversations_count: number;
  };
  recent_orders: (Order & { customer?: Pick<Customer, "name" | "whatsapp_phone"> | null })[];
  recent_conversations: WhatsappConversation[];
  products_preview: Product[];
}

export async function loadDashboardData(tenantId: string): Promise<DashboardData | { error: string }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "supabase_not_configured" };
  }

  const supabase = createServiceClient();

  // Verify tenant
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantErr) return { error: `tenant_query_failed: ${tenantErr.message}` };
  if (!tenant) return { error: `tenant_not_found: ${tenantId}` };

  // Parallel queries for stats + previews
  const [
    productsCountRes,
    activeProductsCountRes,
    ordersCountRes,
    pendingOrdersCountRes,
    customersCountRes,
    conversationsCountRes,
    recentOrdersRes,
    recentConversationsRes,
    productsPreviewRes,
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("active", true),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "pending"),
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("whatsapp_conversations").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase
      .from("orders")
      .select("*, customer:customers(name,whatsapp_phone)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    tenant: tenant as Tenant,
    stats: {
      products_count: productsCountRes.count ?? 0,
      active_products_count: activeProductsCountRes.count ?? 0,
      orders_count: ordersCountRes.count ?? 0,
      pending_orders_count: pendingOrdersCountRes.count ?? 0,
      customers_count: customersCountRes.count ?? 0,
      conversations_count: conversationsCountRes.count ?? 0,
    },
    recent_orders: (recentOrdersRes.data ?? []) as DashboardData["recent_orders"],
    recent_conversations: (recentConversationsRes.data ?? []) as WhatsappConversation[],
    products_preview: (productsPreviewRes.data ?? []) as Product[],
  };
}
