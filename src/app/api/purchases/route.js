import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addPurchase, getPurchases } from "@/libs/google-sheets";

function makeToken(password) {
  return Buffer.from(password).toString("base64");
}

async function isAuthenticated() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token === makeToken(adminPassword);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const purchases = await getPurchases();
    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Error al leer las compras de Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos leer las compras." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Los datos enviados no tienen el formato correcto." },
      { status: 400 }
    );
  }

  const { producto, precioUnitario, cantidad } = body;

  if (!producto?.trim() || !precioUnitario || !cantidad) {
    return NextResponse.json(
      { error: "Faltan datos de la compra." },
      { status: 400 }
    );
  }

  try {
    const result = await addPurchase(body);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error al guardar la compra en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos registrar la compra." },
      { status: 500 }
    );
  }
}
