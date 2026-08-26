import { z } from "zod";

// Normalized product row — output of any parser (Excel, Vision, manual).
export const ParsedProductSchema = z.object({
  sku: z.string().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  unit_price: z.number().min(0),
  unit: z.string().default("pieza"),
  category: z.string().nullable(),
  stock: z.number().int().min(0).default(0),
  aliases: z.array(z.string()).default([]),
  photo_url: z.string().url().nullable(),
});

export type ParsedProduct = z.infer<typeof ParsedProductSchema>;

// Common column-name aliases from real MX tiendita/proveedor Excels.
export const COLUMN_ALIASES = {
  sku: ["sku", "código", "codigo", "clave", "id", "cod", "articulo", "artículo"],
  name: ["nombre", "producto", "descripcion", "descripción", "articulo", "artículo"],
  unit_price: ["precio", "precio venta", "precio_venta", "price", "costo", "unit price"],
  unit: ["unidad", "unit", "medida", "presentación", "presentacion"],
  category: ["categoría", "categoria", "linea", "línea", "familia", "tipo"],
  stock: ["stock", "existencia", "inventario", "cantidad", "qty"],
} as const;
