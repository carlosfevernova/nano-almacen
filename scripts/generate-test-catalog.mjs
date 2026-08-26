import ExcelJS from "exceljs";

const products = [
  { sku: "7501055363512", nombre: "Coca Cola 600ml", precio: 18, unidad: "botella", categoria: "refresco", stock: 24 },
  { sku: "7501030463024", nombre: "Sabritas Original 45g", precio: 15, unidad: "bolsa", categoria: "botana", stock: 30 },
  { sku: "7501080411011", nombre: "Corona Extra 355ml", precio: 22, unidad: "botella", categoria: "cerveza", stock: 48 },
  { sku: "7501011191019", nombre: "Bimbollos 6pz", precio: 32, unidad: "bolsa", categoria: "panaderia", stock: 12 },
  { sku: "7501058611321", nombre: "Boing Mango 500ml", precio: 14, unidad: "botella", categoria: "refresco", stock: 20 },
  { sku: "7501000114504", nombre: "Marlboro Rojos 20", precio: 78, unidad: "cajetilla", categoria: "tabaco", stock: 15 },
  { sku: "7501020522110", nombre: "Leche Lala Entera 1L", precio: 27, unidad: "litro", categoria: "lacteo", stock: 18 },
  { sku: "7501055390120", nombre: "Nestea Limon 600ml", precio: 17, unidad: "botella", categoria: "refresco", stock: 22 },
  { sku: "7501000131518", nombre: "Ruffles Queso 45g", precio: 15, unidad: "bolsa", categoria: "botana", stock: 25 },
  { sku: "7500810000105", nombre: "Yoli Sabor Uva 355ml", precio: 12, unidad: "lata", categoria: "refresco", stock: 30 },
];

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet("Catalogo");

ws.columns = [
  { header: "SKU", key: "sku", width: 18 },
  { header: "Nombre", key: "nombre", width: 30 },
  { header: "Precio", key: "precio", width: 10 },
  { header: "Unidad", key: "unidad", width: 12 },
  { header: "Categoria", key: "categoria", width: 12 },
  { header: "Stock", key: "stock", width: 8 },
];

products.forEach((p) => ws.addRow(p));

await wb.xlsx.writeFile("./test-catalog.xlsx");
console.log("wrote ./test-catalog.xlsx with", products.length, "rows");
