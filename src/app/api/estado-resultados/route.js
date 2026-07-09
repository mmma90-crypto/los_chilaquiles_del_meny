import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEstadoResultados, getPuntoDeEquilibrio } from "@/libs/google-sheets";

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

// GET /api/estado-resultados?mes=0-11&anio=YYYY
// `mes` usa el mismo indice 0-11 que el resto del panel de finanzas.
export async function GET(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes");
    const anio = searchParams.get("anio");
    const [estado, puntoEquilibrio] = await Promise.all([
      getEstadoResultados(mes, anio),
      getPuntoDeEquilibrio(),
    ]);
    return NextResponse.json({ estado, puntoEquilibrio });
  } catch (error) {
    console.error("Error al calcular el estado de resultados:", error);
    return NextResponse.json(
      { error: "No pudimos calcular el estado de resultados." },
      { status: 500 }
    );
  }
}
