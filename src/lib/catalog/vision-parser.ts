import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ParsedProductSchema, type ParsedProduct } from "./schema";

const SYSTEM_PROMPT = `Eres un asistente que extrae productos de una foto para un catálogo de tiendita mexicana.

Recibes una foto (puede ser: un estante de tienda, una lista escrita a mano, un menú, un ticket, o una foto individual de producto).

Extrae CADA producto visible con:
- "name": nombre visible del producto (marca + producto si aplica, ej: "Coca Cola 600ml")
- "sku": código de barras/SKU si lo ves impreso, o null
- "unit_price": precio si lo ves impreso, o null
- "unit": presentación si aplica ("botella", "lata", "bolsa", "kilo", "600ml"), o null
- "category": clasificación breve ("refresco", "cerveza", "abarrote", "botana", "lácteo"), o null
- "confidence_note": si algo no lo distingues bien, describe la duda brevemente

Si la foto no tiene productos claros (foto borrosa, escena no relacionada), devuelve items:[] con "notes" explicando.

FORMATO ESTRICTO — solo JSON:
{
  "items": [
    { "name": string, "sku": string|null, "unit_price": number|null, "unit": string|null, "category": string|null, "confidence_note": string|null }
  ],
  "notes": string|null
}`;

const VisionResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      sku: z.string().nullable(),
      unit_price: z.number().nullable(),
      unit: z.string().nullable(),
      category: z.string().nullable(),
      confidence_note: z.string().nullable(),
    })
  ),
  notes: z.string().nullable(),
});

let cached: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (cached) return cached;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY not configured");
  cached = new GoogleGenAI({ apiKey });
  return cached;
}

export interface VisionParseResult {
  products: ParsedProduct[];
  notes: string | null;
  low_confidence_notes: string[];
}

export async function parseImageCatalog(
  imageBase64: string,
  mimeType: string
): Promise<VisionParseResult> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: "Extrae los productos visibles en esta foto." },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini Vision returned empty response");

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`Vision returned invalid JSON: ${text.slice(0, 200)}`);
  }

  const parsed = VisionResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Vision output failed validation: ${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}`
    );
  }

  const products: ParsedProduct[] = [];
  const lowConfidence: string[] = [];

  for (const item of parsed.data.items) {
    if (item.confidence_note) lowConfidence.push(`${item.name}: ${item.confidence_note}`);

    const productParsed = ParsedProductSchema.safeParse({
      sku: item.sku,
      name: item.name,
      description: null,
      unit_price: item.unit_price ?? 0, // default 0 if not seen, tendero corrige
      unit: item.unit ?? "pieza",
      category: item.category,
      stock: 0,
      aliases: [],
      photo_url: null,
    });

    if (productParsed.success) products.push(productParsed.data);
  }

  return {
    products,
    notes: parsed.data.notes,
    low_confidence_notes: lowConfidence,
  };
}
