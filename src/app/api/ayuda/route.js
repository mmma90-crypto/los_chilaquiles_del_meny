import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getAyudaSemanal,
  getAyudaSemanalPendiente,
  updateAyudaSemanalPagado,
} from "@/libs/google-sheets";

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
    const ayudaSemanal = await getAyudaSemanal();
    const pendiente = await getAyudaSemanalPendiente();
    return NextResponse.json({ ayudaSemanal, pendiente });
  } catch (error) {
    console.error("Error al leer la ayuda semanal de Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos leer la ayuda semanal." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
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

  const { rowNumber, pagado } = body;

  if (!rowNumber) {
    return NextResponse.json(
      { error: "Falta el numero de fila de la ayuda semanal." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateAyudaSemanalPagado(rowNumber, pagado);
    if (!updated) {
      return NextResponse.json(
        { error: "No encontramos esa semana de ayuda." },
        { status: 404 }
      );
    }
    const pendiente = await getAyudaSemanalPendiente();
    return NextResponse.json({ success: true, pendiente });
  } catch (error) {
    console.error("Error al actualizar la ayuda semanal en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos actualizar la ayuda semanal." },
      { status: 500 }
    );
  }
}
