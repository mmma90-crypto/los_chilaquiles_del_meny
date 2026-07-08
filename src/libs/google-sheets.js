import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

function getAuth() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getDoc() {
  const auth = getAuth();
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  return doc;
}

// Encuentra el nombre real de una columna sin importar mayusculas/minusculas,
// para que no se rompa si alguien renombra encabezados en la hoja.
function matchHeader(headerValues, label) {
  return (
    headerValues.find((h) => h.toLowerCase() === label.toLowerCase()) || label
  );
}

export async function getLeads() {
  const doc = await getDoc();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    nombre: row.get(h("Nombre")) || "",
    email: row.get(h("Email")) || "",
    telefono: row.get(h("Telefono")) || "",
    mensaje: row.get(h("Mensaje")) || "",
  }));
}

export async function addRowToSheet({ name, email, phone, message }) {
  const doc = await getDoc();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  const h = (label) => matchHeader(sheet.headerValues, label);
  await sheet.addRow({
    [h("Fecha")]: new Date().toLocaleString("es-MX"),
    [h("Nombre")]: name,
    [h("Email")]: email,
    [h("Telefono")]: phone || "",
    [h("Mensaje")]: message,
  });
}

const ORDERS_SHEET_TITLE = "Pedidos";
const ORDERS_HEADERS = [
  "Fecha",
  "Base",
  "Proteinas",
  "Toppings",
  "Total",
  "Nombre",
  "Telefono",
  "Direccion",
  "Ubicacion",
  "Metodo de pago",
];

async function getOrdersSheet(doc) {
  let sheet = doc.sheetsByTitle[ORDERS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: ORDERS_SHEET_TITLE,
      headerValues: ORDERS_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
    // Agrega columnas nuevas (ej. "Metodo de pago") si la pestaña ya
    // existia de una version anterior sin borrar columnas que el
    // usuario haya agregado a mano.
    const missing = ORDERS_HEADERS.filter(
      (label) => !sheet.headerValues.some((h) => h.toLowerCase() === label.toLowerCase())
    );
    if (missing.length > 0) {
      await sheet.setHeaderRow([...sheet.headerValues, ...missing]);
    }
  }
  return sheet;
}

export async function addOrderToSheet({
  base,
  proteinas,
  toppings,
  total,
  nombre,
  telefono,
  direccion,
  ubicacion,
}) {
  const doc = await getDoc();
  const sheet = await getOrdersSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const row = await sheet.addRow({
    [h("Fecha")]: new Date().toLocaleString("es-MX"),
    [h("Base")]: base || "",
    [h("Proteinas")]: proteinas || "",
    [h("Toppings")]: toppings || "",
    [h("Total")]: total ?? "",
    [h("Nombre")]: nombre || "",
    [h("Telefono")]: telefono || "",
    [h("Direccion")]: direccion || "",
    [h("Ubicacion")]: ubicacion || "",
  });
  return { rowNumber: row.rowNumber };
}

export async function getOrders() {
  const doc = await getDoc();
  const sheet = await getOrdersSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    base: row.get(h("Base")) || "",
    proteinas: row.get(h("Proteinas")) || "",
    toppings: row.get(h("Toppings")) || "",
    total: row.get(h("Total")) || "",
    nombre: row.get(h("Nombre")) || "",
    telefono: row.get(h("Telefono")) || "",
    direccion: row.get(h("Direccion")) || "",
    ubicacion: row.get(h("Ubicacion")) || "",
    metodoPago: row.get(h("Metodo de pago")) || "",
  }));
}

export async function updateOrderPaymentMethod(rowNumber, metodoPago) {
  const doc = await getDoc();
  const sheet = await getOrdersSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.rowNumber === rowNumber);
  if (!row) return false;
  row.set(h("Metodo de pago"), metodoPago);
  await row.save();
  return true;
}

const PURCHASES_SHEET_TITLE = "Compras";
const PURCHASES_HEADERS = [
  "Fecha",
  "Producto",
  "Precio unitario",
  "Cantidad",
  "Unidad",
  "Total",
  "Pagado",
  "Financiado por",
  "Reembolsado",
];

async function getPurchasesSheet(doc) {
  let sheet = doc.sheetsByTitle[PURCHASES_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: PURCHASES_SHEET_TITLE,
      headerValues: PURCHASES_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
    const missing = PURCHASES_HEADERS.filter(
      (label) => !sheet.headerValues.some((h) => h.toLowerCase() === label.toLowerCase())
    );
    if (missing.length > 0) {
      await sheet.setHeaderRow([...sheet.headerValues, ...missing]);
    }
  }
  return sheet;
}

export async function addPurchase({
  fecha,
  producto,
  precioUnitario,
  cantidad,
  unidad,
  pagado,
  financiadoPor,
  reembolsado,
}) {
  const doc = await getDoc();
  const sheet = await getPurchasesSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);

  const precio = Number(precioUnitario) || 0;
  const cant = Number(cantidad) || 0;
  const total = precio * cant;

  const fechaFormateada = fecha
    ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX")
    : new Date().toLocaleDateString("es-MX");

  const row = await sheet.addRow({
    [h("Fecha")]: fechaFormateada,
    [h("Producto")]: producto || "",
    [h("Precio unitario")]: precio,
    [h("Cantidad")]: cant,
    [h("Unidad")]: unidad || "",
    [h("Total")]: total,
    [h("Pagado")]: pagado ? "Si" : "No",
    [h("Financiado por")]: financiadoPor || "Yo",
    [h("Reembolsado")]: reembolsado ? "Si" : "No",
  });

  return { rowNumber: row.rowNumber, total };
}

