import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getDisponibilidadProteinas,
  setDisponibilidadProteina,
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

// GET es publico: el formulario de pedido del sitio necesita saber que
// proteinas estan agotadas sin iniciar sesion.
export async function GET() {
  try {
    const proteinas = await getDisponibilidadProteinas();
    return NextResponse.json({ proteinas });
  } catch (error) {
    console.error("Error al leer la disponibilidad de proteinas:", error);
    return NextResponse.json(
      { error: "No pudimos leer la disponibilidad." },
      { status: 500 }
    );
  }
}

// PATCH solo para el admin: activa/desactiva una proteina en la pestaña
// Disponibilidad de Google Sheets.
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

  const { proteina, activo } = body;
  if (!proteina || typeof activo !== "boolean") {
    return NextResponse.json(
      { error: "Faltan datos de la proteina." },
      { status: 400 }
    );
  }

  try {
    await setDisponibilidadProteina(proteina, activo);
    const proteinas = await getDisponibilidadProteinas();
    return NextResponse.json({ success: true, proteinas });
  } catch (error) {
    console.error("Error al actualizar la disponibilidad:", error);
    return NextResponse.json(
      { error: "No pudimos actualizar la disponibilidad." },
      { status: 500 }
    );
  }
}
