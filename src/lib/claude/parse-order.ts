import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaude } from "./client";

// Structured output schema — Claude fills exactly this shape.
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

const SYSTEM_PROMPT = `Eres el motor de pedidos de Nano-Almacén, un sistema para tienditas y abarrotes en México que reciben pedidos por WhatsApp.

Tu única tarea: leer el mensaje del cliente y devolver una estructura de pedido normalizada.

REGLAS:
1. Detecta la INTENCIÓN del mensaje:
   - "order": el cliente está pidiendo productos ("5 coronas", "2 kilos de tortillas")
   - "question": pregunta sobre horarios, precios, disponibilidad, ubicación
   - "complaint": queja o reclamo
   - "greeting": solo saludo o cortesía ("buenas", "hola", "gracias")
   - "cancel": quiere cancelar un pedido ("cancélamelo", "ya no lo quiero")
   - "other": cualquier otra cosa (chismes, spam, etc.)

2. Extrae ITEMS solo si intent="order". Para cada producto:
   - "query": el nombre COMO EL CLIENTE LO ESCRIBIÓ (ej: "coronitas", "chelas", "sabritas de sal"). NO normalices marcas.
   - "quantity": cantidad numérica. Convierte fracciones y palabras:
       * "una", "un", "uno" → 1
       * "un par" → 2
       * "media docena" → 6
       * "docena" → 12
       * "1/2 kilo" → 0.5 (cuando aplica a peso)
       * Si no se especifica cantidad y hay un producto claro, usa 1
   - "unit": unidad SI el cliente la mencionó explícitamente ("kilo", "litro", "botella", "bolsa", "caja", "six", "cartón"). null si no.
   - "notes": cualquier qualifier del producto ("frío", "grande", "de dieta", "para llevar"). null si no.

3. "confidence": qué tan seguro estás de la extracción completa (0.0 a 1.0).
   - 1.0 = mensaje claro y sin ambigüedad ("5 coronas y 2 sabritas")
   - 0.6-0.8 = alguna ambigüedad menor ("mándame lo de siempre")
   - 0.3-0.5 = mensaje difícil de parsear
   - 0.0-0.2 = no sabes qué quiere

4. "reply_suggestion": mensaje corto (máx 160 caracteres) en español mexicano informal para responder al cliente. Confirma el pedido si es order, responde saludo si es greeting, pide más info si es question ambigua.

5. "language": idioma detectado del mensaje.
   - "es-MX" si detectas mexicanismos ("chelas", "papas", "elote", "n'ombre")
   - "es" si es español neutro
   - "en" si es inglés
   - "other" cualquier otro

6. "notes": observación breve si hay algo raro (mensaje muy largo, mezcla idiomas, spam sospechoso, etc.). null si todo normal.

CONTEXTO CULTURAL MX:
- "chela" o "cheve" = cerveza (asume marca genérica si no dicen)
- "papas" solas = Sabritas o similar (frituras). "papas naturales" = producto fresco.
- "boing", "jarritos", "peñafiel", "yoli" = refrescos MX
- "gansito", "pingüinos", "mamut", "principe" = pan/dulce Marinela/Bimbo
- "6" o "six" solo = six pack de cerveza
- "cigarros marlboro rojos" = tabaco (asume normal, no light, no menthol)
- Números escritos: procesa "cinco" = 5, "diez" = 10, "veinte" = 20

NO INVENTES ITEMS. Si el mensaje dice "tengo hambre", intent="other", items=[].
NO NORMALIZES marcas a un catálogo. El sistema hace matching después.
NO agregues productos que el cliente no mencionó explícitamente.`;

export interface ParseOrderInput {
  message: string;
  tenantName?: string;
  customerName?: string | null;
}

export async function parseOrder(
  input: ParseOrderInput
): Promise<ParsedOrder> {
  const client = getClaude();

  const userContext = [
    input.tenantName ? `Tiendita: ${input.tenantName}` : null,
    input.customerName ? `Cliente: ${input.customerName}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const userContent = userContext
    ? `[${userContext}]\n\nMensaje del cliente:\n"${input.message}"`
    : `Mensaje del cliente:\n"${input.message}"`;

  const response = await client.messages.parse({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
    output_config: {
      format: zodOutputFormat(ParsedOrderSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return structured output");
  }

  return response.parsed_output;
}