export async function getPurchases() {
  const doc = await getDoc();
  const sheet = await getPurchasesSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    producto: row.get(h("Producto")) || "",
    precioUnitario: row.get(h("Precio unitario")) || "",
    cantidad: row.get(h("Cantidad")) || "",
    unidad: row.get(h("Unidad")) || "",
    total: row.get(h("Total")) || "",
    pagado: (row.get(h("Pagado")) || "").toLowerCase() === "si",
    financiadoPor: row.get(h("Financiado por")) || "",
    reembolsado: (row.get(h("Reembolsado")) || "").toLowerCase() === "si",
    rowNumber: row.rowNumber,
  }));
}

// Marca (o desmarca) una compra existente como reembolsada, por numero de
// fila (el mismo rowNumber que devuelve getPurchases()/addPurchase()).
export async function updatePurchaseReembolso(rowNumber, reembolsado) {
  const doc = await getDoc();
  const sheet = await getPurchasesSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.rowNumber === rowNumber);
  if (!row) return false;
  row.set(h("Reembolsado"), reembolsado ? "Si" : "No");
  await row.save();
  return true;
}

// Suma el Total de las compras aun no reembolsadas, agrupado por quien las
// financio, para saber cuanto le debe el negocio a cada quien.
export async function getDeudas() {
  const purchases = await getPurchases();
  const deudas = { yo: 0, papasVanessa: 0 };
  purchases.forEach((p) => {
    if (p.reembolsado) return;
    const total = Number(p.total) || 0;
    if (normalizeName(p.financiadoPor) === normalizeName("Papás Vanessa")) {
      deudas.papasVanessa += total;
    } else if (normalizeName(p.financiadoPor) === normalizeName("Yo")) {
      deudas.yo += total;
    }
  });
  return deudas;
}

