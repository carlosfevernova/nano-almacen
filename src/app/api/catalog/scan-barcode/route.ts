// Sprint B #3: GTIN scan foto — alta rápida productos vía código de barras.
// Gemini Vision extrae GTIN + nombre + precio si visibles en la imagen.
// Lookup en products del tenant → devuelve match existente O sugiere alta.
//
// POST multipart/form-data:
//   file: imagen (jpg/png/webp) con producto o código de barras
//   tenant_id: uuid
//
// Response:
//   { ok, source: 'vision', gtin, product_name, price_hint, match: {existing_product} | null,
//     suggestion: { sku, name, unit_price, ... } (para pre-fill form alta) }

import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ScanResultSchema = z.object({
  gtin: z.string().nullable(),
  product_name: z.string().nullable(),
  brand: z.string().nullable(),
  size_or_variant: z.string().nullable(),
  price_visible: z.number().nullable(),
  category_hint: z.string().nullable(),
  confidence_note: z.string().nullable(),
});

const SYSTEM_PROMPT = `Eres un asistente de captura rápida para catálogos de tienditas mexicanas.

Recibes UNA foto — puede ser: producto entero, código de barras (EAN/GTIN 13 dígitos), etiqueta de precio, o combinación. Objetivo: extraer datos para dar de alta el producto en 1 tap.

Extrae:
- "gtin": código de barras 8-14 dígitos si visible; SOLO números (sin espacios ni guiones). null si no.
- "product_name": nombre completo visible ("Coca Cola 600ml", "Sabritas Original 45g"). null si no distingues.
- "brand": marca principal ("Coca Cola", "Sabritas", "Bimbo"). null si no.
- "size_or_variant": presentación ("600ml", "45g", "6 pack"). null si no.
- "price_visible": número si ves etiqueta de precio ("$18.50" → 18.5). null si no.
- "category_hint": clasificación breve ("refresco", "botana", "cerveza", "lácteo", "abarrote"). null si no.
- "confidence_note": si algo no distingues, describe brevemente. null si todo claro.

REGLAS:
- NO inventes GTIN. Si no ves código, null.
- Si ves múltiples productos en la foto, elige el más prominente / centrado.
- Foto borrosa o irrelevante: todos los campos null + confidence_note explicando.

FORMATO ESTRICTO — solo JSON:
{ "gtin": string|null, "product_name": string|null, "brand": string|null,
  "size_or_variant": string|null, "price_visible": number|null,
  "category_hint": string|null, "confidence_note": string|null }`;

let cached: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY not configured");
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const file = form.get("file");
  const tenantId = String(form.get("tenant_id") ?? "").trim();

  if (!(file instanceof File)) return NextResponse.json({ error: "missing_file" }, { status: 400 });
  if (!tenantId) return NextResponse.json({ error: "missing_tenant_id" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "file_too_large", hint: "max 5MB" }, { status: 413 });

  const mime = file.type || "application/octet-stream";
  if (!IMAGE_MIME_TYPES.includes(mime)) {
    return NextResponse.json({ error: "unsupported_type", detail: mime, hint: "jpeg/png/webp only" }, { status: 415 });
  }

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured", hint: "Set GOOGLE_GENAI_API_KEY" }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const started = Date.now();
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const ai = getClient();

  let visionResult: z.infer<typeof ScanResultSchema>;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: mime, data: base64 } },
            { text: "Extrae los datos del producto de esta foto." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 400,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Vision returned empty response");

    const parsed = ScanResultSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "vision_schema_failed", detail: parsed.error.issues.map((i) => i.message).join("; ") },
        { status: 502 }
      );
    }
    visionResult = parsed.data;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "vision_failed", detail }, { status: 502 });
  }

  // Lookup existing product in tenant's catalog if GTIN detected
  const supabase = createServiceClient();
  let match: unknown = null;

  if (visionResult.gtin) {
    const { data } = await supabase
      .from("products")
      .select("id,sku,name,unit_price,stock,category,active")
      .eq("tenant_id", tenantId)
      .eq("sku", visionResult.gtin)
      .maybeSingle();
    match = data;
  }

  // Build suggestion for pre-fill "add product" form
  const suggestion = visionResult.product_name
    ? {
        sku: visionResult.gtin,
        name: [visionResult.brand, visionResult.product_name, visionResult.size_or_variant]
          .filter(Boolean)
          .join(" ")
          .trim() || visionResult.product_name,
        unit_price: visionResult.price_visible ?? 0,
        unit: visionResult.size_or_variant ?? "pieza",
        category: visionResult.category_hint,
        stock: 0,
      }
    : null;

  return NextResponse.json({
    ok: true,
    source: "vision",
    elapsed_ms: Date.now() - started,
    scan: visionResult,
    match,
    suggestion,
    action_hint: match
      ? "product_exists"
      : suggestion
        ? "ready_to_add"
        : "unclear_image",
  });
}
