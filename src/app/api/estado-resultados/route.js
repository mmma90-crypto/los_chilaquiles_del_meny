import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getEstadoResultados,
  getPuntoDeEquilibrio,
  getPuntoDeEquilibrioAnual,
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

// GET /api/estado-resultados?mes=1-12&anio=YYYY
// `mes` va en base 1 (enero=1 ... diciembre=12), igual que el resto del
// panel de finanzas.
export async function GET(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const anio = searchParams.get("anio");
    const [estado, puntoEquilibrio, puntoEquilibrioAnual] = await Promise.all([
      getEstadoResultados(mes, anio),
      getPuntoDeEquilibrio(mes, anio),
      getPuntoDeEquilibrioAnual(anio),
    ]);
    return NextResponse.json({ estado, puntoEquilibrio, puntoEquilibrioAnual });
  } catch (error) {
    console.error("Error al calcular el estado de resultados:", error);
    // Incluye el mensaje real del error para poder diagnosticar problemas
    // (ej. cuota de Google Sheets excedida) desde el propio panel.
    const detalle = error?.message ? ` Detalle: ${error.message}` : "";
    return NextResponse.json(
      { error: `No pudimos calcular el estado de resultados.${detalle}` },
      { status: 500 }
    );
  }
}