// Agrupa las compras (con precio) por Producto dentro de [desde, hasta] (ambas
// inclusive, formato "YYYY-MM-DD"). Sin rango, usa todo el historico. Devuelve
// la lista ordenada de mayor a menor gasto, con el % sobre el gasto total del
// periodo.
export async function getTopInsumos({ desde, hasta } = {}) {
  const purchases = await getPurchases();
  const desdeRango = parseFechaISO(desde);
  const hastaRango = parseFechaISO(hasta);

  const totales = new Map();
  let gastoTotalPeriodo = 0;

  purchases.forEach((p) => {
    const total = Number(p.total) || 0;
    if (total <= 0) return; // ignora filas sin precio

    const fecha = parseFechaCompra(p.fecha);
    if (desdeRango && (!fecha || fecha < desdeRango)) return;
    if (hastaRango && (!fecha || fecha > hastaRango)) return;

    const producto = p.producto || "Sin especificar";
    totales.set(producto, (totales.get(producto) || 0) + total);
    gastoTotalPeriodo += total;
  });

  return Array.from(totales.entries())
    .map(([producto, total]) => ({
      producto,
      total,
      porcentaje: gastoTotalPeriodo > 0 ? (total / gastoTotalPeriodo) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

const PRODUCTOS_SHEET_TITLE = "Productos";
const PRODUCTOS_HEADERS = ["Nombre", "Unidad", "Categoria"];

async function getProductosSheet(doc) {
  let sheet = doc.sheetsByTitle[PRODUCTOS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: PRODUCTOS_SHEET_TITLE,
      headerValues: PRODUCTOS_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

export async function getProductos() {
  const doc = await getDoc();
  const sheet = await getProductosSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    nombre: row.get(h("Nombre")) || "",
    unidad: row.get(h("Unidad")) || "",
    categoria: row.get(h("Categoria")) || "",
  }));
}

// Agrega un producto al catalogo solo si no existe ya uno con el mismo nombre
// (comparando sin acentos/mayusculas/espacios via normalizeName), para que el
// select de Compras no termine con el mismo insumo duplicado varias veces.
export async function addProducto(nombre, unidad, categoria) {
  const doc = await getDoc();
  const sheet = await getProductosSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);

  const rows = await sheet.getRows();
  const key = normalizeName(nombre);
  const existente = rows.find((row) => normalizeName(row.get(h("Nombre"))) === key);
  if (existente) {
    return {
      nombre: existente.get(h("Nombre")) || "",
      unidad: existente.get(h("Unidad")) || "",
      categoria: existente.get(h("Categoria")) || "",
    };
  }

  await sheet.addRow({
    [h("Nombre")]: nombre || "",
    [h("Unidad")]: unidad || "",
    [h("Categoria")]: categoria || "",
  });

  return { nombre: nombre || "", unidad: unidad || "", categoria: categoria || "" };
}

const RECIPES_SHEET_TITLE = "Recetas";
const RECIPES_HEADERS = ["Categoria", "Nombre", "Ingrediente", "Cantidad", "Unidad"];
// Las filas con Ingrediente "RENDIMIENTO_LITROS" (en salsas) y "SALSA_LITROS"
// (en platillos) no son insumos comprables: son marcadores de rendimiento y
// de cuanta salsa usa el platillo. getCostAnalysis() los interpreta aparte.
const RECIPES_SEED_ROWS = [
  ["salsa", "Verde picosa", "Tomatillo", 0.5, "kg"],
  ["salsa", "Verde picosa", "Habanero", 0.045, "kg"],
  ["salsa", "Verde picosa", "Jalapeño", 0.68, "kg"],
  ["salsa", "Verde picosa", "Serrano", 0.1, "kg"],
  ["salsa", "Verde picosa", "Sal", 0.005, "kg"],
  ["salsa", "Verde picosa", "RENDIMIENTO_LITROS", 3, "litro"],
  ["salsa", "Verde no picosa", "Tomatillo", 0.825, "kg"],
  ["salsa", "Verde no picosa", "Jalapeño", 0.14, "kg"],
  ["salsa", "Verde no picosa", "Serrano", 0.05, "kg"],
  ["salsa", "Verde no picosa", "Campbells", 0.333, "pieza"],
  ["salsa", "Verde no picosa", "Leche", 0.2, "litro"],
  ["salsa", "Verde no picosa", "Sal", 0.005, "kg"],
  ["salsa", "Verde no picosa", "RENDIMIENTO_LITROS", 2.5, "litro"],
  ["salsa", "Roja no picosa", "Tomate", 0.7, "kg"],
  ["salsa", "Roja no picosa", "Jalapeño", 0.1, "kg"],
  ["salsa", "Roja no picosa", "Pure tomate", 1, "pieza"],
  ["salsa", "Roja no picosa", "Sal", 0.005, "kg"],
  ["salsa", "Roja no picosa", "RENDIMIENTO_LITROS", 3, "litro"],
  ["salsa", "Roja picosa", "Tomate", 0.5, "kg"],
  ["salsa", "Roja picosa", "Chile arbol", 0.05, "kg"],
  ["salsa", "Roja picosa", "Chile morita", 0.05, "kg"],
  ["salsa", "Roja picosa", "Chile mirasol", 0.05, "kg"],
  ["salsa", "Roja picosa", "Chipotle", 1, "pieza"],
  ["salsa", "Roja picosa", "Sal", 0.005, "kg"],
  ["salsa", "Roja picosa", "RENDIMIENTO_LITROS", 3, "litro"],
  ["platillo", "Chilaquiles base", "Tortillas", 0.2, "kg"],
  ["platillo", "Chilaquiles base", "SALSA_LITROS", 0.2, "litro"],
  ["platillo", "Chilaquiles base", "Queso", 0.06, "kg"],
  ["platillo", "Chilaquiles base", "Media crema", 0.08, "kg"],
  ["platillo", "Chilaquiles base", "Cebolla morada", 0.03, "kg"],
  ["platillo", "Chilaquiles base", "Cilantro", 0.01, "kg"],
  ["platillo", "Chilaquiles base", "Envases", 1, "pieza"],
  ["platillo", "Chilaquiles base", "Tenedores", 1, "pieza"],
  ["platillo", "Chilaquiles base", "Servilletas", 3, "pieza"],
  ["platillo", "Chilaquiles base", "Bolsas", 1, "pieza"],
  ["platillo", "Chilaquiles base", "Gasolina", 0.3, "litro"],
  ["platillo", "Chilaquiles base", "Sueldo", 0.05, "unidad"],
  ["platillo", "Chilaquiles base", "Gas", 0.2, "kg"],
  ["proteina", "Pollo", "Pollo", 0.12, "kg"],
  ["proteina", "Barbacoa", "Barbacoa", 0.15, "kg"],
  ["proteina", "Chicharron", "Chicharron", 0.08, "kg"],
  ["proteina", "Huevo", "Huevos", 1, "pieza"],
];

const PRICES_SHEET_TITLE = "PreciosBase";
const PRICES_HEADERS = ["Producto", "Precio", "Unidad"];
const PRICES_SEED_ROWS = [
  ["Tortillas", 18, "kg"],
  ["Tomatillo", 42.9, "kg"],
  ["Habanero", 160, "kg"],
  ["Jalapeño", 39.9, "kg"],
  ["Serrano", 56.9, "kg"],
  ["Tomate", 29.91, "kg"],
  ["Pure tomate", 13, "pieza"],
  ["Campbells", 74.9, "pieza"],
  ["Leche", 30, "litro"],
  ["Queso", 139, "kg"],
  ["Media crema", 36.5, "kg"],
  ["Cebolla morada", 36.9, "kg"],
  ["Cilantro", 11.9, "kg"],
  ["Envases", 1.65, "pieza"],
  ["Tenedores", 0.52, "pieza"],
  ["Servilletas", 0.083, "pieza"],
  ["Bolsas", 0.3, "pieza"],
  ["Gasolina", 25.5, "litro"],
  ["Sueldo", 150, "unidad"],
  ["Gas", 10.5, "kg"],
  ["Pollo", 79, "kg"],
  ["Barbacoa", 199, "kg"],
  ["Chicharron", 185, "kg"],
  ["Huevos", 3.3, "pieza"],
  ["Chile arbol", 249, "kg"],
  ["Chile morita", 259, "kg"],
  ["Chile mirasol", 250, "kg"],
  ["Chipotle", 26, "pieza"],
  ["Sal", 20, "kg"],
];

const PARAMETROS_COSTEO_SHEET_TITLE = "ParametrosCosteo";
const PARAMETROS_COSTEO_HEADERS = ["Concepto", "Valor"];
const PARAMETROS_COSTEO_SEED_ROWS = [["Sueldo semanal ayuda", 100]];

async function getParametrosCosteoSheet(doc) {
  let sheet = doc.sheetsByTitle[PARAMETROS_COSTEO_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: PARAMETROS_COSTEO_SHEET_TITLE,
      headerValues: PARAMETROS_COSTEO_HEADERS,
    });
    await sheet.addRows(
      PARAMETROS_COSTEO_SEED_ROWS.map(([concepto, valor]) => ({
        Concepto: concepto,
        Valor: valor,
      }))
    );
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

// Parametros usados SOLO para prorratear costos en el costeo de platillos
// (getCostAnalysis). No se deben sumar en getFinancesSummary ni en gastos
// fijos mensuales: el pago real del sueldo sigue siendo un Retiro aparte.
export async function getParametrosCosteo() {
  const doc = await getDoc();
  const sheet = await getParametrosCosteoSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    concepto: row.get(h("Concepto")) || "",
    valor: Number(row.get(h("Valor"))) || 0,
  }));
}

async function getRecipesSheet(doc) {
  let sheet = doc.sheetsByTitle[RECIPES_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: RECIPES_SHEET_TITLE,
      headerValues: RECIPES_HEADERS,
    });
    await sheet.addRows(
      RECIPES_SEED_ROWS.map(([categoria, nombre, ingrediente, cantidad, unidad]) => ({
        Categoria: categoria,
        Nombre: nombre,
        Ingrediente: ingrediente,
        Cantidad: cantidad,
        Unidad: unidad,
      }))
    );
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

