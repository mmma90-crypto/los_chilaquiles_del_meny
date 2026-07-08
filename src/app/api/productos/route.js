import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addProducto, getProductos } from "@/libs/google-sheets";

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
    const productos = await getProductos();
    return NextResponse.json({ productos });
  } catch (error) {
    console.error("Error al leer los productos de Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos leer el catalogo de productos." },
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

  const { nombre, unidad, categoria } = body;

  if (!nombre?.trim() || !unidad?.trim()) {
    return NextResponse.json(
      { error: "Faltan datos del producto." },
      { status: 400 }
    );
  }

  try {
    const producto = await addProducto(nombre.trim(), unidad, categoria);
    return NextResponse.json({ success: true, producto });
  } catch (error) {
    console.error("Error al guardar el producto en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos registrar el producto." },
      { status: 500 }
    );
  }
}
