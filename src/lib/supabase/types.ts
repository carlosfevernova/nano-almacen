// Manually maintained until we auto-generate via `supabase gen types typescript`.
// Regenerate: `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts`

export type TenantPlan = 'free' | 'starter' | 'growth' | 'pro';
export type TenantStatus = 'active' | 'suspended' | 'canceled';
export type TenantUserRole = 'owner' | 'staff' | 'viewer';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'oxxo' | 'mercadopago';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type OrderSource = 'whatsapp' | 'web' | 'manual';
export type WaDirection = 'inbound' | 'outbound';
export type WaMessageType = 'text' | 'image' | 'audio' | 'document' | 'system';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  rfc: string | null;
  whatsapp_phone_id: string | null;
  whatsapp_display_number: string | null;
  timezone: string;
  currency: string;
  plan: TenantPlan;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  photo_url: string | null;
  category: string | null;
  stock: number;
  active: boolean;
  aliases: string[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  whatsapp_phone: string;
  name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  status: OrderStatus;
  subtotal: number;
  total: number;
  notes: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  cfdi_uuid: string | null;
  cfdi_pdf_url: string | null;
  cfdi_xml_url: string | null;
  source: OrderSource;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  notes: string | null;
  created_at: string;
}

export interface WhatsappConversation {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  order_id: string | null;
  direction: WaDirection;
  message_type: WaMessageType;
  content: string;
  whatsapp_message_id: string | null;
  parsed_intent: unknown | null;
  parse_confidence: number | null;
  created_at: string;
}
