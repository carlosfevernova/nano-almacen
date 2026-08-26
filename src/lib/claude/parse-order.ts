import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

// Structured output schema — the model fills exactly this shape.
export const ParsedOrderSchema = z.object({
  intent: z.enum([
    "order",
    "question",
    "complaint",
    "greeting",
    "cancel",
    "other",
  ]),
  confidence: z.number().min(0).max(1),
  items: z.array(
    z.object({
      query: z.string(),
      quantity: z.number().positive(),
      unit: z.string().nullable(),
      notes: z.string().nullable(),
    })
  ),
  reply_suggestion: z.string(),
  language: z.enum(["es-MX", "es", "en", "other"]),
  notes: z.string().nullable(),
});

export type ParsedOrder = z.infer<typeof ParsedOrderSchema>;

// Google Gemini JSON schema (mirrors Zod above)
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: ["intent", "confidence", "items", "reply_suggestion", "language", "notes"],
  properties: {
    intent: {
      type: Type.STRING,
      enum: ["order", "question", "complaint", "greeting", "cancel", "other"],
    },
    confidence: { type: Type.NUMBER },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["query", "quantity", "unit", "notes"],
        properties: {
          query: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING, nullable: true },
          notes: { type: Type.STRING, nullable: true },
        },
      },
    },
    reply_suggestion: { type: Type.STRING },
    language: { type: Type.STRING, enum: ["es-MX", "es", "en", "other"] },
    notes: { type: Type.STRING, nullable: true },
  },
};

const SYSTEM_PROMPT = `Eres el motor de pedidos de Nano-Almacén, un sistema para tienditas y abarrotes en México que reciben pedidos por WhatsApp.

Tu única tarea: leer el mensaje del cliente y devolver una estructura de pedido normalizada.

REGLAS:
1. Detecta la INTENCIÓN del mensaje:
   - "order": el cliente está pidiendo productos ("5 coronas", "2 kilos de tortillas")
   - "question": pregunta sobre horarios, precios, disponibilidad, ubicación
   - "complaint": queja o reclamo
   - "greeting": solo saludo o cortesía ("buenas", "hola", "gracias")
   - "cancel": quiere cancelar un pedido ("cancélamelo", "ya no lo quiero")
   - "other": cualquier otra cosa

2. Extrae ITEMS solo si intent="order". Para cada producto:
   - "query": el nombre COMO EL CLIENTE LO ESCRIBIÓ (ej: "coronitas", "chelas"). NO normalices marcas.
   - "quantity": cantidad numérica. Convierte fracciones y palabras:
       * "una", "un" → 1 · "un par" → 2 · "media docena" → 6 · "docena" → 12
       * "1/2 kilo" → 0.5 · Si no se especifica cantidad y hay producto claro, usa 1
   - "unit": unidad SI el cliente la mencionó ("kilo", "litro", "botella", "bolsa", "caja", "six", "cartón"). null si no.
   - "notes": qualifier del producto ("frío", "grande", "de dieta"). null si no.

3. "confidence": qué tan seguro estás (0.0 a 1.0).
   - 1.0 = claro y sin ambigüedad ("5 coronas y 2 sabritas")
   - 0.6-0.8 = alguna ambigüedad ("mándame lo de siempre")
   - 0.3-0.5 = mensaje difícil
   - 0.0-0.2 = no sabes qué quiere

4. "reply_suggestion": mensaje corto (máx 160 caracteres) en español mexicano informal.

5. "language": "es-MX" si detectas mexicanismos, "es" español neutro, "en" inglés, "other".

6. "notes": observación breve si hay algo raro. null si todo normal.

CONTEXTO MX:
- "chela"/"cheve" = cerveza (marca genérica si no dicen)
- "papas" solas = Sabritas/frituras. "papas naturales" = fresco.
- "boing", "jarritos", "peñafiel", "yoli" = refrescos MX
- "gansito", "pingüinos", "mamut", "principe" = pan/dulce Bimbo/Marinela
- "6" o "six" solo = six pack cerveza
- Números escritos: "cinco"=5, "diez"=10, "veinte"=20

NO INVENTES ITEMS. Si dice "tengo hambre", intent="other", items=[].
NO NORMALIZES marcas — el sistema hace matching después.`;

let cachedClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY not configured");
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENAI_API_KEY);
}

export interface ParseOrderInput {
  message: string;
  tenantName?: string;
  customerName?: string | null;
}

export async function parseOrder(input: ParseOrderInput): Promise<ParsedOrder> {
  const ai = getClient();

  const userContext = [
    input.tenantName ? `Tiendita: ${input.tenantName}` : null,
    input.customerName ? `Cliente: ${input.customerName}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const userContent = userContext
    ? `[${userContext}]\n\nMensaje del cliente:\n"${input.message}"`
    : `Mensaje del cliente:\n"${input.message}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: userContent,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned empty response");

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
  }

  const parsed = ParsedOrderSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Gemini output failed schema validation: ${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}`
    );
  }

  return parsed.data;
}
