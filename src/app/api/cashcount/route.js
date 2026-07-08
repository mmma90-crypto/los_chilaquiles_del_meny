import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  addArqueo,
  addRetiro,
  getArqueosWithComparison,
  getExpectedCash,
  getRetiros,
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
    // Secuencial (no Promise.all): ambas llamadas pueden necesitar crear la
    // pestaña "Retiros" la primera vez, y llamarlas en paralelo hace que
    // Google Sheets reciba dos addSheet concurrentes para el mismo nombre.
    const arqueos = await getArqueosWithComparison();
    const retiros = await getRetiros();
    return NextResponse.json({ arqueos, retiros });
  } catch (error) {
    console.error("Error al leer arqueos/retiros de Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos leer el arqueo de caja." },
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

  const { tipo } = body;

  if (tipo === "arqueo") {
    const { fecha, efectivoContado, cuentaContado } = body;

    if (efectivoContado === undefined || cuentaContado === undefined) {
      return NextResponse.json(
        { error: "Faltan datos del arqueo." },
        { status: 400 }
      );
    }

    try {
      const esperado = await getExpectedCash(fecha);
      const result = await addArqueo({ fecha, efectivoContado, cuentaContado });
      return NextResponse.json({ success: true, ...result, esperado });
    } catch (error) {
      console.error("Error al guardar el arqueo en Google Sheets:", error);
      return NextResponse.json(
        { error: "No pudimos registrar el arqueo." },
        { status: 500 }
      );
    }
  }

  if (tipo === "retiro") {
    const { concepto, monto, categoria, deDonde } = body;

    if (!concepto?.trim() || !monto) {
      return NextResponse.json(
        { error: "Faltan datos del retiro." },
        { status: 400 }
      );
    }

    try {
      const result = await addRetiro({
        fecha: body.fecha,
        concepto,
        categoria,
        monto,
        deDonde,
      });
      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      console.error("Error al guardar el retiro en Google Sheets:", error);
      return NextResponse.json(
        { error: "No pudimos registrar el retiro." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Tipo de registro invalido." },
    { status: 400 }
  );
}
