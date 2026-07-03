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
  }));
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
  function buildBlock(getIngredientPrice) {
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
        const { precio } = getIngredientPrice(ing.ingrediente);
        trackIngredient(ing.ingrediente, ing.unidad);
        costoComun += precio * ing.cantidad;
      });
      platillos.push({
        nombre: group.nombre,
        porSalsa: salsas.map((s) => ({
          salsa: s.nombre,
          costoBase: costoComun + salsaLitros * s.costoPorLitro,
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
    };
  }

  const hoy = new Date();
  const hoyMedianoche = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const hace30Dias = new Date(hoyMedianoche);
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const resultado = {
    actual: buildBlock(getIngredientPriceActual),
    ultimos30dias: buildBlock(makeWeightedPriceResolver(hace30Dias, hoyMedianoche)),
  };

  const desdeRango = parseFechaISO(desde);
  const hastaRango = parseFechaISO(hasta);
  if (desdeRango && hastaRango) {
    resultado.rangoPersonalizado = buildBlock(makeWeightedPriceResolver(desdeRango, hastaRango));
  }

  return resultado;
}

const FIXED_COSTS_SHEET_TITLE = "GastosFijos";
const FIXED_COSTS_HEADERS = ["Concepto", "Monto mensual"];
const FIXED_COSTS_SEED_ROWS = [
  ["Sueldo Vanessa", 600],
  ["Gas", 200],
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
// ventas de la pagina (Pedidos), ventas manuales, gasto en insumos (Compras)
// y gastos fijos (GastosFijos) para calcular la utilidad neta por mes.
export async function getFinancesSummary({ year } = {}) {
  const targetYear = Number(year) || new Date().getFullYear();

  const [orders, manualSales, purchases, fixedCosts] = await Promise.all([
    getOrders(),
    getManualSales(),
    getPurchases(),
    getFixedCosts(),
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

  return meses.map((m) => {
    const ventasTotales = m.ventasPagina + m.ventasManuales;
    const utilidadNeta = ventasTotales - m.gastoInsumos - gastosFijosMensual;
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
      utilidadNeta,
      margenNeto,
      ventasPorFecha,
      totalesPorMetodo,
    };
  });
}