async function getPricesSheet(doc) {
  let sheet = doc.sheetsByTitle[PRICES_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: PRICES_SHEET_TITLE,
      headerValues: PRICES_HEADERS,
    });
    await sheet.addRows(
      PRICES_SEED_ROWS.map(([producto, precio, unidad]) => ({
        Producto: producto,
        Precio: precio,
        Unidad: unidad,
      }))
    );
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

// Normaliza nombres de producto/ingrediente para poder compararlos sin
// importar acentos, mayusculas o espacios extra (ej. "Jalapeño" vs "jalapeno ").
const DIACRITICS_REGEX = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
);

function normalizeName(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Clasifica un metodo de pago libre (de Pedidos o VentasManuales) en una de
// las 4 categorias que muestra el desglose financiero por dia.
function classifyMetodoPago(metodoPago) {
  const m = normalizeName(metodoPago);
  if (m.includes("efectivo")) return "efectivo";
  if (m.includes("transferencia")) return "transferencia";
  if (m.includes("paypal") || m.includes("tarjeta")) return "tarjetaPaypal";
  return "otro";
}

// Las fechas de Compras se guardan con toLocaleDateString("es-MX"), ej: "2/7/2026"
// (dia/mes/anio, NO mes/dia/anio).
function parseFechaCompra(fecha) {
  if (!fecha) return null;
  const match = String(fecha).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Los campos <input type="date"> del panel viajan como "YYYY-MM-DD".
function parseFechaISO(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, yyyy, mm, dd] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Precio promedio ponderado por cantidad de las compras de `producto` dentro
// de [desde, hasta] (ambas inclusive). Sin rango, usa todo el historico.
// Devuelve null si no hay compras con precio en el rango (el llamador decide
// el fallback, normalmente el precio de PreciosBase).
function getWeightedPrice(producto, compras, desde, hasta) {
  const key = normalizeName(producto);
  let sumaCantidadPorPrecio = 0;
  let sumaCantidad = 0;

  compras.forEach((compra) => {
    if (normalizeName(compra.producto) !== key) return;
    const precio = Number(compra.precioUnitario) || 0;
    if (precio <= 0) return; // ignora compras sin precio

    const fecha = parseFechaCompra(compra.fecha);
    if (desde && (!fecha || fecha < desde)) return;
    if (hasta && (!fecha || fecha > hasta)) return;

    const cantidad = Number(compra.cantidad) || 0;
    sumaCantidadPorPrecio += cantidad * precio;
    sumaCantidad += cantidad;
  });

  if (sumaCantidad <= 0) return null;
  return sumaCantidadPorPrecio / sumaCantidad;
}

// Inicio de semana (lunes) de una fecha, para agrupar ventas de platillos
// por semana al prorratear el sueldo.
function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

// Platillos vendidos por fecha: usa VentasPorPlatillo (suma de Pollo+
// Chicharron+Huevo+Barbacoa+Sencillo) si tiene filas con fecha valida; si no,
// cae a contar 1 platillo por cada Pedido guardado.
async function getPlatillosVendidosPorFecha() {
  const ventas = await getVentasPorPlatillo();
  const ventasConFecha = ventas
    .map((v) => ({
      fecha: parseFechaCompra(v.fecha),
      cantidad: v.pollo + v.chicharron + v.huevo + v.barbacoa + v.sencillo,
    }))
    .filter((v) => v.fecha);
  if (ventasConFecha.length > 0) return ventasConFecha;

  const orders = await getOrders();
  return orders
    .map((o) => ({ fecha: parseFechaCompra(o.fecha), cantidad: 1 }))
    .filter((o) => o.fecha);
}

// Promedio de platillos vendidos por semana, usando las ultimas `numSemanas`
// semanas (lunes a domingo) que tengan al menos una venta registrada.
function avgPlatillosUltimasSemanasConDatos(ventasPorFecha, numSemanas) {
  const porSemana = new Map();
  ventasPorFecha.forEach(({ fecha, cantidad }) => {
    const key = getWeekStart(fecha).getTime();
    porSemana.set(key, (porSemana.get(key) || 0) + cantidad);
  });
  const semanas = Array.from(porSemana.keys())
    .sort((a, b) => b - a)
    .slice(0, numSemanas);
  if (semanas.length === 0) return 0;
  const total = semanas.reduce((sum, key) => sum + porSemana.get(key), 0);
  return total / semanas.length;
}

// Promedio de platillos vendidos por semana dentro de [desde, hasta] (ambas
// inclusive), usando el numero real de dias del rango entre 7.
function avgPlatillosEnRango(ventasPorFecha, desde, hasta) {
  const total = ventasPorFecha
    .filter(({ fecha }) => fecha >= desde && fecha <= hasta)
    .reduce((sum, v) => sum + v.cantidad, 0);
  const dias = Math.max(1, Math.round((hasta - desde) / 86400000) + 1);
  return total / (dias / 7);
}

function buildSueldoInfo(sueldoSemanal, promedioPlatillosSemana) {
  const costoPorPlatillo =
    sueldoSemanal > 0 && promedioPlatillosSemana > 0
      ? sueldoSemanal / promedioPlatillosSemana
      : 0;
  return { sueldoSemanal, promedioPlatillosSemana, costoPorPlatillo };
}

export async function getCostAnalysis({ desde, hasta } = {}) {
  const doc = await getDoc();

  const recipesSheet = await getRecipesSheet(doc);
  const rh = (label) => matchHeader(recipesSheet.headerValues, label);
  const recipeRows = await recipesSheet.getRows();
  const recipes = recipeRows.map((row) => ({
    categoria: row.get(rh("Categoria")) || "",
    nombre: row.get(rh("Nombre")) || "",
    ingrediente: row.get(rh("Ingrediente")) || "",
    cantidad: Number(row.get(rh("Cantidad"))) || 0,
    unidad: row.get(rh("Unidad")) || "",
  }));

  const pricesSheet = await getPricesSheet(doc);
  const ph = (label) => matchHeader(pricesSheet.headerValues, label);
  const priceRows = await pricesSheet.getRows();
  const basePrices = new Map();
  priceRows.forEach((row) => {
    const producto = row.get(ph("Producto")) || "";
    basePrices.set(normalizeName(producto), Number(row.get(ph("Precio"))) || 0);
  });

  const purchases = await getPurchases();
  const recentPurchases = new Map();
  purchases.forEach((p) => {
    const key = normalizeName(p.producto);
    const fecha = parseFechaCompra(p.fecha);
    const precio = Number(p.precioUnitario) || 0;
    const existing = recentPurchases.get(key);
    if (!existing || (fecha && (!existing.fecha || fecha > existing.fecha))) {
      recentPurchases.set(key, { precio, fecha });
    }
  });

  function getIngredientPriceActual(nombre) {
    const key = normalizeName(nombre);
    const recent = recentPurchases.get(key);
    if (recent) return { precio: recent.precio, fuente: "compra reciente" };
    if (basePrices.has(key)) return { precio: basePrices.get(key), fuente: "precio base" };
    return { precio: 0, fuente: "precio base" };
  }

  // Genera un resolvedor de precio ponderado (compras en [desdeRango, hastaRango])
  // con el mismo fallback a PreciosBase que el resolvedor "actual".
  function makeWeightedPriceResolver(desdeRango, hastaRango) {
    return function getIngredientPriceWeighted(nombre) {
      const ponderado = getWeightedPrice(nombre, purchases, desdeRango, hastaRango);
      if (ponderado !== null) return { precio: ponderado, fuente: "promedio ponderado" };
      const key = normalizeName(nombre);
      if (basePrices.has(key)) return { precio: basePrices.get(key), fuente: "precio base" };
      return { precio: 0, fuente: "precio base" };
    };
  }

  const groups = new Map();
  recipes.forEach((r) => {
    const key = `${r.categoria}|||${r.nombre}`;
    if (!groups.has(key)) {
      groups.set(key, { categoria: r.categoria, nombre: r.nombre, ingredientes: [] });
    }
    groups.get(key).ingredientes.push(r);
  });

  // Calcula salsas/proteinas/platillos/combinaciones con una fuente de precio
  // dada (getIngredientPrice), para no repetir la logica por cada bloque.
  // sueldoInfo trae el costo de mano de obra por platillo ya prorrateado
  // (independiente por vista: actual / ultimos30dias / rangoPersonalizado).
  function buildBlock(getIngredientPrice, sueldoInfo) {
    const ingredientesUsados = new Map();
    function trackIngredient(nombre, unidad) {
      const key = normalizeName(nombre);
      if (ingredientesUsados.has(key)) return;
      const { precio, fuente } = getIngredientPrice(nombre);
      ingredientesUsados.set(key, { nombre, unidad, precio, fuente });
    }

    const salsas = [];
    groups.forEach((group) => {
      if (normalizeName(group.categoria) !== "salsa") return;
      let costoTotal = 0;
      let rendimientoLitros = 0;
      group.ingredientes.forEach((ing) => {
        if (normalizeName(ing.ingrediente) === "rendimiento_litros") {
          rendimientoLitros = ing.cantidad;
          return;
        }
        const { precio } = getIngredientPrice(ing.ingrediente);
        trackIngredient(ing.ingrediente, ing.unidad);
        costoTotal += precio * ing.cantidad;
      });
      salsas.push({
        nombre: group.nombre,
        costoTotal,
        rendimientoLitros,
        costoPorLitro: rendimientoLitros > 0 ? costoTotal / rendimientoLitros : 0,
      });
    });

    const platillos = [];
    groups.forEach((group) => {
      if (normalizeName(group.categoria) !== "platillo") return;
      let costoComun = 0;
      let salsaLitros = 0;
      group.ingredientes.forEach((ing) => {
        if (normalizeName(ing.ingrediente) === "salsa_litros") {
          salsaLitros = ing.cantidad;
          return;
        }
        if (normalizeName(ing.ingrediente) === "sueldo") {
          // El costo de mano de obra ya no sale de Recetas/PreciosBase: se
          // prorratea aparte (sueldoInfo.costoPorPlatillo) mas abajo.
          return;
        }
        const { precio } = getIngredientPrice(ing.ingrediente);
        trackIngredient(ing.ingrediente, ing.unidad);
        costoComun += precio * ing.cantidad;
      });
      platillos.push({
        nombre: group.nombre,
        porSalsa: salsas.map((s) => ({
          salsa: s.nombre,
          costoBase: costoComun + salsaLitros * s.costoPorLitro + sueldoInfo.costoPorPlatillo,
        })),
      });
    });

    const proteinas = [];
    groups.forEach((group) => {
      if (normalizeName(group.categoria) !== "proteina") return;
      let costo = 0;
      group.ingredientes.forEach((ing) => {
        const { precio } = getIngredientPrice(ing.ingrediente);
        trackIngredient(ing.ingrediente, ing.unidad);
        costo += precio * ing.cantidad;
      });
      proteinas.push({ nombre: group.nombre, costo });
    });

    const combinaciones = [];
    platillos.forEach((platillo) => {
      platillo.porSalsa.forEach(({ salsa, costoBase }) => {
        combinaciones.push({ salsa, proteina: null, costo: costoBase });
        proteinas.forEach((p) => {
          combinaciones.push({ salsa, proteina: p.nombre, costo: costoBase + p.costo });
        });
      });
    });

    return {
      salsas,
      proteinas,
      combinaciones,
      ingredientes: Array.from(ingredientesUsados.values()),
      sueldo: sueldoInfo,
    };
  }

  const hoy = new Date();
  const hoyMedianoche = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const hace30Dias = new Date(hoyMedianoche);
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const [parametrosCosteo, ventasPorFecha] = await Promise.all([
    getParametrosCosteo(),
    getPlatillosVendidosPorFecha(),
  ]);
  const sueldoSemanal =
    parametrosCosteo.find(
      (p) => normalizeName(p.concepto) === normalizeName("Sueldo semanal ayuda")
    )?.valor || 0;

  const resultado = {
    actual: buildBlock(
      getIngredientPriceActual,
      buildSueldoInfo(
        sueldoSemanal,
        avgPlatillosUltimasSemanasConDatos(ventasPorFecha, 4)
      )
    ),
    ultimos30dias: buildBlock(
      makeWeightedPriceResolver(hace30Dias, hoyMedianoche),
      buildSueldoInfo(
        sueldoSemanal,
        avgPlatillosEnRango(ventasPorFecha, hace30Dias, hoyMedianoche)
      )
    ),
  };

  const desdeRango = parseFechaISO(desde);
  const hastaRango = parseFechaISO(hasta);
  if (desdeRango && hastaRango) {
    resultado.rangoPersonalizado = buildBlock(
      makeWeightedPriceResolver(desdeRango, hastaRango),
      buildSueldoInfo(
        sueldoSemanal,
        avgPlatillosEnRango(ventasPorFecha, desdeRango, hastaRango)
      )
    );
  }

  return resultado;
}

const FIXED_COSTS_SHEET_TITLE = "GastosFijos";
const FIXED_COSTS_HEADERS = ["Concepto", "Monto mensual"];
const FIXED_COSTS_SEED_ROWS = [
  ["Gas", 0],
];

async function getFixedCostsSheet(doc) {
  let sheet = doc.sheetsByTitle[FIXED_COSTS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: FIXED_COSTS_SHEET_TITLE,
      headerValues: FIXED_COSTS_HEADERS,
    });
    await sheet.addRows(
      FIXED_COSTS_SEED_ROWS.map(([concepto, monto]) => ({
        Concepto: concepto,
        "Monto mensual": monto,
      }))
    );
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

export async function getFixedCosts() {
  const doc = await getDoc();
  const sheet = await getFixedCostsSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    concepto: row.get(h("Concepto")) || "",
    montoMensual: Number(row.get(h("Monto mensual"))) || 0,
  }));
}

