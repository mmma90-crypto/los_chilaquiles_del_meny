import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

function getAuth() {
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function getLeads() {
  const auth = getAuth();
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  return rows.map((row) => ({
    fecha: row.get("Fecha") || "",
    nombre: row.get("Nombre") || "",
    email: row.get("Email") || "",
    telefono: row.get("Telefono") || "",
    mensaje: row.get("Mensaje") || "",
  }));
}

export async function addRowToSheet({ name, email, phone, message }) {
  const auth = getAuth();
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow({
    Fecha: new Date().toLocaleString("es-MX"),
    Nombre: name,
    Email: email,
    Telefono: phone || "",
    Mensaje: message,
  });
}
