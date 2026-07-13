import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getRecetasAgrupadas,
  updateReceta,
  duplicarReceta,
  getPrecioIngrediente,
  getProductos,
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

// GET: recetas agrupadas + catalogo de productos + precio actual de cada
// ingrediente (compra reciente o precio base), todo lo que el editor de
// recetas necesita para calcular costos en vivo con una sola peticion.
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const [recetas, productos] = await Promise.all([
      getRecetasAgrupadas(),
      getProductos(),
    ]);

    // Precios de la union de: catalogo de Productos + ingredientes ya usados
    // en recetas (algunos, como Sueldo, no estan en el catalogo de compras).
    const nombres = new Map();
    productos.forEach((p) => {
      if (p.nombre) nombres.set(p.nombre.toLowerCase(), p.nombre);
    });
    recetas.forEach((r) =>
      r.ingredientes.forEach((ing) => {
        if (ing.nombre && !nombres.has(ing.nombre.toLowerCase())) {
          nombres.set(ing.nombre.toLowerCase(), ing.nombre);
        }
      })
    );
    const lista = Array.from(nombres.values());
    const preciosResueltos = await Promise.all(
      lista.map((nombre) => getPrecioIngrediente(nombre))
    );
    const precios = lista.map((nombre, i) => ({
      nombre,
      precio: preciosResueltos[i].precio,
      fuente: preciosResueltos[i].fuente,
    }));

    return NextResponse.json({ recetas, productos, precios });
  } catch (error) {
    console.error("Error al leer las recetas de Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos leer las recetas." },
      { status: 500 }
    );
  }
}

// PUT: reemplaza los ingredientes de una receta existente.
export async function PUT(request) {
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

  const { categoria, nombre, ingredientes } = body;
  if (!categoria?.trim() || !nombre?.trim()) {
    return NextResponse.json(
      { error: "Falta la categoria o el nombre de la receta." },
      { status: 400 }
    );
  }
  const validos = Array.isArray(ingredientes)
    ? ingredientes.filter(
        (i) => String(i?.nombre || "").trim() && (Number(i?.cantidad) || 0) > 0
      )
    : [];
  if (validos.length === 0) {
    return NextResponse.json(
      { error: "La receta necesita al menos un ingrediente con cantidad mayor a 0." },
      { status: 400 }
    );
  }

  try {
    await updateReceta(categoria.trim(), nombre.trim(), validos);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar la receta en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos guardar la receta." },
      { status: 500 }
    );
  }
}

// POST: duplica una receta existente con un nombre nuevo (variante editable).
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

  const { categoria, nombreOriginal, nombreNuevo } = body;
  if (!categoria?.trim() || !nombreOriginal?.trim() || !nombreNuevo?.trim()) {
    return NextResponse.json(
      { error: "Faltan datos para duplicar la receta." },
      { status: 400 }
    );
  }

  try {
    const resultado = await duplicarReceta(
      categoria.trim(),
      nombreOriginal.trim(),
      nombreNuevo.trim()
    );
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, receta: resultado });
  } catch (error) {
    console.error("Error al duplicar la receta en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos duplicar la receta." },
      { status: 500 }
    );
  }
}
