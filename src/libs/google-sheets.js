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
  await sheet.addRow({
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
}
