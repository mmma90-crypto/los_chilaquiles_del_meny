import { NextResponse } from "next/server";
import { addOrderToSheet } from "@/libs/google-sheets";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El pedido enviado no tiene el formato correcto." },
      { status: 400 }
    );
  }

  const { base, nombre, telefono, direccion } = body;

  if (!base?.trim() || !nombre?.trim() || !telefono?.trim() || !direccion?.trim()) {
    return NextResponse.json(
      { error: "Faltan datos del pedido." },
      { status: 400 }
    );
  }

  try {
    await addOrderToSheet(body);
  } catch (error) {
    console.error("Error al guardar el pedido en Google Sheets:", error);
    return NextResponse.json(
      { error: "No pudimos registrar el pedido." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