const MANUAL_SALES_SHEET_TITLE = "VentasManuales";
const MANUAL_SALES_HEADERS = ["Fecha", "Concepto", "Monto", "Metodo pago"];

async function getManualSalesSheet(doc) {
  let sheet = doc.sheetsByTitle[MANUAL_SALES_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: MANUAL_SALES_SHEET_TITLE,
      headerValues: MANUAL_SALES_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

export async function getManualSales() {
  const doc = await getDoc();
  const sheet = await getManualSalesSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    concepto: row.get(h("Concepto")) || "",
    monto: Number(row.get(h("Monto"))) || 0,
    metodoPago: row.get(h("Metodo pago")) || "",
  }));
}

export async function addManualSale({ fecha, concepto, monto, metodoPago }) {
  const doc = await getDoc();
  const sheet = await getManualSalesSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);

  const fechaFormateada = fecha
    ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX")
    : new Date().toLocaleDateString("es-MX");

  const row = await sheet.addRow({
    [h("Fecha")]: fechaFormateada,
    [h("Concepto")]: concepto || "",
    [h("Monto")]: Number(monto) || 0,
    [h("Metodo pago")]: metodoPago || "",
  });

  return { rowNumber: row.rowNumber };
}

// Resumen financiero mensual del año dado (por defecto, el actual). Combina
// ventas de la pagina (Pedidos), ventas manuales, gasto en insumos (Compras),
// gastos fijos (GastosFijos) y retiros/gastos (Retiros) para calcular la
// utilidad neta por mes.
export async function getFinancesSummary({ year } = {}) {
  const targetYear = Number(year) || new Date().getFullYear();

  const [orders, manualSales, purchases, fixedCosts, retiros] = await Promise.all([
    getOrders(),
    getManualSales(),
    getPurchases(),
    getFixedCosts(),
    getRetiros(),
  ]);

  const gastosFijosMensual = fixedCosts.reduce(
    (sum, c) => sum + (Number(c.montoMensual) || 0),
    0
  );

  const meses = Array.from({ length: 12 }, (_, i) => ({
    mes: i,
    ventasPagina: 0,
    ventasManuales: 0,
    gastoInsumos: 0,
    gastoRetiros: 0,
    porFecha: new Map(),
  }));

  function registrarVentaPorFecha(mesBucket, fecha, monto, metodoPago) {
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
      fecha.getDate()
    ).padStart(2, "0")}`;
    if (!mesBucket.porFecha.has(key)) {
      mesBucket.porFecha.set(key, {
        orden: fecha.getTime(),
        fecha: `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`,
        efectivo: 0,
        transferencia: 0,
        tarjetaPaypal: 0,
        otro: 0,
      });
    }
    const entry = mesBucket.porFecha.get(key);
    entry[classifyMetodoPago(metodoPago)] += Number(monto) || 0;
  }

  orders.forEach((o) => {
    const fecha = parseFechaCompra(o.fecha);
    if (!fecha || fecha.getFullYear() !== targetYear) return;
    const mesBucket = meses[fecha.getMonth()];
    mesBucket.ventasPagina += Number(o.total) || 0;
    registrarVentaPorFecha(mesBucket, fecha, o.total, o.metodoPago);
  });

  manualSales.forEach((v) => {
    const fecha = parseFechaCompra(v.fecha);
    if (!fecha || fecha.getFullYear() !== targetYear) return;
    const mesBucket = meses[fecha.getMonth()];
    mesBucket.ventasManuales += Number(v.monto) || 0;
    registrarVentaPorFecha(mesBucket, fecha, v.monto, v.metodoPago);
  });

  purchases.forEach((p) => {
    if ((Number(p.precioUnitario) || 0) <= 0) return; // ignora filas sin precio
    const fecha = parseFechaCompra(p.fecha);
    if (!fecha || fecha.getFullYear() !== targetYear) return;
    meses[fecha.getMonth()].gastoInsumos += Number(p.total) || 0;
  });

  // Los retiros de categoria "Reembolso insumos" no se restan aqui: ese costo
  // ya esta contado en gastoInsumos (Compras). El resto de retiros (sueldo,
  // renta, gas, personal, otro) si son gasto real del negocio.
  retiros.forEach((r) => {
    if (normalizeName(r.categoria) === normalizeName("Reembolso insumos")) return;
    const fecha = parseFechaCompra(r.fecha);
    if (!fecha || fecha.getFullYear() !== targetYear) return;
    meses[fecha.getMonth()].gastoRetiros += Number(r.monto) || 0;
  });

  return meses.map((m) => {
    const ventasTotales = m.ventasPagina + m.ventasManuales;
    const utilidadNeta =
      ventasTotales - m.gastoInsumos - gastosFijosMensual - m.gastoRetiros;
    const margenNeto = ventasTotales > 0 ? (utilidadNeta / ventasTotales) * 100 : 0;

    const ventasPorFecha = Array.from(m.porFecha.values())
      .sort((a, b) => a.orden - b.orden)
      .map(({ orden, ...dia }) => ({
        ...dia,
        total: dia.efectivo + dia.transferencia + dia.tarjetaPaypal + dia.otro,
      }));

    const totalesPorMetodo = ventasPorFecha.reduce(
      (acc, dia) => ({
        efectivo: acc.efectivo + dia.efectivo,
        transferencia: acc.transferencia + dia.transferencia,
        tarjetaPaypal: acc.tarjetaPaypal + dia.tarjetaPaypal,
        otro: acc.otro + dia.otro,
        total: acc.total + dia.total,
      }),
      { efectivo: 0, transferencia: 0, tarjetaPaypal: 0, otro: 0, total: 0 }
    );

    return {
      mes: m.mes,
      ventasPagina: m.ventasPagina,
      ventasManuales: m.ventasManuales,
      ventasTotales,
      gastoInsumos: m.gastoInsumos,
      gastosFijos: gastosFijosMensual,
      gastoRetiros: m.gastoRetiros,
      utilidadNeta,
      margenNeto,
      ventasPorFecha,
      totalesPorMetodo,
    };
  });
}

const RETIROS_SHEET_TITLE = "Retiros";
const RETIROS_HEADERS = ["Fecha", "Concepto", "Categoria", "Monto", "De donde"];

async function getRetirosSheet(doc) {
  let sheet = doc.sheetsByTitle[RETIROS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: RETIROS_SHEET_TITLE,
      headerValues: RETIROS_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

export async function getRetiros() {
  const doc = await getDoc();
  const sheet = await getRetirosSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    concepto: row.get(h("Concepto")) || "",
    categoria: row.get(h("Categoria")) || "",
    monto: Number(row.get(h("Monto"))) || 0,
    deDonde: row.get(h("De donde")) || "",
  }));
}

export async function addRetiro({ fecha, concepto, categoria, monto, deDonde }) {
  const doc = await getDoc();
  const sheet = await getRetirosSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);

  const fechaFormateada = fecha
    ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX")
    : new Date().toLocaleDateString("es-MX");

  const row = await sheet.addRow({
    [h("Fecha")]: fechaFormateada,
    [h("Concepto")]: concepto || "",
    [h("Categoria")]: categoria || "Otro",
    [h("Monto")]: Number(monto) || 0,
    [h("De donde")]: deDonde || "Efectivo",
  });

  return { rowNumber: row.rowNumber };
}

const ARQUEOS_SHEET_TITLE = "Arqueos";
const ARQUEOS_HEADERS = ["Fecha", "Efectivo contado", "Cuenta contado"];

async function getArqueosSheet(doc) {
  let sheet = doc.sheetsByTitle[ARQUEOS_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: ARQUEOS_SHEET_TITLE,
      headerValues: ARQUEOS_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

export async function getArqueos() {
  const doc = await getDoc();
  const sheet = await getArqueosSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    efectivoContado: Number(row.get(h("Efectivo contado"))) || 0,
    cuentaContado: Number(row.get(h("Cuenta contado"))) || 0,
  }));
}

export async function addArqueo({ fecha, efectivoContado, cuentaContado }) {
  const doc = await getDoc();
  const sheet = await getArqueosSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);

  const fechaFormateada = fecha
    ? new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX")
    : new Date().toLocaleDateString("es-MX");

  const row = await sheet.addRow({
    [h("Fecha")]: fechaFormateada,
    [h("Efectivo contado")]: Number(efectivoContado) || 0,
    [h("Cuenta contado")]: Number(cuentaContado) || 0,
  });

  return { rowNumber: row.rowNumber };
}

// Calcula el saldo esperado de efectivo y cuenta a la fecha `hasta`, partiendo
// del arqueo anterior mas reciente (su conteo real, no un teorico en cero) y
// sumando ventas / restando retiros ocurridos desde ese arqueo hasta esa
// fecha (inclusive). Los retiros de "Reembolso insumos" SI se restan aqui
// (mueven caja/cuenta realmente), a diferencia de getFinancesSummary donde se
// excluyen de la utilidad neta para no contar el costo dos veces.
function computeExpectedCash(hasta, { orders, manualSales, retiros, arqueos }) {
  let arqueoAnterior = null;
  arqueos.forEach((a) => {
    const fechaArqueo = parseFechaCompra(a.fecha);
    if (!fechaArqueo || fechaArqueo >= hasta) return;
    if (!arqueoAnterior || fechaArqueo > arqueoAnterior.fecha) {
      arqueoAnterior = {
        fecha: fechaArqueo,
        efectivoContado: a.efectivoContado,
        cuentaContado: a.cuentaContado,
      };
    }
  });

  const desde = arqueoAnterior ? arqueoAnterior.fecha : null;
  let efectivoEsperado = arqueoAnterior ? arqueoAnterior.efectivoContado : 0;
  let cuentaEsperado = arqueoAnterior ? arqueoAnterior.cuentaContado : 0;

  function enRango(fechaValor) {
    const f = parseFechaCompra(fechaValor);
    if (!f) return false;
    if (desde && f <= desde) return false;
    if (f > hasta) return false;
    return true;
  }

  orders.forEach((o) => {
    if (!enRango(o.fecha)) return;
    const monto = Number(o.total) || 0;
    if (classifyMetodoPago(o.metodoPago) === "efectivo") efectivoEsperado += monto;
    else cuentaEsperado += monto;
  });

  manualSales.forEach((v) => {
    if (!enRango(v.fecha)) return;
    const monto = Number(v.monto) || 0;
    if (classifyMetodoPago(v.metodoPago) === "efectivo") efectivoEsperado += monto;
    else cuentaEsperado += monto;
  });

  retiros.forEach((r) => {
    if (!enRango(r.fecha)) return;
    const monto = Number(r.monto) || 0;
    if (normalizeName(r.deDonde) === "efectivo") efectivoEsperado -= monto;
    else cuentaEsperado -= monto;
  });

  return {
    efectivoEsperado,
    cuentaEsperado,
    desde: desde ? desde.toISOString() : null,
    hasta: hasta.toISOString(),
  };
}

export async function getExpectedCash(fecha) {
  const hasta = parseFechaISO(fecha) || new Date();
  const [orders, manualSales, retiros, arqueos] = await Promise.all([
    getOrders(),
    getManualSales(),
    getRetiros(),
    getArqueos(),
  ]);
  return computeExpectedCash(hasta, { orders, manualSales, retiros, arqueos });
}

// Arqueos ya acompañados del saldo esperado (efectivo/cuenta) calculado al
// momento de cada uno, para que el panel muestre la comparacion esperado vs
// contado por fila sin tener que pedir /api/cashcount una vez por fila.
export async function getArqueosWithComparison() {
  const [orders, manualSales, retiros, arqueos] = await Promise.all([
    getOrders(),
    getManualSales(),
    getRetiros(),
    getArqueos(),
  ]);

  return arqueos
    .map((a) => ({ ...a, fechaParsed: parseFechaCompra(a.fecha) }))
    .sort((a, b) => (a.fechaParsed?.getTime() || 0) - (b.fechaParsed?.getTime() || 0))
    .map((a) => {
      const hasta = a.fechaParsed || new Date();
      const esperado = computeExpectedCash(hasta, {
        orders,
        manualSales,
        retiros,
        arqueos,
      });
      return {
        fecha: a.fecha,
        efectivoContado: a.efectivoContado,
        cuentaContado: a.cuentaContado,
        efectivoEsperado: esperado.efectivoEsperado,
        cuentaEsperado: esperado.cuentaEsperado,
      };
    });
}

const VENTAS_PLATILLO_SHEET_TITLE = "VentasPorPlatillo";
const VENTAS_PLATILLO_HEADERS = [
  "Fecha",
  "Pollo",
  "Chicharron",
  "Huevo",
  "Barbacoa",
  "Sencillo",
  "Extra huevo",
  "Extra salsa",
  "Extra prensado",
  "Extra pollo",
];

async function getVentasPorPlatilloSheet(doc) {
  let sheet = doc.sheetsByTitle[VENTAS_PLATILLO_SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({
      title: VENTAS_PLATILLO_SHEET_TITLE,
      headerValues: VENTAS_PLATILLO_HEADERS,
    });
  } else {
    await sheet.loadHeaderRow();
  }
  return sheet;
}

export async function getVentasPorPlatillo() {
  const doc = await getDoc();
  const sheet = await getVentasPorPlatilloSheet(doc);
  const h = (label) => matchHeader(sheet.headerValues, label);
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get(h("Fecha")) || "",
    pollo: Number(row.get(h("Pollo"))) || 0,
    chicharron: Number(row.get(h("Chicharron"))) || 0,
    huevo: Number(row.get(h("Huevo"))) || 0,
    barbacoa: Number(row.get(h("Barbacoa"))) || 0,
    sencillo: Number(row.get(h("Sencillo"))) || 0,
    extraHuevo: Number(row.get(h("Extra huevo"))) || 0,
    extraSalsa: Number(row.get(h("Extra salsa"))) || 0,
    extraPrensado: Number(row.get(h("Extra prensado"))) || 0,
    extraPollo: Number(row.get(h("Extra pollo"))) || 0,
  }));
}

const PLATILLOS_CATEGORIAS = [
  { key: "pollo", label: "Pollo" },
  { key: "chicharron", label: "Chicharron" },
  { key: "huevo", label: "Huevo" },
  { key: "barbacoa", label: "Barbacoa" },
  { key: "sencillo", label: "Sencillo" },
  { key: "extraHuevo", label: "Extra huevo" },
  { key: "extraSalsa", label: "Extra salsa" },
  { key: "extraPrensado", label: "Extra prensado" },
  { key: "extraPollo", label: "Extra pollo" },
];

// Suma el historico completo de VentasPorPlatillo columna por columna y
// calcula el % de cada una sobre el total de piezas vendidas (todas las
// columnas juntas), ordenado de mayor a menor.
export async function getPlatillosSummary() {
  const ventas = await getVentasPorPlatillo();

  const totales = PLATILLOS_CATEGORIAS.map(({ key, label }) => ({
    categoria: label,
    total: ventas.reduce((sum, v) => sum + (Number(v[key]) || 0), 0),
  }));

  const totalGeneral = totales.reduce((sum, t) => sum + t.total, 0);

  const platillos = totales
    .map((t) => ({
      ...t,
      porcentaje: totalGeneral > 0 ? (t.total / totalGeneral) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { platillos, totalGeneral };
}
