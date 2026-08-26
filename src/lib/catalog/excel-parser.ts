import ExcelJS from "exceljs";
import { ParsedProductSchema, COLUMN_ALIASES, type ParsedProduct } from "./schema";

interface HeaderMap {
  sku: number | null;
  name: number | null;
  unit_price: number | null;
  unit: number | null;
  category: number | null;
  stock: number | null;
}

function normalize(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function matchHeader(cell: unknown, aliases: readonly string[]): boolean {
  const val = normalize(cell);
  return aliases.some((a) => val === normalize(a));
}

function buildHeaderMap(headerRow: ExcelJS.Row): HeaderMap {
  const map: HeaderMap = { sku: null, name: null, unit_price: null, unit: null, category: null, stock: null };
  headerRow.eachCell((cell, colNumber) => {
    if (matchHeader(cell.value, COLUMN_ALIASES.sku) && map.sku === null) map.sku = colNumber;
    else if (matchHeader(cell.value, COLUMN_ALIASES.name) && map.name === null) map.name = colNumber;
    else if (matchHeader(cell.value, COLUMN_ALIASES.unit_price) && map.unit_price === null) map.unit_price = colNumber;
    else if (matchHeader(cell.value, COLUMN_ALIASES.unit) && map.unit === null) map.unit = colNumber;
    else if (matchHeader(cell.value, COLUMN_ALIASES.category) && map.category === null) map.category = colNumber;
    else if (matchHeader(cell.value, COLUMN_ALIASES.stock) && map.stock === null) map.stock = colNumber;
  });
  return map;
}

function readCell(row: ExcelJS.Row, col: number | null): unknown {
  if (col === null) return null;
  const val = row.getCell(col).value;
  // ExcelJS returns rich text objects for formatted cells; extract plain text.
  if (val && typeof val === "object" && "richText" in val) {
    return (val.richText as Array<{ text: string }>).map((r) => r.text).join("");
  }
  if (val && typeof val === "object" && "text" in val) {
    return (val as { text: string }).text;
  }
  return val;
}

function toNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  const cleaned = String(val).replace(/[$,\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export interface ExcelParseResult {
  products: ParsedProduct[];
  errors: Array<{ row: number; reason: string }>;
  detected_columns: HeaderMap;
  total_rows: number;
}

export async function parseExcelCatalog(buffer: ArrayBuffer): Promise<ExcelParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { products: [], errors: [{ row: 0, reason: "empty_workbook" }], detected_columns: { sku: null, name: null, unit_price: null, unit: null, category: null, stock: null }, total_rows: 0 };
  }

  const headerRow = sheet.getRow(1);
  const cols = buildHeaderMap(headerRow);

  if (cols.name === null || cols.unit_price === null) {
    return {
      products: [],
      errors: [{ row: 1, reason: "missing_required_columns: name and unit_price columns are required" }],
      detected_columns: cols,
      total_rows: sheet.rowCount - 1,
    };
  }

  const products: ParsedProduct[] = [];
  const errors: Array<{ row: number; reason: string }> = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    const nameRaw = readCell(row, cols.name);
    const priceRaw = readCell(row, cols.unit_price);

    // Skip empty rows silently
    if (!nameRaw && !priceRaw) return;

    const name = String(nameRaw ?? "").trim();
    const price = toNumber(priceRaw);

    if (!name) {
      errors.push({ row: rowNumber, reason: "missing_name" });
      return;
    }
    if (price === null || price < 0) {
      errors.push({ row: rowNumber, reason: `invalid_price: ${priceRaw}` });
      return;
    }

    const raw = {
      sku: cols.sku ? String(readCell(row, cols.sku) ?? "").trim() || null : null,
      name,
      description: null,
      unit_price: price,
      unit: cols.unit ? String(readCell(row, cols.unit) ?? "pieza").trim() || "pieza" : "pieza",
      category: cols.category ? String(readCell(row, cols.category) ?? "").trim() || null : null,
      stock: cols.stock ? Math.max(0, Math.floor(toNumber(readCell(row, cols.stock)) ?? 0)) : 0,
      aliases: [],
      photo_url: null,
    };

    const parsed = ParsedProductSchema.safeParse(raw);
    if (parsed.success) {
      products.push(parsed.data);
    } else {
      errors.push({ row: rowNumber, reason: parsed.error.issues[0]?.message ?? "validation_failed" });
    }
  });

  return { products, errors, detected_columns: cols, total_rows: sheet.rowCount - 1 };
}
