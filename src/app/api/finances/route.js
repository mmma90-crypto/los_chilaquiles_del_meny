import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addManualSale, getFinancesSummary } from "@/libs/google-sheets";

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

export async function GET(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const meses = await getFinancesSummary({ year });
    return NextResponse.json({ meses });
  } catch (error) {
    console.error("Error al calcular las finanzas:", error);
    return NextResponse.json(
      { error: "No pudimos calcular las finanzas." },
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

  const { concepto, monto } = body;

  if (!concepto?.trim() || !monto) {
    return NextResponse.json(
      { error: "Faltan datos de la venta." },
      { status: 400 }
    );
  }

  try {
    const result = await addManualSale(body);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error al guardar la venta manual en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos registrar la venta." },
      { status: 500 }
    );
  }
}
