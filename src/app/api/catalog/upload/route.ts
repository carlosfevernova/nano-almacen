import { NextResponse } from "next/server";
import { parseExcelCatalog } from "@/lib/catalog/excel-parser";
import { parseImageCatalog } from "@/lib/catalog/vision-parser";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EXCEL_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const file = form.get("file");
  const tenantId = String(form.get("tenant_id") ?? "").trim();
  const commit = String(form.get("commit") ?? "false") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!tenantId) {
    return NextResponse.json({ error: "missing_tenant_id" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "file_too_large", hint: "max 10MB" }, { status: 413 });
  }

  const mime = file.type || "application/octet-stream";
  const isExcel = EXCEL_MIME_TYPES.includes(mime) || file.name.toLowerCase().endsWith(".xlsx");
  const isImage = IMAGE_MIME_TYPES.includes(mime);

  if (!isExcel && !isImage) {
    return NextResponse.json(
      { error: "unsupported_file_type", detail: mime, hint: "xlsx or jpeg/png/webp" },
      { status: 415 }
    );
  }

  const started = Date.now();

  try {
    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const result = await parseExcelCatalog(buffer);
      const persisted = commit && result.products.length > 0
        ? await persistProducts(tenantId, result.products)
        : 0;
      return NextResponse.json({
        ok: true,
        source: "excel",
        elapsed_ms: Date.now() - started,
        detected_columns: result.detected_columns,
        total_rows: result.total_rows,
        product_count: result.products.length,
        error_count: result.errors.length,
        errors: result.errors.slice(0, 20),
        products: result.products.slice(0, 100),
        persisted,
      });
    }

    // image path
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const result = await parseImageCatalog(base64, mime);
    const persisted = commit && result.products.length > 0
      ? await persistProducts(tenantId, result.products)
      : 0;
    return NextResponse.json({
      ok: true,
      source: "vision",
      elapsed_ms: Date.now() - started,
      product_count: result.products.length,
      products: result.products,
      notes: result.notes,
      low_confidence_notes: result.low_confidence_notes,
      persisted,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[catalog/upload] failed", err);
    return NextResponse.json({ error: "parse_failed", detail }, { status: 500 });
  }
}

async function persistProducts(
  tenantId: string,
  products: Array<{ sku: string | null; name: string; unit_price: number; unit: string; category: string | null; stock: number; aliases: string[]; description: string | null; photo_url: string | null }>
): Promise<number> {
  const supabase = createServiceClient();

  // Verify tenant exists (avoid orphan inserts under a fake ID).
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantErr || !tenant) {
    throw new Error(`tenant_not_found: ${tenantId}`);
  }

  const rows = products.map((p) => ({ ...p, tenant_id: tenantId }));

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, {
      onConflict: "tenant_id,sku",
      ignoreDuplicates: false,
    })
    .select("id");

  if (error) {
    throw new Error(`supabase_upsert_failed: ${error.message}`);
  }

  return data?.length ?? 0;
}
